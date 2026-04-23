# 多智能体架构调研报告 —— AgentOS 技术选型参考

> 调研时间：2026-04-20  
> 调研范围：当前主流多智能体框架、企业级编排模式、与 AgentOS 三层架构的匹配分析

---

## 1. 调研背景与目标

AgentOS 是一个面向 B 端的企业级 Agent 操作系统，核心特征：

- **可编排任务流**：复杂任务拆解为可执行的子任务序列
- **持续上下文组织**：跨 Session、跨项目沉淀和复用上下文
- **可治理可审计**：所有 Agent 行动可追溯、可度量、可管控
- **三层架构**：效能管理（全局）→ 管理智能体/群主（调度）→ 普通 Agent/Skill（执行）

本次调研的目标是：**找出最适合在 AgentOS 上构建多智能体系统的架构范式**，而不是简单地套用某个开源框架。

---

## 2. 主流多智能体架构分类

### 2.1 架构分类总览

根据 2024-2025 年多智能体领域的工程实践和学术研究，当前主流架构可分为四大类：

```
多智能体架构谱系
├── 工作流导向型（Workflow-Oriented）
│   ├── LangGraph  ← 状态机图
│   ├── CrewAI     ← 角色队列
│   ├── MetaGPT    ← SOP流程
│   └── AutoGen v0.4  ← Actor模型
│
├── 对话导向型（Conversation-Oriented）
│   ├── AutoGen（经典版） ← 群聊模式
│   └── OpenAI Swarm      ← 轻量handoff
│
├── 蜂群型（Swarm）
│   └── OpenAI Swarm / ruVflo  ← 无中心调度
│
└── 协议标准化型（Protocol-Based）
    ├── A2A Protocol（Google） ← Agent互操作
    ├── MCP（Anthropic）      ← 工具标准化
    └── Microsoft Agent Framework ← 企业统一框架
```

### 2.2 核心框架深度对比

| 维度 | **LangGraph** | **CrewAI** | **AutoGen** | **MetaGPT** | **OpenAI Swarm** |
|------|--------------|-----------|-------------|-------------|-----------------|
| **核心抽象** | 有向状态图（StateGraph） | 角色团队（Crew） | 对话代理（ConversableAgent） | SOP角色（PM/Architect/Dev） | 轻量handoff函数 |
| **调度方式** | 显式图定义，边条件控制 | 序列/层级流程 | GroupChatManager选发言人 | 固定流水线 | 无中心，agent自决策 |
| **状态管理** | ✅ 原生持久化 + Checkpoint | ⚠️ 内存为主 | ⚠️ 手动实现 | ⚠️ 共享内存池 | ❌ 无状态 |
| **可控性** | ⭐⭐⭐⭐⭐ 极高 | ⭐⭐⭐ 中等 | ⭐⭐ 较低 | ⭐⭐⭐⭐ 较高 | ⭐ 很低 |
| **可审计性** | ⭐⭐⭐⭐⭐ 节点级可追溯 | ⭐⭐⭐ 任务级 | ⭐⭐ 对话级 | ⭐⭐⭐⭐ 角色级 | ⭐ 难以追踪 |
| **学习曲线** | 陡峭 | 平缓 | 中等 | 陡峭 | 极平缓 |
| **Token效率** | ⭐⭐⭐⭐⭐ 高（聚焦prompt） | ⭐⭐⭐ 中（角色背景占用） | ⭐⭐ 低（对话来回消耗） | ⭐⭐⭐ 中 | ⭐⭐⭐⭐ 高 |
| **失败恢复** | ✅ 原生checkpoint恢复 | ❌ 需自行实现 | ❌ 需自行实现 | ⚠️ 阶段回滚 | ❌ 无 |
| **生产就绪度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **典型场景** | 合规流程、数据处理、客服升级 | 内容创作、销售自动化 | 代码生成、研究分析 | 软件开发、端到端项目 | 简单路由、客服分诊 |

