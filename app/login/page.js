'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  Users,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/dashboard/project-plan');
        router.refresh();
      } else {
        setError(data.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f2ee] font-sans">
      {/* Mobile top header bar — teal, full width */}
      <header className="lg:hidden relative bg-[#2B4C46] px-6 pt-8 pb-14 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div
          className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(closest-side, rgba(156,106,70,0.35), transparent)' }}
        />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-semibold text-lg shrink-0">
            P
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-white text-[15px]">PMS Workspace</span>
            <span className="text-[12px] text-white/60">Project Management System</span>
          </div>
        </div>
      </header>

      <div className="flex items-stretch justify-center lg:py-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] lg:mx-6 lg:rounded-[28px] overflow-hidden lg:shadow-[0_20px_60px_-15px_rgba(31,56,52,0.25)]">

          {/* Left brand / context panel (desktop only) */}
          <div className="hidden lg:flex relative flex-col justify-between bg-[#2B4C46] text-white px-12 py-14 overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '28px 28px',
              }}
            />
            <div
              className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full"
              style={{ background: 'radial-gradient(closest-side, rgba(156,106,70,0.35), transparent)' }}
            />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-semibold text-lg">
                  P
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold text-[15px]">PMS Workspace</span>
                  <span className="text-[11px] text-white/55">Project Management System</span>
                </div>
              </div>

              <h2 className="mt-16 text-[32px] leading-[1.2] font-semibold max-w-sm">
                Keep every project, task and deadline in one place.
              </h2>
              <p className="mt-4 text-sm text-white/65 max-w-xs leading-relaxed">
                Sign in with your work account to pick up where your team left off.
              </p>
            </div>

            <div className="relative space-y-5">
              <div className="flex items-start gap-3">
                <LayoutDashboard className="w-4.5 h-4.5 mt-0.5 text-white/70 shrink-0" />
                <p className="text-sm text-white/70 leading-relaxed">
                  A live view of every project's plan and progress
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-4.5 h-4.5 mt-0.5 text-white/70 shrink-0" />
                <p className="text-sm text-white/70 leading-relaxed">
                  Roles and permissions kept in sync automatically
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 text-white/70 shrink-0" />
                <p className="text-sm text-white/70 leading-relaxed">
                  Task ownership and status, always up to date
                </p>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="flex flex-col justify-center bg-white px-6 pb-10 -mt-8 rounded-t-[28px] shadow-[0_-8px_24px_-12px_rgba(31,56,52,0.15)] sm:px-10 lg:px-14 lg:mt-0 lg:pb-12 lg:py-12 lg:rounded-none lg:shadow-none">
            <div className="w-full max-w-sm mx-auto pt-9 lg:pt-0">

              <div className="mb-8">
                <h1 className="text-[24px] sm:text-[26px] font-semibold text-[#1f3834]">Sign in</h1>
                <p className="mt-1.5 text-sm text-[#827a70]">
                  Use your workspace email and password to continue.
                </p>
              </div>

            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-[#fdf2f1] border border-[#f3d6d3] text-[#a33c34] text-[13px] leading-snug">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[13px] font-medium text-[#3f3a33] block">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c9388]" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#dcd6cb] rounded-xl text-[#1f3834] text-sm placeholder-[#b0a89e] focus:outline-none focus:border-[#2B4C46] focus:ring-2 focus:ring-[#2B4C46]/15 transition-shadow"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-medium text-[#3f3a33]">
                    Password
                  </label>
                  <a href="#" className="text-[12px] font-medium text-[#2B4C46] hover:text-[#9c6a46] transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c9388]" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-[#dcd6cb] rounded-xl text-[#1f3834] text-sm placeholder-[#b0a89e] focus:outline-none focus:border-[#2B4C46] focus:ring-2 focus:ring-[#2B4C46]/15 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9c9388] hover:text-[#544e45] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-5 bg-[#2B4C46] hover:bg-[#203a35] text-white font-medium rounded-xl text-sm shadow-sm transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#f0ebe3] flex items-center justify-between text-[12px] text-[#827a70]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2B4C46]" />
                <span>Role synced automatically on sign-in</span>
              </div>
            </div>

            <p className="mt-8 text-center text-[12px] text-[#a0978c]">
              © {new Date().getFullYear()} Project Management System
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}