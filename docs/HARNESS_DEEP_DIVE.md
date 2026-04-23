# Harness 架构深度解析 —— Anthropic Managed Agents 核心循环

> 本文基于 Anthropic Engineering Blog《Managed Agents》及 Claude Code 等产品的工程实践，深入解析 Harness 的设计哲学、状态机、上下文工程与错误恢复机制。

---

## 1. Harness 的本质：不是 Agent，而是 Agent 的"操作系统调度器"

### 1.1 常见误解

很多人把 Harness 理解为"Agent 的智能核心"或"Prompt 模板"。这是错的。

Harness 的准确定义是：

> **一个无状态的、可替换的、负责在 LLM 与外部世界之间搬运事件的状态机循环。**

它本身不产生智能，它只是**智能的搬运工和调度器**。

### 1.2 核心循环（The Loop）

```
┌─────────────────────────────────────────────────────────────┐
│                         HARNESS LOOP                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. READ   ← 从 Session 读取事件切片 (getEvents)             │
│     ↓                                                        │
│  2. PACK   ← Context Engineering：决定哪些事件进 LLM         │
│     ↓                                                        │
│  3. CALL   ← 调用 LLM (Claude API)                           │
│     ↓                                                        │
│  4. PARSE  ← 解析 LLM 响应：文本 / tool_use / tool_result    │
│     ↓                                                        │
│  5. ROUTE  ← 把 tool calls 路由到对应的 Hands/Sandbox        │
│     ↓                                                        │
│  6. EXEC   ← 等待 Hands 执行，拿到字符串结果                  │
│     ↓                                                        │
│  7. WRITE  ← 把结果 emit 回 Session (emitEvent)              │
│     ↓                                                        │
│  8. JUMP   ← 回到步骤 1，循环                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**关键设计：Harness 在每次循环开始时都重新读取 Session，而不是把状态存在内存里。**

这意味着：
- Harness 进程可以随时被 kill 掉，新进程启动后从 Session 最后一条事件继续，无感知恢复
- 同一个 Session 可以在循环 A 由 Harness-A 处理，循环 B 由 Harness-B 处理

---

## 2. 状态机设计：Harness 不是 while(true)，而是有明确阶段的状态推进

### 2.1 Anthropic 定义的标准 Harness 状态

虽然 Anthropic 没有公开源码，但从 Managed Agents 的接口设计和 Claude Code 的行为可以反推出 Harness 内部的状态机：

```
                    ┌─────────────┐
                    │   INITIAL   │  ← wake(sessionId) 后进入
                    └──────┬──────┘
                           │ 读取 Session，构建初始上下文
                           ▼
                    ┌─────────────┐
                    │   PLANNING  │  ← LLM 决定"我要做什么"
                    └──────┬──────┘
                           │ 解析出 tool_calls 或完成标记
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐ ┌─────────┐ ┌─────────┐
        │ EXECUTE │ │  WAIT   │ │ COMPLETE│
        │(发工具)  │ │(等结果) │ │(任务完成)│
        └────┬────┘ └────┬────┘ └─────────┘
             │           │
             │    ┌──────┘
             │    ▼
             │ ┌─────────┐
             └→│ REVIEW  │  ← 检查工具结果，决定下一步
               └────┬────┘
                    │
                    └────────→ 回到 PLANNING（循环）