> 数据来源：arXiv 2602.11583、LangChain 官方文档、CrewAI 文档、AutoGen v0.4 发布说明

---

## 3. 关键架构模式分析

### 3.1 模式一：中心化编排（Orchestrator-Worker）

**代表**：LangGraph、CrewAI（层级模式）、Anthropic Managed Agents

```
┌─────────────────┐
│   Orchestrator  │  ← 群主Agent / Harness
│   (调度中心)     │
└────────┬────────┘
         │ 分解任务
    ┌────┼────┬────────┐
    ▼    ▼    ▼        ▼
┌───┐ ┌──┐ ┌───┐  ┌────┐
│W1 │ │W2│ │W3 │  │W4  │  ← 子Agent / Skill
└───┘ └──┘ └───┘  └────┘
    └────┼────┘
         ▼
    ┌─────────┐
    │ 结果聚合  │  ← Orchestrator 整合
    └─────────┘
```

**核心特征**：
- 一个中心调度器负责分解任务、分发子任务、聚合结果
- 子 Agent 之间不直接通信，所有信息通过 Orchestrator 中转
- 通信内容被约束为结构化产物：任务规格、中间结果、错误报告

**优点**：
- ✅ 调试简单：所有决策路径集中在一处
- ✅ 监控简单：Orchestrator 是天然的可观测点
- ✅ 可控性强：人类可以在 Orchestrator 层介入审批

**缺点**：
- ⚠️ 单点瓶颈：大量 Agent 依赖一个协调器
- ⚠️ 并行度受限：Orchestrator 需要串行处理多个子任务结果

**与 AgentOS 的匹配度**：⭐⭐⭐⭐⭐ **高度匹配**
- AgentOS 的"群主 Agent"就是 Orchestrator 的角色
- "@下派"机制就是任务分解和分发
- 第一层效能管理可以直接监控 Orchestrator 的决策日志

---

### 3.2 模式二：角色团队（Role-Based Crew）

**代表**：CrewAI、MetaGPT、ChatDev

```
┌─────────────┐
│   产品经理   │ ← 角色A：定义需求
└──────┬──────┘
       ▼
┌─────────────┐
│   架构师     │ ← 角色B：设计架构
└──────┬──────┘
       ▼
┌─────────────┐
│   工程师     │ ← 角色C：编写代码
└──────┬──────┘
       ▼
┌─────────────┐
│   测试员     │ ← 角色D：验证质量
└─────────────┘
```

**核心特征**：
- 每个 Agent 有明确的角色定义（角色名、目标、背景故事、工具权限）
- 按照预定义的流程（顺序或层级）协作
- 强调"标准作业程序"（SOP）

**优点**：
- ✅ 直观易懂：贴合企业组织架构
- ✅ 角色专业化：每个 Agent 聚焦特定能力
- ✅ 输出质量高：MetaGPT 在代码 benchmark 上 pass rate 超 85%

**缺点**：
- ⚠️ 流程僵化：难以动态调整角色和流程
- ⚠️ 上下文膨胀：每个角色的 backstory 占用大量 token
- ⚠️ 不适合非结构化任务：SOP 难以覆盖所有边缘情况

**与 AgentOS 的匹配度**：⭐⭐⭐ **中等匹配**
- 可以作为 AgentOS 中"特定项目模板"的实现（如软件开发项目）
- 但不适合作为通用调度范式——AgentOS 的群主需要更灵活的动态调度能力

---

### 3.3 模式三：对话群聊（Group Chat）

**代表**：AutoGen（经典版）、Anthropic Agent Teams

```
┌─────┐     ┌─────┐     ┌─────┐
│Agent│◄───►│Agent│◄───►│Agent│
│  A  │     │  B  │     │  C  │
└──┬──┘     └──┬──┘     └──┬──┘
   └───────────┼───────────┘
               ▼
          ┌─────────┐
          │ GroupChat│ ← 共享对话上下文
          │ Manager  │ ← 决定下一个谁发言
          └─────────┘
```

