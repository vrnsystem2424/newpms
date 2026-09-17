'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/dashboard/project-plan');
        router.refresh();
      } else {
        setError(data.message || 'Login failed');
        setLoading(false);
      }
    } catch {
      setError('Server connection failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        {/* Brand strip */}
        <div className="text-center mb-7">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{
              background: 'var(--primary-soft)',
              color: 'var(--primary)',
              border: '1px solid #b7ddd8',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent)' }}
            />
            Project Management System
          </div>

          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ color: 'var(--text-main)' }}
          >
            Sign in
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Site plans, buffers aur progress — ek workspace se
          </p>
        </div>

        <div className="card p-8">
          {error ? (
            <div
              className="mb-5 rounded-[10px] px-3.5 py-2.5 text-sm font-medium"
              style={{
                background: 'var(--danger-soft)',
                color: 'var(--danger)',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-1"
            >
              {loading ? 'Checking credentials...' : 'Continue'}
            </button>
          </form>

          <p
            className="text-center text-xs mt-6"
            style={{ color: 'var(--text-soft)' }}
          >
            Access is restricted to registered team members
          </p>
        </div>
      </div>
    </div>
  );
}