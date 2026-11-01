/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { NguyenLandingShowcase } from './components/NguyenLandingShowcase';
import { LiveFeedView } from './components/LiveFeedView';
import { ParetoFrontierView } from './components/ParetoFrontierView';
import { ModelComparisonView } from './components/ModelComparisonView';
import { BiasFairnessView } from './components/BiasFairnessView';
import { AblationStatsView } from './components/AblationStatsView';
import { AiFactCheckInspector } from './components/AiFactCheckInspector';
import { SourceCredibilityDashboard } from './components/SourceCredibilityDashboard';
import { BENCHMARK_ARTICLES, BENCHMARK_USER_PERSONAS, DEFAULT_WEIGHTS } from './data/mindSmallDataset';
import { UserPersona, MultiObjectiveWeights, NewsArticle, ScoredArticle } from './types';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { LiveBreakingNewsTicker } from './components/LiveBreakingNewsTicker';
import { ArticleReaderModal } from './components/ArticleReaderModal';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { SocialWireFeed } from './components/SocialWireFeed';
import { UserProfileDashboard, DashboardSubTab } from './components/UserProfileDashboard';
import { ChatPartner } from './components/PrivateMessengerView';
import {
  initGlobalBackNavigation,
  triggerLayeredBack,
  safePushHistoryState,
} from './utils/backNavigation';

import { ScrollToTopButton } from './components/ScrollToTopButton';
import { GeminiChatbotDrawer } from './components/GeminiChatbotDrawer';
import { Box, ArrowLeft } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import PromoteHeader from './ruixenui/promote-header';
import { RuixenGradientFooter } from '@/registry/ruixenui/ruixen-gradient-footer';

const TAB_LABELS: Record<ActiveTab, string> = {
  overview: 'Overview',
  feed: 'Ranked News Feed',
  wire: 'Social Wire',
  profile: 'Analyst Profile',
  sources: 'Source Registry',
  pareto: 'Pareto Frontier',
  comparison: '7 Baselines',
  fairness: 'Bias & Fairness',
  ablation: 'Ablation & Stats',
  factcheck: 'AI Fact-Check',
};

function MainApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [feedCategoryFilter, setFeedCategoryFilter] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<UserPersona>(BENCHMARK_USER_PERSONAS[0]);
  const [weights, setWeights] = useState<MultiObjectiveWeights>(DEFAULT_WEIGHTS);
  const { saveCustomWeights, logReadingSessionToDb } = useFirebase();

  // NewsAPI.org Live Feed & Auto-Update state with Region support
  const [articles, setArticles] = useState<NewsArticle[]>(BENCHMARK_ARTICLES);
  const [newsSourceMode, setNewsSourceMode] = useState<'newsapi' | 'benchmark'>('newsapi');
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('us');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(Date.now());
  const [secondsSinceLastSync, setSecondsSinceLastSync] = useState(0);
  const [selectedReaderArticle, setSelectedReaderArticle] = useState<ScoredArticle | null>(null);
  const [repostDraftArticle, setRepostDraftArticle] = useState<NewsArticle | ScoredArticle | null>(null);
  const [inspectedProfileUid, setInspectedProfileUid] = useState<string | null>(null);
  const [dashboardSubTab, setDashboardSubTab] = useState<DashboardSubTab>('preferences');
  const [messagePartner, setMessagePartner] = useState<ChatPartner | null>(null);
  const [strictPersonalization, setStrictPersonalization] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('trustnews_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-mode');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light-mode');
      root.setAttribute('data-theme', 'dark');
    }
    try {
      window.localStorage.setItem('trustnews_theme', theme);
    } catch {
      // Ignore localStorage restrictions
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Explicit internal navigation stack so phone Back button & UI Back buttons always step back page-by-page without leaving the site
  interface NavSnapshot {
    tab: ActiveTab;
    category: string | null;
    profileUid: string | null;
    dashboardSubTab: DashboardSubTab;
  }

  const navStackRef = React.useRef<NavSnapshot[]>([]);
  const currentSnapshotRef = React.useRef<NavSnapshot>({
    tab: 'overview',
    category: null,
    profileUid: null,
    dashboardSubTab: 'preferences',
  });
  const isRestoringSnapshotRef = React.useRef<boolean>(false);

  // Parse URL parameters on initial load & initialize global mobile Back navigation sentinel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const profileUid = urlParams.get('profile');
    const wirePost = urlParams.get('wirePost');
    const tabParam = urlParams.get('tab') as ActiveTab | null;

    let initialTab: ActiveTab = 'overview';
    if (profileUid) {
      setInspectedProfileUid(profileUid);
      initialTab = 'profile';
      setActiveTab('profile');
    } else if (wirePost) {
      initialTab = 'wire';
      setActiveTab('wire');
    } else if (tabParam && TAB_LABELS[tabParam]) {
      initialTab = tabParam;
      setActiveTab(tabParam);
    }

    if (initialTab !== 'overview') {
      navStackRef.current = [
        { tab: 'overview', category: null, profileUid: null, dashboardSubTab: 'preferences' },
      ];
      currentSnapshotRef.current = {
        tab: initialTab,
        category: null,
        profileUid: profileUid || null,
        dashboardSubTab: 'preferences',
      };
    }

    initGlobalBackNavigation(() => {
      if (navStackRef.current.length > 0) {
        const prev = navStackRef.current.pop()!;
        isRestoringSnapshotRef.current = true;
        currentSnapshotRef.current = prev;
        setActiveTab(prev.tab);
        setFeedCategoryFilter(prev.category);
        setInspectedProfileUid(prev.profileUid);
        setDashboardSubTab(prev.dashboardSubTab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          isRestoringSnapshotRef.current = false;
        }, 50);
        return true;
      }

      if (currentSnapshotRef.current.tab !== 'overview') {
        const rootSnap: NavSnapshot = {
          tab: 'overview',
          category: null,
          profileUid: null,
          dashboardSubTab: 'preferences',
        };
        isRestoringSnapshotRef.current = true;
        currentSnapshotRef.current = rootSnap;
        setActiveTab('overview');
        setFeedCategoryFilter(null);
        setInspectedProfileUid(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          isRestoringSnapshotRef.current = false;
        }, 50);
        return true;
      }

      return false;
    });
  }, []);

  // Push navigation state whenever activeTab, feedCategoryFilter, inspectedProfileUid, or dashboardSubTab changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prevSnap = currentSnapshotRef.current;
    const hasChanged =
      prevSnap.tab !== activeTab ||
      (prevSnap.category ?? null) !== (feedCategoryFilter ?? null) ||
      (prevSnap.profileUid ?? null) !== (inspectedProfileUid ?? null) ||
      (activeTab === 'profile' && prevSnap.dashboardSubTab !== dashboardSubTab);

    if (!hasChanged) return;

    if (!isRestoringSnapshotRef.current) {
      navStackRef.current = [...navStackRef.current.slice(-25), prevSnap];
    }

    currentSnapshotRef.current = {
      tab: activeTab,
      category: feedCategoryFilter ?? null,
      profileUid: inspectedProfileUid ?? null,
      dashboardSubTab,
    };

    try {
      const url = new URL(window.location.href);
      if (activeTab === 'overview') {
        url.searchParams.delete('tab');
        url.searchParams.delete('page');
        url.searchParams.delete('profile');
      } else {
        url.searchParams.set('tab', activeTab);
        if (activeTab !== 'feed') {
          url.searchParams.delete('page');
        }
        if (activeTab === 'profile' && inspectedProfileUid) {
          url.searchParams.set('profile', inspectedProfileUid);
        } else {
          url.searchParams.delete('profile');
        }
      }

      safePushHistoryState(
        {
          tab: activeTab,
          category: feedCategoryFilter ?? null,
          profileUid: inspectedProfileUid ?? null,
          dashboardSubTab,
        },
        url.toString()
      );
    } catch {
      // Ignore URL manipulation issues in sandboxed frames
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, feedCategoryFilter, inspectedProfileUid, dashboardSubTab]);

  const handleStepBack = () => {
    const handled = triggerLayeredBack();
    if (!handled) {
      setActiveTab('overview');
      setFeedCategoryFilter(null);
      setInspectedProfileUid(null);
    }
  };

  const fetchLiveNews = async (category = 'all', searchQuery = '', force = false, region = selectedRegion) => {
    setIsLiveLoading(true);
    try {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category.toLowerCase());
      if (searchQuery) params.append('q', searchQuery);
      if (force) {
        params.append('force', 'true');
        params.append('_cb', Date.now().toString());
      }
      if (region) params.append('region', region.toLowerCase());
      params.append('pageSize', '100');

      const res = await fetch(`/api/news?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'ok' && Array.isArray(data.articles) && data.articles.length > 0) {
        const seenTitles = new Set<string>();
        const seenIds = new Set<string>();
        const uniqueArticles: NewsArticle[] = [];

        for (const art of data.articles) {
          const normTitle = (art.title || '')
            .toLowerCase()
            .replace(/\s*-\s*[^-]+$/, '')
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 80);

          if (!normTitle || seenTitles.has(normTitle) || seenIds.has(art.id)) {
            continue;
          }
          seenTitles.add(normTitle);
          seenIds.add(art.id);
          uniqueArticles.push(art);
        }

        setArticles(uniqueArticles);
        setNewsSourceMode('newsapi');
        setLastSyncTimestamp(Date.now());
        setSecondsSinceLastSync(0);
      } else {
        // Fallback to benchmark
        setArticles(BENCHMARK_ARTICLES);
      }
    } catch (err: any) {
      console.warn('NewsAPI fetch error, fallback to benchmark:', err);
      setArticles(BENCHMARK_ARTICLES);
    } finally {
      setIsLiveLoading(false);
    }
  };

  // Initial fetch from NewsAPI.org on mount
  useEffect(() => {
    fetchLiveNews();
  }, []);

  // 1-second elapsed counter for "Synced Xs ago"
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceLastSync(Math.floor((Date.now() - lastSyncTimestamp) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncTimestamp]);

  // Periodic 60-second auto-update from NewsAPI with selected region
  useEffect(() => {
    if (!autoSyncEnabled || newsSourceMode !== 'newsapi') return;

    const interval = setInterval(() => {
      fetchLiveNews(feedCategoryFilter || 'all', '', true, selectedRegion);
    }, 60000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, newsSourceMode, feedCategoryFilter, selectedRegion]);

  const handleUpdateWeights = (newWeights: MultiObjectiveWeights) => {
    setWeights(newWeights);
    saveCustomWeights(newWeights);
  };

  const handleNavigateTab = (tab: ActiveTab, category?: string) => {
    setActiveTab(tab);
    if (category !== undefined) {
      setFeedCategoryFilter(category);
      if (newsSourceMode === 'newsapi') {
        fetchLiveNews(category);
      }
    }
  };

  const handleLogInteraction = (articleId: string, dwellSec: number, feedback: 'positive' | 'negative' | 'flagged' | null) => {
    const art = articles.find(a => a.id === articleId);
    if (!art) return;
    const completionRatio = Math.min(1.0, dwellSec / Math.max(1, art.expectedReadTimeSec));
    logReadingSessionToDb(art.id, art.title, art.publisher, dwellSec, completionRatio, feedback);
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans selection:bg-neutral-800">
      {/* Top Promotional Header (Ruixen UI PromoteHeader) */}
      <PromoteHeader
        badge="LIVE NEWSAPI"
        title="Live NewsAPI.org Wire Connected:"
        highlightText="Real-Time Global Headlines Evaluated with TrustAware Multi-Objective Ranking"
        actionText="View Live Feed"
        onAction={() => handleNavigateTab('feed')}
        statsText="Auto-Updating Live Wire"
      />

      {/* Top Bar Navigation matching Nguyen aesthetic with Universal Search */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'feed') {
            setFeedCategoryFilter(null);
          }
          if (tab === 'profile') {
            setInspectedProfileUid(null);
          }
        }}
        canGoBack={activeTab !== 'overview' || isSearchOpen || Boolean(selectedReaderArticle)}
        onStepBack={handleStepBack}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        selectedPersona={selectedPersona}
        personas={BENCHMARK_USER_PERSONAS}
        onSelectPersona={setSelectedPersona}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenMessages={() => {
          setInspectedProfileUid(null);
          setDashboardSubTab('messages');
          setActiveTab('profile');
        }}
        onOpenNotifications={() => {
          setInspectedProfileUid(null);
          setDashboardSubTab('notifications');
          setActiveTab('profile');
        }}
        onSelectNotification={(notif) => {
          if (notif.type === 'message') {
            setInspectedProfileUid(null);
            setMessagePartner({
              uid: notif.senderId,
              displayName: notif.senderName,
              handle: notif.senderHandle,
              photoURL: notif.senderPhoto,
            });
            setDashboardSubTab('messages');
            setActiveTab('profile');
          } else {
            setActiveTab('wire');
          }
        }}
      />

      {/* Real-time Breaking News Ticker Strip */}
      <LiveBreakingNewsTicker
        articles={articles}
        isLiveLoading={isLiveLoading}
        onRefresh={() => fetchLiveNews(feedCategoryFilter || 'all', '', true, selectedRegion)}
        onSelectArticle={(article) => {
          // Cast to ScoredArticle if necessary
          const scored = article as ScoredArticle;
          if (!scored.computedScores) {
            scored.computedScores = {
              relevance: 0.8,
              engagement: 0.8,
              satisfaction: 0.8,
              credibility: article.sourceReliability,
              diversityContribution: 0.5,
              novelty: 0.6,
              finalRankScore: 0.85,
              rank: 1,
              decomposed: { relevancePt: 0.3, credibilityPt: 0.3, satisfactionPt: 0.2, diversityPt: 0.1, noveltyPt: 0.1, clickbaitPenaltyPt: 0 }
            };
          }
          setSelectedReaderArticle(scored);
        }}
        secondsSinceLastSync={secondsSinceLastSync}
        autoSyncEnabled={autoSyncEnabled}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Step-by-Step Back Navigation Bar for Sub-Pages */}
        {activeTab !== 'overview' && (
          <div className="mb-4 flex items-center justify-between gap-2">
            <button
              onClick={handleStepBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white transition-all cursor-pointer shadow-xs"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
              <button
                onClick={() => handleNavigateTab('overview')}
                className="hover:text-neutral-300 transition-colors cursor-pointer"
              >
                Overview
              </button>
              <span>/</span>
              <span className="text-neutral-300 font-semibold">{TAB_LABELS[activeTab]}</span>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <NguyenLandingShowcase
            onNavigateTab={handleNavigateTab}
            articles={articles}
            onSelectArticle={(scored) => setSelectedReaderArticle(scored)}
          />
        )}

        {activeTab === 'feed' && (
          <LiveFeedView
            articles={articles}
            user={selectedPersona}
            weights={weights}
            onUpdateWeights={handleUpdateWeights}
            selectedCategory={feedCategoryFilter}
            onSelectCategory={(cat) => {
              setFeedCategoryFilter(cat);
              if (newsSourceMode === 'newsapi') {
                fetchLiveNews(cat || 'all', '', false, selectedRegion);
              }
            }}
            selectedRegion={selectedRegion}
            onSelectRegion={(reg) => {
              setSelectedRegion(reg);
              fetchLiveNews(feedCategoryFilter || 'all', '', true, reg);
            }}
            newsSourceMode={newsSourceMode}
            onToggleNewsSource={(mode) => {
              setNewsSourceMode(mode);
              if (mode === 'benchmark') {
                setArticles(BENCHMARK_ARTICLES);
              } else {
                fetchLiveNews(feedCategoryFilter || 'all', '', true, selectedRegion);
              }
            }}
            onRefreshLiveNews={(category, query) => fetchLiveNews(category, query, true, selectedRegion)}
            isLiveLoading={isLiveLoading}
            secondsSinceLastSync={secondsSinceLastSync}
            autoSyncEnabled={autoSyncEnabled}
            onToggleAutoSync={() => setAutoSyncEnabled(!autoSyncEnabled)}
            onRepostArticle={(art) => {
              setRepostDraftArticle(art);
              setActiveTab('wire');
            }}
            personas={BENCHMARK_USER_PERSONAS}
            onSelectPersona={(persona) => {
              setSelectedPersona(persona);
            }}
            strictPersonalization={strictPersonalization}
            onToggleStrictPersonalization={(enabled) => {
              setStrictPersonalization(enabled);
            }}
          />
        )}

        {activeTab === 'wire' && (
          <SocialWireFeed
            onOpenReader={(art) => {
              const scored = art as ScoredArticle;
              if (!scored.computedScores) {
                scored.computedScores = {
                  relevance: 0.8,
                  engagement: 0.8,
                  satisfaction: 0.8,
                  credibility: art.credibilityScore ?? art.sourceReliability ?? 0.8,
                  diversityContribution: 0.5,
                  novelty: 0.6,
                  finalRankScore: 0.85,
                  rank: 1,
                  decomposed: { relevancePt: 0.3, credibilityPt: 0.3, satisfactionPt: 0.2, diversityPt: 0.1, noveltyPt: 0.1, clickbaitPenaltyPt: 0 },
                };
              }
              setSelectedReaderArticle(scored);
            }}
            onViewProfile={(uid) => {
              setInspectedProfileUid(uid);
              setDashboardSubTab('reposts');
              setActiveTab('profile');
            }}
            onMessageUser={(partner) => {
              setInspectedProfileUid(null);
              setMessagePartner(partner);
              setDashboardSubTab('messages');
              setActiveTab('profile');
            }}
            repostDraftArticle={repostDraftArticle}
            onClearRepostDraft={() => setRepostDraftArticle(null)}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfileDashboard
            initialUserId={inspectedProfileUid}
            initialDashboardTab={dashboardSubTab}
            initialMessagePartner={messagePartner}
            onOpenReader={(art) => {
              const scored = art as ScoredArticle;
              if (!scored.computedScores) {
                scored.computedScores = {
                  relevance: 0.8,
                  engagement: 0.8,
                  satisfaction: 0.8,
                  credibility: art.credibilityScore ?? 0.8,
                  diversityContribution: 0.5,
                  novelty: 0.6,
                  finalRankScore: 0.85,
                  rank: 1,
                  decomposed: { relevancePt: 0.3, credibilityPt: 0.3, satisfactionPt: 0.2, diversityPt: 0.1, noveltyPt: 0.1, clickbaitPenaltyPt: 0 },
                };
              }
              setSelectedReaderArticle(scored);
            }}
            onOpenWireWithRepost={(art) => {
              setRepostDraftArticle(art);
              setActiveTab('wire');
            }}
            onBackToFeed={() => setActiveTab('feed')}
            onNavigateWire={() => setActiveTab('wire')}
          />
        )}

        {activeTab === 'sources' && (
          <SourceCredibilityDashboard />
        )}

        {activeTab === 'pareto' && (
          <ParetoFrontierView
            articles={articles}
            user={selectedPersona}
            weights={weights}
            onUpdateWeights={handleUpdateWeights}
          />
        )}

        {activeTab === 'comparison' && (
          <ModelComparisonView
            articles={BENCHMARK_ARTICLES}
            user={selectedPersona}
          />
        )}

        {activeTab === 'fairness' && (
          <BiasFairnessView
            articles={BENCHMARK_ARTICLES}
            user={selectedPersona}
          />
        )}

        {activeTab === 'ablation' && (
          <AblationStatsView
            articles={BENCHMARK_ARTICLES}
            user={selectedPersona}
          />
        )}

        {activeTab === 'factcheck' && (
          <AiFactCheckInspector />
        )}
      </main>

      {/* Global Article Reader Modal for Ticker Dispatches & Search results */}
      {selectedReaderArticle && (
        <ArticleReaderModal
          article={selectedReaderArticle}
          user={selectedPersona}
          onClose={() => setSelectedReaderArticle(null)}
          onLogInteraction={handleLogInteraction}
          onRepostArticle={(art) => {
            setRepostDraftArticle(art);
            setActiveTab('wire');
          }}
          onNextArticle={() => {
            const idx = articles.findIndex(a => a.id === selectedReaderArticle?.id);
            if (idx >= 0 && idx < articles.length - 1) {
              const nextArt = articles[idx + 1] as ScoredArticle;
              if (!nextArt.computedScores) {
                nextArt.computedScores = {
                  relevance: 0.8,
                  engagement: 0.8,
                  satisfaction: 0.8,
                  credibility: nextArt.sourceReliability,
                  diversityContribution: 0.5,
                  novelty: 0.6,
                  finalRankScore: 0.85,
                  rank: idx + 2,
                  decomposed: { relevancePt: 0.3, credibilityPt: 0.3, satisfactionPt: 0.2, diversityPt: 0.1, noveltyPt: 0.1, clickbaitPenaltyPt: 0 }
                };
              }
              setSelectedReaderArticle(nextArt);
            }
          }}
          onPrevArticle={() => {
            const idx = articles.findIndex(a => a.id === selectedReaderArticle?.id);
            if (idx > 0) {
              const prevArt = articles[idx - 1] as ScoredArticle;
              if (!prevArt.computedScores) {
                prevArt.computedScores = {
                  relevance: 0.8,
                  engagement: 0.8,
                  satisfaction: 0.8,
                  credibility: prevArt.sourceReliability,
                  diversityContribution: 0.5,
                  novelty: 0.6,
                  finalRankScore: 0.85,
                  rank: idx,
                  decomposed: { relevancePt: 0.3, credibilityPt: 0.3, satisfactionPt: 0.2, diversityPt: 0.1, noveltyPt: 0.1, clickbaitPenaltyPt: 0 }
                };
              }
              setSelectedReaderArticle(prevArt);
            }
          }}
          hasNextArticle={
            articles.findIndex(a => a.id === selectedReaderArticle?.id) < articles.length - 1
          }
          hasPrevArticle={
            articles.findIndex(a => a.id === selectedReaderArticle?.id) > 0
          }
          currentIndex={articles.findIndex(a => a.id === selectedReaderArticle?.id)}
          totalArticles={articles.length}
        />
      )}

      {/* Universal Search Modal (Spotlight Command-K Palette) */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        articles={articles}
        onSelectArticle={(art) => {
          const scored = art as ScoredArticle;
          if (!scored.computedScores) {
            scored.computedScores = {
              relevance: 0.8,
              engagement: 0.8,
              satisfaction: 0.8,
              credibility: art.sourceReliability,
              diversityContribution: 0.5,
              novelty: 0.6,
              finalRankScore: 0.85,
              rank: 1,
              decomposed: { relevancePt: 0.3, credibilityPt: 0.3, satisfactionPt: 0.2, diversityPt: 0.1, noveltyPt: 0.1, clickbaitPenaltyPt: 0 }
            };
          }
          setSelectedReaderArticle(scored);
        }}
        onSearchNewsApi={(query) => {
          fetchLiveNews(feedCategoryFilter || 'all', query, true, selectedRegion);
          setActiveTab('feed');
        }}
        onNavigateTab={(tab) => {
          handleNavigateTab(tab);
        }}
        currentRegion={selectedRegion}
        onSelectRegion={(reg) => {
          setSelectedRegion(reg);
          fetchLiveNews(feedCategoryFilter || 'all', '', true, reg);
        }}
      />

      {/* Modern Multi-Column Footer with RuixenGradientFooter Dia Rainbow Glow Effect */}
      <RuixenGradientFooter gradientHeight="40vh" className="pt-12 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-black font-black text-xs shadow-xs">
                <Box className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-extrabold text-white tracking-tight flex items-center">
                TrustNews
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mb-4">
              Advanced multi-objective evaluation and trust-aware ranking framework for personalized news recommendation. Mitigating clickbait, filter bubbles, and popularity bias through Pareto optimization.
            </p>
            <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>MIND-Small Benchmark Protocol Active</span>
            </div>
          </div>

          {/* Column: Interactive Views */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 font-mono">
              Framework
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Product Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('feed')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Ranked News Feed
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('sources')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Source Credibility Registry
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('pareto')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Pareto Frontier Optimizer
                </button>
              </li>
            </ul>
          </div>

          {/* Column: ML Baselines */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 font-mono">
              Baselines & Stats
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  7 Recommender Baselines
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('fairness')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Bias & Exposure Gini
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('ablation')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Ablation & Paired T-Tests
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('factcheck')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Gemini AI Fact-Checker
                </button>
              </li>
            </ul>
          </div>

          {/* Column: Scientific Protocol */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 font-mono">
              Protocol Specs
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-neutral-400">Temporal Dwell Decay</li>
              <li className="text-neutral-400">Intra-List Diversity (ILD)</li>
              <li className="text-neutral-400">Shannon Entropy Spread</li>
              <li className="text-neutral-400">Multi-Objective Re-Ranking</li>
              <li className="text-neutral-400">Clickbait Penalty Guard</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <div>
            &copy; {new Date().getFullYear()} TrustNews Framework. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Precision &alpha; = 0.05</span>
            <span>·</span>
            <span>Pareto Dominance Solver</span>
            <span>·</span>
            <span>Apache 2.0</span>
          </div>
        </div>
      </RuixenGradientFooter>

      {/* Floating Transparent Scroll-to-Top Button */}
      <ScrollToTopButton />

      {/* Multi-Turn Gemini Chatbot Drawer */}
      <GeminiChatbotDrawer
        articles={articles}
        selectedPersona={selectedPersona}
        weights={weights}
        activeTab={activeTab}
        onSelectArticle={(art) => {
          const scored: ScoredArticle = {
            ...art,
            computedScores: art.scores || {
              relevance: 0.88,
              engagement: 0.78,
              satisfaction: 0.85,
              credibility: art.sourceReliability || 0.9,
              diversityContribution: 0.55,
              novelty: 0.65,
              finalRankScore: 0.87,
              rank: 1,
              decomposed: {
                relevancePt: 0.3,
                credibilityPt: 0.3,
                satisfactionPt: 0.2,
                diversityPt: 0.1,
                noveltyPt: 0.1,
                clickbaitPenaltyPt: 0,
              },
            },
          };
          setSelectedReaderArticle(scored);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="trustnews_theme">
      <FirebaseProvider>
        <MainApp />
      </FirebaseProvider>
    </ThemeProvider>
  );
}
