"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Sliders,
  Layers,
  Sparkles,
  LogOut,
  LogIn,
  ChevronRight,
  Check,
  Settings,
  Bookmark,
  Activity,
  Key,
  ShieldAlert,
  Clock,
  LayoutGrid,
  List,
  Compass,
  FileText,
  BadgeCheck,
  Scale,
  Database,
  Lock
} from "lucide-react";
import ThemeSwitch from "@/components/ui/theme-switch";
import { resolveUserAvatarUrl } from "../../src/utils/avatar";

export interface AccountMenuUser {
  uid?: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  role?: string;
  tier?: string;
  verified?: boolean;
}

export interface AccountMenuProps {
  user?: AccountMenuUser | null;
  onSignIn?: () => void;
  onSignUp?: () => void;
  onSignOut?: () => void;
  onNavigateTab?: (tab: string, filter?: string) => void;
  activeFeedView?: "magazine" | "list";
  onChangeFeedView?: (view: "magazine" | "list") => void;
  credibilityFloor?: number;
  onChangeCredibilityFloor?: (floor: number) => void;
  savedAuditsCount?: number;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  className?: string;
  align?: "left" | "right";
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  user,
  onSignIn,
  onSignUp,
  onSignOut,
  onNavigateTab,
  activeFeedView = "magazine",
  onChangeFeedView,
  credibilityFloor = 80,
  onChangeCredibilityFloor,
  savedAuditsCount = 0,
  theme = "dark",
  onToggleTheme,
  className = "",
  align = "right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isObjectiveExpanded, setIsObjectiveExpanded] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<string>("balanced");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsObjectiveExpanded(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsObjectiveExpanded(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isAuthenticated = !!user && !!user.uid;
  const userName = user?.displayName || user?.email?.split("@")[0] || "Guest";
  const userEmail = user?.email || "";
  const userAvatarUrl = resolveUserAvatarUrl(
    user?.photoURL,
    user?.displayName || user?.email,
    user?.uid || user?.email
  );

  const rankingObjectives = [
    {
      id: "balanced",
      label: "Balanced",
      short: "Equal Pareto weights",
      icon: Scale,
      accent: "text-cyan-400",
    },
    {
      id: "credibility",
      label: "Credibility",
      short: "Fact-check priority",
      icon: ShieldCheck,
      accent: "text-emerald-400",
    },
    {
      id: "dwell",
      label: "Deep Read",
      short: "Sustained depth",
      icon: Clock,
      accent: "text-sky-400",
    },
    {
      id: "diversity",
      label: "Diversity",
      short: "Cross-perspective",
      icon: Sparkles,
      accent: "text-indigo-400",
    },
  ];

  const activeObjectiveObj =
    rankingObjectives.find((o) => o.id === selectedObjective) || rankingObjectives[0];

