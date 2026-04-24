import { useState } from 'react';
import {
  Mail, Lock, Eye, EyeOff, Hexagon, Globe
} from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
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
      <div className="hidden lg:flex w-1/2 flex-col" style={{ backgroundColor: '#faf6f3' }}>
        {/* 上部：Logo + 文案 */}
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

        {/* 下部：3D 背景图 */}
        <div className="flex-1 flex items-center justify-center min-h-0 px-6 pb-6">
          <img
            src="/login-bg-clean.png"
            alt="Agent OS"
            className="max-w-full max-h-full object-contain"
            draggable={false}
          />
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
