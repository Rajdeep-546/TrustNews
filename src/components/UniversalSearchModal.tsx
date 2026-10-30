import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ShieldCheck,
  ExternalLink,
  Flame,
  Globe,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { NewsArticle } from '../types';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: NewsArticle[];
  onSelectArticle: (article: NewsArticle) => void;
  onSearchNewsApi?: (query: string) => void;
  currentRegion?: string;
  onSelectRegion?: (region: string) => void;
}

export const REGIONS = [
  { id: 'us', label: 'United States', flag: '🇺🇸', short: 'US' },
  { id: 'global', label: 'Global Wire', flag: '🌐', short: 'Global' },
  { id: 'gb', label: 'United Kingdom', flag: '🇬🇧', short: 'UK' },
  { id: 'in', label: 'India', flag: '🇮🇳', short: 'India' },
  { id: 'eu', label: 'Europe', flag: '🇪🇺', short: 'EU' },
  { id: 'ca', label: 'Canada', flag: '🇨🇦', short: 'CA' },
];

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  articles,
  onSelectArticle,
  onSearchNewsApi,
  currentRegion = 'us',
  onSelectRegion,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Filter articles
  const filtered = articles.filter((art) => {
    const matchesCategory = selectedCategory === 'All' || art.category.toLowerCase() === selectedCategory.toLowerCase();
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
    onSelectArticle(art);
    onClose();
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearchNewsApi) {
      onSearchNewsApi(query.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10 max-h-[82vh]">
        
        {/* Search Header Bar */}
        <form onSubmit={handleQuerySubmit} className="relative flex items-center px-4 py-3.5 border-b border-neutral-800 bg-neutral-900/60">
          <Search className="w-5 h-5 text-neutral-400 shrink-0 ml-1 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news, topics, wires, or authors worldwide..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-white mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-md">
            ESC
          </kbd>
        </form>

        {/* Region & Category Pills Filter Bar */}
        <div className="p-3 border-b border-neutral-850 bg-neutral-950/80 space-y-2">
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
        <div className="overflow-y-auto p-3 space-y-2 max-h-[50vh] scrollbar-thin">
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
                  onClick={() => {
                    onSearchNewsApi(query);
                    onClose();
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

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 border-t border-neutral-850 bg-neutral-950 flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <span>{filtered.length} articles found</span>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="text-neutral-400 bg-neutral-900 px-1 py-0.5 rounded">↵</kbd> to open brief</span>
          </div>
        </div>

      </div>
    </div>
  );
};
