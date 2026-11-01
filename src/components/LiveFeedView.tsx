import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShieldCheck, AlertCircle, BookOpen, HelpCircle, 
  ArrowRight, Filter, Sparkles, CheckCircle2, TrendingUp,
  Clock, ShieldAlert, SlidersHorizontal, Globe, RefreshCw,
  Search, ExternalLink, Radio, Database, LayoutGrid, List,
  ArrowUpDown, Flame, AlertTriangle, Zap, Check, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp, Bookmark, Repeat2,
  User, UserCheck, Cpu, Activity, Scale, Compass
} from 'lucide-react';
import { ToolbarDock } from '@/registry/ruixenui/toolbar-dock';
import { NewsArticle, UserPersona, BaselineModelId, MultiObjectiveWeights } from '../types';
import { runRecommendationEngine, ScoredArticle } from '../algorithms/recommenderEngines';
import { evaluateRecommendationMetrics } from '../algorithms/evaluationMetrics';
import { calculatePersonaParetoWeights } from '../algorithms/multiObjectiveOptimizer';
import { ArticleReaderModal } from './ArticleReaderModal';
import { ExplainabilityDrawer } from './ExplainabilityDrawer';
import { useFirebase } from '../context/FirebaseContext';
import { LazyScrollReveal } from './LazyScrollReveal';
import { LazyImage } from './LazyImage';
import { useOverlayBackHandler } from '../utils/backNavigation';

interface LiveFeedViewProps {
  articles: NewsArticle[];
  user: UserPersona;
  weights: MultiObjectiveWeights;
  onUpdateWeights: (weights: MultiObjectiveWeights) => void;
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
  newsSourceMode?: 'newsapi' | 'benchmark';
  onToggleNewsSource?: (mode: 'newsapi' | 'benchmark') => void;
  onRefreshLiveNews?: (category?: string, query?: string) => void;
  isLiveLoading?: boolean;
  secondsSinceLastSync?: number;
  autoSyncEnabled?: boolean;
  onToggleAutoSync?: () => void;
  onJumpToFactCheck?: (title: string, abstract: string, publisher: string) => void;
  selectedRegion?: string;
  onSelectRegion?: (region: string) => void;
  onRepostArticle?: (article: ScoredArticle) => void;
  personas?: UserPersona[];
  onSelectPersona?: (persona: UserPersona) => void;
  strictPersonalization?: boolean;
  onToggleStrictPersonalization?: (enabled: boolean) => void;
}

export type PipelineStage = 'stage_1_candidates' | 'stage_2_cred_filter' | 'stage_3_moo_scoring' | 'stage_4_mmr_diversity' | 'stage_5_final_feed';
export type ViewMode = 'grid' | 'list';
export type SortOption = 'moo' | 'credibility' | 'freshness' | 'dwell' | 'satisfaction';

const CLIENT_THEME_IMAGES: Record<string, string[]> = {
  Technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', // silicon wafer
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', // neural wave
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80', // cybersecurity
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80', // robotics
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80', // photonics
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80', // logistics containers
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80', // server racks
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80', // hardware workstation
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80', // dark tech lines
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80', // engineer coding
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80', // datacenters
    'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1200&q=80', // quantum processor
  ],
  Science: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80', // earth from space
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80', // fossil specimen
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80', // deep space galaxy
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80', // laser optics
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80', // molecular lab
    'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80', // planetary rover
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80', // atmospheric horizon
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80', // observatory dome
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80', // cell biology microscope
  ],
  Environment: [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80', // alpine valley
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80', // offshore wind turbines
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80', // desert solar farm
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80', // ocean reef
    'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=1200&q=80', // glacial ice floes
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80', // forest canopy
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80', // seedling growth
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', // ancient sequoia
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', // golden meadow sunset
  ],
  Health: [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80', // clinical setting
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', // oncology lab
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80', // pharmaceutical pipette
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80', // genetics dna research
    'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80', // health analytics
    'https://images.unsplash.com/photo-1583912267670-6575ad472688?auto=format&fit=crop&w=1200&q=80', // immunology research
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80', // medical doctor consultation
  ],
  Economics: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80', // market trading screens
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80', // corporate skyscraper
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80', // stock trading floor
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80', // central banking hall
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80', // currency exchange
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=80', // boardroom analytics
  ],
  Politics: [
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80', // government dome
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80', // courthouse gavel
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80', // diplomacy summit
    'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80', // parliament assembly
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80', // civic voting
  ],
  Culture: [
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80', // museum atrium
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80', // theater stage
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80', // fine art installation
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', // festival lights
  ]
};

