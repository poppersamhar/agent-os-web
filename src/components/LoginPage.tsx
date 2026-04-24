import { useState } from 'react';
import {
  Mail, Lock, Eye, EyeOff, Hexagon, Globe, Bot, Wrench,
  Hammer, Database, Activity
} from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

/* ─── 轴测投影工具函数 ─── */
const COS30 = 0.866;
const SIN30 = 0.5;

function iso(x: number, y: number, z: number) {
  return {
    x: (x - z) * COS30,
    y: (x + z) * SIN30 - y,
  };
}

/* ─── 左侧 3D 轴测场景 ─── */
function IsometricScene() {
  const s = 42; // 立方体半边长
  const cx = 0;
  const cy = 0;
  const cz = 0;

  // 立方体 8 个顶点
  const v = [
    iso(cx - s, cy - s, cz - s), // 0 左下后
    iso(cx + s, cy - s, cz - s), // 1 右下后
    iso(cx + s, cy - s, cz + s), // 2 右下前
    iso(cx - s, cy - s, cz + s), // 3 左下前
    iso(cx - s, cy + s, cz - s), // 4 左上后
    iso(cx + s, cy + s, cz - s), // 5 右上后
    iso(cx + s, cy + s, cz + s), // 6 右上前
    iso(cx - s, cy + s, cz + s), // 7 左上前
  ];

  const toS = (p: { x: number; y: number }) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;

  // 可见的三个面 path
  const topFace = `M${toS(v[4])} L${toS(v[5])} L${toS(v[6])} L${toS(v[7])}Z`;
  const rightFace = `M${toS(v[1])} L${toS(v[2])} L${toS(v[6])} L${toS(v[5])}Z`;
  const leftFace = `M${toS(v[0])} L${toS(v[3])} L${toS(v[7])} L${toS(v[4])}Z`;

  // 卡片位置（轴测坐标，围绕立方体）
  const cards = [
    { icon: Bot, label: 'Agent', x: -95, y: 30, z: -50 },
    { icon: Wrench, label: 'Skills', x: 85, y: 45, z: -55 },
    { icon: Hammer, label: 'Tools', x: -80, y: 20, z: 70 },
    { icon: Database, label: 'Data', x: 90, y: 35, z: 65 },
    { icon: Activity, label: 'Monitor', x: 0, y: 55, z: 95 },
  ];

  // 平台底座（比立方体宽）
  const ps = 70;
  const pY = -s - 6;
  const pv = [
    iso(cx - ps, pY, cz - ps),
    iso(cx + ps, pY, cz - ps),
    iso(cx + ps, pY, cz + ps),
    iso(cx - ps, pY, cz + ps),
  ];
  const platformPath = `M${toS(pv[0])} L${toS(pv[1])} L${toS(pv[2])} L${toS(pv[3])}Z`;

  // 平台侧面（厚度）
  const thick = 10;
  const pvs = [
    iso(cx - ps, pY, cz + ps),
    iso(cx + ps, pY, cz + ps),
    iso(cx + ps, pY - thick, cz + ps),
    iso(cx - ps, pY - thick, cz + ps),
  ];
  const platformSidePath = `M${toS(pvs[0])} L${toS(pvs[1])} L${toS(pvs[2])} L${toS(pvs[3])}Z`;

  return (
    <div className="relative w-[480px] h-[420px] select-none" style={{ transform: 'translateX(-20px)' }}>
      <svg viewBox="-180 -200 360 400" className="w-full h-full" style={{ overflow: 'visible' }}>
        <defs>
          {/* 顶面渐变 */}
          <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffa07a" />
            <stop offset="100%" stopColor="#ff8a65" />
          </linearGradient>
          {/* 正面渐变 */}
          <linearGradient id="frontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff8a65" />
            <stop offset="100%" stopColor="#e17055" />
          </linearGradient>
          {/* 侧面渐变 */}
          <linearGradient id="sideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d65a3f" />
            <stop offset="100%" stopColor="#c0392b" />
          </linearGradient>
          {/* 平台渐变 */}
          <linearGradient id="platGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="100%" stopColor="rgba(250,246,243,0.85)" />
          </linearGradient>
          {/* 阴影滤镜 */}
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="12" />
            <feOffset dx="0" dy="16" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* 平台阴影 */}
          <filter id="platShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="16" />
            <feOffset dx="0" dy="20" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.12" />
            </feComponentTransfer>
          </filter>
          {/* 虚线端点 */}
          <marker id="dotEnd" markerWidth="6" markerHeight="6" refX="3" refY="3">
            <circle cx="3" cy="3" r="2" fill="#e17055" opacity="0.5" />
          </marker>
        </defs>

        {/* 平台底层阴影 */}
        <ellipse cx="0" cy="55" rx="110" ry="28" fill="rgba(225,112,85,0.1)" filter="url(#platShadow)" />

        {/* 平台侧面 */}
        <path d={platformSidePath} fill="rgba(230,220,215,0.5)" />

        {/* 平台顶面 */}
        <path d={platformPath} fill="url(#platGrad)" stroke="rgba(255,255,255,0.8)" strokeWidth="1" />

        {/* 连接线（在立方体下层） */}
        {cards.map((c, i) => {
          const p = iso(c.x, c.y, c.z);
          // 连到立方体正面的中心偏上
          const target = iso(0, -s * 0.3, s * 0.6);
          const mid = { x: (p.x + target.x) / 2, y: (p.y + target.y) / 2 - 15 };
          return (
            <path
              key={i}
              d={`M${toS(p)} Q${mid.x.toFixed(1)},${mid.y.toFixed(1)} ${toS(target)}`}
              stroke="#e17055"
              strokeWidth="0.8"
              strokeDasharray="3,4"
              fill="none"
              opacity="0.35"
              markerEnd="url(#dotEnd)"
            />
          );
        })}

        {/* 立方体右侧面 */}
        <path d={rightFace} fill="url(#sideGrad)" />
        {/* 立方体左侧面 */}
        <path d={leftFace} fill="url(#frontGrad)" />
        {/* 立方体顶面 */}
        <path d={topFace} fill="url(#topGrad)" />

        {/* 立方体正面高光边 */}
        <path d={`M${toS(v[3])} L${toS(v[7])}`} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
        <path d={`M${toS(v[7])} L${toS(v[6])}`} stroke="rgba(255,255,255,0.25)" strokeWidth="1" fill="none" />

        {/* 装饰小圆点 */}
        <circle cx="-140" cy="-80" r="3" fill="#e17055" opacity="0.2" />
        <circle cx="130" cy="-60" r="2.5" fill="#e17055" opacity="0.15" />
        <circle cx="-120" cy="100" r="2" fill="#e17055" opacity="0.12" />
        <circle cx="145" cy="85" r="2" fill="#e17055" opacity="0.1" />
      </svg>

      {/* HTML 卡片层（覆盖在 SVG 之上） */}
      {cards.map((c) => {
        const p = iso(c.x, c.y, c.z);
        return (
          <div
            key={c.label}
            className="absolute flex items-center gap-2 px-3 py-2 rounded-xl animate-fade-in"
            style={{
              left: `calc(50% + ${p.x * 1.15}px - 40px)`,
              top: `calc(50% + ${p.y * 1.15}px - 14px)`,
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.03)',
              zIndex: 10,
              animationDelay: `${0.4 + Math.random() * 0.3}s`,
              animationFillMode: 'both',
            }}
          >
            <c.icon className="w-[15px] h-[15px] shrink-0" strokeWidth={1.5} style={{ color: '#e17055' }} />
            <span className="text-[11px] font-medium text-text whitespace-nowrap">{c.label}</span>
          </div>
        );
      })}

      {/* 立方体中心 logo（覆盖层） */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: '50%',
          top: '42%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
        }}
      >
        <Hexagon className="w-10 h-10 text-white/90" strokeWidth={1.2} />
      </div>
    </div>
  );
}

