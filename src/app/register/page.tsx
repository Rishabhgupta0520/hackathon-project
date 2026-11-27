'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, User, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundEngine.playClick();

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      soundEngine.playLock();
      setSuccess(`Account created for ${data.user.name}. Redirecting...`);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 500);
    } catch (err: any) {
      soundEngine.playWarning();
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD] bg-sky-mist px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2.5 mb-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#627E4A] text-white shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#141414]">
              ghostwire<span className="text-[#627E4A]">.io</span>
            </span>
          </Link>
          <h1 className="font-serif text-3xl font-normal text-[#141414]">Create Analyst Account</h1>
          <p className="text-xs text-[#5A5A5A] mt-1 font-sans">Deploy your zero-knowledge privacy workspace</p>
        </div>

        <div className="rounded-3xl border border-[#ECECEC] bg-[#FAFAFA] p-6 sm:p-8 shadow-sm">
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

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#2A2A2A] mb-1.5 font-sans">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-[#8A8A8A]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                  className="w-full rounded-[9px] border border-[#ECECEC] bg-white py-2.5 pl-10 pr-4 text-xs text-[#141414] placeholder-[#A0A0A0] focus:border-[#627E4A] focus:outline-none focus:ring-1 focus:ring-[#627E4A] transition-colors"
                />
              </div>
            </div>

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
                Master Password (min 8 characters)
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
              <span>{loading ? 'Registering Account...' : 'Create Account & Access Studio'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#5A5A5A]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#627E4A] hover:underline font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
