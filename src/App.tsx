import { useState, useRef, useCallback, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectChat from './components/ProjectChat';
import ProjectWizard from './components/ProjectWizard';
import ToolsPage from './components/ToolsPage';
import SkillPage from './components/SkillPage';
import RightPanel from './components/RightPanel';
import BizAgentPanel from './components/BizAgentPanel';
import KnowledgeGraph from './components/KnowledgeGraph';
import DraggableChat from './components/DraggableChat';

import TaskWizard from './components/TaskWizard';
import LoginPage from './components/LoginPage';
import { projects as initialProjects } from './data/mockData';
import type { Project } from './data/mockData';


type ViewType = 'home' | 'project' | 'tools' | 'skill';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try { return localStorage.getItem('agent-os-logged-in') === 'true'; }
    catch { return false; }
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
    try { localStorage.setItem('agent-os-logged-in', 'true'); } catch { /* ignore */ }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    try { localStorage.removeItem('agent-os-logged-in'); } catch { /* ignore */ }
  };

  const [activeView, setActiveView] = useState<ViewType>('home');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [projectList, setProjectList] = useState<Project[]>(initialProjects);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskProjectId, setTaskProjectId] = useState<string | null>(null);


  // 项目聊天视图分割条状态
  const [projectSplitPercent, setProjectSplitPercent] = useState(67);
  const isResizingRef = useRef(false);
  const projectContainerRef = useRef<HTMLDivElement>(null);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [selectedDataItemId, setSelectedDataItemId] = useState<string | null>(null);

  const activeProject = projectList.find(p => p.id === activeProjectId);

  const isProjectOverview = activeView === 'project' && activeProjectId && !activeChatId;
  const isProjectChat = activeView === 'project' && activeProjectId && activeChatId;
  const isScrollableView = activeView === 'home' || activeView === 'tools' || activeView === 'skill';

  // 滚轮切换页面
  const scrollViews: ViewType[] = ['home', 'skill', 'tools'];
  const scrollIndex = scrollViews.indexOf(activeView);
  useEffect(() => {
    let locked = false;
    const onWheel = (e: WheelEvent) => {
      if (locked || !isScrollableView) return;
      // 如果事件发生在可滚动容器内部且还能滚动，不切换页面
      const target = e.target as HTMLElement;
      const scrollable = target.closest('[data-scrollable]') as HTMLElement | null;
      if (scrollable) {
        const canScrollDown = scrollable.scrollTop + scrollable.clientHeight < scrollable.scrollHeight - 2;
        const canScrollUp = scrollable.scrollTop > 2;
        if (e.deltaY > 0 && canScrollDown) return;
        if (e.deltaY < 0 && canScrollUp) return;
      }
      if (e.deltaY > 40 && scrollIndex < scrollViews.length - 1) {
        locked = true;
        setActiveView(scrollViews[scrollIndex + 1]);
        setTimeout(() => { locked = false; }, 600);
      } else if (e.deltaY < -40 && scrollIndex > 0) {
        locked = true;
        setActiveView(scrollViews[scrollIndex - 1]);
        setTimeout(() => { locked = false; }, 600);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [scrollIndex, isScrollableView]);

  const handleNavigate = (view: string, projectId?: string, chatId?: string | null) => {
    setActiveView(view as ViewType);
    if (projectId !== undefined) {
      setActiveProjectId(projectId);
    }
    if (chatId !== undefined) {
      setActiveChatId(chatId);
    }
    if (view !== 'skill') setSelectedSkillId(null);
  };

  const handleCreateProject = (name: string, desc: string, icon: string) => {
    const pid = `p${Date.now()}`;
    const newProject: Project = {
      id: pid,
      name,
      description: desc,
      updatedAt: '刚刚',
      memberCount: 1,
      unread: false,
      status: 'active',
      icon,
      chats: [{ id: `c${Date.now()}`, name: '主对话', projectId: pid, messages: [] }],
    };
    setProjectList(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setActiveChatId(null); // 新建项目显示项目展示页（图谱）
    setActiveView('project');
    setShowProjectModal(false);
  };

  const handleEditProject = (projectId: string, name: string) => {
    setProjectList(prev => prev.map(p => p.id === projectId ? { ...p, name } : p));
  };

  const handleDeleteProject = (projectId: string) => {
    setProjectList(prev => prev.filter(p => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
      setActiveChatId(null);
      setActiveView('home');
    }
  };

  const handlePinProject = (projectId: string) => {
    setProjectList(prev => {
      const idx = prev.findIndex(p => p.id === projectId);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  };

  const handleEditChat = (projectId: string, chatId: string, name: string) => {
    setProjectList(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, chats: p.chats.map(c => c.id === chatId ? { ...c, name } : c) };
    }));
  };

  const handleDeleteChat = (projectId: string, chatId: string) => {
    setProjectList(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, chats: p.chats.filter(c => c.id !== chatId) };
    }));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };

  const handlePinChat = (projectId: string, chatId: string) => {
    setProjectList(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const idx = p.chats.findIndex(c => c.id === chatId);
      if (idx <= 0) return p;
      const nextChats = [...p.chats];
      const [item] = nextChats.splice(idx, 1);
      nextChats.unshift(item);
      return { ...p, chats: nextChats };
    }));
  };

  const handleCreateTask = (projectId: string) => {
    setTaskProjectId(projectId);
    setShowTaskModal(true);
  };

  const handleConfirmCreateTask = (name: string, _desc: string) => {
    if (!taskProjectId) return;
    const cid = `c${Date.now()}`;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const defaultMessages = [
      {
        id: `m${Date.now()}-1`,
        role: 'human' as const,
        senderId: 'u1',
        senderName: 'samhar',
        content: '大家好，我是samhar',
        timestamp: timeStr,
        status: 'sent' as const,
      },
      {
        id: `m${Date.now()}-2`,
        role: 'host' as const,
        senderId: 'host1',
        senderName: 'BizAgent',
        content: '你好，samhar！我是这个团队负责人bizagent，让我们一起协作完成此次任务吧！',
        timestamp: timeStr,
        status: 'sent' as const,
      },
    ];
    setProjectList(prev => prev.map(p => {
      if (p.id !== taskProjectId) return p;
      return {
        ...p,
        chats: [...p.chats, { id: cid, name, projectId: p.id, messages: defaultMessages }],
      };
    }));
    setActiveProjectId(taskProjectId);
    setActiveChatId(cid);
    setActiveView('project');
    setShowTaskModal(false);
    setTaskProjectId(null);
  };

  // 项目聊天视图拖拽逻辑（使用 ref 避免闭包问题）
  const handleProjectResizeStart = useCallback(() => {
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleProjectResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current || !projectContainerRef.current) return;
    const rect = projectContainerRef.current.getBoundingClientRect();
    const newPercent = ((e.clientX - rect.left) / rect.width) * 100;
    setProjectSplitPercent(Math.min(Math.max(newPercent, 20), 80));
  }, []);

  const handleProjectResizeEnd = useCallback(() => {
    isResizingRef.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleProjectResizeMove);
    window.addEventListener('mouseup', handleProjectResizeEnd);
    return () => {
      window.removeEventListener('mousemove', handleProjectResizeMove);
      window.removeEventListener('mouseup', handleProjectResizeEnd);
    };
  }, [handleProjectResizeMove, handleProjectResizeEnd]);

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex bg-bg overflow-hidden">
      {/* Sidebar */}
      <div className={`h-full shrink-0 overflow-hidden bg-sidebar-bg transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-[220px]'}`}>
        <Sidebar
          activeView={activeView}
          activeProjectId={activeProjectId}
          activeChatId={activeChatId}
          projects={projectList}
          onNavigate={handleNavigate}
          onCreateProject={() => setShowProjectModal(true)}
          onCreateTask={handleCreateTask}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onPinProject={handlePinProject}
          onEditChat={handleEditChat}
          onDeleteChat={handleDeleteChat}
          onPinChat={handlePinChat}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content area */}
      {isScrollableView ? (
        <>
          <div className="flex-1 min-w-0 bg-main-bg relative overflow-hidden">
            {scrollViews.map((view, i) => (
              <div
                key={view}
                className="absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{ transform: `translateY(${(i - scrollIndex) * 100}%)` }}
              >
                <div data-scrollable className="h-full overflow-y-auto pr-[372px]">
                  {view === 'home' && <Dashboard />}
                  {view === 'tools' && <ToolsPage />}
                  {view === 'skill' && (
                    <SkillPage
                      selectedSkillId={selectedSkillId}
                      onSelectSkill={setSelectedSkillId}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="fixed right-3 top-[60px] bottom-14 w-[360px] z-10">
            <BizAgentPanel
              activeView={activeView}
              selectedSkillId={activeView === 'skill' ? selectedSkillId : null}
            />
          </div>
        </>
      ) : isProjectOverview ? (
        // 项目展示页：全宽图谱 + 右侧浮动 BizAgent（和首页一致）
        <>
          <div className="flex-1 flex flex-col min-w-0 bg-main-bg">
            <div className="h-[52px] shrink-0 flex flex-col justify-center px-5 bg-white/70 backdrop-blur-md z-20">
              <h1 className="text-[13px] font-semibold text-text leading-none tracking-tight">{activeProject?.name}</h1>
              <p className="text-[11px] text-text-muted leading-none mt-1.5">{activeProject?.description}</p>
            </div>
            <div className="flex-1 relative min-h-0">
              <KnowledgeGraph projectId={activeProjectId} />
            </div>
          </div>
          <div className="fixed right-3 top-[60px] bottom-14 w-[360px] z-10">
            <DraggableChat projectId={activeProjectId} mode="fixed" />
          </div>
        </>
      ) : isProjectChat ? (
        // 项目聊天页：左右分栏（ProjectChat + RightPanel）
        <div ref={projectContainerRef} className="flex-1 flex min-w-0 bg-main-bg">
          <div className="h-full overflow-hidden relative" style={{ width: rightPanelCollapsed ? '100%' : `${projectSplitPercent}%` }}>
            <ProjectChat
              chatName={activeProject?.chats.find(c => c.id === activeChatId)?.name || ''}
              messages={activeProject?.chats.find(c => c.id === activeChatId)?.messages || []}
              rightPanelCollapsed={rightPanelCollapsed}
              onToggleRightPanel={() => setRightPanelCollapsed(v => !v)}
              selectedDataItemId={selectedDataItemId}
              onSelectDataItem={setSelectedDataItemId}
            />
            {/* 隐形阶段导航 */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 gap-4">
              {[
                { name: '营收对比', msgId: 'm2' },
                { name: '成本分析', msgId: 'm9' },
                { name: '现金流', msgId: 'm13' },
                { name: '客户预警', msgId: 'm18' },
                { name: '预算目标', msgId: 'm22' },
              ].map((stage, i, arr) => (
                <div key={stage.name} className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      const el = document.querySelector(`[data-message-id="${stage.msgId}"]`);
                      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="group relative w-2.5 h-2.5 rounded-full bg-gray-300 hover:bg-primary hover:scale-150 transition-all duration-200"
                    title={stage.name}
                  >
                    <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-[11px] text-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                      {stage.name}
                    </span>
                  </button>
                  {i < arr.length - 1 && <div className="w-px h-8 bg-gray-200" />}
                </div>
              ))}
            </div>
          </div>
          {!rightPanelCollapsed && (
            <>
              <div
                onMouseDown={handleProjectResizeStart}
                className="w-1.5 shrink-0 relative group bg-border hover:bg-primary transition-colors"
                style={{ cursor: 'col-resize' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-text-muted/30 group-hover:bg-primary/60 transition-colors" />
              </div>
              <div className="h-full overflow-hidden flex-1 min-w-0">
                <RightPanel activeView={activeView} activeProjectId={activeProjectId} selectedDataItemId={selectedDataItemId} />
              </div>
            </>
          )}
        </div>
      ) : (
        <main className="flex-1 min-w-0 overflow-hidden bg-main-bg">
          <Dashboard />
        </main>
      )}

      {/* Create Project Modal */}
      {showProjectModal && (
        <ProjectWizard
          onCreateProject={handleCreateProject}
          onCancel={() => setShowProjectModal(false)}
        />
      )}

      {/* Create Task Modal */}
      {showTaskModal && taskProjectId && (
        <TaskWizard
          projectName={projectList.find(p => p.id === taskProjectId)?.name || ''}
          onCreateTask={handleConfirmCreateTask}
          onCancel={() => {
            setShowTaskModal(false);
            setTaskProjectId(null);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
