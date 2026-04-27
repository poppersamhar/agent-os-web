import { useRef, useEffect, useState } from 'react';
import { projects, agents, skills } from '../data/mockData';
import { useTheme } from '../contexts/ThemeContext';
import { X, FileText } from 'lucide-react';
import type { ExcludeRect } from './DraggableChat';

/* ─── Types ─── */
type NodeType = 'project' | 'agent' | 'skill' | 'file' | 'insight';

interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  floatPhase: number;
  floatSpeed: number;
  layer: number;
  detail: string;
  meta?: Record<string, string>;
}

const themeNodeColors: Record<string, Record<NodeType, { fill: string; stroke: string; label: string }>> = {
  emerald: {
    project:  { fill: '#065f46', stroke: '#10b981', label: '项目' },
    agent:    { fill: '#00b894', stroke: '#34d399', label: 'Agent' },
    skill:    { fill: '#7c3aed', stroke: '#a78bfa', label: 'Skill' },
    file:     { fill: '#475569', stroke: '#94a3b8', label: '文件' },
    insight:  { fill: '#d97706', stroke: '#fbbf24', label: '洞察' },
  },
  coral: {
    project:  { fill: '#9a3412', stroke: '#f97316', label: '项目' },
    agent:    { fill: '#e17055', stroke: '#fb923c', label: 'Agent' },
    skill:    { fill: '#0984e3', stroke: '#60a5fa', label: 'Skill' },
    file:     { fill: '#5d4037', stroke: '#a1887f', label: '文件' },
    insight:  { fill: '#ca8a04', stroke: '#facc15', label: '洞察' },
  },
  azure: {
    project:  { fill: '#1e3a5f', stroke: '#3b82f6', label: '项目' },
    agent:    { fill: '#0984e3', stroke: '#60a5fa', label: 'Agent' },
    skill:    { fill: '#8e44ad', stroke: '#c084fc', label: 'Skill' },
    file:     { fill: '#475569', stroke: '#94a3b8', label: '文件' },
    insight:  { fill: '#d97706', stroke: '#fbbf24', label: '洞察' },
  },
};

interface GraphEdge {
  source: string;
  target: string;
}

