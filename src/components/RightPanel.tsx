import { useState } from 'react';
import {
  Database, Network, Shield,
  CheckCircle2, Circle, Loader2, ArrowRight,
} from 'lucide-react';
import { taskFlow, dataItems } from '../data/mockData';

interface RightPanelProps {
  activeView: string;
  activeProjectId: string | null;
  selectedDataItemId: string | null;
}

type BottomTabKey = 'audit' | 'file' | 'graph';

const bottomTabs: { key: BottomTabKey; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { key: 'audit', label: '数据', icon: Shield },
  { key: 'file', label: '文件', icon: Database },
  { key: 'graph', label: '图谱', icon: Network },
];

// 横向任务流组件
function TaskFlowHorizontal() {
  return (
    <div className="h-full flex flex-col px-4 py-2.5">
      <h3 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 shrink-0">任务工作流</h3>
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="flex items-center gap-1.5 w-full overflow-x-auto pb-1">
          {taskFlow.map((step, i) => {
            const isLast = i === taskFlow.length - 1;
            return (
              <div key={i} className="flex items-center gap-1.5 shrink-0">
                <div className="flex flex-col items-center min-w-[80px]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 ${
                    step.status === 'completed'
                      ? 'bg-success-subtle border-success text-success'
                      : step.status === 'in-progress'
                      ? 'bg-warning-subtle border-warning text-warning'
                      : 'bg-bg border-border text-text-muted'
                  }`}>
                    {step.status === 'completed' && <CheckCircle2 className="w-4 h-4" strokeWidth={2} />}
                    {step.status === 'in-progress' && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                    {step.status === 'pending' && <Circle className="w-4 h-4" strokeWidth={2} />}
                  </div>
                  <span className={`text-[11px] font-medium text-center leading-tight ${
                    step.status === 'completed' ? 'text-success' :
                    step.status === 'in-progress' ? 'text-warning' : 'text-text-muted'
                  }`}>
                    {step.name}
                  </span>
                  <span className="text-[10px] text-text-muted mt-0.5 text-center leading-tight">{step.agent}</span>
                </div>
                {!isLast && (
                  <div className="flex flex-col items-center px-0.5">
                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${
                      step.status === 'completed' ? 'text-success/40' : 'text-border'
                    }`} strokeWidth={1.5} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 数据 Tab：上传文件 + 产出
function DataPanel() {
  return (
    <div className="h-full flex flex-col px-4 py-3 overflow-y-auto">
      {/* 上传文件 */}
      <div className="mb-3">
        <h4 className="text-[11px] font-semibold text-text-muted mb-2">上传文件</h4>
        <div className="space-y-1.5">
          {[
            { name: 'sales_q3.xlsx', size: '2.3MB' },
            { name: 'region_data.csv', size: '856KB' },
            { name: 'budget_notes.md', size: '12KB' },
          ].map((f) => (
            <div key={f.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg transition-colors cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] text-primary font-medium">{f.name.split('.').pop()?.toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-text truncate">{f.name}</div>
                <div className="text-[10px] text-text-muted">{f.size}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border-light my-2" />

      {/* 产出 */}
      <div className="flex-1">
        <h4 className="text-[11px] font-semibold text-text-muted mb-2">产出</h4>
        <div className="space-y-1.5">
          {[
            { name: 'Q3营收对比图.png', size: '1.2MB' },
            { name: '分析报告.pdf', size: '3.5MB' },
            { name: '趋势数据.xlsx', size: '1.8MB' },
          ].map((f) => (
            <div key={f.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg transition-colors cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] text-success font-medium">{f.name.split('.').pop()?.toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-text truncate">{f.name}</div>
                <div className="text-[10px] text-text-muted">{f.size}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 图谱 Tab：项目维度关系
function GraphPanel() {
  return (
    <div className="h-full flex flex-col px-4 py-3 overflow-y-auto">
      <h4 className="text-[11px] font-semibold text-text-muted mb-2">项目关系图谱</h4>
      <div className="space-y-2">
        <div className="bg-bg border border-border rounded-xl p-3">
          <div className="text-xs font-medium text-text mb-1">中心节点</div>
          <div className="text-[11px] text-text-secondary">Q3 财报分析</div>
        </div>
        <div className="bg-bg border border-border rounded-xl p-3">
          <div className="text-xs font-medium text-text mb-1.5">关联 Agent</div>
          <div className="flex flex-wrap gap-1.5">
            {['知识工程', '数据治理', '图表生成'].map((a) => (
              <span key={a} className="text-[11px] px-2 py-0.5 bg-agent-host-subtle text-agent-host rounded-md">{a}</span>
            ))}
          </div>
        </div>
        <div className="bg-bg border border-border rounded-xl p-3">
          <div className="text-xs font-medium text-text mb-1.5">关联 Skill</div>
          <div className="flex flex-wrap gap-1.5">
            {['SQL执行器', '企业搜索', 'PDF解析'].map((s) => (
              <span key={s} className="text-[11px] px-2 py-0.5 bg-skill-subtle text-skill rounded-md">{s}</span>
            ))}
          </div>
        </div>
        <div className="bg-bg border border-border rounded-xl p-3">
          <div className="text-xs font-medium text-text mb-1.5">关键洞察</div>
          <div className="space-y-1 text-[11px] text-text-secondary">
            <div>• 营收对比分析</div>
            <div>• 消费者业务下滑 5%</div>
            <div>• 海外市场增长 34%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 数据详情面板
function DataDetailPanel({ selectedId }: { selectedId: string | null }) {
  const selected = dataItems.find(d => d.id === selectedId);

  if (selected) {
    const max = Math.max(...(selected.data?.map(d => d.value) || [0]));
    return (
      <div className="h-full flex flex-col px-4 py-3 overflow-y-auto">
        <h4 className="text-[11px] font-semibold text-text-muted mb-1">{selected.title}</h4>
        <p className="text-[10px] text-text-muted mb-3">{selected.description}</p>
        <div className="bg-white border border-border/60 rounded-xl p-3 mb-3">
          {selected.chartType === 'bar' && selected.data && (
            <div className="flex items-end gap-2 h-32">
              {selected.data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] font-medium text-text">{d.value}</div>
                  <div className={`w-full rounded-t ${d.change?.startsWith('-') ? 'bg-rose-400' : 'bg-primary/80'}`} style={{ height: `${(d.value / max) * 100}%` }} />
                  <span className="text-[9px] text-text-muted truncate w-full text-center">{d.label}</span>
                  {d.change && <span className={`text-[9px] ${d.change.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>{d.change}</span>}
                </div>
              ))}
            </div>
          )}
          {selected.chartType === 'line' && selected.data && (
            <div className="flex items-end gap-2 h-32 px-2">
              <svg viewBox={`0 0 ${selected.data.length * 40} 100`} className="w-full h-full" preserveAspectRatio="none">
                <polyline fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"
                  points={selected.data.map((d, i) => `${i * 40 + 20},${100 - (d.value / max) * 80}`).join(' ')} />
                {selected.data.map((d, i) => (
                  <g key={i}>
                    <circle cx={i * 40 + 20} cy={100 - (d.value / max) * 80} r="3" className="fill-primary" />
                    <text x={i * 40 + 20} y={95} textAnchor="middle" className="fill-text-muted" style={{ fontSize: '8px' }}>{d.label}</text>
                    <text x={i * 40 + 20} y={100 - (d.value / max) * 80 - 8} textAnchor="middle" className="fill-text" style={{ fontSize: '9px', fontWeight: 500 }}>{d.value}</text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h5 className="text-[11px] font-semibold text-text-muted mb-1">数据明细</h5>
          {selected.data?.map((d, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-bg">
              <span className="text-[11px] text-text">{d.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-text">{d.value}</span>
                {d.change && <span className={`text-[10px] ${d.change.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>{d.change}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-4 py-3 overflow-y-auto">
      <h4 className="text-[11px] font-semibold text-text-muted mb-2">数据产出</h4>
      <div className="space-y-2">
        {dataItems.map((item) => (
          <div key={item.id} className="bg-white border border-border/60 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium text-text">{item.title}</span>
              <span className="text-[10px] text-text-muted">{item.chartType === 'bar' ? '柱状图' : '折线图'}</span>
            </div>
            <p className="text-[10px] text-text-muted">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RightPanel({ activeView, activeProjectId, selectedDataItemId }: RightPanelProps) {
  const [bottomTab, setBottomTab] = useState<BottomTabKey>('audit');

  const isProjectView = activeView === 'project' && activeProjectId;
  if (!isProjectView) return null;

  return (
    <div className="h-full w-full flex flex-col bg-surface/80 backdrop-blur-md border-l border-border">
      {/* 上半部分：横向任务流 */}
      <div className="h-[28%] shrink-0 border-b border-border">
        <TaskFlowHorizontal />
      </div>

      {/* 下半部分：选项卡切换 */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Tab Bar */}
        <div className="flex items-center border-b border-border shrink-0 bg-surface/50">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setBottomTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium border-b-2 transition-all duration-200 ${
                  bottomTab === tab.key
                    ? 'border-primary text-primary-dark'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                <Icon className="w-3 h-3" strokeWidth={1.8} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {bottomTab === 'file' && <DataPanel />}
          {bottomTab === 'graph' && <GraphPanel />}
          {bottomTab === 'audit' && <DataDetailPanel selectedId={selectedDataItemId} />}
        </div>
      </div>
    </div>
  );
}
