'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function MotionCursor() {
  const [enabled, setEnabled] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);

  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  const springConfig = { damping: 28, stiffness: 380, mass: 0.4 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion) {
      setEnabled(false);
      return;
    }
    setEnabled(true);

    const handleMouseMove = (e: MouseEvent) => {
      setHasMoved(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target as HTMLElement | null;
      const cursorTarget = target?.closest('[data-cursor]');
      if (cursorTarget) {
        setCursorText(cursorTarget.getAttribute('data-cursor') || '');
      } else {
        setCursorText('');
      }

      const isInteractive = !!target?.closest('button, a, input, select, textarea, [role="button"]');
      setIsHoveringInteractive(isInteractive);
    };

    const handleMouseLeave = () => {
      setCursorText('');
      setIsHoveringInteractive(false);
      setHasMoved(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  if (!enabled || !hasMoved) return null;

  return (
    <>
      {/* Central pinpoint dot - Electric Cyan */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-50 rounded-full bg-[#38BDF8] shadow-[0_0_10px_#38BDF8]"
        style={{
          x: mouseX,
          y: mouseY,
          width: 6,
          height: 6,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* Trailing luminous magnetic halo - Electric Cyan / Neon Teal */}
      <motion.div
        className={`pointer-events-none fixed top-0 left-0 z-50 flex items-center justify-center rounded-full border transition-colors duration-150 ${
          cursorText
            ? 'border-[#38BDF8]/80 bg-[#06080F]/80 backdrop-blur-md shadow-[0_0_20px_rgba(56,189,248,0.3)]'
            : isHoveringInteractive
            ? 'border-[#38BDF8]/60 bg-[#38BDF8]/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
            : 'border-white/20 bg-white/[0.02]'
        }`}
        style={{
          x: smoothX,
          y: smoothY,
          width: cursorText ? 68 : isHoveringInteractive ? 44 : 26,
          height: cursorText ? 26 : isHoveringInteractive ? 44 : 26,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        {cursorText && (
          <span className="text-[9px] font-mono font-bold tracking-widest text-[#38BDF8] uppercase">
            {cursorText}
          </span>
        )}
      </motion.div>
    </>
  );
}
