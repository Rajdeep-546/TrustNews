import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ShieldCheck,
  Globe,
  BookOpen,
  ArrowLeft,
  Compass,
  Layers,
  MessageSquare,
  User,
  Sliders,
  BarChart3,
  Scale,
  Sparkles,
} from 'lucide-react';
import { NewsArticle } from '../types';
import { ActiveTab } from './Header';
import { useOverlayBackHandler } from '../utils/backNavigation';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: NewsArticle[];
  onSelectArticle: (article: NewsArticle) => void;
  onSearchNewsApi?: (query: string) => void;
  currentRegion?: string;
  onSelectRegion?: (region: string) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const REGIONS = [
  { id: 'us', label: 'United States', flag: '🇺🇸', short: 'US' },
  { id: 'global', label: 'Global Wire', flag: '🌐', short: 'Global' },
  { id: 'gb', label: 'United Kingdom', flag: '🇬🇧', short: 'UK' },
  { id: 'in', label: 'India', flag: '🇮🇳', short: 'India' },
  { id: 'eu', label: 'Europe', flag: '🇪🇺', short: 'EU' },
  { id: 'ca', label: 'Canada', flag: '🇨🇦', short: 'CA' },
];

const QUICK_PAGES: Array<{ id: ActiveTab; label: string; keywords: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', keywords: 'home overview landing main', icon: Compass },
  { id: 'feed', label: 'Ranked Feed', keywords: 'news feed live stream articles headlines', icon: Layers },
  { id: 'wire', label: 'Social Wire', keywords: 'wire social posts write repost comments', icon: MessageSquare },
  { id: 'profile', label: 'Dashboard & Messages', keywords: 'profile dashboard messages whatsapp notifications settings', icon: User },
  { id: 'sources', label: 'Source Registry', keywords: 'sources publishers credibility trust registry', icon: ShieldCheck },
  { id: 'pareto', label: 'Pareto Frontier', keywords: 'pareto weights optimizer multi-objective', icon: Sliders },
  { id: 'comparison', label: '7 Baselines', keywords: 'baselines models benchmark comparison mind', icon: BarChart3 },
  { id: 'fairness', label: 'Bias & Fairness', keywords: 'bias fairness gini diversity exposure', icon: Scale },
  { id: 'factcheck', label: 'AI Fact-Check', keywords: 'fact check ai verify claims audit', icon: Sparkles },
];

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  articles,
  onSelectArticle,
  onSearchNewsApi,
  currentRegion = 'us',
  onSelectRegion,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const inputRef = useRef<HTMLInputElement>(null);

  // Intercept mobile hardware/gesture Back button when search modal is open
  useOverlayBackHandler(isOpen, onClose, 'universal-search');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = ['All', 'Technology', 'Economics', 'Health', 'Science', 'Environment', 'Politics'];

  // Filter matching quick pages when user types
  const matchingPages = query.trim()
    ? QUICK_PAGES.filter(
        (p) =>
          p.label.toLowerCase().includes(query.toLowerCase()) ||
          p.keywords.toLowerCase().includes(query.toLowerCase())
      )
    : QUICK_PAGES.slice(0, 5);

  // Filter articles
  const filtered = articles.filter((art) => {
    const matchesCategory =
      selectedCategory === 'All' || art.category.toLowerCase() === selectedCategory.toLowerCase();
    if (!matchesCategory) return false;
    if (!query.trim()) return true;

    const q = query.toLowerCase();
    return (
      art.title.toLowerCase().includes(q) ||
      art.abstract.toLowerCase().includes(q) ||
      art.publisher.toLowerCase().includes(q) ||
      (art.author && art.author.toLowerCase().includes(q))
    );
  });

  const handleSelect = (art: NewsArticle) => {
    onClose();
    onSelectArticle(art);
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearchNewsApi) {
      const q = query.trim();
      onClose();
      onSearchNewsApi(q);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Universal Search"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10 max-h-[88vh] sm:max-h-[82vh]"
      >
        {/* Search Header Bar with Mobile Back & Close Controls */}
        <form
          onSubmit={handleQuerySubmit}
          className="relative flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-neutral-800 bg-neutral-900/70"
        >
          {/* Explicit Back Button (Always visible on mobile & desktop) */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700/80 text-xs font-semibold text-neutral-200 hover:text-white transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Go Back"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span>Back</span>
          </button>

          <div className="relative flex-1 flex items-center min-w-0">
            <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-2 hidden sm:block" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search news, topics, pages, or authors..."
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-hidden"
            />
          </div>

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="px-2 py-1 rounded-lg bg-neutral-800/80 text-[11px] font-mono text-neutral-300 hover:text-white cursor-pointer shrink-0"
              title="Clear search query"
            >
              Clear
            </button>
          )}

          {/* Always-visible Close (X) Button */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Close Search (ESC)"
            aria-label="Close Search"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline text-[10px] font-mono text-neutral-400">ESC</span>
          </button>
        </form>

        {/* Region, Category & Quick Page Pills Filter Bar */}
        <div className="p-3 border-b border-neutral-850 bg-neutral-950/90 space-y-2.5">
          {/* Quick Page Navigation Strip */}
          {onNavigateTab && matchingPages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 shrink-0 mr-1">
                Pages:
              </span>
              {matchingPages.map((page) => {
                const Icon = page.icon;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab(page.id);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icon className="w-3 h-3 text-sky-400" />
                    <span>{page.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Region Selector Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 shrink-0 mr-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-neutral-400" /> Region:
            </span>
            {REGIONS.map((r) => {
              const isSelected = currentRegion.toLowerCase() === r.id.toLowerCase();
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectRegion?.(r.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-mono transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black font-bold shadow-xs'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                  }`}
                >
                  <span>{r.flag}</span>
                  <span>{r.short}</span>
                </button>
              );
            })}
          </div>

          {/* Category Pills Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 shrink-0 mr-1">
              Topic:
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Results List */}
        <div className="overflow-y-auto p-3 space-y-2 max-h-[52vh] scrollbar-thin">
          {filtered.length > 0 ? (
            filtered.map((art, idx) => (
              <div
                key={`${art.id}-${idx}`}
                onClick={() => handleSelect(art)}
                className="group flex items-start gap-3 p-3 rounded-2xl bg-neutral-900/40 hover:bg-neutral-850/80 border border-neutral-850 hover:border-neutral-700 transition-all cursor-pointer"
              >
                {art.urlToImage ? (
                  <img
                    src={art.urlToImage}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-neutral-800"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-neutral-500" />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-neutral-800 text-neutral-200">
                      {art.category}
                    </span>
                    <span className="text-xs text-neutral-400 truncate">{art.publisher}</span>
                    <span className="ml-auto text-[10px] font-mono text-emerald-400 flex items-center gap-0.5 shrink-0">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {Math.round(art.sourceReliability * 100)}%
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                    {art.title}
                  </h4>

                  <p className="text-[11px] text-neutral-400 line-clamp-1 leading-relaxed">
                    {art.abstract}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-neutral-400">
                No local wire matches for &ldquo;<span className="text-white font-medium">{query}</span>&rdquo;
              </p>
              {query && onSearchNewsApi && (
                <button
                  type="button"
                  onClick={() => {
                    const q = query;
                    onClose();
                    onSearchNewsApi(q);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors cursor-pointer shadow-md"
                >
                  <Search className="w-3.5 h-3.5 text-black" />
                  <span>Search Global NewsAPI for &ldquo;{query}&rdquo;</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts & mobile Back button */}
        <div className="px-4 py-2.5 border-t border-neutral-850 bg-neutral-950 flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-neutral-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
            <span>Back to Page</span>
          </button>
          <span>{filtered.length} articles found</span>
          <div className="hidden sm:flex items-center gap-2">
            <span>
              Press <kbd className="text-neutral-400 bg-neutral-900 px-1 py-0.5 rounded">↵</kbd> to open brief
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