function buildGraph(projectId: string, taskId?: string | null) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return { nodes: [] as GraphNode[], edges: [] as GraphEdge[] };

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const degree = new Map<string, number>();
  const inc = (id: string) => degree.set(id, (degree.get(id) || 0) + 1);

  const makeNode = (id: string, label: string, type: NodeType, radius: number, mass: number, layer: number, detail: string, meta?: Record<string, string>): GraphNode => ({
    id, label, type, x: 0, y: 0, baseX: 0, baseY: 0, vx: 0, vy: 0, radius, mass,
    floatPhase: Math.random() * Math.PI * 2,
    floatSpeed: 0.0004 + Math.random() * 0.0008,
    layer, detail, meta,
  });

  if (taskId) {
    // 任务子图谱模式
    const chat = project.chats.find((c) => c.id === taskId);
    const centerLabel = chat ? chat.name : '任务节点';
    nodes.push(makeNode('task-center', centerLabel, 'project', 14, 5, 0, chat ? `${chat.name}任务详情` : '任务详情', { 消息数: String(chat?.messages.length || 0) }));

    // 关联的 Agent（从消息中提取）
    const taskAgents = agents.filter((a) => a.workLine === project.name).slice(0, 3);
    taskAgents.forEach((agent) => {
      nodes.push(makeNode(agent.id, agent.name, 'agent', 8.5, 2, 1, agent.description, { 状态: agent.status, 调用: String(agent.calls) }));
      edges.push({ source: 'task-center', target: agent.id });
      inc('task-center'); inc(agent.id);
    });

    // 任务相关文件
    const taskFiles = [
      { name: 'task_data.xlsx', size: '1.2MB' },
      { name: 'analysis_result.csv', size: '456KB' },
    ];
    taskFiles.forEach((f, i) => {
      const fid = `tfile-${i}`;
      nodes.push(makeNode(fid, f.name, 'file', 5.5, 1, 2, `任务文件`, { 大小: f.size }));
      edges.push({ source: 'task-center', target: fid });
      inc('task-center'); inc(fid);
    });

    // 任务洞察
    const taskInsights = [
      { text: '异常发现', desc: '发现3处数据异常' },
      { text: '优化建议', desc: '建议调整参数配置' },
    ];
    taskInsights.forEach((kp, i) => {
      const kid = `tkp-${i}`;
      nodes.push(makeNode(kid, kp.text, 'insight', 5.5, 1, 2, kp.desc));
      edges.push({ source: 'task-center', target: kid });
      inc('task-center'); inc(kid);
    });
  } else {
    // 项目图谱模式
    nodes.push(makeNode(project.id, project.name, 'project', 14, 5, 0, project.description || '项目节点', { 成员: String(project.memberCount) }));

    // 任务节点（用 chats 作为任务）
    project.chats.forEach((chat) => {
      const tid = `chat-${chat.id}`;
      nodes.push(makeNode(tid, chat.name, 'agent', 8.5, 2, 1, `项目任务：${chat.name}`, { 消息数: String(chat.messages.length) }));
      edges.push({ source: project.id, target: tid });
      inc(project.id); inc(tid);
    });

    const relatedAgents = agents.filter((a) => a.workLine === project.name);
    relatedAgents.forEach((agent) => {
      nodes.push(makeNode(agent.id, agent.name, 'agent', 8.5, 2, 1, agent.description, { 状态: agent.status, 调用: String(agent.calls) }));
      edges.push({ source: project.id, target: agent.id });
      inc(project.id); inc(agent.id);
    });

    const relatedSkills = skills.filter((s) =>
      relatedAgents.some((a) => a.mountedSkills.includes(s.id))
    );
    relatedSkills.forEach((skill) => {
      nodes.push(makeNode(skill.id, skill.name, 'skill', 6.5, 1.3, 1, skill.description, { 类别: skill.category, 作者: skill.author }));
      const parent = relatedAgents.find((a) => a.mountedSkills.includes(skill.id));
      if (parent) {
        edges.push({ source: parent.id, target: skill.id });
        inc(parent.id); inc(skill.id);
      }
    });

    const files = [
      { name: 'sales_q3.xlsx', size: '2.3MB' },
      { name: 'region_data.csv', size: '856KB' },
      { name: 'budget_notes.md', size: '12KB' },
    ];
    files.forEach((f, i) => {
      const fid = `file-${i}`;
      nodes.push(makeNode(fid, f.name, 'file', 5.5, 1, 2, `项目文件`, { 大小: f.size }));
      edges.push({ source: project.id, target: fid });
      inc(project.id); inc(fid);
    });

    const keypoints = [
      { text: '营收对比分析', desc: '各业务线Q3营收横向对比' },
      { text: '消费者业务下滑', desc: '消费者业务同比下滑5%' },
      { text: '海外市场+34%', desc: '海外市场增速领跑全业务' },
    ];
    keypoints.forEach((kp, i) => {
      const kid = `kp-${i}`;
      nodes.push(makeNode(kid, kp.text, 'insight', 5.5, 1, 2, kp.desc));
      edges.push({ source: project.id, target: kid });
      inc(project.id); inc(kid);
    });
  }

  nodes.forEach((n) => {
    const d = degree.get(n.id) || 0;
    if (d >= 6) n.radius = 16;
    else if (d >= 4) n.radius = 11;
    else if (d >= 2) n.radius = 8;
  });

  return { nodes, edges };
}

