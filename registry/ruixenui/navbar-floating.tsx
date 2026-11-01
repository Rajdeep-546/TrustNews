"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Compass,
  Layers,
  MessageSquare,
  ShieldCheck,
  Sliders,
  BarChart3,
  Scale,
  Sparkles,
  ChevronDown,
  Search,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  ExternalLink,
  Box,
  Bell,
  MessageCircle,
  Sun,
  Moon
} from "lucide-react";
import { AccountMenu } from "./account-menu";
import { NotificationsFilter } from "./notifications-filter";
import { UserNotification } from "../../src/types";
import { useOverlayBackHandler } from "../../src/utils/backNavigation";
import ThemeSwitch from "@/components/ui/theme-switch";

export type ActiveTab =
  | "overview"
  | "feed"
  | "wire"
  | "profile"
  | "sources"
  | "pareto"
  | "comparison"
  | "fairness"
  | "ablation"
  | "factcheck";

export interface FeatureOption {
  id: ActiveTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  accentColor?: string;
}

export const FEATURE_OPTIONS: FeatureOption[] = [
  {
    id: "feed",
    label: "Ranked Feed",
    description: "Multi-objective Pareto-ranked live news stream",
    icon: Layers,
    badge: "LIVE",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    accentColor: "text-emerald-400",
  },
  {
    id: "wire",
    label: "Social Wire",
    description: "Real-time dispatches, fact-check notes & debates",
    icon: MessageSquare,
    badge: "WIRE",
    badgeColor: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
    accentColor: "text-sky-400",
  },
  {
    id: "sources",
    label: "Source Registry",
    description: "Publisher credibility ratings & transparency registry",
    icon: ShieldCheck,
    accentColor: "text-emerald-400",
  },
  {
    id: "pareto",
    label: "Pareto Frontier",
    description: "Multi-objective weights & trade-off optimizer",
    icon: Sliders,
    accentColor: "text-cyan-400",
  },
  {
    id: "comparison",
    label: "7 Baselines",
    description: "MIND benchmark recommender model comparisons",
    icon: BarChart3,
    accentColor: "text-neutral-300",
  },
  {
    id: "fairness",
    label: "Bias & Fairness",
    description: "Intra-list diversity & Gini exposure metrics",
    icon: Scale,
    accentColor: "text-purple-400",
  },
  {
    id: "ablation",
    label: "Ablation & Stats",
    description: "Model component ablation & statistical significance",
    icon: Layers,
    accentColor: "text-neutral-300",
  },
  {
    id: "factcheck",
    label: "AI Fact-Check",
    description: "Gemini claim verification & audit inspector",
    icon: Sparkles,
    accentColor: "text-indigo-400",
  },
];

export interface NavbarFloatingProps {
  activeTab?: ActiveTab;
  onTabChange?: (tab: ActiveTab) => void;
  onOpenSearch?: () => void;
  currentUser?: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    verified?: boolean;
  } | null;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onSignOut?: () => void;
  savedAuditsCount?: number;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  onSelectNotification?: (notification: UserNotification) => void;
  canGoBack?: boolean;
  onStepBack?: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  className?: string;
  githubUrl?: string;
}