  const handleTriggerClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNavigate = (tab: string, filter?: string) => {
    setIsOpen(false);
    setIsObjectiveExpanded(false);
    onNavigateTab?.(tab, filter);
  };

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      {isAuthenticated ? (
        <button
          onClick={handleTriggerClick}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className={`group relative flex items-center gap-2 rounded-full border py-1 pl-1.5 pr-2.5 text-xs font-medium transition-all duration-200 cursor-pointer shadow-xs ${
            isOpen
              ? "border-neutral-700 bg-neutral-800/95 text-white ring-2 ring-sky-500/20"
              : "border-neutral-800 bg-neutral-900/90 text-neutral-200 hover:border-neutral-700 hover:bg-neutral-850 hover:text-white"
          }`}
        >
          {/* Avatar with Status Pip */}
          <div className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-700">
            <img
              src={userAvatarUrl}
              alt={userName}
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-neutral-950" />
          </div>

          {/* Text Identity */}
          <span className="hidden sm:inline-block text-xs font-semibold text-neutral-200 group-hover:text-white truncate max-w-[100px]">
            {userName}
          </span>

          <ChevronRight
            className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 group-hover:text-neutral-200 ${
              isOpen ? "rotate-90 text-white" : ""
            }`}
          />
        </button>
      ) : (
        <button
          onClick={handleTriggerClick}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className={`group relative flex items-center gap-2 rounded-full border py-1.5 px-3 text-xs font-medium transition-all duration-200 cursor-pointer shadow-xs ${
            isOpen
              ? "border-neutral-700 bg-neutral-800 text-white ring-2 ring-sky-500/20"
              : "border-neutral-800 bg-neutral-900/90 text-neutral-200 hover:border-neutral-700 hover:bg-neutral-850 hover:text-white"
          }`}
        >
          <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="font-semibold text-white">Account</span>
          <ChevronRight
            className={`h-3 w-3 text-neutral-400 transition-transform duration-200 group-hover:text-neutral-200 ${
              isOpen ? "rotate-90 text-white" : ""
            }`}
          />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`fixed sm:absolute ${
            align === "right" ? "right-2 sm:right-0 left-2 sm:left-auto" : "left-2 sm:left-0 right-2 sm:right-auto"
          } top-16 sm:top-full sm:mt-2.5 sm:w-[340px] origin-top-right rounded-2xl border border-neutral-800/90 bg-neutral-950/98 p-2.5 text-neutral-200 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl ring-1 ring-white/5 z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* SECTION 1: Identity & Auth Card */}
          <div className="rounded-xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/90 to-neutral-900/40 p-3.5">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-700/80 shadow-inner">
                    <img src={userAvatarUrl} alt={userName} className="h-full w-full object-cover" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-neutral-900 bg-emerald-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-white truncate">{userName}</h4>
                      <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-neutral-400 font-mono truncate">
                      {userEmail || "Verified Researcher"}
                    </p>
                  </div>

                  <button
                    onClick={() => handleNavigate("profile")}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 text-[11px] font-semibold text-white transition-colors cursor-pointer shrink-0"
                  >
                    Profile
                  </button>
                </div>

                {/* Compact Telemetry Strip */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-neutral-800/80 text-center">
                  <div className="rounded-lg bg-neutral-950/70 px-2 py-1.5 border border-neutral-800/60">
                    <span className="block text-[9px] font-mono text-neutral-500 uppercase">Status</span>
                    <span className="text-[11px] font-mono font-semibold text-emerald-400">Verified</span>
                  </div>
                  <div className="rounded-lg bg-neutral-950/70 px-2 py-1.5 border border-neutral-800/60">
                    <span className="block text-[9px] font-mono text-neutral-500 uppercase">Min Trust</span>
                    <span className="text-[11px] font-mono font-semibold text-sky-400">&ge;{credibilityFloor}%</span>
                  </div>
                  <div className="rounded-lg bg-neutral-950/70 px-2 py-1.5 border border-neutral-800/60">
                    <span className="block text-[9px] font-mono text-neutral-500 uppercase">Audits</span>
                    <span className="text-[11px] font-mono font-semibold text-indigo-400">{savedAuditsCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white">TrustNews Account</h4>
                      <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/60">
                        Guest
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">
                      Sign in to sync custom Pareto weights, saved audits &amp; direct messages.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onSignIn?.();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      (onSignUp || onSignIn)?.();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800/90 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>Create Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Feed Controls & Theme */}
          <div className="mt-2 rounded-xl border border-neutral-800/70 bg-neutral-900/30 p-2 space-y-2">
            <div className="px-1 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                Quick Preferences
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                {activeObjectiveObj.label}
              </span>
            </div>

            {/* Inline Expandable Ranking Objective Selector */}
            <div className="rounded-lg bg-neutral-950/60 border border-neutral-800/70 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsObjectiveExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-2.5 py-2 text-left hover:bg-neutral-900/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-xs font-medium text-neutral-200">Ranking Mode</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-cyan-400 font-medium">
                    {activeObjectiveObj.label}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-200 ${
                      isObjectiveExpanded ? "rotate-90 text-white" : ""
                    }`}
                  />
                </div>
              </button>

              {isObjectiveExpanded && (
                <div className="grid grid-cols-2 gap-1.5 p-2 pt-1 border-t border-neutral-800/60 bg-neutral-950/90">
                  {rankingObjectives.map((obj) => {
                    const IconComp = obj.icon;
                    const isSelected = selectedObjective === obj.id;
                    return (
                      <button
                        key={obj.id}
                        type="button"
                        onClick={() => {
                          setSelectedObjective(obj.id);
                          setIsObjectiveExpanded(false);
                        }}
                        className={`flex flex-col items-start rounded-lg p-2 text-left border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-neutral-800/90 border-neutral-600 text-white shadow-xs"
                            : "bg-neutral-900/50 border-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-0.5">
                          <IconComp className={`w-3.5 h-3.5 ${obj.accent}`} />
                          {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <span className="text-[11px] font-semibold text-white leading-tight">
                          {obj.label}
                        </span>
                        <span className="text-[9px] text-neutral-400 truncate w-full">
                          {obj.short}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inline Segmented Credibility Floor Control */}
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-950/60 border border-neutral-800/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs font-medium text-neutral-200">Trust Floor</span>
              </div>
              <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                {[65, 80, 90].map((val) => {
                  const active = credibilityFloor === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onChangeCredibilityFloor?.(val)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                        active
                          ? "bg-emerald-500 text-black shadow-xs"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {val}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Appearance Theme Row */}
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-950/60 border border-neutral-800/70">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-neutral-200">Appearance</span>
                <span className="text-[10px] font-mono text-neutral-500">
                  {theme === "light" ? "Light Mode" : "Dark Mode"}
                </span>
              </div>
              <ThemeSwitch
                className="scale-90 origin-right"
                themeOverride={theme}
                onThemeChange={(nextTheme) => {
                  if (nextTheme !== theme && onToggleTheme) {
                    onToggleTheme();
                  }
                }}
              />
            </div>
          </div>

          {/* SECTION 3: Workspace Navigation */}
          <div className="mt-2 space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              Workspace
            </div>

            <button
              onClick={() => handleNavigate("profile")}
              className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-900/90 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-neutral-700">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-neutral-100">Dashboard &amp; Profile</span>
                  <span className="block text-[10px] text-neutral-500">Saved audits, inbox &amp; settings</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300" />
            </button>

            <button
              onClick={() => handleNavigate("wire")}
              className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-900/90 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-neutral-700">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-neutral-100">Social Wire</span>
                  <span className="block text-[10px] text-neutral-500">Live community dispatches</span>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Live
              </span>
            </button>

            <button
              onClick={() => handleNavigate("factcheck")}
              className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-900/90 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-neutral-700">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-neutral-100">AI Claim Verifier</span>
                  <span className="block text-[10px] text-neutral-500">Fact-check articles &amp; sources</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300" />
            </button>

            <button
              onClick={() => handleNavigate("pareto")}
              className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-900/90 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-neutral-700">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-left">
                  <span className="block font-semibold text-neutral-100">Pareto Optimizer</span>
                  <span className="block text-[10px] text-neutral-500">5-objective frontier weights</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300" />
            </button>
          </div>

          {/* SECTION 4: Footer */}
          {isAuthenticated && (
            <div className="mt-2 pt-2 border-t border-neutral-800/80">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSignOut?.();
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>Sign Out</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-500">End Session</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