**核心特征**：
- 多个 Agent 共享同一个对话上下文
- GroupChatManager 根据策略选择下一个发言人（轮询、随机、基于内容匹配）
- Agent 之间通过自然语言直接通信

**优点**：
- ✅ 灵活性极高：Agent 可以自发协作
- ✅ 贴合人类习惯：像企业微信群一样工作
- ✅ 涌现能力强：可能产生意想不到的协作效果

**缺点**：
- ❌ 难以审计：自然语言通信难以结构化追踪
- ❌ 容易跑飞：终止条件和迭代限制没配好会无限循环
- ❌ 调试困难：对话历史长，错误定位难
- ❌ Token 消耗大：多人对话上下文快速膨胀

**与 AgentOS 的匹配度**：⭐⭐ **低匹配**
- AutoGen 的群聊模式与 AgentOS 的"群聊"UI 很像，但底层机制完全不同
- AgentOS 需要的是**结构化可审计的通信**，不是自由对话
- 可以借鉴其"共享上下文"的UI表现形式，但不能用其调度机制

---

### 3.4 模式四：蜂群架构（Swarm）

**代表**：OpenAI Swarm、ruVflo

```
┌─────┐     ┌─────┐     ┌─────┐
│Agent│◄───►│Agent│◄───►│Agent│
│  A  │     │  B  │     │  C  │
└─────┘     └─────┘     └─────┘
   ▲    handoff    ▲
   └───────────────┘
      （无中心调度）
```

**核心特征**：
- 无中心 Orchestrator，Agent 自己决定任务归属
- handoff 函数：Agent A 判断自己不适合处理，将上下文传递给 Agent B
- 基于能力匹配动态路由

**优点**：
- ✅ 去中心化：没有单点故障
- ✅ 可扩展性：新增 Agent 只需声明能力，无需改调度逻辑

**缺点**：
- ❌ 不可预测：执行路径由模型实时决定，难以审计
- ❌ 调试极难：handoff 链可能很长且分叉
- ❌ 不适合 B 端：企业需要确定性，蜂群提供的是概率性

**与 AgentOS 的匹配度**：⭐ **不匹配**
- AgentOS 是 B 端企业系统，**可预测性、可审计性、可控性**是核心需求
- 蜂群架构与这些需求直接矛盾

---

### 3.5 模式五：协议标准化（A2A + MCP）

**代表**：Google A2A、Anthropic MCP、Microsoft Agent Framework

```
┌─────────────────────────────────────────┐
│           Agent A（LangGraph）            │
│              A2A Protocol                │
└─────────────────┬───────────────────────┘
                  │ HTTP + Task/Message
┌─────────────────▼───────────────────────┐
│           Agent B（AutoGen）              │
│              MCP Server                  │
└─────────────────────────────────────────┘
```

**核心特征**：
- **A2A（Agent-to-Agent）**：定义 Agent 间通信的标准协议（AgentCard、Task、Message）
- **MCP（Model Context Protocol）**：定义 Agent 与工具连接的标准协议（tools、resources、prompts）
- 目标：跨框架互操作，不同框架构建的 Agent 可以协作

**与 AgentOS 的匹配度**：⭐⭐⭐⭐ **高度匹配（作为连接层）**
- A2A 可以作为 AgentOS 中"群主与第三方 Agent 通信"的标准协议
- MCP 可以作为 AgentOS 中"Skill 接入"的标准接口
- 但**不应将协议层当作架构层**——协议解决的是"怎么连"，不解决"怎么调"

---

## 4. 与 AgentOS 三层架构的匹配分析

### 4.1 第一层：效能管理智能体

