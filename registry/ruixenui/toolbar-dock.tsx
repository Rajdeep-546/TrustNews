"use client";

import React, { useState } from "react";
import {
  Compass,
  Layers,
  MessageSquare,
  ShieldCheck,
  Sliders,
  BarChart3,
  Scale,
  Sparkles,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Check
} from "lucide-react";

export interface ToolbarDockItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string[];
  badge?: boolean | string;
  badgeColor?: string;
  accentClass?: string;
  active?: boolean;
  onClick?: () => void;
}

export interface ToolbarDockProps {
  items?: ToolbarDockItem[];
  defaultCollapsed?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
  activeId?: string;
  onItemSelect?: (id: string) => void;
  showLabels?: boolean;
  title?: string;
}

export const ToolbarDock: React.FC<ToolbarDockProps> = ({
  items,
  defaultCollapsed = false,
  orientation = "vertical",
  className = "",
  activeId = "overview",
  onItemSelect,
  showLabels = true,
  title = "Navigation & Categories",
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Default TrustNews navigation items if none provided
  const defaultItems: ToolbarDockItem[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: "feed",
      label: "Ranked Feed",
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      badge: "LIVE",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    },
    {
      id: "wire",
      label: "Social Wire",
      icon: <MessageSquare className="w-4 h-4 text-sky-400" />,
      badge: "X-FEED",
      badgeColor: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
    },
    {
      id: "sources",
      label: "Source Registry",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: "pareto",
      label: "Pareto Frontier",
      icon: <Sliders className="w-4 h-4 text-neutral-300" />,
    },
    {
      id: "comparison",
      label: "7 Baselines",
      icon: <BarChart3 className="w-4 h-4 text-neutral-300" />,
    },
    {
      id: "fairness",
      label: "Bias & Fairness",
      icon: <Scale className="w-4 h-4 text-neutral-300" />,
    },
    {
      id: "ablation",
      label: "Ablation & Stats",
      icon: <Layers className="w-4 h-4 text-neutral-300" />,
    },
    {
      id: "factcheck",
      label: "AI Fact-Check",
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
    },
  ];

  const dockItems = items && items.length > 0 ? items : defaultItems;
  const isVertical = orientation === "vertical";
  const activeItem = dockItems.find((it) => it.id === activeId) || dockItems[0];

  return (
    <div className={`relative z-40 transition-all duration-300 ${className}`}>
      {/* Dock Container */}
      <div
        className={`flex ${
          isVertical ? "flex-col" : "flex-row"
        } rounded-2xl bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 shadow-2xl shadow-black/90 p-1.5 transition-all duration-200`}
      >
        {/* Toggle Collapse/Expand Header */}
        <div className="flex items-center justify-between gap-2 p-1">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 transition-all cursor-pointer w-full text-left"
            title={isCollapsed ? "Expand all options" : "Collapse dock"}
            aria-label={isCollapsed ? "Expand all options" : "Collapse dock"}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="p-1 rounded-lg bg-neutral-800 text-cyan-400 shrink-0">
                {isCollapsed ? <Menu className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              </span>
              {isCollapsed && activeItem?.icon && (
                <span className="shrink-0 flex items-center justify-center">
                  {activeItem.icon}
                </span>
              )}
              <span className="text-xs font-mono font-semibold text-white truncate">
                {isCollapsed ? activeItem?.label || title : title}
              </span>
              {isCollapsed && activeItem?.badge && (
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                  activeItem.badgeColor || "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                }`}>
                  {activeItem.badge}
                </span>
              )}
            </div>

            {isCollapsed ? (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0 flex items-center gap-1">
                <span>{dockItems.length}</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </span>
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            )}
          </button>
        </div>

        {/* Separator when expanded */}
        {!isCollapsed && <div className="h-px w-full bg-neutral-800/80 my-1" />}

        {/* Vertical Dock Items List with Icons and Options */}
        {!isCollapsed && (
          <div
            className={`flex ${
              isVertical ? "flex-col" : "flex-row flex-wrap"
            } gap-1 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 py-1`}
          >
            {dockItems.map((item) => {
              const isActive = activeId === item.id || item.active;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (onItemSelect) {
                      onItemSelect(item.id);
                    }
                    // Auto-collapse on selection on phone view for clean UX
                    setIsCollapsed(true);
                  }}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-black font-semibold shadow-md shadow-white/10"
                      : "text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
                  }`}
                  aria-label={item.label}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded-lg shrink-0 transition-transform ${
                        isActive ? "scale-110" : ""
                      }`}
                    >
                      {item.icon}
                    </span>

                    {showLabels && (
                      <span
                        className={`text-xs tracking-tight truncate ${
                          isActive ? "font-bold text-black" : "font-medium text-neutral-200"
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                          isActive
                            ? "bg-neutral-950 text-emerald-400"
                            : item.badgeColor || "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ToolbarDockDemo() {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center p-4">
      <ToolbarDock />
    </div>
  );
}
