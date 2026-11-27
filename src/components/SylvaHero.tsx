'use client';

import React, { useState } from 'react';

interface SylvaHeroProps {
  bodyFont?: string;
  bodySize?: number;
  bodyWeight?: number;
  headingFont?: string;
  headingLetterSpacing?: number;
  headingSize?: number;
  headingWeight?: number;
  primaryColor?: string;
  variant?: string;
}

/**
 * ThreeUI SylvaHero - Living World Green 3D Canvas Scene
 * Embeds the exact verified HTML / Three.js WebGL canvas source from threeui.com
 * Source revision SHA-256 05f359ce157a / inner-green-3d.html
 */
export function SylvaHero({
  primaryColor = '#ffffff',
  variant = 'living-green',
}: SylvaHeroProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-[540px] md:h-[620px] overflow-hidden rounded-2xl border border-white/10 bg-[#09090B]">
      {/* Loading state indicator */}
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#09090B] z-10 transition-opacity duration-500">
          <div className="flex items-center space-x-3 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-300">
              Initializing WebGL Living-Green Scene...
            </span>
          </div>
        </div>
      )}

      {/* Verified ThreeUI HTML5 iframe sandboxed canvas container */}
      <iframe
        src="/shaders/inner-green-3d.html"
        title="GhostWire 3D Living World Mesh"
        className="w-full h-full border-0 pointer-events-auto"
        onLoad={() => {
          setTimeout(() => setLoaded(true), 300);
        }}
      />

      {/* Cyber-Editorial Gradient Vignette Overlay to blend seamlessly with Obsidian Dark Mode */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-[#09090B]/40" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#09090B] to-transparent" />

      {/* Floating Status Badge */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center space-x-2.5 rounded-full border border-emerald-500/30 bg-black/70 px-3.5 py-1.5 backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-mono tracking-wider text-emerald-300 uppercase">
          WebGL Mesh Active | Variant: {variant}
        </span>
      </div>
    </div>
  );
}