| 架构模式 | 适用性 | 说明 |
|---------|-------|------|
| LangGraph Checkpoint | ⭐⭐⭐⭐⭐ | 原生支持状态持久化和历史回溯，完美支撑审计需求 |
| CrewAI 日志 | ⭐⭐⭐ | 任务级日志，粒度不够细 |
| AutoGen 对话记录 | ⭐⭐ | 自然语言记录，难以结构化分析 |
| 蜂群 | ⭐ | 无确定路径，无法审计 |

**推荐**：借鉴 LangGraph 的 **显式状态图 + Checkpoint 机制**，构建效能管理层的观测基础。

### 4.2 第二层：管理智能体（群主）

| 架构模式 | 适用性 | 说明 |
|---------|-------|------|
| LangGraph StateGraph | ⭐⭐⭐⭐⭐ | 状态机驱动的调度，与 Harness 概念天然契合 |
| CrewAI 层级流程 | ⭐⭐⭐ | 可用，但不够灵活 |
| AutoGen GroupChat | ⭐⭐ | 自由度过高，群主失去控制权 |
| MetaGPT SOP | ⭐⭐⭐ | 适合特定领域模板，不适合通用群主 |
| Anthropic Harness | ⭐⭐⭐⭐⭐ | 无状态 + Session 驱动，与群主职责完全对应 |

**推荐**：**LangGraph 状态机 + Anthropic Harness 解耦思想** 的融合方案。

具体而言：
- 用 **LangGraph 的 StateGraph** 定义群主的调度状态机（计划→执行→审查→完成）
- 用 **Anthropic Harness 的无状态设计** 保证群主可替换、可恢复
- 用 **Session Log** 作为群主的唯一状态源

### 4.3 第三层：普通 Agent / Skill

| 架构模式 | 适用性 | 说明 |
|---------|-------|------|
| MCP Server | ⭐⭐⭐⭐⭐ | Skill 的标准化封装，统一接入接口 |
| CrewAI Tool | ⭐⭐⭐⭐ | 易用但绑定 CrewAI 生态 |
| AutoGen Tool | ⭐⭐⭐ | 灵活但缺乏标准 |
| A2A Agent | ⭐⭐⭐⭐ | 第三方 Agent 接入的标准方式 |

**推荐**：**MCP 作为 Skill 的接入标准**，A2A 作为第三方 Agent 的接入标准。

---

## 5. 推荐架构方案

### 5.1 核心结论

**AgentOS 不应直接套用任何一个现成框架，而应采用"融合架构"：**

```
AgentOS 多智能体架构 = 
    LangGraph 的状态机调度（第二层群主）
  + Anthropic Harness 的解耦设计（Session/Harness/Hand 三层抽象）
  + MCP / A2A 的标准化接入（第三层 Skill/Agent）
  + 自研效能管理层（第一层治理）
```

### 5.2 分层技术选型

| AgentOS 层级 | 借鉴对象 | 核心能力 | 不采用原生框架的原因 |
|-------------|---------|---------|-------------------|
| **第一层：效能管理** | LangGraph Checkpoint + 自研 | 全局观测、风险分析、覆盖率统计 | 现有框架没有企业治理层 |
| **第二层：群主调度** | LangGraph StateGraph + Anthropic Harness | 状态机调度、无状态恢复、上下文工程 | 需要融合两者优势，且必须支持"@下派"语义 |
| **第三层：Skill** | MCP Server | 标准化工具接入 | 直接采用行业标准，不重复造轮子 |
| **第三层：第三方Agent** | A2A Protocol | 跨框架 Agent 互操作 | 直接采用行业标准 |
| **通信协议** | 自研 + A2A | 结构化事件流（Session Log）| 现有协议的通信粒度不满足审计需求 |

### 5.3 为什么不直接用 LangGraph / CrewAI / AutoGen？

