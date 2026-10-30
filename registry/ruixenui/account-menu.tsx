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
  className = "",
  align = "right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<string>("balanced");
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveSubmenu(null);
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
        setActiveSubmenu(null);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmenuEnter = (key: string) => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    setActiveSubmenu(key);
  };

  const handleSubmenuLeave = () => {
    submenuTimeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 180);
  };

  const isAuthenticated = !!user && !!user.uid;
  const userName = user?.displayName || user?.email?.split("@")[0] || "Guest";
  const userEmail = user?.email || "";
  const userInitials = (user?.displayName || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const rankingObjectives = [
    {
      id: "balanced",
      label: "Pareto Balanced",
      desc: "Equalized multi-objective Pareto distribution",
      icon: Scale,
      color: "text-white",
    },
    {
      id: "credibility",
      label: "Credibility Priority",
      desc: "Weight fact-checked wires highest (w_cred=0.45)",
      icon: ShieldCheck,
      color: "text-emerald-400",
    },
    {
      id: "dwell",
      label: "Deep Dwell Time",
      desc: "Optimize for sustained reading & depth (w_dwell=0.40)",
      icon: Clock,
      color: "text-cyan-400",
    },
    {
      id: "diversity",
      label: "Anti-Echo Diversity",
      desc: "Maximize cross-perspective exposure (w_div=0.35)",
      icon: Sparkles,
      color: "text-indigo-400",
    },
  ];

  const handleTriggerClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNavigate = (tab: string, filter?: string) => {
    setIsOpen(false);
    setActiveSubmenu(null);
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
          className="group relative flex items-center gap-2.5 rounded-full border border-neutral-800 bg-neutral-900/90 py-1 pl-1.5 pr-3 text-xs font-medium text-neutral-200 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-850 hover:text-white focus:outline-hidden focus:ring-2 focus:ring-neutral-700 cursor-pointer shadow-xs"
        >
          {/* Avatar with Status Pip */}
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={userName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-mono text-[11px] font-bold text-neutral-200">
                {userInitials}
              </span>
            )}
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-neutral-950 bg-emerald-500 ring-1 ring-neutral-900 animate-pulse" />
          </div>

          {/* Text Identity */}
          <div className="flex flex-col text-left leading-tight hidden sm:flex">
            <span className="text-[12px] font-semibold text-neutral-200 group-hover:text-white truncate max-w-[120px]">
              {userName}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <BadgeCheck className="w-2.5 h-2.5" />
              Verified
            </span>
          </div>

          <ChevronRight
            className={`h-3.5 w-3.5 text-neutral-500 transition-transform duration-200 group-hover:text-neutral-300 ${
              isOpen ? "rotate-90 text-white" : ""
            }`}
          />
        </button>
      ) : (
        <button
          onClick={handleTriggerClick}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className="group relative flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 py-1.5 px-3 text-xs font-medium text-neutral-300 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-850 hover:text-white cursor-pointer shadow-xs"
        >
          {/* Google Logo Icon */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="font-semibold text-white">Sign In</span>
          <ChevronRight
            className={`h-3 w-3 text-neutral-500 transition-transform duration-200 group-hover:text-neutral-300 ${
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
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-72 sm:w-80 origin-top-right rounded-2xl border border-neutral-800 bg-neutral-950/98 p-1.5 text-neutral-200 shadow-2xl backdrop-blur-2xl ring-1 ring-black/40 z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* User Profile Header Card */}
          <div className="rounded-xl border border-neutral-850 bg-neutral-900/60 p-3 mb-1.5">
            {isAuthenticated ? (
              <div className="flex items-start gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={userName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-mono text-sm font-bold text-neutral-200">
                      {userInitials}
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-neutral-900 bg-emerald-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white truncate">{userName}</h4>
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-neutral-400 font-mono truncate">{userEmail}</p>

                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                      Google Authenticated
                    </span>
                    {savedAuditsCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                        {savedAuditsCount} Audits
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Unauthenticated Session</h4>
                    <p className="text-[10px] text-neutral-400">Sign in with Google for real persistence</p>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Connect your Google account to save custom Pareto ranking weights and claim-verification audits in Firestore.
                </p>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    onSignIn?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition-colors cursor-pointer shadow-md"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-1 px-1 py-1 mb-1 text-center">
            <div className="rounded-lg bg-neutral-900/50 p-1.5 border border-neutral-850">
              <span className="block text-[9px] font-mono text-neutral-500 uppercase">Cred. Floor</span>
              <span className="text-[11px] font-mono font-semibold text-emerald-400">{credibilityFloor}%</span>
            </div>
            <div className="rounded-lg bg-neutral-900/50 p-1.5 border border-neutral-850">
              <span className="block text-[9px] font-mono text-neutral-500 uppercase">Auth Mode</span>
              <span className="text-[11px] font-mono font-semibold text-cyan-400">
                {isAuthenticated ? "Google" : "Guest"}
              </span>
            </div>
            <div className="rounded-lg bg-neutral-900/50 p-1.5 border border-neutral-850">
              <span className="block text-[9px] font-mono text-neutral-500 uppercase">Saved Audits</span>
              <span className="text-[11px] font-mono font-semibold text-indigo-400">{savedAuditsCount}</span>
            </div>
          </div>

          <div className="h-px bg-neutral-850 my-1" />

          {/* Menu Sections with Nested Submenus */}
          <div className="space-y-0.5 text-xs">
            {/* SUBMENU 1: Ranking Optimization Objective */}
            <div
              className="relative"
              onMouseEnter={() => handleSubmenuEnter("objective")}
              onMouseLeave={handleSubmenuLeave}
            >
              <button
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer group ${
                  activeSubmenu === "objective" ? "bg-neutral-850 text-white" : "hover:bg-neutral-900 text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <div className="flex flex-col">
                    <span className="font-medium">Ranking Objective</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {rankingObjectives.find((o) => o.id === selectedObjective)?.label || "Balanced"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />
              </button>

              {/* Nested Submenu: Objectives */}
              {activeSubmenu === "objective" && (
                <div
                  className="absolute right-full top-0 mr-1.5 w-64 rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-right-2 duration-150"
                  onMouseEnter={() => handleSubmenuEnter("objective")}
                  onMouseLeave={handleSubmenuLeave}
                >
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
                    Optimization Target
                  </div>
                  {rankingObjectives.map((obj) => {
                    const isSelected = selectedObjective === obj.id;
                    const IconComp = obj.icon;
                    return (
                      <button
                        key={obj.id}
                        onClick={() => {
                          setSelectedObjective(obj.id);
                          setActiveSubmenu(null);
                        }}
                        className={`w-full flex items-start gap-2.5 rounded-lg p-2 text-left transition-colors cursor-pointer ${
                          isSelected ? "bg-neutral-850 text-white" : "hover:bg-neutral-900 text-neutral-300"
                        }`}
                      >
                        <IconComp className={`w-4 h-4 mt-0.5 shrink-0 ${obj.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">{obj.label}</span>
                            {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                          </div>
                          <span className="block text-[10px] text-neutral-400 mt-0.5">{obj.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SUBMENU 2: Feed Layout */}
            <div
              className="relative"
              onMouseEnter={() => handleSubmenuEnter("layout")}
              onMouseLeave={handleSubmenuLeave}
            >
              <button
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer group ${
                  activeSubmenu === "layout" ? "bg-neutral-850 text-white" : "hover:bg-neutral-900 text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                  <div className="flex flex-col">
                    <span className="font-medium">Feed Presentation</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {activeFeedView === "magazine" ? "Magazine Grid" : "Analytical List"}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />
              </button>

              {/* Nested Submenu: Layout choices */}
              {activeSubmenu === "layout" && (
                <div
                  className="absolute right-full top-0 mr-1.5 w-56 rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-right-2 duration-150"
                  onMouseEnter={() => handleSubmenuEnter("layout")}
                  onMouseLeave={handleSubmenuLeave}
                >
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
                    Display Layout
                  </div>
                  <button
                    onClick={() => {
                      onChangeFeedView?.("magazine");
                      setActiveSubmenu(null);
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer ${
                      activeFeedView === "magazine" ? "bg-neutral-850 text-white" : "hover:bg-neutral-900 text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                      <div>
                        <span className="block text-xs font-medium">Magazine Grid</span>
                        <span className="block text-[10px] text-neutral-500">Rich editorial imagery & gauges</span>
                      </div>
                    </div>
                    {activeFeedView === "magazine" && <Check className="w-3 h-3 text-cyan-400" />}
                  </button>

                  <button
                    onClick={() => {
                      onChangeFeedView?.("list");
                      setActiveSubmenu(null);
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer ${
                      activeFeedView === "list" ? "bg-neutral-850 text-white" : "hover:bg-neutral-900 text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <List className="w-3.5 h-3.5 text-emerald-400" />
                      <div>
                        <span className="block text-xs font-medium">Analytical List</span>
                        <span className="block text-[10px] text-neutral-500">Dense score tables & vectors</span>
                      </div>
                    </div>
                    {activeFeedView === "list" && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* SUBMENU 3: Credibility Floor Guard */}
            <div
              className="relative"
              onMouseEnter={() => handleSubmenuEnter("credibility")}
              onMouseLeave={handleSubmenuLeave}
            >
              <button
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer group ${
                  activeSubmenu === "credibility" ? "bg-neutral-850 text-white" : "hover:bg-neutral-900 text-neutral-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="font-medium">Credibility Floor</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Filter: &ge; {credibilityFloor}% Trust
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />
              </button>

              {/* Nested Submenu: Credibility Floor Options */}
              {activeSubmenu === "credibility" && (
                <div
                  className="absolute right-full top-0 mr-1.5 w-60 rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-right-2 duration-150"
                  onMouseEnter={() => handleSubmenuEnter("credibility")}
                  onMouseLeave={handleSubmenuLeave}
                >
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
                    Minimum Trust Threshold
                  </div>
                  {[
                    { val: 90, label: "Strict Tier-1 (>90%)", desc: "Peer-reviewed & major wires only" },
                    { val: 80, label: "Recommended (>80%)", desc: "Balanced fact-checked reporting" },
                    { val: 65, label: "Permissive (>65%)", desc: "Includes opinion & blog commentary" },
                  ].map((lvl) => (
                    <button
                      key={lvl.val}
                      onClick={() => {
                        onChangeCredibilityFloor?.(lvl.val);
                        setActiveSubmenu(null);
                      }}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer ${
                        credibilityFloor === lvl.val ? "bg-neutral-850 text-white" : "hover:bg-neutral-900 text-neutral-300"
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-semibold">{lvl.label}</span>
                        <span className="block text-[10px] text-neutral-500">{lvl.desc}</span>
                      </div>
                      {credibilityFloor === lvl.val && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* My Dashboard & Preferences */}
            <button
              onClick={() => handleNavigate("profile")}
              className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                <span className="font-semibold text-white">My Dashboard &amp; Preferences</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400">UID</span>
            </button>

            {/* Social Wire Feed */}
            <button
              onClick={() => handleNavigate("wire")}
              className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-sky-400 group-hover:text-sky-300" />
                <span>Social Wire &amp; Reposts</span>
              </div>
              <span className="text-[10px] font-mono text-sky-400">x.com</span>
            </button>

            {/* Direct Navigation Links */}
            <button
              onClick={() => handleNavigate("factcheck")}
              className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                <span>AI Fact-Check Claims</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 group-hover:text-neutral-400">Gemini</span>
            </button>

            <button
              onClick={() => handleNavigate("sources")}
              className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                <span>Source Credibility Registry</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">18 Wires</span>
            </button>

            <button
              onClick={() => handleNavigate("pareto")}
              className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                <span>Pareto Frontier Tuning</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">5-Dim</span>
            </button>
          </div>

          <div className="h-px bg-neutral-850 my-1" />

          {/* Account Footer Actions */}
          <div className="space-y-0.5">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSignOut?.();
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer group"
              >
                <LogOut className="w-4 h-4 text-rose-400 transition-transform group-hover:-translate-x-0.5" />
                <span className="font-semibold">Sign Out from Google</span>
                <span className="text-[10px] font-mono text-neutral-500 ml-auto">⌘Q</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSignIn?.();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-white hover:bg-neutral-200 py-2 text-xs font-bold text-black transition-colors cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
