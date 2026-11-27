'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Shield,
  FileText,
  Activity,
  Bug,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  User,
  Sliders,
  Check,
  Eye,
  FileCheck2,
  Server
} from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

interface GhostWireLandingScrollProps {
  onOpenStudio?: () => void;
  onSelectPreset?: (preset: string) => void;
}

export function GhostWireLandingScroll({ onOpenStudio, onSelectPreset }: GhostWireLandingScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeBentoTab, setActiveBentoTab] = useState(0);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  // Check Auth State
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Scroll Progress Engine (smooth rAF calculation)
  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight;
      const windowHeight = window.innerHeight;

      // Progress from 0 to 1 through the sticky section
      const progress = Math.min(
        1,
        Math.max(0, -rect.top / (containerHeight - windowHeight))
      );

      setScrollProgress(progress);
    };

    const onScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Auto-progress bento tabs in Act II if user is scrolling through
  useEffect(() => {
    if (scrollProgress > 0.45) {
      const tabIndex = Math.min(3, Math.floor(((scrollProgress - 0.45) / 0.5) * 4));
      setActiveBentoTab(tabIndex);
    }
  }, [scrollProgress]);

  const bentoTabs = [
    {
      id: 'edge',
      title: 'Edge Redaction',
      label: '01 · ZERO-PII TRANSMISSION',
      desc: 'Client-side single-pass O(n) regex paired with Verhoeff (Aadhaar) and Luhn (Credit Cards) checksums. Sensitive data never leaves your browser.',
      icon: Shield,
    },
    {
      id: 'linkage',
      title: 'Linkage Defense',
      label: '02 · ADVERSARIAL PROTECTION',
      desc: 'Latanya Sweeney linkage attack simulator models cross-database voter/census re-identification, proving risk drops from 89% down to <4% with K-anonymity.',
      icon: Bug,
    },
    {
      id: 'safe_ai',
      title: 'Safe AI & Share',
      label: '03 · ZERO-KNOWLEDGE VAULT',
      desc: 'Pre-sanitizes prompts before LLM ingestion. Shares encrypted documents via client-side AES-256-GCM where decryption keys live strictly in URL #key fragments.',
      icon: Lock,
    },
    {
      id: 'audit',
      title: 'Export & Audit',
      label: '04 · STATUTORY COMPLIANCE',
      desc: 'Automated legal checks against India DPDP Act 2023, EU GDPR Article 32, and HIPAA Safe Harbor with certified PDF and XLSX compliance ledgers.',
      icon: FileCheck2,
    },
  ];

  // Calculated transforms for the Rising Firewall Card
  // Act I: 0 -> 0.45 (Card climbs up from horizon)
  const risingCardTranslateY = Math.max(0, 100 - scrollProgress * 220);
  const risingCardScale = Math.min(1, 0.88 + scrollProgress * 0.25);
  const risingCardOpacity = Math.min(1, 0.4 + scrollProgress * 1.5);

  // Act I -> Act II transition
  const actOneOpacity = Math.max(0, 1 - scrollProgress * 2.8);
  const actTwoOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.35) * 3));

  const handleStudioScroll = () => {
    soundEngine.playClick();
    if (onOpenStudio) {
      onOpenStudio();
    } else {
      const el = document.getElementById('privacy-studio');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full bg-[#FDFDFD] text-[#141414]">
      {/* ── FLOATING PILL NAVBAR ── */}
      <header className="fixed top-5 left-0 right-0 z-50 flex items-center justify-between max-w-5xl mx-auto px-4 pointer-events-none">
        {/* Left Brand Badge */}
        <Link
          href="/"
          className="pointer-events-auto flex items-center space-x-2.5 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-[13px] border border-[#ECECEC] shadow-sm hover:border-[#D0D0D0] transition-editorial"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#627E4A] text-white">
            <Shield className="h-3.5 w-3.5" />
          </div>
          <span className="font-serif text-base font-semibold tracking-tight text-[#141414]">
            ghostwire<span className="text-[#627E4A]">.io</span>
          </span>
        </Link>

        {/* Center Floating Pill: Quick-jump modes */}
        <nav className="pointer-events-auto hidden md:flex items-center space-x-1 bg-white/90 backdrop-blur-md px-2 py-1.5 rounded-[13px] border border-[#ECECEC] shadow-sm">
          {[
            { id: 'studio', label: 'Shield', icon: Shield },
            { id: 'logs', label: 'Logs', icon: Server, preset: 'server_log' },
            { id: 'clinical', label: 'Clinical', icon: Activity, preset: 'clinical_note' },
            { id: 'attack', label: 'Attack Sim', icon: Bug },
            { id: 'vault', label: 'ZK Vault', icon: Lock },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundEngine.playClick();
                  if (item.preset && onSelectPreset) {
                    onSelectPreset(item.preset);
                  }
                  handleStudioScroll();
                }}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-[8px] text-xs font-medium text-[#4A4A4A] hover:text-[#141414] hover:bg-[#F4F5F5] transition-editorial"
              >
                <Icon className="h-3.5 w-3.5 text-[#627E4A]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Button */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-[13px] border border-[#ECECEC] shadow-sm text-xs font-medium text-[#141414] hover:border-[#627E4A]/40 transition-editorial"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#627E4A]/15 text-[#627E4A]">
                <User className="h-3 w-3" />
              </div>
              <span>{user.name.split(' ')[0]}</span>
              <span className="text-[10px] bg-[#F4F5F5] px-1.5 py-0.5 rounded text-[#627E4A] font-mono">Studio</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center space-x-1.5 bg-[#1E1E1E] text-white px-4 py-2 rounded-[9px] text-xs font-medium shadow-sm hover:bg-[#141414] transition-editorial"
            >
              <Zap className="h-3.5 w-3.5 text-[#A7CBE0]" />
              <span>Sign In / Demo</span>
            </Link>
          )}
        </div>
      </header>

      {/* ── STICKY SCROLL STAGE (Height 240vh for smooth choreography) ── */}
      <div className="relative h-[250vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
          
          {/* Atmospheric Mist & Horizon Background */}
          <div className="absolute inset-0 pointer-events-none -z-10 bg-sky-mist opacity-70" />
          <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none -z-10 bg-gradient-to-t from-[#EBF3F8] via-[#F4F5F5]/60 to-transparent" />

          {/* ──────────────── ACT I: ATMOSPHERIC HERO & RISING FIREWALL CARD ──────────────── */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-start pt-24 px-4 sm:px-6 transition-opacity duration-300 pointer-events-auto"
            style={{ opacity: actOneOpacity, pointerEvents: actOneOpacity < 0.1 ? 'none' : 'auto' }}
          >
            {/* Top Status Badge */}
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/90 px-3.5 py-1 text-xs font-mono text-[#627E4A] border border-[#ECECEC] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#627E4A] animate-pulse" />
              <span>Zero-Knowledge Edge Engine · 0 KB Raw PII Transmitted</span>
            </div>

            {/* Newsreader Serif Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal text-center text-[#141414] leading-[1.08] tracking-tight mt-6 max-w-4xl">
              <span className="block italic text-[#4A4A4A]">The privacy firewall</span>
              <span className="block">for sensitive logs & AI.</span>
              <span className="block text-[#627E4A]">Redact together, locally.</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-[#4A4A4A] text-center max-w-xl font-normal leading-relaxed">
              Detect, classify, and mathematically safeguard sensitive identifiers inside browser memory before any telemetry or LLM prompt leaves your enterprise network.
            </p>

            {/* CTAs */}
            <div className="mt-7 flex items-center space-x-3">
              <button
                onClick={handleStudioScroll}
                className="flex items-center space-x-2 rounded-[9px] bg-[#1E1E1E] text-white px-5 py-3 text-xs font-medium shadow-sm hover:bg-[#141414] hover:shadow-md transition-editorial"
              >
                <Shield className="h-4 w-4 text-[#A7CBE0]" />
                <span>Launch Privacy Studio</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <Link
                href="/dashboard"
                className="flex items-center space-x-2 rounded-[9px] bg-white border border-[#ECECEC] text-[#141414] px-4 py-3 text-xs font-medium hover:border-[#627E4A]/50 transition-editorial shadow-sm"
              >
                <span>Live Workspace</span>
              </Link>
            </div>

            {/* ── RISING LIVE FIREWALL CARD (Climbs out from horizon) ── */}
            <div
              className="mt-8 w-full max-w-3xl rounded-3xl border border-[#ECECEC] bg-[#F4F5F5] p-5 sm:p-6 shadow-xl transition-transform ease-out"
              style={{
                transform: `translateY(${risingCardTranslateY}px) scale(${risingCardScale})`,
                opacity: risingCardOpacity,
              }}
            >
              {/* Card Header & Live Counters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E5E7EB] gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#627E4A]" />
                  <span className="text-xs font-mono font-medium text-[#141414]">Audit: Clinical & Server Logs</span>
                  <span className="text-[10px] font-mono text-[#7D8954] bg-[#E7F0FC] px-2 py-0.5 rounded">
                    Mode: Edge WebWorker
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono">
                  <span className="text-[#627E4A] font-semibold">14 Redacted</span>
                  <span className="text-[#141414]">·</span>
                  <span className="text-[#D97757] font-semibold">4 Quasi-Clues</span>
                  <span className="text-[#141414]">·</span>
                  <span className="text-[#9B4A4A] font-semibold">0 Leaks</span>
                </div>
              </div>

              {/* Simulated Live Security Thread */}
              <div className="mt-4 space-y-3 text-xs font-sans">
                {/* Analyst message */}
                <div className="flex items-start space-x-2.5 bg-white p-3 rounded-2xl border border-[#ECECEC]">
                  <div className="h-6 w-6 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0">
                    AN
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#141414]">
                      <span className="text-[#627E4A] font-mono">@shield</span> sanitize patient intake & server logs before AI summary.
                    </p>
                    <p className="text-[11px] text-[#6A6A6A] font-mono mt-1">
                      Payload: 10,240 lines · Direct Aadhaar, PAN & Clinical diagnoses
                    </p>
                  </div>
                </div>

                {/* Shield WebWorker automated reply */}
                <div className="flex items-start space-x-2.5 bg-[#FAFAFA] p-3 rounded-2xl border border-[#ECECEC] relative">
                  <div className="h-6 w-6 rounded-full bg-[#627E4A] text-white flex items-center justify-center text-[10px] flex-shrink-0">
                    <Shield className="h-3 w-3" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-[#141414]">Edge Shield Worker</span>
                      <span className="text-[10px] font-mono text-[#627E4A] bg-[#627E4A]/10 px-1.5 py-0.5 rounded">
                        1.4ms Latency
                      </span>
                    </div>
                    <p className="text-xs text-[#2A2A2A] mt-1">
                      Done ✅ 14 PII tokens masked locally. Linkage risk dropped from <strong className="text-[#D97757]">89%</strong> to <strong className="text-[#627E4A]">3%</strong>. Zero bytes sent to cloud.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────── ACT II: STICKY COMPACT HEADER & DUAL BENTO SHOWCASE ──────────────── */}
          <div
            className="absolute inset-0 flex flex-col justify-start pt-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto transition-opacity duration-300 pointer-events-auto"
            style={{ opacity: actTwoOpacity, pointerEvents: actTwoOpacity < 0.1 ? 'none' : 'auto' }}
          >
            {/* Header Band */}
            <div className="text-center mb-6">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#627E4A] font-semibold">
                Architecture & Statutory Defense
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#141414] mt-1 font-normal">
                Your edge firewall, sanitizing before anything leaves.
              </h2>
            </div>

            {/* Dual Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch">
              
              {/* Left Bento: 4 Interactive Tabs with Progress Bars */}
              <div className="lg:col-span-5 rounded-[34px] border border-[#ECECEC] bg-[#FAFAFA] p-6 flex flex-col justify-between shadow-sm">
                <div className="space-y-4">
                  {bentoTabs.map((tab, idx) => {
                    const isActive = activeBentoTab === idx;
                    const Icon = tab.icon;
                    return (
                      <div
                        key={tab.id}
                        onClick={() => {
                          soundEngine.playClick();
                          setActiveBentoTab(idx);
                        }}
                        className={`cursor-pointer rounded-2xl p-4 transition-editorial border ${
                          isActive
                            ? 'bg-white border-[#ECECEC] shadow-sm'
                            : 'bg-transparent border-transparent hover:bg-white/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7D8954] font-medium">
                            {tab.label}
                          </span>
                          <Icon className={`h-4 w-4 ${isActive ? 'text-[#627E4A]' : 'text-[#8A8A8A]'}`} />
                        </div>
                        <h3 className="font-serif text-lg font-normal text-[#141414]">{tab.title}</h3>
                        <p className="text-xs text-[#5A5A5A] leading-relaxed mt-1">{tab.desc}</p>

                        {/* Animated Progress Bar */}
                        <div className="mt-3 h-1 w-full rounded-full bg-[#EFEFEF] overflow-hidden">
                          <div
                            className="h-full bg-[#627E4A] transition-all duration-300"
                            style={{ width: isActive ? '100%' : '0%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-[#ECECEC] flex items-center justify-between">
                  <span className="text-xs text-[#6A6A6A] font-sans">Full client-side attestation</span>
                  <button
                    onClick={handleStudioScroll}
                    className="text-xs font-medium text-[#1E1E1E] hover:text-[#627E4A] flex items-center space-x-1"
                  >
                    <span>Test In Studio</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Right Bento: Frosted-Glass Interactive Preview Stage */}
              <div className="lg:col-span-7 rounded-[38px] border border-[#ECECEC] overflow-hidden relative min-h-[420px] flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-br from-[#EBF3F8] via-[#F4F5F5] to-[#E7F0FC]">
                
                {/* Decorative Mist Gradient Sphere */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#A7CBE0]/30 blur-[90px] pointer-events-none" />

                {/* Top Pill Matrix Indicator */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-[#141414] bg-white/90 backdrop-blur-md px-3 py-1 rounded-[10px] border border-[#ECECEC] shadow-sm">
                    {bentoTabs[activeBentoTab].title} Preview
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#627E4A]" />
                    <span className="text-xs font-mono text-[#627E4A] font-medium">Verified Local</span>
                  </div>
                </div>

                {/* Morphing Stage Content */}
                <div className="relative z-10 my-auto py-6">
                  {/* Tab 0: Edge Redaction Chips */}
                  {activeBentoTab === 0 && (
                    <div className="space-y-4">
                      <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-[#ECECEC] shadow-sm space-y-2">
                        <span className="text-[10px] font-mono text-[#7D8954] uppercase">Live Token Replacement</span>
                        <div className="font-mono text-xs text-[#141414] leading-relaxed">
                          Patient <span className="bg-[#E7F0FC] text-[#3B55F0] px-2 py-0.5 rounded font-bold">[PERSON_01]</span> admitted under MRN <span className="bg-[#627E4A]/10 text-[#627E4A] px-2 py-0.5 rounded font-bold">[CLINICAL_MRN_01]</span> with diagnosis <span className="bg-[#627E4A]/10 text-[#627E4A] px-2 py-0.5 rounded font-bold">[DIAGNOSIS_01]</span>.
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-white/80 p-3 rounded-xl border border-[#ECECEC]">
                          <span className="text-[10px] text-[#7A7A7A]">Aadhaar Checksum:</span>
                          <p className="font-bold text-[#627E4A] mt-0.5">Verhoeff D5 Validated</p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-[#ECECEC]">
                          <span className="text-[10px] text-[#7A7A7A]">Card Numbers:</span>
                          <p className="font-bold text-[#627E4A] mt-0.5">Luhn Mod-10 Validated</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 1: Linkage Defense Meter */}
                  {activeBentoTab === 1 && (
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-[#ECECEC] shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-[#141414] font-medium">Re-Identification Risk:</span>
                        <div className="flex items-center space-x-2 text-xs font-mono font-bold">
                          <span className="line-through text-[#9B4A4A]">89% Unprotected</span>
                          <span className="text-[#627E4A]">→ 3% Sanitized</span>
                        </div>
                      </div>

                      {/* Bar comparison */}
                      <div className="h-3 w-full bg-[#F4F5F5] rounded-full overflow-hidden flex">
                        <div className="h-full bg-[#627E4A] w-[3%]" />
                        <div className="h-full bg-[#E5E7EB] w-[97%]" />
                      </div>

                      <div className="text-xs text-[#5A5A5A] font-sans space-y-1">
                        <p className="flex items-center space-x-1.5 text-[#627E4A]">
                          <Check className="h-3.5 w-3.5" />
                          <span>Exact Age generalized to 25–35 decade cohort</span>
                        </p>
                        <p className="flex items-center space-x-1.5 text-[#627E4A]">
                          <Check className="h-3.5 w-3.5" />
                          <span>PIN 411057 generalized to Western India Metro</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Safe AI & Vault */}
                  {activeBentoTab === 2 && (
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-[#ECECEC] shadow-sm space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#ECECEC]">
                        <span className="text-xs font-mono text-[#141414] font-semibold">Zero-Knowledge Share Envelope</span>
                        <span className="text-[10px] font-mono text-[#627E4A] bg-[#627E4A]/10 px-2 py-0.5 rounded">
                          AES-256-GCM
                        </span>
                      </div>
                      <div className="p-3 bg-[#F4F5F5] rounded-xl font-mono text-xs text-[#3A3A3A] truncate">
                        https://ghostwire.io/share/vlt_9021#key=8f9a2b7c4d1e3f...
                      </div>
                      <p className="text-xs text-[#5A5A5A]">
                        Decryption key stays 100% in the URL hash fragment. Zero key storage on backend databases.
                      </p>
                    </div>
                  )}

                  {/* Tab 3: Statutory Standards */}
                  {activeBentoTab === 3 && (
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#ECECEC] shadow-sm">
                        <span className="text-[10px] text-[#7A7A7A]">India DPDP Act 2023</span>
                        <p className="font-bold text-[#627E4A] mt-1">Sec 8(5) Compliant</p>
                        <span className="text-[10px] text-[#5A5A5A]">₹0 Penalty Exposure</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#ECECEC] shadow-sm">
                        <span className="text-[10px] text-[#7A7A7A]">EU GDPR Standard</span>
                        <p className="font-bold text-[#627E4A] mt-1">Article 32 Verified</p>
                        <span className="text-[10px] text-[#5A5A5A]">Technical Measures OK</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#ECECEC] shadow-sm">
                        <span className="text-[10px] text-[#7A7A7A]">HIPAA Safe Harbor</span>
                        <p className="font-bold text-[#627E4A] mt-1">18/18 De-Identified</p>
                        <span className="text-[10px] text-[#5A5A5A]">Clinical Safe Harbor</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#ECECEC] shadow-sm">
                        <span className="text-[10px] text-[#7A7A7A]">Google Gemini GenAI</span>
                        <p className="font-bold text-[#3B55F0] mt-1">Structured Audit</p>
                        <span className="text-[10px] text-[#5A5A5A]">Anonymized Schema Only</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Stage Pill */}
                <div className="relative z-10 flex items-center justify-between pt-3 border-t border-[#ECECEC]">
                  <span className="text-[11px] text-[#6A6A6A] font-sans">
                    Zero raw PII storage · SQLite Audit Ledger WAL
                  </span>
                  <button
                    onClick={handleStudioScroll}
                    className="text-xs font-medium text-[#1E1E1E] hover:underline"
                  >
                    Open Studio →
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
