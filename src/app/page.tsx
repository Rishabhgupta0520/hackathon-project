'use client';

import React, { useState } from 'react';
import { GhostWireLandingScroll } from '@/components/ui/ghostwire-landing-scroll';
import { PrivacyStudio } from '@/components/PrivacyStudio';

export default function Home() {
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>(undefined);

  const handleOpenStudio = () => {
    const el = document.getElementById('privacy-studio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    const el = document.getElementById('privacy-studio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-[#141414] flex flex-col font-sans">
      {/* ── Editorial Scroll Choreography (Act I & Act II) ── */}
      <GhostWireLandingScroll
        onOpenStudio={handleOpenStudio}
        onSelectPreset={handleSelectPreset}
      />

      {/* ── Interactive Client-Side Privacy Studio Workbench ── */}
      <div className="border-t border-[#ECECEC] bg-[#FDFDFD]">
        <PrivacyStudio initialPreset={selectedPreset} />
      </div>

      {/* ── Editorial Warm Footer ── */}
      <footer className="w-full border-t border-[#ECECEC] bg-[#FAFAFA] py-10 text-center text-xs text-[#7A7A7A] space-y-2">
        <div className="font-serif text-base text-[#141414] font-semibold">
          ghostwire<span className="text-[#627E4A]">.io</span>
        </div>
        <p className="font-sans">
          Zero-Knowledge Edge PII Firewall &amp; Statutory Data Privacy Platform. 100% Client-Side Processing.
        </p>
        <p className="font-mono text-[11px] text-[#9A9A9A]">
          India DPDP Act 2023 · EU GDPR Article 32 · US HIPAA Safe Harbor · Web Crypto AES-256-GCM
        </p>
      </footer>
    </div>
  );
}
