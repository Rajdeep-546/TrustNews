import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sliders,
  BarChart3,
  Scale,
  Layers,
  Sparkles,
  Compass,
  ArrowRight,
  Search,
  MessageSquare
} from 'lucide-react';
import { UserPersona } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import { AccountMenu } from '@/registry/ruixenui/account-menu';
import { ToolbarDock, ToolbarDockItem } from '@/registry/ruixenui/toolbar-dock';
import { AuthModal } from './AuthModal';

export type ActiveTab = 'overview' | 'feed' | 'wire' | 'profile' | 'sources' | 'pareto' | 'comparison' | 'fairness' | 'ablation' | 'factcheck';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedPersona?: UserPersona;
  personas?: UserPersona[];
  onSelectPersona?: (persona: UserPersona) => void;
  onOpenSearch?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  accentClass?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Compass },
  { id: 'feed', label: 'Ranked Feed', icon: Layers, badge: 'LIVE', badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  { id: 'wire', label: 'Social Wire', icon: MessageSquare, badge: 'X-FEED', badgeColor: 'bg-sky-500/20 text-sky-400 border border-sky-500/30', accentClass: 'text-sky-400' },
  { id: 'sources', label: 'Source Registry', icon: ShieldCheck, accentClass: 'text-emerald-400' },
  { id: 'pareto', label: 'Pareto Frontier', icon: Sliders },
  { id: 'comparison', label: '7 Baselines', icon: BarChart3 },
  { id: 'fairness', label: 'Bias & Fairness', icon: Scale },
  { id: 'ablation', label: 'Ablation & Stats', icon: Layers },
  { id: 'factcheck', label: 'AI Fact-Check', icon: Sparkles, accentClass: 'text-indigo-400' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  selectedPersona,
  personas = [],
  onSelectPersona,
  onOpenSearch,
}) => {
  const { currentUser, signIn, signOutUser, savedAudits } = useFirebase();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Global keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const dockItems: ToolbarDockItem[] = NAV_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    icon: <item.icon className="w-4 h-4" />,
    badge: item.badge,
    badgeColor: item.badgeColor,
    active: activeTab === item.id,
    onClick: () => onTabChange(item.id),
  }));

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-800/90 text-neutral-100">
      {/* Top Navbar Row: Responsive Brand Logo, Universal Search, Account Menu, and Actions */}
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-2.5">
        {/* Brand Mark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => onTabChange('overview')}
            className="flex items-center gap-2 sm:gap-2.5 text-left cursor-pointer group"
          >
            {/* Geometric Diamond Mark */}
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-black font-black text-sm shadow-xs transition-transform group-hover:scale-105 shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-black"
              >
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 8.5 12 2" />
                <line x1="12" y1="22" x2="12" y2="15.5" />
                <polyline points="22 8.5 12 15.5 2 8.5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                TrustNews <span className="text-xs px-1.5 py-0.5 rounded font-mono font-medium bg-neutral-900 border border-neutral-700 text-cyan-400">MOO</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-tight -mt-0.5 hidden sm:block">
                Multi-Objective News Intelligence
              </span>
            </div>
          </button>
        </div>

        {/* Universal Search Bar - Responsively Adapts on Phone View */}
        <div className="flex-1 max-w-[170px] sm:max-w-md mx-1 sm:mx-6 flex items-center">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/90 text-neutral-400 hover:text-white hover:border-neutral-700 text-xs transition-all cursor-pointer shadow-xs"
            title="Universal Search (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate text-[11px] text-neutral-400 hidden xs:inline">Search news &amp; wires...</span>
            <span className="truncate text-[11px] text-neutral-400 xs:hidden">Search...</span>
            <kbd className="ml-auto hidden sm:inline-block text-[10px] font-mono text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700/60">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Section: Ruixen UI AccountMenu and Launch Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Ruixen UI Account Menu (Real Google / Firebase Authentication) */}
          <AccountMenu
            user={
              currentUser
                ? {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                    verified: currentUser.emailVerified,
                  }
                : null
            }
            onSignIn={() => signIn()}
            onSignUp={() => signIn()}
            onSignOut={signOutUser}
            onNavigateTab={(tab) => onTabChange(tab as ActiveTab)}
            savedAuditsCount={savedAudits?.length || 0}
          />

          {/* High-Contrast Quick Launch Button - Shown on Desktop/Tablet to avoid crowding on mobile phone view */}
          {activeTab === 'overview' ? (
            <button
              onClick={() => onTabChange('feed')}
              className="hidden md:inline-flex px-3.5 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-full transition-colors items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs"
            >
              <span>Launch Feed</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={() => onTabChange('overview')}
              className="hidden md:inline-flex px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-full transition-colors items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Overview</span>
            </button>
          )}
        </div>
      </div>

      {/* Real Auth & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Down-the-Navbar Navigation Tabs Bar */}
      <div className="border-t border-neutral-800/80 bg-neutral-950/95 backdrop-blur-md">
        {/* Desktop / Tablet View (Horizontal Tabs Bar) */}
        <div className="hidden sm:flex max-w-7xl mx-auto px-4 sm:px-6 py-2 items-center justify-between gap-3">
          <nav aria-label="Main Navigation Tabs" className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 w-full">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? `bg-neutral-800 font-semibold shadow-xs ring-1 ${
                          item.accentClass === 'text-emerald-400'
                            ? 'text-emerald-300 ring-emerald-500/30'
                            : item.accentClass === 'text-indigo-400'
                            ? 'text-indigo-300 ring-indigo-500/30'
                            : 'text-white ring-neutral-700/60'
                        }`
                      : `text-neutral-400 hover:text-white hover:bg-neutral-900/90 ${
                          item.accentClass ? `hover:${item.accentClass}` : ''
                        }`
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? item.accentClass || 'text-white'
                        : item.accentClass || 'text-neutral-400'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${item.badgeColor || 'bg-neutral-700 text-neutral-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick status indicator in fullscreen / widescreen */}
          <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-neutral-400 shrink-0 pl-3 border-l border-neutral-850">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-neutral-300 font-medium">Pareto Active</span>
          </div>
        </div>

        {/* Phone View: Ruixen UI ToolbarDock with Vertical Icons & Options */}
        <div className="sm:hidden px-3 py-1.5 w-full">
          <ToolbarDock
            items={dockItems}
            activeId={activeTab}
            onItemSelect={(id) => onTabChange(id as ActiveTab)}
            orientation="vertical"
            defaultCollapsed={true}
            title="Navigation Views"
            className="w-full"
          />
        </div>
      </div>
    </header>
  );
};
