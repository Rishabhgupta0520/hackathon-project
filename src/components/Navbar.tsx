'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Shield, Terminal, BookOpen, Key, LogOut, User, Zap } from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenVaultModal?: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UserStats {
  totalScans: number;
  entitiesProtected: number;
  savedVaults: number;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [muted, setMuted] = useState(soundEngine.getMuted());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setStats(data.stats);
      } else {
        setUser(null);
        setStats(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleToggleSound = () => {
    const isMutedNow = soundEngine.toggleMute();
    setMuted(isMutedNow);
    if (!isMutedNow) {
      soundEngine.playClick();
    }
  };

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setStats(null);
      window.location.reload();
    } catch {
      // ignore
    }
  };

  const handleInstantDemo = async () => {
    soundEngine.playClick();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDemo: true }),
      });
      if (res.ok) {
        soundEngine.playLock();
        fetchSession();
      }
    } catch {
      // ignore
    }
  };

  const navItems = [
    { id: 'firewall', label: 'Edge Firewall & Redactor', icon: Shield },
    { id: 'privacy_proxy', label: 'Diff Privacy & Attack Lab', icon: Terminal },
    { id: 'compliance_audit', label: 'GenAI DPDP/GDPR Audit', icon: BookOpen },
    { id: 'vault', label: 'Zero-Knowledge Vault', icon: Key },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[rgba(56,189,248,0.12)] bg-[#06080F]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#38BDF8]/40 bg-[#38BDF8]/10 shadow-[0_0_15px_rgba(56,189,248,0.25)] group-hover:scale-105 transition-transform">
            <Shield className="h-5 w-5 text-[#38BDF8]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display text-base font-bold tracking-tight text-white">
                GHOSTWIRE
              </span>
              <span className="rounded border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#38BDF8]">
                v2.0 EDGE
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
              Zero-Knowledge PII Firewall & Enterprise Privacy Platform
            </p>
          </div>
        </Link>

        {/* Center Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 rounded-xl border border-white/[0.08] bg-[#0D111C]/90 p-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(item.id);
                }}
                data-cursor="NAV"
                className={`flex items-center space-x-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'border border-[#38BDF8]/30 bg-[#38BDF8]/15 text-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                    : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#38BDF8]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Auth, Audio Synth & Sandbox Status */}
        <div className="flex items-center space-x-3">
          {/* Audio Synthesizer Toggle */}
          <button
            onClick={handleToggleSound}
            data-cursor={muted ? 'UNMUTE' : 'MUTE'}
            aria-label={muted ? 'Unmute procedural sound synthesizer' : 'Mute procedural sound synthesizer'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0D111C] text-slate-300 hover:border-[#38BDF8]/40 hover:text-white transition-colors"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-[#38BDF8]" />}
          </button>

          {/* Sandbox Status Badge */}
          <div className="hidden sm:flex items-center space-x-2 rounded-xl border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
            <span className="text-[11px] font-mono text-[#38BDF8]">ZK-SANDBOX OK</span>
          </div>

          {/* Auth User State */}
          {!loadingUser && (
            user ? (
              <div className="flex items-center space-x-2 pl-1 border-l border-white/[0.08]">
                <div className="flex items-center space-x-2 rounded-xl border border-white/[0.08] bg-[#0D111C] px-2.5 py-1 text-xs">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#38BDF8]/20 text-[#38BDF8] font-bold text-[10px]">
                    <User className="h-3 w-3" />
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-[11px] font-medium text-white">{user.name}</div>
                    {stats && (
                      <div className="text-[9px] font-mono text-[#38BDF8]">{stats.totalScans} scans verified</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  data-cursor="LOGOUT"
                  title="Sign Out"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0D111C] text-slate-400 hover:border-rose-500/40 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 pl-1 border-l border-white/[0.08]">
                <button
                  onClick={handleInstantDemo}
                  data-cursor="DEMO"
                  className="hidden sm:flex items-center space-x-1.5 rounded-xl border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1.5 text-xs font-medium text-[#38BDF8] hover:bg-[#38BDF8]/20 transition-colors"
                >
                  <Zap className="h-3 w-3 fill-current" />
                  <span>Demo</span>
                </button>

                <Link
                  href="/login"
                  data-cursor="LOGIN"
                  className="flex items-center space-x-1.5 rounded-xl border border-white/[0.1] bg-[#0D111C] px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:border-[#38BDF8]/50 hover:text-white transition-colors"
                >
                  <span>Sign In</span>
                </Link>
              </div>
            )
          )}
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-2 border-t border-white/[0.06] bg-[#06080F] space-x-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(item.id);
              }}
              className={`flex flex-shrink-0 items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                isActive
                  ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
