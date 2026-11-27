'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, User, LogOut, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { PrivacyStudio } from '@/components/PrivacyStudio';
import { soundEngine } from '@/lib/soundEngine';

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [muted, setMuted] = useState(soundEngine.getMuted());

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleSound = () => {
    const isMutedNow = soundEngine.toggleMute();
    setMuted(isMutedNow);
    if (!isMutedNow) soundEngine.playClick();
  };

  const handleLogout = async () => {
    soundEngine.playClick();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#141414] flex flex-col font-sans">
      {/* Editorial Dashboard Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#ECECEC] bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#627E4A] text-white">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-serif text-lg font-semibold tracking-tight text-[#141414]">
                ghostwire<span className="text-[#627E4A]">.io</span>
              </span>
            </Link>
            <span className="text-xs text-[#8A8A8A] font-mono">/</span>
            <span className="text-xs font-mono text-[#5A5A5A] uppercase tracking-wider">
              Privacy Studio Workspace
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Audio Synth Toggle */}
            <button
              onClick={handleToggleSound}
              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#ECECEC] bg-[#F4F5F5] text-[#5A5A5A] hover:text-[#141414] transition-colors"
            >
              {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-[#627E4A]" />}
            </button>

            {/* User Profile Badge */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-[#F4F5F5] border border-[#ECECEC] px-3 py-1.5 rounded-[9px] text-xs">
                  <div className="h-5 w-5 rounded-full bg-[#627E4A]/15 text-[#627E4A] flex items-center justify-center font-bold text-[10px]">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="font-medium text-[#141414]">{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#ECECEC] bg-[#F4F5F5] text-[#5A5A5A] hover:text-[#9B4A4A] transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-1.5 bg-[#1E1E1E] text-white px-3.5 py-1.5 rounded-[8px] text-xs font-medium hover:bg-[#141414]"
              >
                <span>Sign In / Demo</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1">
        <PrivacyStudio isDashboardPage={true} />
      </main>

      {/* Editorial Footer */}
      <footer className="w-full border-t border-[#ECECEC] bg-[#FDFDFD] py-8 text-center text-xs font-mono text-[#7A7A7A]">
        <p>GhostWire — Zero-Knowledge Edge PII Firewall &amp; Data Privacy Platform. 100% Client-Side Processing.</p>
      </footer>
    </div>
  );
}
