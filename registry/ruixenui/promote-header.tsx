"use client";

import React, { useState } from "react";
import { ArrowRight, X, Sparkles, ShieldCheck, ChevronRight } from "lucide-react";

export interface PromoteHeaderProps {
  badge?: string;
  badgeVariant?: "default" | "glow" | "outline" | "emerald";
  title?: string;
  highlightText?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  statsText?: string;
  showIcon?: boolean;
}

export const PromoteHeader: React.FC<PromoteHeaderProps> = ({
  badge = "NEW v2.4",
  badgeVariant = "glow",
  title = "TrustNews Engine:",
  highlightText = "Multi-Objective Pareto Optimization & Verifiable Fact-Checking",
  actionText = "Explore Pareto Frontier",
  actionHref,
  onAction,
  dismissible = true,
  onDismiss,
  className = "",
  statsText = "99.2% Credibility Guarantee",
  showIcon = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    onDismiss?.();
  };

  const handleActionClick = (e: React.MouseEvent) => {
    if (onAction) {
      e.preventDefault();
      onAction();
    }
  };

  return (
    <aside
      aria-label="Platform Announcement"
      className={`relative isolate z-40 w-full overflow-hidden border-b border-neutral-800 bg-black/90 backdrop-blur-md text-neutral-100 transition-all duration-300 ${className}`}
    >
      {/* Subtle background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
        {/* Left / Center content */}
        <div className="flex-1 flex items-center justify-center sm:justify-start gap-2.5 flex-wrap text-center sm:text-left">
          {/* Badge */}
          {badge && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                badgeVariant === "emerald"
                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40"
                  : badgeVariant === "outline"
                  ? "bg-transparent text-neutral-300 border border-neutral-700"
                  : "bg-white/10 text-white border border-white/20 shadow-xs"
              }`}
            >
              {showIcon && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              {badge}
            </span>
          )}

          {/* Main Title & Highlight */}
          <div className="inline-flex items-center gap-1.5 flex-wrap justify-center sm:justify-start font-medium text-neutral-300">
            <span className="font-semibold text-white">{title}</span>
            <span className="text-neutral-400 hidden md:inline">{highlightText}</span>
          </div>

          {/* Optional stats badge */}
          {statsText && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-neutral-900/80 px-2 py-0.5 rounded border border-neutral-800">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              {statsText}
            </span>
          )}

          {/* Call to action */}
          {actionText && (
            <a
              href={actionHref || "#"}
              onClick={handleActionClick}
              className="inline-flex items-center gap-1 font-semibold text-white hover:text-neutral-200 underline underline-offset-4 cursor-pointer group transition-colors ml-1"
            >
              <span>{actionText}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-white" />
            </a>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default PromoteHeader;
