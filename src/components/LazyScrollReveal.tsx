import React, { useRef, useEffect, useState, ReactNode } from 'react';

interface LazyScrollRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  durationMs?: number;
  threshold?: number;
  rootMargin?: string;
  animation?: 'fade-up' | 'fade-in' | 'scale-up' | 'slide-right' | 'slide-left';
  once?: boolean;
}

export const LazyScrollReveal: React.FC<LazyScrollRevealProps> = ({
  children,
  className = '',
  delayMs = 0,
  durationMs = 600,
  threshold = 0.1,
  rootMargin = '0px 0px -40px 0px',
  animation = 'fade-up',
  once = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(el);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once]);

  const getHiddenClasses = () => {
    switch (animation) {
      case 'fade-in':
        return 'opacity-0';
      case 'scale-up':
        return 'opacity-0 scale-95';
      case 'slide-right':
        return 'opacity-0 -translate-x-8';
      case 'slide-left':
        return 'opacity-0 translate-x-8';
      case 'fade-up':
      default:
        return 'opacity-0 translate-y-7';
    }
  };

  const getVisibleClasses = () => {
    switch (animation) {
      case 'slide-right':
      case 'slide-left':
        return 'opacity-100 translate-x-0';
      case 'scale-up':
        return 'opacity-100 scale-100';
      case 'fade-in':
        return 'opacity-100';
      case 'fade-up':
      default:
        return 'opacity-100 translate-y-0';
    }
  };

  return (
    <div
      ref={elementRef}
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
        willChange: 'opacity, transform',
      }}
      className={`transition-all ease-[cubic-bezier(0.25,1,0.5,1)] ${
        isVisible ? getVisibleClasses() : getHiddenClasses()
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default LazyScrollReveal;
