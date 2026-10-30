import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export interface HaloReelItem {
  id?: string;
  category?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  trustScore?: number;
  badge?: string;
  tab?: string;
  categoryFilter?: string;
  src: string;
  alt?: string;
  href?: string;
  [key: string]: any;
}

export interface HaloReelProps extends React.HTMLAttributes<HTMLDivElement> {
  items: HaloReelItem[];
  centerLabel?: React.ReactNode;
  cardWidth?: number;
  cardHeight?: number;
  minScale?: number;
  radiusYRatio?: number;
  holdDuration?: number;
  stepDuration?: number;
  autoPlay?: boolean;
  className?: string;
  onItemClick?: (item: HaloReelItem, index: number) => void;
}

export const HaloReel: React.FC<HaloReelProps> = ({
  items = [],
  centerLabel,
  cardWidth = 130,
  cardHeight = 180,
  minScale = 0.4,
  radiusYRatio = 0.36,
  holdDuration = 1000,
  stepDuration = 700,
  autoPlay = true,
  className = '',
  onItemClick,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 560 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Smooth rotational angle (in radians)
  const angleRef = useRef(0);
  const targetAngleRef = useRef(0);
  const [renderAngle, setRenderAngle] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  const total = items.length || 1;
  const angleStep = (2 * Math.PI) / total;

  // Measure container size dynamically
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setContainerSize({
          width: clientWidth || 800,
          height: clientHeight || 560,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Step to next / previous
  const stepTo = useCallback(
    (nextIdx: number) => {
      const normalized = ((nextIdx % total) + total) % total;
      setCurrentIndex(normalized);
      targetAngleRef.current = -nextIdx * angleStep;
    },
    [total, angleStep]
  );

  const stepNext = useCallback(() => {
    stepTo(currentIndex + 1);
  }, [currentIndex, stepTo]);

  const stepPrev = useCallback(() => {
    stepTo(currentIndex - 1);
  }, [currentIndex, stepTo]);

  // Autoplay timer
  useEffect(() => {
    if (!isPlaying || isHovered || isDragging) return;

    const interval = setInterval(() => {
      stepTo(currentIndex + 1);
    }, holdDuration + stepDuration);

    return () => clearInterval(interval);
  }, [isPlaying, isHovered, isDragging, currentIndex, holdDuration, stepDuration, stepTo]);

  // Smooth lerp loop
  useEffect(() => {
    let active = true;

    const animate = () => {
      if (!active) return;

      const diff = targetAngleRef.current - angleRef.current;
      if (Math.abs(diff) > 0.0005) {
        angleRef.current += diff * 0.08; // smooth easing
        setRenderAngle(angleRef.current);
      } else {
        angleRef.current = targetAngleRef.current;
        setRenderAngle(angleRef.current);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Drag interaction
  const dragStartRef = useRef<{ x: number; angle: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartRef.current = {
      x: e.clientX,
      angle: targetAngleRef.current,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const deltaAngle = (dx / (containerSize.width * 0.4)) * Math.PI;
    targetAngleRef.current = dragStartRef.current.angle + deltaAngle;
    angleRef.current = targetAngleRef.current;
    setRenderAngle(targetAngleRef.current);
  };

  const handlePointerUp = () => {
    if (dragStartRef.current) {
      dragStartRef.current = null;
      setIsDragging(false);
      // Snap to nearest item
      const rawIndex = Math.round(-targetAngleRef.current / angleStep);
      stepTo(rawIndex);
    }
  };

  // Dimensions
  const rx = Math.max(120, (containerSize.width - cardWidth) * 0.42);
  const ry = rx * radiusYRatio;
  const cx = containerSize.width / 2;
  const cy = containerSize.height / 2;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (isDragging) handlePointerUp();
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative isolate w-full overflow-hidden select-none cursor-grab active:cursor-grabbing flex items-center justify-center ${className}`}
      {...props}
    >
      {/* Center Label */}
      {centerLabel && (
        <div className="absolute z-10 pointer-events-none text-center transform -translate-y-2">
          {centerLabel}
        </div>
      )}

      {/* Halo Cards Orbit */}
      <div className="relative w-full h-full pointer-events-none">
        {items.map((item, index) => {
          const theta = renderAngle + index * angleStep;

          // x and y in 3D orbit
          const sinTheta = Math.sin(theta);
          const cosTheta = Math.cos(theta); // depth: -1 (back) to +1 (front)

          const x = cx + rx * sinTheta - cardWidth / 2;
          const y = cy + ry * cosTheta - cardHeight / 2;

          // Normalized depth in [0, 1]
          const depth = (cosTheta + 1) / 2;
          const scale = minScale + (1 - minScale) * depth;
          const opacity = 0.35 + 0.65 * Math.pow(depth, 1.2);
          // Scale z-index strictly inside the local isolated stacking context (1-25)
          const zIndex = Math.max(1, Math.min(25, Math.round(depth * 25)));
          const isFront = cosTheta > 0.85;

          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              aria-label={item.title || item.category || item.alt || `News Category ${index + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                stepTo(index);
                onItemClick?.(item, index);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  stepTo(index);
                  onItemClick?.(item, index);
                }
              }}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                transform: `scale(${scale})`,
                opacity,
                zIndex,
                pointerEvents: 'auto',
                transition: isDragging ? 'none' : 'box-shadow 0.3s ease, border-color 0.3s ease',
              }}
              className={`rounded-2xl overflow-hidden shadow-2xl cursor-pointer border select-none transition-all ${
                isFront
                  ? 'border-white/80 shadow-white/20 ring-1 ring-white/40'
                  : 'border-neutral-800 shadow-black/80 hover:border-neutral-600 hover:ring-1 hover:ring-white/20'
              } bg-neutral-900 group`}
            >
              <img
                src={item.src}
                alt={item.alt || item.title || `Halo item ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 pointer-events-none"
                loading="lazy"
                onError={(e) => {
                  // Fallback sleek dark gradient if image fails
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.classList.add(
                      'bg-gradient-to-tr',
                      'from-neutral-950',
                      'via-neutral-900',
                      'to-neutral-800'
                    );
                  }
                }}
              />
              {/* Multilayer readable gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/30 pointer-events-none" />

              {/* Top Category Badge and Trust Pill */}
              <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1 pointer-events-none">
                {item.category && (
                  <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-mono font-semibold text-white border border-white/20 truncate max-w-[90px]">
                    {item.category}
                  </span>
                )}
                {item.trustScore !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {item.trustScore}%
                  </span>
                )}
                {item.badge && !item.trustScore && (
                  <span className="px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[9px] font-mono font-semibold text-white border border-white/30 truncate shrink-0">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Bottom Details Card Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none flex flex-col justify-end">
                {item.subtitle && (
                  <div className="text-[10px] font-mono text-neutral-400 line-clamp-1 mb-0.5">
                    {item.subtitle}
                  </div>
                )}
                <div className="text-xs font-bold text-white leading-tight line-clamp-2 drop-shadow-xs">
                  {item.title || item.alt || `Category ${index + 1}`}
                </div>

                {/* Click Action Indicator */}
                <div className="mt-1.5 pt-1 border-t border-white/10 flex items-center justify-between text-[10px] font-medium text-neutral-300 group-hover:text-white transition-colors">
                  <span className="truncate">
                    {item.tab ? 'Open Module' : 'View in Feed'}
                  </span>
                  <span className="text-white font-mono group-hover:translate-x-0.5 transition-transform">
                    &rarr;
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Carousel Navigation Controls */}
      <div className="absolute bottom-4 z-20 flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-full px-3 py-1.5 shadow-lg">
        <button
          onClick={(e) => {
            e.stopPropagation();
            stepPrev();
          }}
          title="Previous Item"
          className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          title={isPlaying ? 'Pause Auto-Reel' : 'Play Auto-Reel'}
          className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            stepNext();
          }}
          title="Next Item"
          className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <span className="text-[10px] font-mono text-neutral-500 pl-1">
          {((currentIndex % total) + total) % total + 1} / {total}
        </span>
      </div>
    </div>
  );
};
