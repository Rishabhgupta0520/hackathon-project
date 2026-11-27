'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Eye, EyeOff, Zap, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundEngine.playClick();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      soundEngine.playLock();
      setSuccess(`Authenticated as ${data.user.name}`);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 500);
    } catch (err: any) {
      soundEngine.playWarning();
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    soundEngine.playClick();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDemo: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Demo login failed');
      }

      soundEngine.playLock();
      setSuccess('Logged in as Security Analyst (Demo Workspace)');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 500);
    } catch (err: any) {
      soundEngine.playWarning();
      setError(err.message || 'Could not initialize demo login.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] bg-sky-mist px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2.5 mb-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#627E4A] text-white shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#141414]">
              ghostwire<span className="text-[#627E4A]">.io</span>
            </span>
          </Link>
          <h1 className="font-serif text-3xl font-normal text-[#141414]">Enterprise Security Portal</h1>
          <p className="text-xs text-[#5A5A5A] mt-1 font-sans">Authenticate into your zero-knowledge privacy workspace</p>
        </div>

        {/* 1-Click Instant Demo Box */}
        <div className="mb-6 rounded-2xl border border-[#ECECEC] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center text-[10px] font-mono font-semibold uppercase tracking-wider text-[#627E4A]">
                Instant Evaluator Access
              </span>
              <h2 className="text-sm font-semibold text-[#141414]">Security Analyst Demo Workspace</h2>
              <p className="text-xs text-[#5A5A5A] leading-relaxed">
                Test all enterprise features immediately with pre-loaded clinical & server log audit ledgers without typing credentials.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstantDemoLogin}
            disabled={demoLoading}
            className="mt-3.5 w-full flex items-center justify-center space-x-2 rounded-[9px] bg-[#1E1E1E] text-white px-4 py-2.5 text-xs font-semibold hover:bg-[#141414] hover:shadow-md transition-editorial disabled:opacity-60"
          >
            <Zap className="h-4 w-4 text-[#A7CBE0] fill-current" />
            <span>{demoLoading ? 'Authorizing Session...' : '1-Click Instant Demo Login'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Login Bento Box */}
        <div className="rounded-3xl border border-[#ECECEC] bg-[#FAFAFA] p-6 sm:p-8 shadow-sm">
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-[#ECECEC]"></div>
            <span className="flex-shrink mx-4 text-[10px] font-mono text-[#7A7A7A] uppercase tracking-widest">
              Or Sign In With Email
            </span>
            <div className="flex-grow border-t border-[#ECECEC]"></div>
          </div>

          {error && (
            <div className="mb-4 flex items-center space-x-2 rounded-xl border border-[#9B4A4A]/30 bg-[#9B4A4A]/10 p-3 text-xs text-[#9B4A4A]">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center space-x-2 rounded-xl border border-[#627E4A]/30 bg-[#627E4A]/10 p-3 text-xs text-[#627E4A]">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#2A2A2A] mb-1.5 font-sans">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#8A8A8A]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@enterprise.corp"
                  required
                  className="w-full rounded-[9px] border border-[#ECECEC] bg-white py-2.5 pl-10 pr-4 text-xs text-[#141414] placeholder-[#A0A0A0] focus:border-[#627E4A] focus:outline-none focus:ring-1 focus:ring-[#627E4A] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2A2A2A] mb-1.5 font-sans">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#8A8A8A]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-[9px] border border-[#ECECEC] bg-white py-2.5 pl-10 pr-10 text-xs text-[#141414] placeholder-[#A0A0A0] focus:border-[#627E4A] focus:outline-none focus:ring-1 focus:ring-[#627E4A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#8A8A8A] hover:text-[#141414]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center space-x-2 rounded-[9px] bg-[#1E1E1E] text-white px-4 py-2.5 text-xs font-semibold hover:bg-[#141414] transition-editorial disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#5A5A5A]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#627E4A] hover:underline font-medium">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