/* ─── 主登录页 ─── */
export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (activeTab === 'login') {
      if (email.trim() === '123' && password === '123') {
        onLogin();
      } else {
        setError('账号或密码错误，请输入 123');
      }
    } else {
      setError('注册功能暂未开放');
    }
  };

  return (
    <div className="w-full h-full flex bg-white">
      {/* ─── 左侧：品牌展示区 ─── */}
      <div className="hidden lg:flex w-1/2 flex-col" style={{ backgroundColor: '#faf6f3' }}>
        {/* 上部：文案 */}
        <div className="px-12 pt-10 pb-4 shrink-0">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e17055' }}>
              <Hexagon className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-semibold text-text tracking-tight">agent-os</span>
          </div>

          <h1 className="text-[30px] font-semibold leading-tight tracking-tight text-text">
            Build, Orchestrate, and
            <br />
            <span style={{ color: '#e17055' }}>Scale AI Agents.</span>
          </h1>
          <p className="mt-4 text-[15px] text-text-secondary leading-relaxed max-w-sm">
            The operating system for your AI agent workforce.
          </p>
        </div>

        {/* 下部：3D 轴测插图 */}
        <div className="flex-1 flex items-center justify-center pb-8 min-h-0">
          <IsometricScene />
        </div>
      </div>

      {/* ─── 右侧：登录表单 ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 relative min-h-0 overflow-y-auto bg-white">
        {/* 移动端 Logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#e17055' }}>
            <Hexagon className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-lg font-semibold text-text">agent-os</span>
        </div>

        {/* 语言选择 */}
        <div className="absolute top-6 right-8 flex items-center gap-1.5 text-[13px] text-text-secondary cursor-pointer hover:text-text transition-colors">
          <Globe className="w-4 h-4" strokeWidth={1.5} />
          <span>English</span>
          <svg width="10" height="6" viewBox="0 0 10 6" className="ml-0.5 text-text-muted">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        <div className="w-full max-w-[360px] py-10">
          {/* 标题 */}
          <div className="text-center mb-8">
            <h2 className="text-[22px] font-semibold text-text tracking-tight">Welcome to agent-os</h2>
            <p className="mt-1.5 text-[13px] text-text-muted">Login or create an account to continue</p>
          </div>

          {/* Tab 切换 */}
          <div className="flex items-center justify-center gap-8 mb-8 relative">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`text-[14px] font-medium pb-2 transition-colors ${activeTab === 'login' ? 'text-text' : 'text-text-muted hover:text-text'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(''); }}
              className={`text-[14px] font-medium pb-2 transition-colors ${activeTab === 'signup' ? 'text-text' : 'text-text-muted hover:text-text'}`}
            >
              Sign up
            </button>
            <div
              className="absolute bottom-0 h-[2px] rounded-full transition-all duration-300"
              style={{
                backgroundColor: '#e17055',
                width: '40px',
                left: activeTab === 'login' ? 'calc(50% - 68px)' : 'calc(50% + 12px)',
              }}
            />
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-text mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={1.5} />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-white text-[14px] text-text placeholder:text-text-placeholder outline-none transition-all focus:border-text-muted focus:ring-2 focus:ring-border"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-text">Password</label>
                <button type="button" className="text-[12px] text-text-muted hover:text-text underline underline-offset-2 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={1.5} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 pl-10 pr-10 rounded-lg border border-border bg-white text-[14px] text-text placeholder:text-text-placeholder outline-none transition-all focus:border-text-muted focus:ring-2 focus:ring-border"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-[13px] text-danger bg-danger-subtle rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 rounded-lg text-[14px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#e17055' }}
            >
              {activeTab === 'login' ? 'Login' : 'Sign up'}
            </button>
          </form>

          {/* or 分隔线 */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[13px] text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google 登录 */}
          <button
            type="button"
            className="w-full h-11 rounded-lg border border-border bg-white text-[14px] font-medium text-text flex items-center justify-center gap-2.5 transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-[12px] text-text-muted leading-relaxed">
            By continuing, you agree to our{' '}
            <button type="button" className="underline underline-offset-2 hover:text-text transition-colors">Terms of Service</button>
            {' '}and{' '}
            <button type="button" className="underline underline-offset-2 hover:text-text transition-colors">Privacy Policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
}
