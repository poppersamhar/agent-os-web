# Agent OS Web

> AI-native project management platform —— 数字员工协作平台前端原型

[![Vercel](https://img.shields.io/badge/Vercel-Live%20Demo-black?logo=vercel)](https://agent-os-web-mu.vercel.app)

**在线预览** 👉 [https://agent-os-web-mu.vercel.app](https://agent-os-web-mu.vercel.app)

---

## 技术栈

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** — 原子化样式
- **Canvas 2D** — 自研力导向关系图谱（物理引擎 + 流体避让）
- **lucide-react** — 线稿图标系统

## 核心功能

| 模块 | 说明 |
|------|------|
| **项目图谱** | 点击项目进入 Canvas 2D 力导向图谱，节点按种类着色，悬停展示详情卡片 |
| **任务群聊** | 苹果风聊天界面，支持 Agent / Skill / BizAgent 多角色对话，数据产出可点击联动右侧面板 |
| **数字员工** | Agent 卡片网格，按 domain 区分，支持新建与挂载 Skills |
| **Skills** | Skill 卡片管理，按类别分类，支持状态开关 |
| **右侧数据面板** | 任务工作流 + 数据 / 文件 / 图谱 三栏切换 |

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 设计原则

- **Less is more** — 极简信息密度
- **线稿图标** — 统一 `strokeWidth=1.5`，无填充色
- **毛玻璃卡片** — `backdrop-blur` 营造层级
- **主题色系统** — 全局 CSS 变量，可扩展暗色模式

## 文件结构

```
src/
├── components/        # 页面组件
│   ├── KnowledgeGraph.tsx   # Canvas 2D 力导向图谱
│   ├── ProjectChat.tsx      # 任务群聊
│   ├── Sidebar.tsx          # 左侧导航
│   ├── RightPanel.tsx       # 右侧任务/数据面板
│   ├── AgentPage.tsx        # 数字员工
│   ├── SkillPage.tsx        # Skills
│   └── ...
├── data/mockData.ts   # Mock 数据（2 个 B 端项目 + 3 个 Agent）
├── contexts/          # 主题上下文
└── App.tsx            # 全局路由
```

## License

MIT
