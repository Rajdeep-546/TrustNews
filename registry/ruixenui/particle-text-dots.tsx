"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

export interface ParticleTextDotsProps {
  text?: string;
  variant?: "dark" | "light";
  className?: string;
  particleGap?: number;
  dotSize?: number;
  fontSize?: number;
  color?: string;
  mouseRadius?: number;
}

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  friction: number;
  springFactor: number;
}

export const ParticleTextDots: React.FC<ParticleTextDotsProps> = ({
  text = "TrustNews",
  variant = "dark",
  className = "",
  particleGap = 4,
  dotSize = 2.0,
  fontSize,
  color,
  mouseRadius = 85,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState<number>(fontSize || 64);

  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    // Use container measured width with fallback
    const width = Math.max(300, Math.round(rect.width || container.clientWidth || 760));

    // Dynamic responsive font size: scales smoothly on desktop, tablet, and mobile
    const calculatedFontSize = fontSize || Math.max(36, Math.min(84, Math.round(width / Math.max(text.length * 0.58, 4.5))));
    setCurrentFontSize(calculatedFontSize);

    // Height proportional to font size to avoid empty vertical black voids on desktop
    const height = Math.max(120, Math.min(220, Math.round(calculatedFontSize * 2.2)));

    // Set canvas dimensions with high-DPI scaling
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Ensure clean transform for text measurement
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const fontStack = `800 ${calculatedFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.font = fontStack;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw reference text
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, width / 2, height / 2);

    // Read pixel buffer directly from physical canvas dimensions
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const step = Math.max(2, Math.round(particleGap * dpr));

    const newParticles: Particle[] = [];

    // Distinct dot colors for dark theme: white, cyan, and emerald glowing hues
    const darkPalette = [
      "#ffffff",
      "#f8fafc",
      "#38bdf8", // sky-400
      "#34d399", // emerald-400
      "#22d3ee", // cyan-400
      "#67e8f9", // cyan-300
      "#a7f3d0", // emerald-200
    ];

    const lightPalette = [
      "#0f172a",
      "#1e293b",
      "#0284c7",
      "#059669",
    ];

    const palette = color ? [color] : variant === "dark" ? darkPalette : lightPalette;

    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];

        if (alpha > 100) {
          const logicalX = x / dpr;
          const logicalY = y / dpr;

          // Start slightly dispersed for initial dynamic assembly animation
          const angle = Math.random() * Math.PI * 2;
          const spread = Math.random() * 35;
          const startX = logicalX + Math.cos(angle) * spread;
          const startY = logicalY + Math.sin(angle) * spread;

          const chosenColor = palette[Math.floor(Math.random() * palette.length)];

          newParticles.push({
            x: startX,
            y: startY,
            originX: logicalX,
            originY: logicalY,
            vx: 0,
            vy: 0,
            size: dotSize * (0.85 + Math.random() * 0.4),
            color: chosenColor,
            friction: 0.88 + Math.random() * 0.05,
            springFactor: 0.045 + Math.random() * 0.02,
          });
        }
      }
    }

    particlesRef.current = newParticles;
    setParticlesLoaded(newParticles.length > 0);
    ctx.clearRect(0, 0, width, height);
  }, [text, variant, particleGap, dotSize, fontSize, color]);

  // Handle ResizeObserver for accurate sizing on desktop & mobile, plus font loading
  useEffect(() => {
    initParticles();

    // Check if fonts are still loading; re-rasterize once ready
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        initParticles();
      });
    }

    // ResizeObserver ensures desktop viewport layout changes re-scale canvas properly
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        initParticles();
      });
      resizeObserver.observe(containerRef.current);
    }

    const handleWindowResize = () => {
      initParticles();
    };

    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [initParticles]);

  // Main animation render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Always explicitly reset transform every frame before clearing and drawing
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Interaction with mouse cursor
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouseRadius) {
            const force = (1 - distance / mouseRadius) * 8.5;
            const angle = Math.atan2(dy, dx);
            p.vx -= Math.cos(angle) * force;
            p.vy -= Math.sin(angle) * force;
          }
        }

        // Spring return force towards origin
        const homeDx = p.originX - p.x;
        const homeDy = p.originY - p.y;

        p.vx += homeDx * p.springFactor;
        p.vy += homeDy * p.springFactor;

        p.vx *= p.friction;
        p.vy *= p.friction;

        p.x += p.vx;
        p.y += p.vy;

        // Render dot
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mouseRadius]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    };
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
      active: true,
    };
  };

  const handleTouchEnd = () => {
    mouseRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-4xl mx-auto flex items-center justify-center overflow-hidden select-none min-h-[120px] ${className}`}
    >
      {/* Ambient luminous glow & fallback headline: guarantees text is immediately visible without any black void */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-700 ${
          particlesLoaded ? "opacity-15 blur-[1px]" : "opacity-95"
        }`}
        aria-hidden="true"
      >
        <span
          className="font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-300 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(34,211,238,0.25)] select-none text-center"
          style={{ fontSize: `${currentFontSize}px` }}
        >
          {text}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="block relative z-10 cursor-crosshair max-w-full"
      />
    </div>
  );
};

export default function ParticleTextDotsDemo() {
  return (
    <div className="relative flex justify-center pt-3 px-3">
      <ParticleTextDots text="TrustNews" variant="dark" />
    </div>
  );
}
