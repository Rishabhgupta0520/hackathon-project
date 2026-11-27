'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Shield, Zap, Lock, Activity, ArrowRight, CheckCircle2, Terminal } from 'lucide-react';
import { soundEngine } from '@/lib/soundEngine';

interface CyberHeroProps {
  onLaunchClick?: () => void;
  onInstantDemoClick?: () => void;
  onSelectPreset?: (type: 'server_log' | 'resume' | 'support_ticket' | 'clinical_note') => void;
}

export function CyberHero({ onLaunchClick, onInstantDemoClick, onSelectPreset }: CyberHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particlesCount, setParticlesCount] = useState(48);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes representing encrypted network data packets
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      pulse: number;
    }

    const count = window.innerWidth < 768 ? 28 : 56;
    setParticlesCount(count);

    const nodes: Node[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2 + 1.2,
      color: Math.random() > 0.4 ? '#38BDF8' : '#22D3EE',
      pulse: Math.random() * Math.PI * 2,
    }));

    let mouseX = -1000;
    let mouseY = -1000;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', onMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle cyber grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update & render nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.04;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        // Mouse repelling/connection
        const dxMouse = mouseX - node.x;
        const dyMouse = mouseY - node.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distMouse < 140) {
          node.x -= (dxMouse / distMouse) * 1.5;
          node.y -= (dyMouse / distMouse) * 1.5;
        }

        // Connect nearby nodes with glowing cyber laser vectors
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.22;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Draw node
        const currentRadius = node.radius + Math.sin(node.pulse) * 0.6;
        ctx.fillStyle = node.color;
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(currentRadius, 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[rgba(56,189,248,0.14)] bg-[#06080F] shadow-2xl">
      {/* Particle Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-auto"
      />

      {/* Cyber Grid Ambient Glows */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#38BDF8]/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#22D3EE]/10 blur-[120px] pointer-events-none" />

      {/* Hero Content Shell */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center space-x-2 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3.5 py-1 text-xs font-mono font-medium text-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#38BDF8] animate-ping" />
            <span>ENTERPRISE ZERO-KNOWLEDGE PII FIREWALL</span>
          </div>
          <div className="inline-flex items-center space-x-1.5 rounded-full border border-white/[0.08] bg-[#0D111C]/80 px-3 py-1 text-xs font-mono text-slate-300">
            <Lock className="h-3 w-3 text-[#22D3EE]" />
            <span>AES-256-GCM EDGE ENCRYPTION</span>
          </div>
        </div>

        {/* Hero Headings */}
        <div className="max-w-4xl">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Client-Side Data Privacy & <br />
            <span className="bg-gradient-to-r from-[#38BDF8] via-[#22D3EE] to-white bg-clip-text text-transparent">
              Adversarial Attack Defense
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl font-sans leading-relaxed">
            High-throughput WebWorker PII sanitization, Laplace differential privacy proxy, and zero-knowledge cryptographic vaulting for enterprise workflows—guaranteeing <strong className="text-white font-medium">zero raw PII transmission</strong> over the network.
          </p>
        </div>

        {/* Action Buttons & Presets */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={() => {
              soundEngine.playClick();
              onLaunchClick?.();
            }}
            data-cursor="SCAN"
            className="group flex items-center space-x-2.5 rounded-xl border border-[#38BDF8]/50 bg-gradient-to-r from-[#38BDF8] to-[#0284C7] px-6 py-3.5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Shield className="h-4 w-4 text-slate-950" />
            <span>Launch PII Firewall</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onInstantDemoClick?.();
            }}
            data-cursor="AUTH"
            className="flex items-center space-x-2 rounded-xl border border-[rgba(56,189,248,0.25)] bg-[#0D111C]/90 px-5 py-3.5 text-sm font-medium text-slate-200 hover:border-[#38BDF8]/60 hover:text-white transition-all duration-150 backdrop-blur-xl"
          >
            <Zap className="h-4 w-4 text-[#38BDF8]" />
            <span>1-Click Demo Workspace</span>
          </button>
        </div>

        {/* Quick Document Presets Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-mono text-slate-400 mr-1 flex items-center">
            <Terminal className="h-3 w-3 mr-1.5 text-[#38BDF8]" />
            Presets:
          </span>
          {[
            { id: 'server_log', label: 'Server Logs', icon: '⚡' },
            { id: 'resume', label: 'Candidate Resumes', icon: '📄' },
            { id: 'support_ticket', label: 'Support Tickets', icon: '💬' },
            { id: 'clinical_note', label: 'Clinical Notes', icon: '🏥' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                soundEngine.playClick();
                onSelectPreset?.(preset.id as any);
              }}
              data-cursor="INSPECT"
              className="inline-flex items-center space-x-1.5 rounded-lg border border-white/[0.08] bg-[#0D111C]/70 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-[#38BDF8]/40 hover:bg-[#38BDF8]/10 hover:text-white transition-all"
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Real-time Telemetry Bento Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[rgba(56,189,248,0.14)] bg-[#0D111C]/80 p-4 backdrop-blur-xl hover:border-[#38BDF8]/40 transition-colors">
            <div className="flex items-center justify-between text-[#38BDF8]">
              <span className="text-xs font-mono font-medium">NETWORK PRIVACY</span>
              <Shield className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-display font-bold text-white">0.00 KB</div>
            <p className="mt-1 text-xs text-slate-400">Zero raw PII transmitted over network</p>
          </div>

          <div className="rounded-xl border border-[rgba(56,189,248,0.14)] bg-[#0D111C]/80 p-4 backdrop-blur-xl hover:border-[#38BDF8]/40 transition-colors">
            <div className="flex items-center justify-between text-[#22D3EE]">
              <span className="text-xs font-mono font-medium">EDGE LATENCY</span>
              <Activity className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-display font-bold text-white">&lt; 1.8 ms</div>
            <p className="mt-1 text-xs text-slate-400">Multi-threaded WebWorker scanning</p>
          </div>

          <div className="rounded-xl border border-[rgba(56,189,248,0.14)] bg-[#0D111C]/80 p-4 backdrop-blur-xl hover:border-[#38BDF8]/40 transition-colors">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-mono font-medium">COMPLIANCE SUITE</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-display font-bold text-white">100% PASS</div>
            <p className="mt-1 text-xs text-slate-400">DPDP Act 2023, GDPR & HIPAA audits</p>
          </div>

          <div className="rounded-xl border border-[rgba(56,189,248,0.14)] bg-[#0D111C]/80 p-4 backdrop-blur-xl hover:border-[#38BDF8]/40 transition-colors">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-xs font-mono font-medium">CRYPTOGRAPHIC VAULT</span>
              <Lock className="h-4 w-4" />
            </div>
            <div className="mt-2 text-2xl font-display font-bold text-white">AES-256-GCM</div>
            <p className="mt-1 text-xs text-slate-400">PBKDF2 100k rounds & client URL hashes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