function getArticleDisplayImage(article: { title: string; category: string; id: string; urlToImage?: string }, index: number = 0): string {
  if (article.urlToImage && article.urlToImage.startsWith('http') && !article.urlToImage.includes('placeholder')) {
    return article.urlToImage;
  }
  const pool = CLIENT_THEME_IMAGES[article.category] || CLIENT_THEME_IMAGES.Technology;
  let hash = 0;
  const str = (article.title || '') + (article.id || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return pool[Math.abs(hash + index * 5) % pool.length];
}

function getFallbackImage(category: string, index: number = 0): string {
  const pool = CLIENT_THEME_IMAGES[category] || CLIENT_THEME_IMAGES.Technology;
  return pool[(index * 3 + 1) % pool.length];
}

export const LiveFeedView: React.FC<LiveFeedViewProps> = ({
  articles,
  user,
  weights,
  onUpdateWeights,
  selectedCategory = null,
  onSelectCategory,
  newsSourceMode = 'newsapi',
  onToggleNewsSource,
  onRefreshLiveNews,
  isLiveLoading = false,
  secondsSinceLastSync = 0,
  autoSyncEnabled = true,
  onToggleAutoSync,
  onJumpToFactCheck,
  selectedRegion = 'us',
  onSelectRegion,
  onRepostArticle,
  personas = [],
  onSelectPersona,
  strictPersonalization,
  onToggleStrictPersonalization,
}) => {
  const { logReadingSessionToDb, saveArticle, removeSavedArticle, isArticleSaved } = useFirebase();
  const [activeModel, setActiveModel] = useState<BaselineModelId>('trustaware_moo');
  const [activeStage, setActiveStage] = useState<PipelineStage>('stage_5_final_feed');
  const [selectedArticleForRead, setSelectedArticleForRead] = useState<ScoredArticle | null>(null);
  const [selectedArticleForExplain, setSelectedArticleForExplain] = useState<ScoredArticle | null>(null);
  const [interactionNotice, setInteractionNotice] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(selectedCategory);
  const [searchInput, setSearchInput] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('moo');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // Strict Personalization state (prop-controlled or fallback internal state)
  const [internalStrict, setInternalStrict] = useState<boolean>(true);
  const isStrict = strictPersonalization ?? internalStrict;
  const handleToggleStrict = (val: boolean) => {
    if (onToggleStrictPersonalization) {
      onToggleStrictPersonalization(val);
    } else {
      setInternalStrict(val);
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageHistory, setPageHistory] = useState<number[]>([]);
  const [pageSize, setPageSize] = useState<number>(6);
  const [pageJumpInput, setPageJumpInput] = useState<string>('');
  const feedContainerRef = useRef<HTMLDivElement>(null);

  const navigateToFeedPage = (targetPage: number) => {
    if (targetPage === currentPage) return;
    setPageHistory((prev) => [...prev.slice(-15), currentPage]);
    setCurrentPage(targetPage);
  };

  // Intercept Back presses to step back page-by-page within the feed before leaving the feed tab
  useOverlayBackHandler(
    pageHistory.length > 0,
    () => {
      setPageHistory((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const previousPage = next.pop() ?? 1;
        setCurrentPage(previousPage);
        return next;
      });
    },
    `feed-page-${pageHistory.length}`
  );

  // Sync category filter if prop changes
  useEffect(() => {
    if (selectedCategory !== undefined) {
      setCategoryFilter(selectedCategory);
    }
  }, [selectedCategory]);

  // Reset to page 1 whenever filters or search query change
  useEffect(() => {
    setCurrentPage(1);
    setPageHistory([]);
  }, [categoryFilter, searchInput, sortBy, activeStage, activeModel]);

  // Strict deduplication by normalized title and ID
  const deduplicatedArticles = useMemo(() => {
    const seenTitles = new Set<string>();
    const seenIds = new Set<string>();
    return articles.filter((art) => {
      const norm = (art.title || '')
        .toLowerCase()
        .replace(/\s*-\s*[^-]+$/, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 80);
      if (!norm || seenTitles.has(norm) || seenIds.has(art.id)) {
        return false;
      }
      seenTitles.add(norm);
      seenIds.add(art.id);
      return true;
    });
  }, [articles]);

  // Dynamically calculate effective Pareto weights based on Strict Personalization mode
  const effectiveWeights = useMemo(() => {
    if (isStrict) {
      return calculatePersonaParetoWeights(user);
    }
    return weights;
  }, [isStrict, user, weights]);

  // Run recommendation engine on deduplicated articles using effective Pareto weights
  const rankedArticles = useMemo(() => {
    return runRecommendationEngine(activeModel, deduplicatedArticles, user, effectiveWeights);
  }, [activeModel, deduplicatedArticles, user, effectiveWeights]);

  const metrics = useMemo(() => {
    return evaluateRecommendationMetrics(rankedArticles, user, 10);
  }, [rankedArticles, user]);

  // Pipeline stage filtering simulation
  let displayedArticles = rankedArticles;
  if (activeStage === 'stage_1_candidates') {
    // Unsorted raw candidates
    displayedArticles = [...deduplicatedArticles].map((a, i) => ({
      ...a,
      computedScores: {
        relevance: 0.5,
        engagement: 0.5,
        satisfaction: 0.5,
        credibility: a.sourceReliability,
        diversityContribution: 0,
        novelty: 0.5,
        finalRankScore: 0.5,
        rank: i + 1,
        decomposed: { relevancePt: 0, credibilityPt: 0, satisfactionPt: 0, diversityPt: 0, noveltyPt: 0, clickbaitPenaltyPt: 0 }
      }
    }));
  } else if (activeStage === 'stage_2_cred_filter') {
    displayedArticles = rankedArticles;
  }

  // Calculate Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: displayedArticles.length };
    displayedArticles.forEach((a) => {
      const cat = a.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [displayedArticles]);

  // 1. Filter by category & search input
  let processedArticles = displayedArticles;
  if (categoryFilter) {
    processedArticles = processedArticles.filter(
      (a) => a.category.toLowerCase() === categoryFilter.toLowerCase()
    );
  }
  if (searchInput.trim()) {
    const q = searchInput.toLowerCase().trim();
    processedArticles = processedArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.abstract.toLowerCase().includes(q) ||
        a.publisher.toLowerCase().includes(q)
    );
  }

  // 2. Sort by selected objective
  processedArticles = useMemo(() => {
    const copy = [...processedArticles];
    if (sortBy === 'credibility') {
      return copy.sort((a, b) => b.computedScores.credibility - a.computedScores.credibility);
    }
    if (sortBy === 'freshness') {
      return copy.sort((a, b) => a.publishedHoursAgo - b.publishedHoursAgo);
    }
    if (sortBy === 'dwell') {
      return copy.sort((a, b) => b.avgObservedDwellSec - a.avgObservedDwellSec);
    }
    if (sortBy === 'satisfaction') {
      return copy.sort((a, b) => b.computedScores.satisfaction - a.computedScores.satisfaction);
    }
    return copy.sort((a, b) => b.computedScores.finalRankScore - a.computedScores.finalRankScore);
  }, [processedArticles, sortBy]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(processedArticles.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedArticles = processedArticles.slice(startIndex, startIndex + pageSize);

  // Strictly unique, non-colliding image assignment for the current paginated view
  const pageImageMap = useMemo(() => {
    const map = new Map<string, string>();
    const usedUrls = new Set<string>();

    paginatedArticles.forEach((article, idx) => {
      // 1. If article has a valid, distinct urlToImage not yet used on this page
      if (article.urlToImage && article.urlToImage.startsWith('http') && !article.urlToImage.includes('placeholder')) {
        if (!usedUrls.has(article.urlToImage)) {
          usedUrls.add(article.urlToImage);
          map.set(article.id, article.urlToImage);
          return;
        }
      }

      // 2. Pick from category theme pool ensuring no duplicate is picked on this page
      const pool = CLIENT_THEME_IMAGES[article.category] || CLIENT_THEME_IMAGES.Technology;
      let picked = pool[(startIndex + idx * 2) % pool.length];
      for (let offset = 0; offset < pool.length; offset++) {
        const candidate = pool[(startIndex + idx + offset) % pool.length];
        if (!usedUrls.has(candidate)) {
          picked = candidate;
          break;
        }
      }
      usedUrls.add(picked);
      map.set(article.id, picked);
    });

    return map;
  }, [paginatedArticles, startIndex]);

  const handleLogInteraction = (articleId: string, dwellSec: number, feedback: 'positive' | 'negative' | 'flagged' | null) => {
    const art = articles.find(a => a.id === articleId);
    if (!art) return;

    const completionRatio = Math.min(1.0, dwellSec / Math.max(1, art.expectedReadTimeSec));
    logReadingSessionToDb(art.id, art.title, art.publisher, dwellSec, completionRatio, feedback);

    let msg = `Logged ${dwellSec}s dwell time for "${art.title.slice(0, 35)}..."`;
    if (dwellSec < 10) {
      msg += ` · Quick bounce detected (-0.25 satisfaction penalty).`;
    } else {
      msg += ` · Sustained reading recorded (+0.30 satisfaction boost).`;
    }
    if (feedback === 'flagged') {
      msg += ` · User flagged as clickbait (credibility threshold lowered).`;
    }

    setInteractionNotice(msg);
    setTimeout(() => setInteractionNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Sleek Consolidated Header & Controls Bar */}
      <div className="bg-neutral-950/90 border border-neutral-850 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        {/* Top Command Line */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Feed Status & Unique Count */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live News Wire
            </span>
            <span className="text-xs text-neutral-300 font-mono">
              <strong className="text-white">{deduplicatedArticles.length}</strong> verified stories
            </span>
            <span className="text-neutral-700 hidden sm:inline">|</span>
            <span className="text-xs text-neutral-500 font-mono hidden sm:inline">
              {secondsSinceLastSync < 60 ? `${secondsSinceLastSync}s ago` : `${Math.round(secondsSinceLastSync / 60)}m ago`}
            </span>
          </div>

          {/* Right: Search, Region, Source, Refresh, Diagnostics */}
          <div className="flex items-center gap-2 flex-1 max-w-2xl justify-end flex-wrap">
            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onRefreshLiveNews?.(categoryFilter || 'all', searchInput);
              }}
              className="flex-1 min-w-[190px] flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 rounded-xl px-3 py-1.5 focus-within:border-cyan-500/50 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search headlines, topics..."
                className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none w-full"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="text-[10px] text-neutral-500 hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              )}
            </form>

            {/* Region Wire Selector */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs">
              <Globe className="w-3.5 h-3.5 text-neutral-400 mr-1.5 shrink-0" />
              <select
                value={selectedRegion || 'us'}
                onChange={(e) => onSelectRegion?.(e.target.value)}
                className="bg-transparent text-neutral-200 text-xs font-mono focus:outline-none cursor-pointer"
              >
                <option value="us" className="bg-neutral-900">🇺🇸 US Wire</option>
                <option value="global" className="bg-neutral-900">🌐 Global</option>
                <option value="gb" className="bg-neutral-900">🇬🇧 UK Wire</option>
                <option value="in" className="bg-neutral-900">🇮🇳 India</option>
                <option value="eu" className="bg-neutral-900">🇪🇺 Europe</option>
                <option value="ca" className="bg-neutral-900">🇨🇦 Canada</option>
              </select>
            </div>

            {/* Source Mode Toggle */}
            <button
              onClick={() => onToggleNewsSource?.(newsSourceMode === 'newsapi' ? 'benchmark' : 'newsapi')}
              title={`Switch source (Current: ${newsSourceMode === 'newsapi' ? 'NewsAPI.org Live' : 'MIND-Small Research'})`}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {newsSourceMode === 'newsapi' ? (
                <>
                  <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span className="hidden sm:inline">Live API</span>
                </>
              ) : (
                <>
                  <Database className="w-3 h-3 text-indigo-400" />
                  <span className="hidden sm:inline">MIND Bench</span>
                </>
              )}
            </button>

            {/* Force Refresh Button */}
            <button
              onClick={() => {
                onRefreshLiveNews?.(categoryFilter || 'all', searchInput);
                setCurrentPage(1);
                setInteractionNotice('⚡ Requesting fresh dispatches from news wires...');
                setTimeout(() => {
                  setInteractionNotice('✓ News feed refreshed with latest dispatches!');
                  setTimeout(() => setInteractionNotice(null), 3000);
                }, 1000);
              }}
              disabled={isLiveLoading}
              title="Force Refresh Live Feed (Bypass Cache)"
              className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-black ${isLiveLoading ? 'animate-spin' : ''}`} />
              <span className="font-semibold">{isLiveLoading ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {/* Collapsible ML Diagnostics Toggle */}
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              title="Toggle Research Diagnostics & Pipeline Stages"
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                showDiagnostics
                  ? 'bg-neutral-800 text-white border-neutral-700'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Diagnostics</span>
              {showDiagnostics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Clean Category Filter Tabs & Sort Row */}
        <div className="pt-3 border-t border-neutral-850/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Desktop Category Tabs */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {['All', 'Technology', 'Economics', 'Health', 'Science', 'Politics', 'Environment'].map((cat) => {
              const isActive = (cat === 'All' && !categoryFilter) || (categoryFilter?.toLowerCase() === cat.toLowerCase());
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    const newCat = cat === 'All' ? null : cat;
                    setCategoryFilter(newCat);
                    onSelectCategory?.(newCat);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-xs'
                      : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-800/80'
                  }`}
                >
                  <span>{cat}</span>
                  {count > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Phone View: Ruixen UI ToolbarDock for Categories with Vertical Options */}
          <div className="sm:hidden w-full">
            <ToolbarDock
              items={[
                { id: 'All', label: 'All Categories', icon: <Compass className="w-4 h-4 text-cyan-400" /> },
                { id: 'Technology', label: 'Technology', icon: <Cpu className="w-4 h-4 text-sky-400" /> },
                { id: 'Economics', label: 'Economics', icon: <TrendingUp className="w-4 h-4 text-amber-400" /> },
                { id: 'Health', label: 'Health', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
                { id: 'Science', label: 'Science', icon: <Sparkles className="w-4 h-4 text-indigo-400" /> },
                { id: 'Politics', label: 'Politics', icon: <Scale className="w-4 h-4 text-purple-400" /> },
                { id: 'Environment', label: 'Environment', icon: <Globe className="w-4 h-4 text-teal-400" /> },
              ].map((item) => ({
                ...item,
                badge: categoryCounts[item.id] ? `${categoryCounts[item.id]}` : undefined,
                active: (item.id === 'All' && !categoryFilter) || categoryFilter?.toLowerCase() === item.id.toLowerCase(),
                onClick: () => {
                  const newCat = item.id === 'All' ? null : item.id;
                  setCategoryFilter(newCat);
                  onSelectCategory?.(newCat);
                }
              }))}
              activeId={categoryFilter || 'All'}
              orientation="vertical"
              defaultCollapsed={true}
              title="Filter Categories"
              className="w-full"
            />
          </div>

          {/* Sort Selector & Grid/List View Switcher */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs text-neutral-400 font-mono">
              <ArrowUpDown className="w-3 h-3 text-neutral-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-white font-sans text-xs focus:outline-none cursor-pointer"
              >
                <option value="moo" className="bg-neutral-900 text-white">TrustAware Score</option>
                <option value="credibility" className="bg-neutral-900 text-white">Highest Trust</option>
                <option value="freshness" className="bg-neutral-900 text-white">Most Recent</option>
                <option value="dwell" className="bg-neutral-900 text-white">Deep Read (~m)</option>
                <option value="satisfaction" className="bg-neutral-900 text-white">Satisfaction</option>
              </select>
            </div>

            <div className="flex items-center p-0.5 bg-neutral-900 border border-neutral-800 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Strict Personalization Toggle & Persona Calibration Strip */}
        <div className="pt-3 border-t border-neutral-850/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle Switch */}
            <div className="flex items-center gap-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl px-3 py-1.5 shadow-xs">
              <Sparkles className={`w-3.5 h-3.5 ${isStrict ? 'text-emerald-400' : 'text-neutral-500'}`} />
              <span className="text-xs text-neutral-300 font-medium">Strict Personalization:</span>
              <button
                type="button"
                role="switch"
                aria-checked={isStrict}
                onClick={() => handleToggleStrict(!isStrict)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isStrict ? 'bg-emerald-500' : 'bg-neutral-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    isStrict ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isStrict ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {isStrict ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Persona Switcher Dropdown */}
            {personas && personas.length > 0 && (
              <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs">
                <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-neutral-400 text-[11px] font-mono hidden sm:inline">Active Persona:</span>
                <select
                  value={user.id}
                  onChange={(e) => {
                    const found = personas.find(p => p.id === e.target.value);
                    if (found && onSelectPersona) {
                      onSelectPersona(found);
                    }
                  }}
                  className="bg-transparent text-neutral-100 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id} className="bg-neutral-900 text-white">
                      {p.name} ({p.role.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="text-xs font-mono text-neutral-400 flex items-center gap-1.5 flex-wrap">
            <span className="text-neutral-500">Vector Mode:</span>
            <span className={isStrict ? 'text-emerald-400 font-semibold flex items-center gap-1' : 'text-neutral-300'}>
              {isStrict && <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />}
              {isStrict ? `Persona-Calibrated (${user.name})` : 'Global Custom Weights'}
            </span>
          </div>
        </div>

        {/* Dynamic Pareto Vector Breakdown Badges */}
        <div className={`p-2.5 rounded-xl border transition-all text-xs flex flex-wrap items-center justify-between gap-2.5 ${
          isStrict
            ? 'bg-neutral-900/40 border-emerald-500/20 text-neutral-300'
            : 'bg-neutral-900/20 border-neutral-800/80 text-neutral-400'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isStrict ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
            <span className="font-mono text-[11px]">
              {isStrict ? (
                <>Pareto weights dynamically adjusted for <strong className="text-white">{user.name}</strong> ({user.role}):</>
              ) : (
                <>Fixed Multi-Objective weights applied across feed:</>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
            <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 font-semibold" title="Credibility & Corroboration Weight">
              Trust &gamma;: {(effectiveWeights.gammaCredibility * 100).toFixed(0)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 font-semibold" title="Dwell Time / Long-Term Satisfaction Weight">
              Dwell &beta;: {(effectiveWeights.betaSatisfaction * 100).toFixed(0)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-500/30 font-semibold" title="Intra-List Diversity / Topic Exploration Weight">
              Diversity &delta;: {(effectiveWeights.deltaDiversity * 100).toFixed(0)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/30 font-semibold" title="Click-Through / Short-Term Relevance Weight">
              CTR &alpha;: {(effectiveWeights.alphaClick * 100).toFixed(0)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-500/30 font-semibold" title="Publisher Exposure Fairness Weight">
              Fairness &epsilon;: {(effectiveWeights.epsilonFairness * 100).toFixed(0)}%
            </span>
            <span className="px-2 py-0.5 rounded bg-sky-950/70 text-sky-300 border border-sky-500/30 font-semibold" title="Freshness / Recency Bias Weight">
              Freshness &zeta;: {(effectiveWeights.zetaFreshness * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Collapsible Research Diagnostics & ML Pipeline Stages */}
      {showDiagnostics && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="text-cyan-400 font-semibold">{user.name}</span>
                <span>·</span>
                <span>{user.role}</span>
                <span>·</span>
                <span>{user.readingPaceWpm} WPM</span>
                <span>·</span>
                <span>Bubble Risk: {Math.round(user.filterBubbleSeverity * 100)}%</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-1">
                Multi-Objective Re-Ranking Diagnostics
              </h2>
            </div>

            {/* Model Paradigm Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-mono">Model:</span>
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value as BaselineModelId)}
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="trustaware_moo">Proposed TrustAware-MOO (Pareto Re-Ranker)</option>
                <option value="click_optimized">Click-Optimized (CTR Maximizer Baseline)</option>
                <option value="hybrid_recommender">Hybrid (Relevance + Engagement)</option>
                <option value="credibility_heuristic">Credibility Heuristic (Whitelist Filter)</option>
                <option value="content_based">Content-Based (Profile Cosine)</option>
                <option value="collaborative_filtering">Collaborative Filtering</option>
                <option value="popularity">Popularity-Based (Global Clicks)</option>
              </select>
            </div>
          </div>

          {/* 5-Stage Pipeline Pills */}
          <div className="pt-3 border-t border-neutral-850">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-mono block mb-2">
              Pipeline Stages
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-neutral-900/80 rounded-xl border border-neutral-800">
              <button
                onClick={() => setActiveStage('stage_1_candidates')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors truncate cursor-pointer ${
                  activeStage === 'stage_1_candidates' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                1. Raw Candidates
              </button>
              <button
                onClick={() => setActiveStage('stage_2_cred_filter')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors truncate cursor-pointer ${
                  activeStage === 'stage_2_cred_filter' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                2. Trust Gate (&tau;&ge;0.4)
              </button>
              <button
                onClick={() => setActiveStage('stage_3_moo_scoring')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors truncate cursor-pointer ${
                  activeStage === 'stage_3_moo_scoring' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                3. Multi-Objective
              </button>
              <button
                onClick={() => setActiveStage('stage_4_mmr_diversity')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors truncate cursor-pointer ${
                  activeStage === 'stage_4_mmr_diversity' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                4. Diversity MMR
              </button>
              <button
                onClick={() => setActiveStage('stage_5_final_feed')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg text-left transition-colors truncate cursor-pointer ${
                  activeStage === 'stage_5_final_feed' ? 'bg-white text-black font-semibold shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
              >
                5. Final Feed
              </button>
            </div>
          </div>

          {/* 4 Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-mono block">NDCG@10 Accuracy</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{metrics.ndcg10.toFixed(3)}</span>
            </div>
            <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-mono block">Mean Credibility</span>
              <span className="text-lg font-bold font-mono text-cyan-400">{(metrics.meanCredibility * 100).toFixed(1)}%</span>
            </div>
            <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-mono block">Intra-List Diversity</span>
              <span className="text-lg font-bold font-mono text-white">{metrics.intraListDiversity.toFixed(3)}</span>
            </div>
            <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-mono block">Publisher Gini</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{metrics.publisherGini.toFixed(3)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Toast Notice */}
      {interactionNotice && (
        <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-neutral-200 flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{interactionNotice}</span>
          </div>
          <button
            onClick={() => setInteractionNotice(null)}
            className="text-neutral-400 hover:text-white font-mono text-[11px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Main News Feed Content: Clean Editorial Grid vs Detailed List */}
      <div ref={feedContainerRef} className="scroll-mt-28">
        {processedArticles.length === 0 ? (
          <div className="p-12 text-center bg-neutral-950 border border-neutral-800 rounded-2xl space-y-4">
            <AlertCircle className="w-8 h-8 text-neutral-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No articles matched your criteria</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Try clearing the search query or switching back to all categories.
            </p>
            <button
              onClick={() => {
                setCategoryFilter(null);
                setSearchInput('');
                onRefreshLiveNews?.('all', '');
              }}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Reset Filters &amp; Reload
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ================= CLEAN MAGAZINE GRID VIEW ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedArticles.map((article, idx) => {
              const trustPercent = Math.round(article.computedScores.credibility * 100);
              const dwellMinutes = Math.max(1, Math.round(article.avgObservedDwellSec / 60));
              const isSaved = isArticleSaved(article.id);
              const cardImage = pageImageMap.get(article.id) || getArticleDisplayImage(article, startIndex + idx);

              return (
                <LazyScrollReveal
                  key={`${article.id}-${article.title}`}
                  delayMs={(idx % 3) * 70}
                  animation="fade-up"
                  durationMs={550}
                  className="h-full"
                >
                  <article
                    onClick={() => setSelectedArticleForRead(article)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedArticleForRead(article);
                      }
                    }}
                    className="group relative rounded-2xl border border-neutral-850/80 bg-neutral-900/40 hover:bg-neutral-900/80 hover:border-neutral-700 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-0.5 text-left h-full"
                  >
                    {/* Thumbnail Image Header */}
                    <div className="relative w-full h-48 overflow-hidden bg-neutral-950">
                      <LazyImage
                        src={cardImage}
                        alt={article.title}
                        fallbackSrc={getFallbackImage(article.category, startIndex + idx)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        containerClassName="w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                    {/* Corner Badges: Category & Trust Pill */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono font-semibold text-neutral-200 border border-neutral-700/60 shadow-xs">
                        {article.category}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold backdrop-blur-md border flex items-center gap-1 shadow-xs ${
                          trustPercent >= 85
                            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                            : trustPercent >= 60
                            ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40'
                            : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{trustPercent}% Trust</span>
                      </span>
                    </div>

                    {/* Dwell time badge */}
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-mono text-neutral-300 border border-neutral-800/60 pointer-events-none">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>~{dwellMinutes}m read</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Publisher & Timestamp */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-2">
                        <span className="text-neutral-300 font-semibold truncate max-w-[170px]">
                          {article.publisher}
                        </span>
                        <span className="text-neutral-500">
                          {article.publishedHoursAgo}h ago
                        </span>
                      </div>

                      {/* Clean Bold Title */}
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug tracking-tight mb-2">
                        {article.title}
                      </h3>

                      {/* Clean Abstract */}
                      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                        {article.abstract}
                      </p>
                    </div>

                    {/* Footer Row: Clean Score & Action Buttons */}
                    <div className="pt-3 border-t border-neutral-850/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                        Rank #{article.computedScores.rank} · <strong className="text-neutral-200">Score {article.computedScores.finalRankScore.toFixed(2)}</strong>
                      </span>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {/* Save Bookmark */}
                        <button
                          onClick={async () => {
                            if (isSaved) {
                              await removeSavedArticle(article.id);
                              setInteractionNotice('Removed from saved bookmarks');
                            } else {
                              await saveArticle(article);
                              setInteractionNotice('✓ Article saved to your profile!');
                            }
                            setTimeout(() => setInteractionNotice(null), 2500);
                          }}
                          title={isSaved ? 'Remove bookmark' : 'Save article'}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-800'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400' : ''}`} />
                        </button>

                        {/* Repost to Wire */}
                        {onRepostArticle && (
                          <button
                            onClick={() => onRepostArticle(article)}
                            title="Repost to Social Wire"
                            className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-sky-400 border border-neutral-800 transition-all cursor-pointer"
                          >
                            <Repeat2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Explain button */}
                        <button
                          onClick={() => setSelectedArticleForExplain(article)}
                          title="Explain why ranked here"
                          className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition-all cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </LazyScrollReveal>
            );
            })}
          </div>
        ) : (
          /* ================= CLEAN EDITORIAL LIST VIEW ================= */
          <div className="space-y-3">
            {paginatedArticles.map((article, idx) => {
              const trustPercent = Math.round(article.computedScores.credibility * 100);
              const dwellMinutes = Math.max(1, Math.round(article.avgObservedDwellSec / 60));
              const isSaved = isArticleSaved(article.id);
              const listImage = pageImageMap.get(article.id) || getArticleDisplayImage(article, startIndex + idx);

              return (
                <LazyScrollReveal
                  key={`${article.id}-${article.title}`}
                  delayMs={(idx % 5) * 50}
                  animation="fade-up"
                  durationMs={500}
                >
                  <article
                    onClick={() => setSelectedArticleForRead(article)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedArticleForRead(article);
                      }
                    }}
                    className="group p-4 sm:p-5 rounded-2xl border border-neutral-850/80 bg-neutral-900/40 hover:bg-neutral-900/80 hover:border-neutral-700 transition-all cursor-pointer shadow-sm text-left"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Thumbnail Image */}
                        <div className="w-24 h-24 sm:w-28 sm:h-24 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shrink-0 hidden sm:block">
                          <LazyImage
                            src={listImage}
                            alt=""
                            fallbackSrc={getFallbackImage(article.category, startIndex + idx)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            containerClassName="w-full h-full"
                          />
                        </div>

                      {/* Content */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                          <span className="text-cyan-400 font-bold">#{article.computedScores.rank}</span>
                          <span>·</span>
                          <span className="text-neutral-300 font-semibold">{article.category}</span>
                          <span>·</span>
                          <span className="text-neutral-400">{article.publisher}</span>
                          <span>·</span>
                          <span>{article.publishedHoursAgo}h ago</span>
                          <span>·</span>
                          <span>~{dwellMinutes}m read</span>
                        </div>

                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 leading-snug tracking-tight">
                          {article.title}
                        </h3>

                        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 max-w-3xl">
                          {article.abstract}
                        </p>
                      </div>
                    </div>

                    {/* Right Action & Trust Column */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-850">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                        {trustPercent}% Trust
                      </span>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={async () => {
                            if (isSaved) {
                              await removeSavedArticle(article.id);
                              setInteractionNotice('Removed from saved bookmarks');
                            } else {
                              await saveArticle(article);
                              setInteractionNotice('✓ Article saved to your profile!');
                            }
                            setTimeout(() => setInteractionNotice(null), 2500);
                          }}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border-neutral-800'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400' : ''}`} />
                        </button>

                        {onRepostArticle && (
                          <button
                            onClick={() => onRepostArticle(article)}
                            className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-sky-400 border border-neutral-800 transition-all cursor-pointer"
                          >
                            <Repeat2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedArticleForExplain(article)}
                          className="p-1.5 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition-all cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </LazyScrollReveal>
            );
            })}
          </div>
        )}

        {/* ================= PAGINATION CONTROLS ================= */}
        {processedArticles.length > 0 && (
          <div className="mt-8 pt-5 border-t border-neutral-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
            {/* Summary / Range indicator */}
            <div className="text-neutral-400 text-center sm:text-left">
              Showing <strong className="text-white">{startIndex + 1}</strong> to{' '}
              <strong className="text-white">
                {Math.min(startIndex + pageSize, processedArticles.length)}
              </strong>{' '}
              of <strong className="text-cyan-400">{processedArticles.length}</strong> headlines · Page{' '}
              <strong className="text-white">{safeCurrentPage}</strong> of{' '}
              <strong className="text-white">{totalPages}</strong>
            </div>

            {/* Page navigation buttons & Page size */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* Page Size Selector */}
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-[11px] text-neutral-500">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-xs text-neutral-300 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                </select>
              </div>

              {/* Jump to First Page */}
              <button
                onClick={() => {
                  navigateToFeedPage(1);
                  feedContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                disabled={safeCurrentPage <= 1}
                title="First Page (Page 1)"
                className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-800 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Previous Page Button */}
              <button
                onClick={() => {
                  const target = Math.max(1, safeCurrentPage - 1);
                  navigateToFeedPage(target);
                  feedContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                disabled={safeCurrentPage <= 1}
                title="Previous Page"
                className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer font-medium text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 9) return true;
                    if (p === 1 || p === totalPages) return true;
                    if (Math.abs(p - safeCurrentPage) <= 2) return true;
                    return false;
                  })
                  .map((p, idx, arr) => {
                    const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-neutral-600 select-none">...</span>
                        )}
                        <button
                          onClick={() => {
                            navigateToFeedPage(p);
                            feedContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className={`w-8 h-8 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                            safeCurrentPage === p
                              ? 'bg-white text-black shadow-md'
                              : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Page Button */}
              <button
                onClick={() => {
                  const target = Math.min(totalPages, safeCurrentPage + 1);
                  navigateToFeedPage(target);
                  feedContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                disabled={safeCurrentPage >= totalPages}
                title="Next Page"
                className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer font-medium text-xs"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Jump to Last Page */}
              <button
                onClick={() => {
                  navigateToFeedPage(totalPages);
                  feedContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                disabled={safeCurrentPage >= totalPages}
                title={`Last Page (Page ${totalPages})`}
                className="w-8 h-8 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-800 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>

              {/* Direct Page Jump Input */}
              {totalPages > 3 && (
                <div className="hidden sm:flex items-center gap-1.5 ml-2 pl-2 border-l border-neutral-800">
                  <span className="text-[11px] text-neutral-500 font-mono">Go to:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageJumpInput}
                    onChange={(e) => setPageJumpInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const p = parseInt(pageJumpInput, 10);
                        if (!isNaN(p) && p >= 1 && p <= totalPages) {
                          navigateToFeedPage(p);
                          setPageJumpInput('');
                          feedContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }
                    }}
                    placeholder={String(safeCurrentPage)}
                    className="w-12 px-1.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500 text-center"
                  />
                  <button
                    onClick={() => {
                      const p = parseInt(pageJumpInput, 10);
                      if (!isNaN(p) && p >= 1 && p <= totalPages) {
                        navigateToFeedPage(p);
                        setPageJumpInput('');
                        feedContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold cursor-pointer"
                  >
                    Go
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Modals */}
      <ArticleReaderModal
        article={selectedArticleForRead}
        user={user}
        onClose={() => setSelectedArticleForRead(null)}
        onLogInteraction={handleLogInteraction}
        onNextArticle={() => {
          const idx = processedArticles.findIndex(a => a.id === selectedArticleForRead?.id);
          if (idx >= 0 && idx < processedArticles.length - 1) {
            setSelectedArticleForRead(processedArticles[idx + 1]);
          }
        }}
        onPrevArticle={() => {
          const idx = processedArticles.findIndex(a => a.id === selectedArticleForRead?.id);
          if (idx > 0) {
            setSelectedArticleForRead(processedArticles[idx - 1]);
          }
        }}
        hasNextArticle={
          selectedArticleForRead !== null &&
          processedArticles.findIndex(a => a.id === selectedArticleForRead?.id) < processedArticles.length - 1
        }
        hasPrevArticle={
          selectedArticleForRead !== null &&
          processedArticles.findIndex(a => a.id === selectedArticleForRead?.id) > 0
        }
        currentIndex={
          selectedArticleForRead
            ? processedArticles.findIndex(a => a.id === selectedArticleForRead?.id)
            : undefined
        }
        totalArticles={processedArticles.length}
        onRepostArticle={onRepostArticle}
      />

      <ExplainabilityDrawer
        article={selectedArticleForExplain}
        user={user}
        onClose={() => setSelectedArticleForExplain(null)}
      />
    </div>
  );
};

export default LiveFeedView;
