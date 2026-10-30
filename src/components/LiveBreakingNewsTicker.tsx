import React, { useState, useEffect } from 'react';
import { Radio, ChevronRight, ChevronLeft, ShieldCheck, Clock, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import { NewsArticle } from '../types';

interface LiveBreakingNewsTickerProps {
  articles: NewsArticle[];
  isLiveLoading: boolean;
  onRefresh: () => void;
  onSelectArticle: (article: NewsArticle) => void;
  secondsSinceLastSync?: number;
  autoSyncEnabled?: boolean;
}

export const LiveBreakingNewsTicker: React.FC<LiveBreakingNewsTickerProps> = ({
  articles,
  isLiveLoading,
  onRefresh,
  onSelectArticle,
  secondsSinceLastSync = 0,
  autoSyncEnabled = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const breakingArticles = articles.slice(0, 8);
  const total = breakingArticles.length;

  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 6000);

    return () => clearInterval(interval);
  }, [total, isPaused]);

  if (total === 0) return null;

  const currentArticle = breakingArticles[currentIndex] || breakingArticles[0];
  const trustScore = Math.round(currentArticle.sourceReliability * 100);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative z-30 w-full max-w-7xl mx-auto px-3 sm:px-6 py-1 sm:py-1.5 select-none"
    >
      <div className="relative rounded-2xl sm:rounded-full bg-neutral-950/90 backdrop-blur-xl border border-neutral-800/90 shadow-xl shadow-black/80 px-3 sm:px-5 py-2 flex items-center justify-between gap-3 text-xs text-neutral-200">
        {/* Left: Live Tag & Current Headline */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-800/60 text-rose-300 font-mono font-bold text-[10px] uppercase tracking-wider shrink-0 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 absolute" />
            <span className="ml-1 hidden sm:inline">LIVE WIRE</span>
            <span className="ml-1 sm:hidden">LIVE</span>
          </div>

          {/* Publisher & Trust Tag */}
          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300 shrink-0 hidden md:inline-flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{currentArticle.publisher}</span>
            <span className="text-emerald-400 font-bold">({trustScore}%)</span>
          </span>

          {/* Cycling Title */}
          <div
            onClick={() => onSelectArticle(currentArticle)}
            className="truncate font-medium text-white hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5"
            title={currentArticle.title}
          >
            <span className="truncate">{currentArticle.title}</span>
            <span className="text-[10px] font-mono text-neutral-400 shrink-0 hidden lg:inline">
              · {currentArticle.publishedHoursAgo}h ago
            </span>
          </div>
        </div>

        {/* Right: Controls & Auto-Sync status */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Seconds elapsed indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {secondsSinceLastSync < 60
                ? `Synced ${secondsSinceLastSync}s ago`
                : `Synced ${Math.round(secondsSinceLastSync / 60)}m ago`}
            </span>
          </div>

          {/* Manual Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLiveLoading}
            title="Refresh Live NewsAPI Wire Now"
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLiveLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Prev / Next controls */}
          <div className="flex items-center gap-0.5 border border-neutral-800 rounded-md bg-neutral-900/60 p-0.5">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + total) % total)}
              title="Previous Headline"
              className="p-0.5 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-neutral-400">
              {currentIndex + 1}/{total}
            </span>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % total)}
              title="Next Headline"
              className="p-0.5 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveBreakingNewsTicker;
