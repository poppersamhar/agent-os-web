import { useState } from 'react';
import {
  Plug, Check, Plus, ExternalLink, Settings, RefreshCw,
  FileText, Code, PenTool, ListTodo, MessageSquare,
  Table, Bot, Cloud, Database, Zap, Shield, Trash2,
} from 'lucide-react';

/* ─── Types ─── */
interface Connector {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  connected: boolean;
  category: 'document' | 'dev' | 'design' | 'project' | 'comm' | 'data' | 'model' | 'automation';
  status?: 'active' | 'error' | 'pending';
}

/* ─── Mock Data ─── */
const initialConnectors: Connector[] = [
  { id: 'notion', name: 'Notion', description: '文档、数据库与知识库同步', icon: FileText, connected: true, category: 'document', status: 'active' },
  { id: 'github', name: 'GitHub', description: '代码仓库、Issues 与 PR 管理', icon: Code, connected: true, category: 'dev', status: 'active' },
  { id: 'slack', name: 'Slack', description: '团队消息与频道通知', icon: MessageSquare, connected: true, category: 'comm', status: 'active' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4 / GPT-4o 模型调用', icon: Bot, connected: true, category: 'model', status: 'active' },
  { id: 'figma', name: 'Figma', description: '设计文件与组件库访问', icon: PenTool, connected: false, category: 'design' },
  { id: 'linear', name: 'Linear', description: '项目任务与里程碑追踪', icon: ListTodo, connected: false, category: 'project' },
  { id: 'sheets', name: 'Google Sheets', description: '电子表格数据读写', icon: Table, connected: false, category: 'data' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5 / Claude 4 模型调用', icon: Bot, connected: false, category: 'model' },
  { id: 'airtable', name: 'Airtable', description: '结构化数据库与视图', icon: Database, connected: false, category: 'data' },
  { id: 'zapier', name: 'Zapier', description: '跨应用自动化工作流', icon: Zap, connected: false, category: 'automation' },
  { id: 'cloud', name: 'AWS S3', description: '对象存储与文件管理', icon: Cloud, connected: false, category: 'data' },
  { id: 'sentinel', name: 'Sentinel', description: '安全审计与访问控制', icon: Shield, connected: false, category: 'automation' },
];

const categoryLabels: Record<string, string> = {
  document: '文档',
  dev: '开发',
  design: '设计',
  project: '项目管理',
  comm: '通讯',
  data: '数据',
  model: '模型',
  automation: '自动化',
};

const categoryOrder = ['document', 'dev', 'design', 'project', 'comm', 'data', 'model', 'automation'];

/* ─── Components ─── */
function ConnectorCard({
  connector,
  onToggle,
}: {
  connector: Connector;
  onToggle: (id: string) => void;
}) {
  const Icon = connector.icon;
  const isConnected = connector.connected;

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        isConnected
          ? 'bg-white/80 backdrop-blur-md border-primary/20 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
          : 'bg-white/40 backdrop-blur-sm border-border/40 hover:bg-white/70 hover:border-border/60'
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isConnected ? 'bg-primary/10' : 'bg-gray-100'
          }`}>
            <Icon className={`w-5 h-5 ${isConnected ? 'text-primary-dark' : 'text-text-muted'}`} strokeWidth={1.5} />
          </div>
          {isConnected ? (
            <div className="flex items-center gap-1 text-[10px] font-medium text-success bg-success-subtle px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" strokeWidth={2} />
              已连接
            </div>
          ) : (
            <span className="text-[10px] text-text-muted bg-bg px-2 py-0.5 rounded-full border border-border-light">
              {categoryLabels[connector.category]}
            </span>
          )}
        </div>

        {/* Info */}
        <h3 className="text-sm font-semibold text-text mb-1">{connector.name}</h3>
        <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{connector.description}</p>

        {/* Action */}
        <button
          onClick={() => onToggle(connector.id)}
          className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-all ${
            isConnected
              ? 'bg-bg text-text-muted hover:text-danger hover:bg-danger-subtle border border-border-light'
              : 'bg-primary text-white hover:bg-primary-dark shadow-sm'
          }`}
        >
          {isConnected ? (
            <>
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              断开
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              连接
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ToolsPage() {
  const [connectors, setConnectors] = useState<Connector[]>(initialConnectors);
  const [filter, setFilter] = useState<string>('all');

  const handleToggle = (id: string) => {
    setConnectors(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, connected: !c.connected, status: !c.connected ? 'active' : undefined }
          : c
      )
    );
  };

  const connectedList = connectors.filter(c => c.connected);
  const availableList = connectors.filter(c => {
    if (!c.connected) {
      return filter === 'all' || c.category === filter;
    }
    return false;
  });

  const connectedCount = connectedList.length;
  const totalCount = connectors.length;

  return (
    <div className="h-full overflow-y-auto px-8 py-8">
      {/* Page Header */}
      <div className="max-w-[900px] mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Plug className="w-5 h-5 text-primary-dark" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text tracking-tight">工具与连接</h1>
            <p className="text-[12px] text-text-muted">管理 MCP 连接器与 API 接口</p>
          </div>
        </div>
        <p className="text-[13px] text-text-secondary leading-relaxed max-w-[520px] mt-3">
          一键连接团队已有的工具，让 Agent 无缝访问业务数据。
          支持 Notion、GitHub、Slack 等主流平台，以及 OpenAI、Anthropic 等模型 API。
        </p>
      </div>

      <div className="max-w-[900px] mx-auto space-y-8">
        {/* Stats Bar */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-border/40">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-[12px] text-text-secondary">
              <span className="font-semibold text-text">{connectedCount}</span> / {totalCount} 已连接
            </span>
          </div>
          <button className="flex items-center gap-1.5 text-[12px] text-primary hover:text-primary-dark transition-colors">
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
            刷新状态
          </button>
          <button className="flex items-center gap-1.5 text-[12px] text-primary hover:text-primary-dark transition-colors">
            <Settings className="w-3.5 h-3.5" strokeWidth={1.5} />
            API 配置
          </button>
        </div>

        {/* Connected Section */}
        {connectedList.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
              <Check className="w-4 h-4 text-success" strokeWidth={1.5} />
              已连接
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {connectedList.map(c => (
                <ConnectorCard key={c.id} connector={c} onToggle={handleToggle} />
              ))}
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Available Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" strokeWidth={1.5} />
              可用连接
            </h2>
            {/* Category Filter */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                  filter === 'all' ? 'bg-primary text-white' : 'bg-bg text-text-muted hover:text-text'
                }`}
              >
                全部
              </button>
              {categoryOrder.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                    filter === cat ? 'bg-primary text-white' : 'bg-bg text-text-muted hover:text-text'
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableList.map(c => (
              <ConnectorCard key={c.id} connector={c} onToggle={handleToggle} />
            ))}
          </div>

          {availableList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Plug className="w-10 h-10 mb-3 opacity-30" strokeWidth={1.2} />
              <p className="text-sm">该分类下暂无可用的连接器</p>
            </div>
          )}
        </section>

        {/* API Config Section */}
        <section className="bg-white/60 backdrop-blur-sm rounded-2xl border border-border/40 p-5">
          <h2 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
            API 配置
          </h2>
          <div className="space-y-3">
            {[
              { label: 'OpenAI API Key', placeholder: 'sk-...', status: '已配置' },
              { label: 'Anthropic API Key', placeholder: 'sk-ant-...', status: '未配置' },
              { label: '自定义 MCP Server', placeholder: 'http://localhost:3000/sse', status: '未配置' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-text-secondary mb-1 block">{item.label}</label>
                  <input
                    type="password"
                    placeholder={item.placeholder}
                    className="w-full bg-white/80 rounded-lg px-3 py-2 text-xs text-text border border-border/50 outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="pt-5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    item.status === '已配置'
                      ? 'bg-success-subtle text-success'
                      : 'bg-text-muted/10 text-text-muted'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-2 text-[11px] text-text-muted">
            <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
            <span>API Key 仅存储在本地浏览器中，不会上传到服务器</span>
          </div>
        </section>
      </div>

      {/* Bottom spacer for scroll */}
      <div className="h-16" />
    </div>
  );
}