```

### 2.2 状态机的关键决策点

| 状态 | 决策逻辑 | 出错处理 |
|------|---------|---------|
| **PLANNING** | LLM 返回 tool_calls？→ EXECUTE。返回纯文本且无后续？→ COMPLETE | LLM 返回格式错误 → 重试或降级 |
| **EXECUTE** | 并行还是串行调用多个 tool？→ 由 Harness 策略决定 | tool 名称不存在 → 把错误写回 Session，让 LLM 自己修正 |
| **WAIT** | 超时策略？→ Harness 配置（30s/60s/120s） | 超时 → 向 LLM 返回 timeout error，让它决定重试或放弃 |
| **REVIEW** | 结果是否满足完成条件？→ 复杂判断，通常再次询问 LLM | 结果格式不对 → 让 LLM 重新格式化 |

**Anthropic 的核心洞察：Harness 不替 LLM 做决策，只是把执行结果"如实汇报"给 LLM，让 LLM 自己决定下一步。**

这和传统软件工程中"写死 if-else 工作流"的本质区别：Harness 是**元工作流**（meta-workflow），它只定义"怎么运转"，不定义"运转什么"。

---

## 3. Context Engineering：Harness 最复杂的部分

### 3.1 问题背景

Claude 的上下文窗口有限（200K tokens），但长期任务可能产生数百万 tokens 的事件流。Harness 必须回答：

> **"在这一次 LLM 调用中，我应该让 Claude 看到哪些历史？"**

### 3.2 Anthropic 的分层策略

Harness 不是简单地把最近 N 条事件塞进 prompt，而是做**分层加载**：

```
LLM Context Window（200K）
├─ 系统提示（System Prompt）          ← 固定，占 2-5K
├─ 任务摘要（Task Summary）            ← compaction 产出，占 5-10K
├─ 近期事件（Recent Events）           ← 最近 50-100 条原始事件
├─ 关键事件（Pinned Events）           ← 用户标记、错误事件、里程碑
├─ 当前循环上下文（Current Turn）       ← 正在进行的 tool_call / result
└─ 预留空间（Reserve）                 ← 给 LLM 输出留 20-30%
```

### 3.3 Context Engineering 的具体技术

**A. Compaction（压缩）**

当早期事件超出窗口时，Harness 会让 LLM 生成一个"摘要对象"，替换掉原始事件：

```
原始事件（10 条，占 15K tokens）
    ↓ Compaction
摘要对象（1 条，占 1K tokens）
"步骤 1-10 已完成：数据提取成功，关键指标为..."
```

**关键点：原始事件仍然保留在 Session Log 中，只是不再进入 LLM 的上下文。**

**B. Context Trimming（选择性裁剪）**

Harness 会根据事件类型决定保留策略：

| 事件类型 | 保留策略 |
|---------|---------|
| 人类输入 | **永久保留**，这是任务目标 |
| 系统计划 | 保留摘要，删除详细推理过程 |
| tool_result（成功） | 保留结果摘要，删除原始输出 |
| tool_result（失败） | **完整保留**，错误是重要信号 |
| thinking blocks | 通常删除，占用大量 token |

**C. Prompt Cache 优化**

Anthropic 在 API 层面支持 prompt caching。Harness 会尽量把**系统提示 + 任务摘要**放在缓存区，这样每次循环只需要付费传输"新增事件"部分，大幅降低延迟和成本。

### 3.4 Context Engineering 为什么是 Harness 的实现细节？

Anthropic 特别强调：

> *"We separated the concerns of recoverable context storage in the session and arbitrary context management in the harness because we can't predict what specific context engineering will be required in future models."*

这意味着：
- **Session 层**只保证： durable、append-only、可查询
- **Harness 层**负责：怎么选、怎么裁、怎么压、怎么缓存

未来 Claude 上下文窗口变大了，或者支持了新的上下文格式（比如多模态视频），只需要升级 Harness，Session 接口完全不需要改。

---

## 4. 不同 Harness 实现对比

Anthropic 明确说了：Managed Agents 是一个 **meta-harness**，它不假设具体的 Harness 实现。

### 4.1 Claude Code Harness

这是 Anthropic 内部广泛使用的 Harness，专为**代码任务**优化：

| 特性 | 说明 |
|------|------|
| **工具集** | 文件读写、bash 命令、代码搜索、LSP 调用 |
| **状态机** | 偏"REPL 模式"：读取文件 → 思考 → 编辑 → 测试 → 循环 |
| **上下文策略** |  heavy compaction，因为代码文件通常很长 |
| **错误恢复** | 命令失败时自动重试，编译错误时自动修复 |
| **适用场景** | 代码生成、重构、调试、代码审查 |

### 4.2 通用任务 Harness（Managed Agents 默认）

更通用的 Harness，适合非代码任务：

| 特性 | 说明 |
|------|------|
| **工具集** | 自定义 MCP tools、沙箱执行、知识检索 |
| **状态机** | 偏"项目管理模式"：计划 → 分派 → 聚合 → 审查 |
| **上下文策略** | 更保守的 compaction，保留更多决策痕迹（方便审计） |
| **错误恢复** | 工具失败时暂停，等待人类确认或提供替代方案 |
| **适用场景** | 数据分析、内容创作、研究、多步骤业务流程 |

### 4.3 两者关键差异

```
Claude Code Harness          通用 Harness
─────────────────────────────────────────────────
工具失败 → 自动重试         工具失败 → 汇报给 LLM，等决策
上下文 → 激进压缩            上下文 → 保守压缩（审计需求）
状态机 → REPL 循环           状态机 → 项目阶段推进
交互 → 流式输出代码          交互 → 结构化卡片+计划
```

**对 AgentOS 的启示：**

AgentOS 的第二层"群主 Agent"也可以有多种 Harness 实现：
- **数据分析专用群主**：工具集围绕 SQL/Python/可视化，状态机偏 REPL
- **流程审批专用群主**：工具集围绕表单/通知/规则引擎，状态机偏 BPMN
- **通用项目群主**：工具集动态组合，状态机偏"计划-分派-审查"

它们共用同一个 Session 接口，但 Harness 实现不同。

---

## 5. 错误恢复机制：Harness 的韧性设计

### 5.1 三层容错

Harness 的错误恢复不是单点，而是分层的：

```
Layer 1: Tool 级错误
─────────────────────
tool_call 返回 error string
  → Harness 把 error 写回 Session
  → LLM 在下一轮看到 error，自行决定重试/降级/终止

