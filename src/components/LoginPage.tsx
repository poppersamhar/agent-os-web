import { useState } from 'react';
import {
  Mail, Lock, Eye, EyeOff, Globe
} from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

/* ─── Agent OS Logo：六边形 + H 形几何图标 ─── */
function AgentOSLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 82 74" className={className} fill="none">
      {/* 六边形外框 */}
      <path
        d="M41 2.5L73.5 21.25V52.75L41 71.5L8.5 52.75V21.25L41 2.5Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* 内部 H 形几何图案 */}
      <path
        d="M28 24L28 50M28 37L46 24L46 50"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
      <div
        className="hidden lg:flex w-[58%] relative overflow-hidden"
        style={{ backgroundColor: '#faf6f3' }}
      >
        {/* 背景图：cover 铺满，偏右显示裁掉左侧空白 */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/login-bg-clean.png)',
            backgroundSize: 'cover',
            backgroundPosition: '75% center',
          }}
        />

        {/* 文本内容叠加在背景图上 */}
        <div className="relative z-10 px-12 pt-10">
          <div className="flex items-center gap-2.5 mb-10">
            <AgentOSLogo className="w-8 h-8 text-[#e17055]" />
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
      </div>

      {/* ─── 右侧：登录表单 ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 relative min-h-0 overflow-y-auto bg-white">
        {/* 移动端 Logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <AgentOSLogo className="w-7 h-7 text-[#e17055]" />
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

          <p className="mt-6 text-center text-[12px] text-text-muted leading-relaxed">
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