export default function KnowledgeGraph({
  projectId,
  excludeRectRef,
}: {
  projectId: string;
  excludeRectRef?: React.RefObject<ExcludeRect | null>;
}) {
  const { themeColor } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const graphRef = useRef<{ nodes: GraphNode[]; edges: GraphEdge[] }>({ nodes: [], edges: [] });
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const hoveredNodeRef = useRef<GraphNode | null>(null);
  const prevExRef = useRef<{ cx: number; cy: number; active: boolean }>({ cx: 0, cy: 0, active: false });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const themeColorRef = useRef(themeColor);
  themeColorRef.current = themeColor;

  // 递进层级状态
  const [currentLevel, setCurrentLevel] = useState<'project' | 'task'>('project');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState('');
  const [docPreview, setDocPreview] = useState<{ name: string; content: string } | null>(null);

  // ref 同步（供 Canvas 事件闭包读取）
  const levelRef = useRef(currentLevel);
  const taskIdRef = useRef(selectedTaskId);
  const dragMovedRef = useRef(false);
  levelRef.current = currentLevel;
  taskIdRef.current = selectedTaskId;

  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    const taskId = currentLevel === 'task' ? selectedTaskId : null;
    const { nodes, edges } = buildGraph(projectId, taskId);
    graphRef.current = { nodes, edges };
    prevExRef.current = { cx: 0, cy: 0, active: false };
  }, [projectId, currentLevel, selectedTaskId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const { nodes, edges } = graphRef.current;
    const cx = W / 2;
    const cy = H / 2;
    const minDim = Math.min(W, H);

    const centerNodes = nodes.filter((n) => n.layer === 0);
    const midNodes = nodes.filter((n) => n.layer === 1);
    const outerNodes = nodes.filter((n) => n.layer === 2);

    centerNodes.forEach((n) => {
      n.x = cx + (Math.random() - 0.5) * 40;
      n.y = cy + (Math.random() - 0.5) * 40;
    });

    midNodes.forEach((n, i) => {
      const angle = (i / Math.max(1, midNodes.length)) * Math.PI * 2 + Math.random() * 0.5;
      const r = minDim * (0.38 + Math.random() * 0.18);
      n.x = cx + Math.cos(angle) * r;
      n.y = cy + Math.sin(angle) * r;
    });

    outerNodes.forEach((n, i) => {
      const angle = (i / Math.max(1, outerNodes.length)) * Math.PI * 2 + Math.random() * 0.8;
      const r = minDim * (0.62 + Math.random() * 0.22);
      n.x = cx + Math.cos(angle) * r;
      n.y = cy + Math.sin(angle) * r;
    });

    // 预热收敛
    for (let f = 0; f < 1500; f++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (1200 * a.mass * b.mass) / (dist * dist);
          a.vx -= (dx / dist) * force / a.mass;
          a.vy -= (dy / dist) * force / a.mass;
          b.vx += (dx / dist) * force / b.mass;
          b.vy += (dy / dist) * force / b.mass;
        }
      }
      edges.forEach((e) => {
        const a = nodes.find((n) => n.id === e.source);
        const b = nodes.find((n) => n.id === e.target);
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 260) * 0.004;
        a.vx += (dx / dist) * force / a.mass;
        a.vy += (dy / dist) * force / a.mass;
        b.vx -= (dx / dist) * force / b.mass;
        b.vy -= (dy / dist) * force / b.mass;
      });
      const pad = 40;
      nodes.forEach((n) => {
        if (n.x < pad) n.vx += (pad - n.x) * 0.04;
        if (n.x > W - pad) n.vx -= (n.x - (W - pad)) * 0.04;
        if (n.y < pad) n.vy += (pad - n.y) * 0.04;
        if (n.y > H - pad) n.vy -= (n.y - (H - pad)) * 0.04;
      });
      nodes.forEach((n) => {
        n.vx *= 0.94; n.vy *= 0.94;
        n.x += n.vx; n.y += n.vy;
      });
    }

    nodes.forEach((n) => { n.baseX = n.x; n.baseY = n.y; n.vx = 0; n.vy = 0; });

    // ─── 流体渲染循环 ───
    const NODE_REPULSE = 300;
    const FLOW_SPRING = 0.002;
    const FLOW_REST = 280;
    const BOUNDARY_K = 0.02;
    const MOTION_DAMP = 0.97;
    const JITTER = 0.025;
    const RETURN_K = 0.004;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const ex = excludeRectRef?.current;
      const exActive = ex && ex.active;
      const now = Date.now();

      // 排斥当前 BizAgent 位置
      if (exActive) {
        const exCX = ex.x + ex.width / 2;
        const exCY = ex.y + ex.height / 2;

        nodes.forEach((n) => {
          const dx = n.x - exCX;
          const dy = n.y - exCY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 150) {
            const t = 1 - dist / 150;
            const strength = t * t * 0.06;
            n.vx += (dx / dist) * strength;
            n.vy += (dy / dist) * strength;
          }
        });

        // 吸引上一位置（后方流入）
        if (prevExRef.current.active) {
          const moved = Math.abs(exCX - prevExRef.current.cx) + Math.abs(exCY - prevExRef.current.cy);
          if (moved > 2) {
            nodes.forEach((n) => {
              const dx = prevExRef.current.cx - n.x;
              const dy = prevExRef.current.cy - n.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              if (dist < 220) {
                const t = 1 - dist / 220;
                const strength = t * t * 0.035;
                n.vx += (dx / dist) * strength;
                n.vy += (dy / dist) * strength;
              }
            });
          }
        }

        prevExRef.current = { cx: exCX, cy: exCY, active: true };
      } else {
        prevExRef.current.active = false;
      }

      nodes.forEach((n) => {
        if (n === draggedNodeRef.current) {
          n.vx = 0; n.vy = 0;
          n.baseX = n.x; n.baseY = n.y;
          return;
        }

        // 微扰动
        n.vx += (Math.random() - 0.5) * JITTER;
        n.vy += (Math.random() - 0.5) * JITTER;

        // 极弱回归
        n.vx += (n.baseX - n.x) * RETURN_K;
        n.vy += (n.baseY - n.y) * RETURN_K;
      });

      // 持续节点间斥力
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (NODE_REPULSE * a.mass * b.mass) / (dist * dist);
          a.vx -= (dx / dist) * force / a.mass;
          a.vy -= (dy / dist) * force / a.mass;
          b.vx += (dx / dist) * force / b.mass;
          b.vy += (dy / dist) * force / b.mass;
        }
      }

      // 持续弱弹簧
      edges.forEach((e) => {
        const a = nodes.find((n) => n.id === e.source);
        const b = nodes.find((n) => n.id === e.target);
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - FLOW_REST) * FLOW_SPRING;
        a.vx += (dx / dist) * force / a.mass;
        a.vy += (dy / dist) * force / a.mass;
        b.vx -= (dx / dist) * force / b.mass;
        b.vy -= (dy / dist) * force / b.mass;
      });

      // 软边界
      const pad = 45;
      nodes.forEach((n) => {
        if (n.x < pad) n.vx += (pad - n.x) * BOUNDARY_K;
        if (n.x > W - pad) n.vx -= (n.x - (W - pad)) * BOUNDARY_K;
        if (n.y < pad) n.vy += (pad - n.y) * BOUNDARY_K;
        if (n.y > H - pad) n.vy -= (n.y - (H - pad)) * BOUNDARY_K;
      });

      // 积分
      nodes.forEach((n) => {
        n.vx *= MOTION_DAMP;
        n.vy *= MOTION_DAMP;
        n.x += n.vx;
        n.y += n.vy;
      });

      /* ─── Render ─── */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const colors = themeNodeColors[themeColorRef.current] || themeNodeColors.emerald;
      const edgeColor = themeColorRef.current === 'coral'
        ? 'rgba(225,112,85,0.18)'
        : themeColorRef.current === 'azure'
          ? 'rgba(9,132,227,0.18)'
          : 'rgba(0,184,148,0.18)';

      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = 0.8;
      edges.forEach((e) => {
        const a = nodes.find((n) => n.id === e.source);
        const b = nodes.find((n) => n.id === e.target);
        if (!a || !b) return;
        const ax = a.x + Math.sin(now * a.floatSpeed + a.floatPhase) * 0.6;
        const ay = a.y + Math.cos(now * a.floatSpeed * 0.7 + a.floatPhase) * 0.5;
        const bx = b.x + Math.sin(now * b.floatSpeed + b.floatPhase) * 0.6;
        const by = b.y + Math.cos(now * b.floatSpeed * 0.7 + b.floatPhase) * 0.5;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      });

      nodes.forEach((n) => {
        const floatX = Math.sin(now * n.floatSpeed + n.floatPhase) * 0.6;
        const floatY = Math.cos(now * n.floatSpeed * 0.7 + n.floatPhase) * 0.5;
        const rx = n.x + floatX;
        const ry = n.y + floatY;

        ctx.shadowColor = 'rgba(0,0,0,0.06)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1.5;

        const c = colors[n.type];
        const isHover = hoveredNodeRef.current?.id === n.id;
        const isDrag = draggedNodeRef.current?.id === n.id;

        ctx.beginPath();
        ctx.arc(rx, ry, n.radius, 0, Math.PI * 2);
        if (isHover) ctx.fillStyle = c.stroke;
        else if (isDrag) ctx.fillStyle = c.fill;
        else ctx.fillStyle = c.fill;
        ctx.fill();

        // 悬停/拖拽时加外圈高亮
        if (isHover || isDrag) {
          ctx.beginPath();
          ctx.arc(rx, ry, n.radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = c.stroke + '60';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        ctx.fillStyle = isHover ? c.stroke : '#3f3f46';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(n.label, rx + n.radius + 8, ry + 4);
      });

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect(); };
  }, [projectId, excludeRectRef, themeColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const posOf = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const hitTest = (x: number, y: number) => {
      const now = Date.now();
      for (const n of graphRef.current.nodes) {
        const fx = Math.sin(now * n.floatSpeed + n.floatPhase) * 0.6;
        const fy = Math.cos(now * n.floatSpeed * 0.7 + n.floatPhase) * 0.5;
        const rx = n.x + fx;
        const ry = n.y + fy;
        const dx = x - rx;
        const dy = y - ry;
        if (dx * dx + dy * dy < (n.radius + 8) ** 2) return n;
      }
      return null;
    };

    const onDown = (e: MouseEvent) => {
      const hit = hitTest(posOf(e).x, posOf(e).y);
      if (!hit) return;
      draggedNodeRef.current = hit;
      dragMovedRef.current = false;

      // 点击节点进入子图谱或预览文档（短按+无位移时触发，拖拽时不触发）
      const clickTimer = setTimeout(() => {
        if (dragMovedRef.current) return; // 发生了拖拽，不触发点击
        if (levelRef.current === 'project' && (hit.type === 'agent' || hit.type === 'insight')) {
          // 进入任务子图谱
          const tid = hit.id.startsWith('chat-') ? hit.id.replace('chat-', '') : hit.id;
          setSelectedTaskId(tid);
          setSelectedTaskName(hit.label);
          setCurrentLevel('task');
        } else if (hit.type === 'file') {
          // 预览文档
          setDocPreview({
            name: hit.label,
            content: `文档：${hit.label}\n\n${hit.detail}\n\n${Object.entries(hit.meta || {}).map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n（此处为文档预览内容占位，实际应调用后端接口获取文档内容）`,
          });
        }
      }, 200);

      const clearTimer = () => clearTimeout(clickTimer);
      window.addEventListener('mouseup', clearTimer, { once: true });
    };
    const onMove = (e: MouseEvent) => {
      const p = posOf(e);
      if (draggedNodeRef.current) {
        const dx = draggedNodeRef.current.x - p.x;
        const dy = draggedNodeRef.current.y - p.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMovedRef.current = true;
        draggedNodeRef.current.x = p.x;
        draggedNodeRef.current.y = p.y;
      }
      const hit = hitTest(p.x, p.y);
      hoveredNodeRef.current = hit;
      canvas.style.cursor = draggedNodeRef.current ? 'grabbing' : hit ? 'pointer' : 'default';

      const tip = tooltipRef.current;
      if (tip) {
        if (hit) {
          const color = (themeNodeColors[themeColorRef.current] || themeNodeColors.emerald)[hit.type];
          const metaRows = hit.meta
            ? Object.entries(hit.meta).map(([k, v]) => `<div class="flex justify-between gap-4"><span class="text-text-muted">${k}</span><span class="text-text font-medium">${v}</span></div>`).join('')
            : '';
          tip.innerHTML = `<div class="flex items-center gap-2 mb-1.5"><span class="w-2 h-2 rounded-full" style="background:${color.stroke}"></span><span class="text-[11px] font-medium" style="color:${color.stroke}">${color.label}</span></div><div class="text-[13px] font-semibold text-text mb-0.5">${hit.label}</div><div class="text-[11px] text-text-secondary leading-relaxed mb-1.5">${hit.detail}</div>${metaRows ? `<div class="space-y-0.5 border-t border-border/40 pt-1.5 mt-1">${metaRows}</div>` : ''}`;
          tip.style.display = 'block';
          const rect = canvas.getBoundingClientRect();
          let tx = p.x + 16;
          let ty = p.y + 16;
          if (tx + 220 > rect.width) tx = p.x - 220;
          if (ty + 140 > rect.height) ty = p.y - 140;
          tip.style.left = tx + 'px';
          tip.style.top = ty + 'px';
        } else {
          tip.style.display = 'none';
        }
      }
    };
    const onUp = () => { draggedNodeRef.current = null; };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-white relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* 面包屑导航 */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() => {
            setCurrentLevel('project');
            setSelectedTaskId(null);
            setSelectedTaskName('');
          }}
          className={`text-[13px] font-medium text-text hover:text-text transition-colors ${
            currentLevel === 'project' ? 'text-text-secondary cursor-default' : ''
          }`}
          disabled={currentLevel === 'project'}
        >
          {project?.name}
        </button>
        {currentLevel === 'task' && (
          <>
            <span className="text-text-muted text-xs">/</span>
            <span className="text-[13px] font-semibold text-text">{selectedTaskName}</span>
          </>
        )}
      </div>

      {/* 文档预览面板 */}
      {docPreview && (
        <div className="absolute bottom-4 right-4 z-30 w-[320px] max-h-[360px] bg-white/85 backdrop-blur-xl rounded-2xl border border-border/60 shadow-xl shadow-black/5 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
              <span className="text-[13px] font-semibold text-text truncate">{docPreview.name}</span>
            </div>
            <button
              onClick={() => setDocPreview(null)}
              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors text-text-muted"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-line">{docPreview.content}</p>
          </div>
        </div>
      )}

      <div
        ref={tooltipRef}
        className="absolute hidden z-20 pointer-events-none bg-white/85 backdrop-blur-md rounded-xl border border-border/60 shadow-lg shadow-black/5 p-3 min-w-[180px] max-w-[240px]"
        style={{ transition: 'opacity 0.15s ease' }}
      />
    </div>
  );
}
