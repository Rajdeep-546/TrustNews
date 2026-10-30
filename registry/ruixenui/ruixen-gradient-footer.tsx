"use client";

import React, { useEffect, useRef, useState } from "react";

export interface RuixenGradientFooterProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  gradientHeight?: string | number;
  className?: string;
  variant?: "dia" | "aurora" | "cyan-emerald";
}

export const RuixenGradientFooter: React.FC<RuixenGradientFooterProps> = ({
  children,
  gradientHeight = "40vh",
  className = "",
  variant = "dia",
  ...props
}) => {
  const footerRef = useRef<HTMLElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(1);

  // Measure scroll proximity to bottom to dynamically reveal the glow as user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      if (!footerRef.current) return;
      const rect = footerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const distance = windowHeight - rect.top;
      const total = rect.height;
      if (total > 0) {
        const progress = Math.min(1, Math.max(0.35, distance / (total * 0.85)));
        setScrollProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heightValue = typeof gradientHeight === "number" ? `${gradientHeight}px` : gradientHeight;

  return (
    <footer
      ref={footerRef}
      className={`relative overflow-hidden border-t border-neutral-900 bg-black text-neutral-400 ${className}`}
      {...props}
    >
      {/* Content rendered on top with crisp readability */}
      <div className="relative z-10 w-full">
        {children}
      </div>

      {/* Dia-inspired rainbow gradient stretching up from the floor */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 overflow-hidden flex items-end justify-center transition-opacity duration-700 select-none"
        style={{
          height: heightValue,
          opacity: 0.9 * scrollProgress,
        }}
        aria-hidden="true"
      >
        {/* Soft atmospheric radial bloom */}
        <div className="absolute -bottom-16 inset-x-0 h-full w-full bg-gradient-to-t from-emerald-500/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />

        {/* Scalable inline SVG rendering the Dia Browser rainbow color floor glow */}
        <svg
          className="w-full h-full object-cover blur-[50px] sm:blur-[70px] scale-110 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 400"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="ruixen-dia-rainbow" x1="0%" y1="100%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="18%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="36%" stopColor="#3b82f6" stopOpacity="0.55" />
              <stop offset="54%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="72%" stopColor="#ec4899" stopOpacity="0.5" />
              <stop offset="88%" stopColor="#f97316" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="ruixen-dia-vertical-mask" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>

            <mask id="ruixen-floor-mask">
              <rect width="100%" height="100%" fill="url(#ruixen-dia-vertical-mask)" />
            </mask>

            <filter id="ruixen-dia-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="30" result="blur" />
            </filter>
          </defs>

          {/* Curved glowing floor wave */}
          <path
            d="M0,300 Q360,170 720,210 T1440,190 L1440,400 L0,400 Z"
            fill="url(#ruixen-dia-rainbow)"
            mask="url(#ruixen-floor-mask)"
            filter="url(#ruixen-dia-blur)"
          />

          {/* Baseline intense ambient glow band */}
          <rect
            y="250"
            width="100%"
            height="150"
            fill="url(#ruixen-dia-rainbow)"
            mask="url(#ruixen-floor-mask)"
          />
        </svg>

        {/* Ambient bottom edge floor line glow */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      </div>
    </footer>
  );
};

export default RuixenGradientFooter;
