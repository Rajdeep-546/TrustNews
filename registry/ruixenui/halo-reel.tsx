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

  // Measure container size dynamically using ResizeObserver + window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.round(rect.width || containerRef.current.clientWidth || 800);
        const height = Math.round(rect.height || containerRef.current.clientHeight || 500);
        setContainerSize({
          width: Math.max(260, width),
          height: Math.max(300, height),
        });
      }
    };

    updateSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
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

  // Drag / Touch swipe interaction with vertical scroll pass-through on phones
  const dragStartRef = useRef<{
    x: number;
    y: number;
    angle: number;
    axis: 'x' | 'y' | null;
    moved: boolean;
  } | null>(null);
  const didDragRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore right-clicks
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    didDragRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      angle: targetAngleRef.current,
      axis: null,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Determine primary gesture axis after a small threshold so vertical phone scrolling is never blocked
    if (!dragStartRef.current.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15) {
        // User is scrolling the page vertically on mobile; abort reel drag immediately
        dragStartRef.current = null;
        setIsDragging(false);
        return;
      }
      dragStartRef.current.axis = 'x';
      dragStartRef.current.moved = true;
      didDragRef.current = true;
      setIsDragging(true);
    }

    if (dragStartRef.current.axis === 'x') {
      const swipeSpan = Math.max(180, containerSize.width * 0.42);
      const deltaAngle = (dx / swipeSpan) * Math.PI;
      targetAngleRef.current = dragStartRef.current.angle + deltaAngle;
      angleRef.current = targetAngleRef.current;
      setRenderAngle(targetAngleRef.current);
    }
  };

  const handlePointerUp = () => {
    if (dragStartRef.current) {
      const wasHorizontalDrag = dragStartRef.current.moved;
      dragStartRef.current = null;
      setIsDragging(false);
      if (wasHorizontalDrag) {
        // Snap to nearest item
        const rawIndex = Math.round(-targetAngleRef.current / angleStep);
        stepTo(rawIndex);
      }
    }
  };

  // Responsive card dimensions and orbit radii across mobile, tablet, and desktop
  const isMobile = containerSize.width < 480;
  const isSmallTablet = containerSize.width >= 480 && containerSize.width < 768;
  const cardScaleFactor = isMobile ? 0.68 : isSmallTablet ? 0.82 : 1;

  const effectiveCardWidth = Math.round(cardWidth * cardScaleFactor);
  const effectiveCardHeight = Math.round(cardHeight * cardScaleFactor);

  // Reserve bottom space for navigation controls and top padding so cards never clip or overlap controls
  const bottomControlsReserve = isMobile ? 52 : 60;
  const topPad = isMobile ? 14 : 20;
  const availHeight = Math.max(200, containerSize.height - bottomControlsReserve - topPad);

  const midScale = minScale + (1 - minScale) * 0.5;
  const horizontalMargin = (effectiveCardWidth * midScale) / 2 + (isMobile ? 10 : 22);
  const rx = Math.max(
    72,
    Math.min(containerSize.width / 2 - horizontalMargin, 420)
  );

  const maxRy = Math.max(44, (availHeight - effectiveCardHeight * 0.86) / 2);
  const desiredRy = rx * (isMobile ? 0.5 : isSmallTablet ? 0.42 : radiusYRatio);
  const ry = Math.max(44, Math.min(maxRy, desiredRy));

  const cx = containerSize.width / 2;
  const cy = topPad + availHeight / 2 - effectiveCardHeight * 0.04;

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
      style={{ touchAction: 'pan-y' }}
      className={`relative isolate w-full overflow-hidden select-none cursor-grab active:cursor-grabbing touch-pan-y flex items-center justify-center ${className}`}
      {...props}
    >
      {/* Center Label */}
      {centerLabel && (
        <div
          style={{ top: `${Math.max(16, cy - effectiveCardHeight * 0.16)}px` }}
          className="absolute inset-x-4 z-10 pointer-events-none text-center flex flex-col items-center justify-center"
        >
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

          const x = cx + rx * sinTheta - effectiveCardWidth / 2;
          const y = cy + ry * cosTheta - effectiveCardHeight / 2;

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
                if (didDragRef.current) {
                  didDragRef.current = false;
                  return;
                }
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
                width: `${effectiveCardWidth}px`,
                height: `${effectiveCardHeight}px`,
                transform: `scale(${scale})`,
                opacity,
                zIndex,
                pointerEvents: 'auto',
                touchAction: 'pan-y',
                transition: isDragging ? 'none' : 'box-shadow 0.3s ease, border-color 0.3s ease',
              }}
              className={`halo-reel-card rounded-2xl overflow-hidden shadow-2xl cursor-pointer border select-none touch-pan-y transition-all ${
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
              <div className="absolute top-1.5 sm:top-2 inset-x-1.5 sm:inset-x-2 flex items-center justify-between gap-1 pointer-events-none">
                {item.category && (
                  <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[8px] sm:text-[10px] font-mono font-semibold text-white border border-white/20 truncate max-w-[70px] sm:max-w-[90px]">
                    {item.category}
                  </span>
                )}
                {item.trustScore !== undefined && (
                  <span className="px-1 sm:px-1.5 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md text-[8px] sm:text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {item.trustScore}%
                  </span>
                )}
                {item.badge && !item.trustScore && (
                  <span className="px-1 sm:px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[8px] sm:text-[9px] font-mono font-semibold text-white border border-white/30 truncate shrink-0">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Bottom Details Card Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-2 sm:p-2.5 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none flex flex-col justify-end">
                {item.subtitle && (
                  <div className="text-[8px] sm:text-[10px] font-mono text-neutral-400 line-clamp-1 mb-0.5">
                    {item.subtitle}
                  </div>
                )}
                <div className="text-[10px] sm:text-xs font-bold text-white leading-tight line-clamp-2 drop-shadow-xs">
                  {item.title || item.alt || `Category ${index + 1}`}
                </div>

                {/* Click Action Indicator */}
                <div className="mt-1 sm:mt-1.5 pt-1 border-t border-white/10 hidden sm:flex items-center justify-between text-[10px] font-medium text-neutral-300 group-hover:text-white transition-colors">
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
      <div className="absolute bottom-3 sm:bottom-4 z-30 flex items-center gap-2 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 rounded-full px-3 py-1 sm:py-1.5 shadow-lg">
        <button
          type="button"
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
          type="button"
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
          type="button"
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