Layer 2: Sandbox 级错误
─────────────────────
Sandbox 容器崩溃 / 网络断开
  → Harness 把 failure 当 tool error 捕获
  → 如果配置了 auto-provision，自动启动新 Sandbox
  → LLM 决定是否重试

Layer 3: Harness 级错误
─────────────────────
Harness 进程崩溃 / 被 OOM kill
  → 新 Harness 启动，wake(sessionId)
  → getSession() 读取完整事件流
  → 从最后一条事件恢复循环
  → 对人类完全无感知
```

### 5.2 幂等性保证

Harness 恢复时面临一个经典问题：

> **"我上次执行到第 5 步，已经发了 tool_call，但在等结果时挂了。恢复后，我应该重发 tool_call 吗？"**

Anthropic 的解决方案：

1. **Session 中记录 tool_call 的发出事件**
   - 事件 A：`emitEvent(tool_call_request)`
   - 事件 B：`emitEvent(tool_call_result)`

2. **恢复时，Harness 检查最后一条事件**
   - 如果是 A 但没有 B → 说明 tool_call 已发出但结果未返回 → Harness 重新等待结果或标记为超时
   - 如果是 B → 正常进入下一轮

3. **Tool 的幂等性由 Tool 自身保证**
   - Harness 不保证"恰好一次执行"，只保证"至少一次执行，结果如实记录"
   - 如果 tool 不幂等（比如"发送邮件"），需要 Tool 层自己做去重（例如用 request_id）

### 5.3 Context Anxiety 的处理

Anthropic 在文章中提到了一个有趣的现象：

> *"Claude Sonnet 4.5 would wrap up tasks prematurely as it sensed its context limit approaching — a behavior sometimes called 'context anxiety.'"*

老的 Harness 对此的修复是：在上下文快满时主动 reset（清空上下文，用摘要替换）。

但当 Claude Opus 4.5 出来后，这个问题消失了。老的 reset 逻辑变成了 dead weight。

**这个案例完美说明了为什么 Harness 要设计成"可替换的实现"**：
- 模型行为变了，Harness 策略也要跟着变
- 但 Session 接口不变，上层业务不受影响

---

## 6. Harness 与 Session、Sandbox 的协作时序

以一个完整的"数据分析任务"为例，看三者的协作：

```
时间轴 →

人类:  "分析 Q3 营收"
  │
  ▼
Harness: wake(sessionId) → getEvents() → 空（新 Session）
  │
  ▼
Harness: 组织 prompt → 调用 Claude
  │
  ▼
Claude:  "我需要先提取数据"
  │       tool_use: {name: "SQL执行器", input: "SELECT * FROM sales_q3"}
  ▼
Harness: parse tool_use → emitEvent(tool_call_request) to Session
  │
  ▼
Harness: execute("SQL执行器", "SELECT * FROM sales_q3") → Sandbox
  │
  ▼
Sandbox: 运行 SQL → 返回结果字符串
  │
  ▼
Harness: receive result → emitEvent(tool_call_result) to Session
  │
  ▼
Harness: 组织 prompt（包含 request + result）→ 调用 Claude
  │
  ▼