| 框架 | 不直接采用的原因 |
|------|----------------|
| **LangGraph** | 状态机设计优秀，但绑定 LangChain 生态、Python 技术栈；AgentOS 需要跨语言、跨部署的独立核心引擎 |
| **CrewAI** | 角色抽象适合快速原型，但层级调度不够灵活，且对"群主动态拉人进群"的支持有限 |
| **AutoGen** | 对话模型自由度太高，不适合 B 端审计需求；v0.4 的 Actor 模型有改进但仍不够结构化 |
| **MetaGPT** | SOP 过于僵化，只适合软件开发领域，不能作为通用 B 端平台的调度范式 |
| **OpenAI Swarm** | 无中心调度与 B 端可控性需求直接矛盾 |

### 5.4 自建核心引擎的建议接口

```typescript
// 第二层：群主调度引擎（Harness Core）
interface HarnessEngine {
  // 状态机定义
  defineWorkflow(nodes: Node[], edges: Edge[]): Workflow;
  
  // 生命周期
  wake(sessionId: string): Promise<HarnessState>;
  suspend(): Promise<void>;
  
  // 核心循环
  runStep(): Promise<StepResult>;
  
  // 上下文工程
  packContext(session: Session, strategy: ContextStrategy): Context;
  
  // 工具路由
  route(toolCall: ToolCall): Promise<ToolResult>;
  
  // 事件持久化
  emit(event: Event): Promise<void>;
}

// 第三层：Skill / Agent 接入标准
interface SkillAdapter {
  // MCP 兼容
  mcpServer?: MCPServer;
  
  // A2A 兼容
  a2aAgent?: A2AAgent;
  
  // 自研 Skill 直接接入
  execute(input: string): Promise<string>;
  
  // 元数据
  schema: ToolSchema;
  capabilities: string[];
}

// 第一层：效能管理接口
interface GovernanceLayer {
  // 审计查询
  audit(sessionId: string, range: TimeRange): AuditLog[];
  
  // 风险分析
  analyzeRisk(sessions: Session[]): RiskReport;
  
  // 覆盖率统计
  coverageMetrics(projectId: string): CoverageReport;
  
  // 能力缺口
  capabilityGap(tasks: Task[]): GapAnalysis;
}
```

---

## 6. 参考框架与文献

| 来源 | 链接 | 核心收获 |
|------|------|---------|
| Anthropic Managed Agents | https://www.anthropic.com/engineering/managed-agents | Harness/Session/Sandbox 解耦架构 |
| Anthropic Building Effective Agents | https://www.anthropic.com/research/building-effective-agents | 五种 Agent 模式（Router、Parallel、Orchestrator 等）|
| LangGraph 文档 | https://langchain-ai.github.io/langgraph/ | 状态机图、Checkpoint、Human-in-the-loop |
| CrewAI 文档 | https://docs.crewai.com/ | 角色抽象、流程定义 |
| AutoGen v0.4 | https://microsoft.github.io/autogen/ | Actor 模型、异步编排 |
| Google A2A Protocol | https://github.com/google/A2A | Agent 间通信标准 |
| Anthropic MCP | https://modelcontextprotocol.io/ | 工具接入标准 |
| arXiv 2602.11583 | Multi-Agent Framework Comparison | 框架对比学术论文 |
| Multi-AgentBench | Zhu et al., 2025 | 多智能体评测基准 |

---

## 7. 下一步建议

1. **先定义 Harness 核心接口**：`wake` / `runStep` / `emit` / `route`，接口定了实现可以换
2. **用 LangGraph 做早期原型**：快速验证状态机调度逻辑，但保持抽象层独立
3. **MCP 优先接入 Skill**：第三层先对接已有 MCP Server（文件系统、数据库、搜索），降低初期工作量
4. **Session 存储先行落地**：这是第一层效能管理能运转的前提，也是 Harness 无状态化的基础
5. **Human-in-the-loop 节点预留**：B 端审批节点必须在状态机中显式定义，不能依赖模型自发决策
