import { useState } from 'react';
import {
  Search, ChevronDown, Code, FileText, MessageSquare, MessageCircle,
  Layers, Box, Mail, Cloud, Calendar, Settings,
} from 'lucide-react';

/* ─── Types ─── */
interface Connector {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  connected: boolean;
  type: 'MCP' | 'API' | 'APP';
  category: string;
}

/* ─── Mock Data ─── */
const connectors: Connector[] = [
  { id: 'github', name: 'GitHub', description: '连接 GitHub 仓库、Issue 和 Pull Request。', icon: Code, connected: false, type: 'MCP', category: '开发' },
  { id: 'notion', name: 'Notion', description: '同步 Notion 工作区、数据库和页面。', icon: FileText, connected: false, type: 'MCP', category: '效率' },
  { id: 'slack', name: 'Slack', description: '通过 Composio 托管 OAuth 和 MCP 连接 Slack。', icon: MessageSquare, connected: false, type: 'MCP', category: '效率' },
  { id: 'feishu', name: 'Feishu', description: '连接飞书文档、消息、多维表格和日历。', icon: MessageCircle, connected: false, type: 'MCP', category: '效率' },
  { id: 'lark', name: 'Lark', description: '连接 Lark 文档、消息、Base 和日历。', icon: MessageCircle, connected: false, type: 'MCP', category: '效率' },
  { id: 'flowus', name: 'FlowUs', description: '连接 FlowUs 页面、数据库和内容块。', icon: Layers, connected: false, type: 'MCP', category: '效率' },
  { id: 'buildin', name: 'Buildin', description: '连接 Buildin 页面、数据库和内容块。', icon: Box, connected: false, type: 'MCP', category: '效率' },
  { id: 'gmail', name: 'Gmail', description: 'Connect Gmail through Composio managed OAuth and MCP.', icon: Mail, connected: false, type: 'MCP', category: '效率' },
  { id: 'gdrive', name: 'Google Drive', description: '通过 MCP 连接 Google Drive 文件和文件夹。', icon: Cloud, connected: false, type: 'MCP', category: '效率' },
  { id: 'gcal', name: 'Google Calendar', description: '同步 Google Calendar 事件和日程。', icon: Calendar, connected: false, type: 'MCP', category: '效率' },
  { id: 'custom', name: 'Custom MCP', description: '配置自定义 MCP Server 连接。', icon: Settings, connected: false, type: 'MCP', category: '开发' },
];

const filterOptions = ['全部类型', 'APP', 'API', 'MCP'];

/* ─── Components ─── */
function ConnectorCard({
  connector,
  onToggle,
}: {
  connector: Connector;
  onToggle: (id: string) => void;
}) {
  const Icon = connector.icon;

  return (
    <div className="bg-white rounded-xl border border-border/30 p-5 flex flex-col">
      {/* Icon + Name */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-text" strokeWidth={1.5} />
        </div>
        <span className="text-[13px] font-medium text-text">{connector.name}</span>
      </div>

      {/* Description */}
      <p className="text-[12px] text-text-muted leading-relaxed mb-4 flex-1">
        {connector.description}
      </p>

      {/* Tags */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] px-2 py-[2px] rounded-md bg-[#fff0eb] text-[#e17055] font-medium">
          {connector.type}
        </span>
        <span className="text-[10px] px-2 py-[2px] rounded-md bg-gray-50 text-text-muted">
          {connector.category}
        </span>
      </div>

      {/* Connect Button */}
      <button
        onClick={() => onToggle(connector.id)}
        className="w-full py-2 text-[12px] font-medium text-text border border-border/60 rounded-lg hover:bg-bg hover:border-border transition-colors"
      >
        {connector.connected ? '断开' : '+ 连接'}
      </button>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ToolsPage() {
  const [items, setItems] = useState<Connector[]>(connectors);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('全部类型');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleToggle = (id: string) => {
    setItems(prev =>
      prev.map(c => c.id === id ? { ...c, connected: !c.connected } : c)
    );
  };

  const filtered = items.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === '全部类型' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const connectedList = filtered.filter(c => c.connected);
  const availableList = filtered.filter(c => !c.connected);

  return (
    <div className="min-h-full px-8 py-6 bg-[#f9f9f9]">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-semibold text-text">连接器</h1>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={1.5} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索连接器..."
                className="w-[220px] h-9 pl-9 pr-3 text-[13px] bg-white border border-border/40 rounded-lg outline-none focus:border-primary/30 transition-colors text-text placeholder:text-text-muted"
              />
            </div>
            {/* Type Filter */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1.5 h-9 px-3 text-[13px] bg-white border border-border/40 rounded-lg text-text hover:border-border transition-colors"
              >
                <span>{typeFilter}</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
              </button>
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-border/40 rounded-lg shadow-lg shadow-black/5 z-20 py-1">
                    {filterOptions.map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setTypeFilter(opt); setShowDropdown(false); }}
                        className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-bg transition-colors ${
                          typeFilter === opt ? 'text-primary font-medium' : 'text-text'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 已连接 */}
        <section className="mb-8">
          <h2 className="text-[13px] text-text-muted mb-3">已连接</h2>
          <div className="bg-white rounded-xl border border-border/20 min-h-[100px] flex items-center justify-center">
            {connectedList.length === 0 ? (
              <p className="text-[13px] text-text-muted">没有找到匹配筛选条件的已连接服务</p>
            ) : (
              <div className="grid grid-cols-4 gap-4 w-full p-4">
                {connectedList.map(c => (
                  <ConnectorCard key={c.id} connector={c} onToggle={handleToggle} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 可连接的服务 */}
        <section>
          <h2 className="text-[13px] text-text-muted mb-3">可连接的服务</h2>
          <div className="grid grid-cols-4 gap-4">
            {availableList.map(c => (
              <ConnectorCard key={c.id} connector={c} onToggle={handleToggle} />
            ))}
          </div>
          {availableList.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-[13px] text-text-muted">没有找到匹配筛选条件的可用服务</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