Claude:  "数据提取完成，接下来我生成图表"
  │       tool_use: {name: "图表生成", input: {...}}
  ▼
Harness: parse → emitEvent → execute("图表生成", ...) → Sandbox
  │
  ▼
Sandbox: 生成图表 → 返回 base64 / markdown
  │
  ▼
Harness: emitEvent(result) → 调用 Claude
  │
  ▼
Claude:  "分析完成，结论是..." （无 tool_use，纯文本回复）
  ▼
Harness: 检测到无 tool_use → emitEvent(completion) → 循环结束
```

**关键观察：**
- Session Log 里记录的顺序：request → result → request → result → completion
- Harness 是唯一的"读写中介"，LLM 和 Sandbox 不直接通信
- 任何时刻 Harness 挂了，新 Harness 读取 Session Log 都能知道"上一步做到了哪"

---

## 7. 在 AgentOS 中的落地映射

### 7.1 AgentOS 群主 Agent = Harness 的实现实例

| Anthropic 概念 | AgentOS 映射 |
|---------------|-------------|
| Harness | 群主 Agent 的"调度内核" |
| Session | 项目群聊的 append-only Event Log |
| Sandbox | 各类 Skill 的执行沙箱 |
| tool_call | 群主 @Skill / @Agent 的下发指令 |
| tool_result | Skill/Agent 执行完成后返回的结果消息 |
| wake() | 群主从待机状态恢复，读取群聊历史 |
| emitEvent() | 群聊中新增一条消息（系统消息或执行结果） |

### 7.2 AgentOS 需要实现的 Harness 接口

```typescript
interface Harness {
  // 生命周期
  wake(sessionId: string): Promise<void>;
  suspend(): Promise<void>;
  
  // 核心循环
  runLoop(): Promise<LoopResult>;
  
  // 上下文工程（可插拔策略）
  packContext(events: Event[], windowSize: number): Context;
  compact(events: Event[]): Summary;
  
  // 工具路由
  routeToolCall(toolCall: ToolCall): Promise<ToolResult>;
  
  // 事件写入
  emitEvent(event: Event): Promise<void>;
}

interface HarnessConfig {
  model: string;           // 使用哪个 LLM
  maxTokens: number;       // 上下文窗口上限
  timeout: number;         // 单步超时
  retryPolicy: RetryPolicy;
  contextStrategy: 'aggressive' | 'conservative' | 'balanced';
  autoProvision: boolean;  // 是否自动启动新 Sandbox
}
```

### 7.3 多 Harness 共存的设计

AgentOS 可以支持一个项目中**切换不同的群主 Harness**：

```
项目 "Q3财报分析"
  ├─ 阶段1（数据提取）：使用 "数据分析专用 Harness"
  │     └─ 工具集：SQL执行器、Python沙箱、数据清洗Skill
  │
  ├─ 阶段2（可视化）：使用 "报告生成专用 Harness"
  │     └─ 工具集：图表生成、PPT合成、邮件发送
  │
  └─ 阶段3（审批）：使用 "流程审批专用 Harness"
        └─ 工具集：规则引擎、通知推送、 human-in-the-loop
```

切换时：
1. 旧 Harness emitEvent("阶段1完成，切换 Harness")
2. 新 Harness wake(sessionId)，读取完整历史
3. 新 Harness 用自己的 contextStrategy 重新组织上下文
4. 对人类用户完全无感知

---

## 8. 常见陷阱与避坑指南

| 陷阱 | 原因 | 正确做法 |
|------|------|---------|
| **Harness 做太多业务逻辑** | 把 if-else 决策写在 Harness 里 | Harness 只负责"搬运和调度"，决策交给 LLM |
| **Harness 持有状态** | 把中间变量存在 Harness 内存 | 所有状态写回 Session，Harness 无状态 |
| **Context 策略一成不变** | 用固定规则决定哪些事件进 prompt | 根据任务类型、模型能力、token 价格动态调整 |
| **忽略幂等性** | 假设 tool 只执行一次 | 设计 request_id，在 Tool 层做去重 |
| **错误直接抛给人类** | 任何 tool 失败都中断任务 | 先把 error 写回 Session，让 LLM 决定怎么处理 |

---

## 参考

- Anthropic: [Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- Anthropic: [Building effective agents](https://www.anthropic.com/research/building-effective-agents)
- Claude Code 设计原则（公开演讲及文档）