export const NavbarFloating: React.FC<NavbarFloatingProps> = ({
  activeTab: controlledActiveTab,
  onTabChange,
  onOpenSearch,
  currentUser = null,
  onSignIn,
  onSignUp,
  onSignOut,
  savedAuditsCount = 0,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  onOpenMessages,
  onOpenNotifications,
  onSelectNotification,
  canGoBack = false,
  onStepBack,
  theme = "dark",
  onToggleTheme,
  className = "",
  githubUrl = "https://github.com/rajdeepbaruah/trustnews-moo",
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<ActiveTab>("overview");
  const currentTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const featuresMenuRef = useRef<HTMLDivElement>(null);
  const featuresBtnRef = useRef<HTMLButtonElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);
  const notificationsBtnRef = useRef<HTMLButtonElement>(null);

  const isAnyMenuOpen = isFeaturesOpen || isNotificationsOpen || isMobileMenuOpen;

  useOverlayBackHandler(
    isAnyMenuOpen,
    () => {
      setIsFeaturesOpen(false);
      setIsNotificationsOpen(false);
      setIsMobileMenuOpen(false);
    },
    "navbar-menu"
  );

  const handleNavbarBack = () => {
    if (isAnyMenuOpen) {
      setIsFeaturesOpen(false);
      setIsNotificationsOpen(false);
      setIsMobileMenuOpen(false);
      return;
    }
    if (onStepBack) {
      onStepBack();
    } else {
      handleSelectTab("overview");
    }
  };

  const handleSelectTab = (tab: ActiveTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
    setIsFeaturesOpen(false);
    setIsNotificationsOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Close Features & Notifications dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        featuresMenuRef.current &&
        !featuresMenuRef.current.contains(e.target as Node) &&
        featuresBtnRef.current &&
        !featuresBtnRef.current.contains(e.target as Node)
      ) {
        setIsFeaturesOpen(false);
      }
      if (
        notificationsMenuRef.current &&
        !notificationsMenuRef.current.contains(e.target as Node) &&
        notificationsBtnRef.current &&
        !notificationsBtnRef.current.contains(e.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFeaturesOpen(false);
        setIsNotificationsOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isFeatureActive = currentTab !== "overview";
  const activeFeatureItem = FEATURE_OPTIONS.find((f) => f.id === currentTab);

  return (
    <nav
      className={`w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 transition-all select-none ${className}`}
      aria-label="Floating Navigation"
    >
      {/* Floating Pill Container */}
      <div className="relative rounded-2xl sm:rounded-full bg-neutral-950/90 backdrop-blur-xl border border-neutral-800/90 shadow-2xl shadow-black/80 px-3 sm:px-5 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Mark */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleSelectTab("overview")}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            {/* Isometric Box Logo Matching Footer */}
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-black font-black text-sm shadow-xs transition-transform group-hover:scale-105 shrink-0">
              <Box className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-tight text-white flex items-center">
                TrustNews
              </span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-tight -mt-0.5 hidden sm:block">
                Multi-Objective News Intelligence
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Navigation Options with Floating Features Dropdown */}
        <div className="hidden md:flex items-center gap-1.5">
          {/* Direct Overview Option */}
          <button
            onClick={() => handleSelectTab("overview")}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === "overview"
                ? "bg-white text-black font-semibold shadow-xs"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/90"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          {/* Features Dropdown Option (Floating Popover) */}
          <div className="relative">
            <button
              ref={featuresBtnRef}
              onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                isFeaturesOpen || isFeatureActive
                  ? "bg-neutral-800 text-white font-semibold ring-1 ring-neutral-700 shadow-xs"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900/90"
              }`}
              aria-expanded={isFeaturesOpen}
              aria-haspopup="true"
            >
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Features</span>
                {isFeatureActive && activeFeatureItem && (
                  <span className="text-[10px] font-mono font-normal text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/50">
                    {activeFeatureItem.label}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isFeaturesOpen ? "rotate-180 text-white" : "text-neutral-400"
                }`}
              />
            </button>

            {/* Floating Features Menu Card */}
            {isFeaturesOpen && (
              <div
                ref={featuresMenuRef}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[580px] p-3 rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-2 border-b border-neutral-800/80 mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                    TrustNews Features &amp; Modules
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    8 Algorithms Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {FEATURE_OPTIONS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = currentTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-start gap-2.5 group ${
                          isSelected
                            ? "bg-neutral-800/90 text-white border border-neutral-700 shadow-sm"
                            : "hover:bg-neutral-900/90 text-neutral-300 hover:text-white border border-transparent"
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? "bg-neutral-700 text-white"
                              : "bg-neutral-900 text-neutral-400 group-hover:text-white group-hover:bg-neutral-800"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-semibold tracking-tight truncate">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                                  item.badgeColor || "bg-neutral-700 text-neutral-300"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 leading-tight line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Search, GitHub, AccountMenu, and Quick Launch */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Universal Search Bar / Trigger */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/90 text-neutral-400 hover:text-white hover:border-neutral-700 text-xs transition-all cursor-pointer shadow-xs"
              title="Universal Search (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate text-[11px] text-neutral-400 hidden lg:inline">Search...</span>
              <kbd className="hidden xl:inline-block text-[9px] font-mono text-neutral-500 bg-neutral-800 px-1 rounded border border-neutral-700/60">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Private Messages Shortcut */}
          {onOpenMessages && (
            <button
              onClick={() => {
                setIsNotificationsOpen(false);
                onOpenMessages();
              }}
              className="relative p-1.5 sm:p-2 rounded-full border border-neutral-800 bg-neutral-900/90 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-center shadow-xs shrink-0"
              title="Private Messages"
              aria-label="Private Messages"
            >
              <MessageCircle className="w-4 h-4" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-black text-[9px] font-mono font-bold flex items-center justify-center shadow-xs">
                  {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                </span>
              )}
            </button>
          )}

          {/* Real-Time Notifications Bell & Popover */}
          <div className="relative">
            <button
              ref={notificationsBtnRef}
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative p-1.5 sm:p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center shadow-xs shrink-0 ${
                isNotificationsOpen
                  ? "bg-sky-500/20 border-sky-500/50 text-sky-400"
                  : "border-neutral-800 bg-neutral-900/90 text-neutral-400 hover:text-sky-400 hover:border-sky-500/40"
              }`}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs animate-pulse">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div
                ref={notificationsMenuRef}
                className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-3 sm:w-[440px] z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <NotificationsFilter
                  compact
                  onSelectNotification={(notif) => {
                    setIsNotificationsOpen(false);
                    if (onSelectNotification) {
                      onSelectNotification(notif);
                    }
                  }}
                />
                {onOpenNotifications && (
                  <div className="mt-1.5 flex justify-end">
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        onOpenNotifications();
                      }}
                      className="w-full py-2 rounded-xl bg-neutral-950/95 hover:bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-sky-400 hover:text-sky-300 transition-colors cursor-pointer shadow-lg"
                    >
                      Open Full Notification Center &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Theme Switch (hidden on phone view; on phone view it lives in Profile Login section) */}
          <div className="hidden md:flex items-center shrink-0">
            <ThemeSwitch
              themeOverride={theme}
              onThemeChange={(nextTheme) => {
                if (nextTheme !== theme && onToggleTheme) {
                  onToggleTheme();
                }
              }}
            />
          </div>

          {/* GitHub Repository Button with pure black silhouette SVG */}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 sm:p-1.5 rounded-full border border-neutral-800 bg-black hover:bg-neutral-900 hover:border-neutral-700 transition-all cursor-pointer hidden sm:flex items-center justify-center group shadow-xs shrink-0"
            title="View Source on GitHub"
            aria-label="View Source Code Repository on GitHub"
          >
            <img
              src="/assets/aistudio/github-light_ff3d18bf.svg"
              alt="GitHub Repository"
              className={`w-5 h-5 rounded-full transition-transform group-hover:scale-105 select-none ${
                theme === "light" ? "invert" : ""
              }`}
            />
          </a>

          {/* Account Menu */}
          <AccountMenu
            user={currentUser}
            onSignIn={onSignIn || (() => {})}
            onSignUp={onSignUp || (() => {})}
            onSignOut={onSignOut || (() => {})}
            onNavigateTab={(tab) => handleSelectTab(tab as ActiveTab)}
            savedAuditsCount={savedAuditsCount}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />

          {/* Quick High-Contrast Launch Button (Desktop) */}
          {currentTab === "overview" ? (
            <button
              onClick={() => handleSelectTab("feed")}
              className="hidden lg:inline-flex px-3.5 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-full transition-colors items-center gap-1 cursor-pointer whitespace-nowrap shadow-xs"
            >
              <span>Launch Feed</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={() => handleSelectTab("overview")}
              className="hidden lg:inline-flex px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-full transition-colors items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Overview</span>
            </button>
          )}

          {/* Mobile Hamburger / Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-cyan-400" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Floating Dropdown Sheet */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-2 p-3 rounded-2xl bg-neutral-950/95 backdrop-blur-2xl border border-neutral-800 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {/* Overview */}
            <button
              onClick={() => handleSelectTab("overview")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors cursor-pointer ${
                currentTab === "overview"
                  ? "bg-white text-black font-semibold"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Overview</span>
            </button>

            {/* Separator */}
            <div className="px-2 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Features
            </div>

            {/* Feature Options List */}
            {FEATURE_OPTIONS.map((item) => {
              const Icon = item.icon;
              const isSelected = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-neutral-800 text-white font-semibold ring-1 ring-neutral-700"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                        item.badgeColor || "bg-neutral-700 text-neutral-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarFloating;

export function NavbarFloatingDemo() {
  return (
    <div className="w-full bg-muted/30 py-4 flex items-center justify-center">
      <NavbarFloating />
    </div>
  );
}
