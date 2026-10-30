"use client";

import React, { useState, useId } from "react";
import {
  ShieldCheck,
  Sparkles,
  Sliders,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  RefreshCw,
  Zap,
  Compass,
  Layers,
  Clock,
  Target,
  ExternalLink,
  ChevronRight,
  Cpu,
  Share2
} from "lucide-react";
import { ParticleTextDots } from "@/registry/ruixenui/particle-text-dots";

export interface ProductCardHeroProps {
  badge?: string;
  badgeLabel?: string;
  title?: string;
  titleHighlight?: string;
  particleText?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  onPrimaryCtaClick?: () => void;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  onSecondaryCtaClick?: () => void;
  className?: string;
  showMetricsBar?: boolean;
}

export interface MetricItem {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export const ProductCardHero: React.FC<ProductCardHeroProps> = ({
  badge = "RESEARCH-GRADE MOO ENGINE v2.4",
  badgeLabel = "Live Re-Ranking Active",
  title = "Trust-Aware Recommendation",
  titleHighlight = "Engineered Beyond Clicks.",
  particleText,
  description = "",
  primaryCtaText = "Launch Live Benchmark",
  primaryCtaHref,
  onPrimaryCtaClick,
  secondaryCtaText = "Explore Pareto Frontier",
  secondaryCtaHref,
  onSecondaryCtaClick,
  className = "",
  showMetricsBar = true,
}) => {
  // Preset optimization objectives inside product hero card
  const [activePreset, setActivePreset] = useState<"balanced" | "trust" | "diversity" | "depth">("balanced");
  
  // Tab inside the product preview card
  const [activeTab, setActiveTab] = useState<"preview" | "weights" | "credibility">("preview");

  // Dynamic weights based on active preset
  const weightsMap = {
    balanced: {
      credibility: 85,
      dwellTime: 80,
      diversity: 75,
      novelty: 70,
      relevance: 90,
      score: "0.892",
      rankTime: "8.4ms",
      paretoEfficiency: "98.4%",
    },
    trust: {
      credibility: 98,
      dwellTime: 85,
      diversity: 70,
      novelty: 60,
      relevance: 82,
      score: "0.934",
      rankTime: "9.1ms",
      paretoEfficiency: "99.1%",
    },
    diversity: {
      credibility: 80,
      dwellTime: 75,
      diversity: 95,
      novelty: 90,
      relevance: 78,
      score: "0.875",
      rankTime: "7.9ms",
      paretoEfficiency: "97.6%",
    },
    depth: {
      credibility: 90,
      dwellTime: 96,
      diversity: 68,
      novelty: 65,
      relevance: 85,
      score: "0.918",
      rankTime: "8.8ms",
      paretoEfficiency: "98.9%",
    },
  };

  const currentWeights = weightsMap[activePreset];

  // Article preview dynamically adjusted based on preset
  const articlePreviews = {
    balanced: {
      publisher: "Reuters Wire",
      category: "Global Economy",
      title: "Global Supply Resilience: Microchip Fabricators Diversify Across APAC & EU",
      trustScore: 98,
      dwellTime: "4m 20s",
      corroboration: "3 Independent Wires",
      biasGini: "0.068 (High Parity)",
    },
    trust: {
      publisher: "Financial Times",
      category: "Monetary Policy",
      title: "Central Banks Synchronize Liquidity Frameworks Amid Sovereign Debt Yield Shifts",
      trustScore: 99,
      dwellTime: "5m 10s",
      corroboration: "4 Peer Sources",
      biasGini: "0.052 (Optimal Parity)",
    },
    diversity: {
      publisher: "Nature Technology",
      category: "Quantum Computing",
      title: "Topological Qubit Coherence Breakthrough Sets 1,000-Qubit Fault Tolerance Horizon",
      trustScore: 96,
      dwellTime: "3m 45s",
      corroboration: "Peer Reviewed (Nature)",
      biasGini: "0.041 (Serendipitous)",
    },
    depth: {
      publisher: "The Lancet Oncology",
      category: "Biomedicine",
      title: "Phase III mRNA Cancer Vaccine Demonstrates 44% Reduction in Recurrence Risk",
      trustScore: 99,
      dwellTime: "6m 30s",
      corroboration: "Double-Blind Clinical Trial",
      biasGini: "0.060 (Deep Reading)",
    },
  };

  const currentArticle = articlePreviews[activePreset];

  return (
    <section
      aria-label="Product Card Hero Section"
      className={`relative isolate overflow-hidden w-full border-b border-neutral-800/80 bg-black text-neutral-100 py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-emerald-600/5 blur-[100px] pointer-events-none -z-10" />

      {/* Subtle Grid Lines pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Hero Narrative, Headlines, CTAs */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            
            {/* Pill Badge */}
            {badge && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-300 mb-6 shadow-xs backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white tracking-wider">{badge}</span>
                {badgeLabel && (
                  <>
                    <span className="text-neutral-600">/</span>
                    <span className="text-neutral-400 hidden sm:inline">{badgeLabel}</span>
                  </>
                )}
              </div>
            )}

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12] mb-6">
              {title}{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                {titleHighlight}
              </span>
            </h1>

            {/* Interactive Particle Text Dots */}
            {particleText && (
              <div className="relative flex justify-start pt-1 pb-4 max-w-xl">
                <ParticleTextDots text={particleText} variant="dark" />
              </div>
            )}

            {/* Description (only rendered if non-empty) */}
            {description ? (
              <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed mb-8 max-w-xl">
                {description}
              </p>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-10">
              <a
                href={primaryCtaHref || "#feed"}
                onClick={(e) => {
                  if (onPrimaryCtaClick) {
                    e.preventDefault();
                    onPrimaryCtaClick();
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all shadow-lg shadow-white/10 cursor-pointer group"
              >
                <span>{primaryCtaText}</span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform" />
              </a>

              <a
                href={secondaryCtaHref || "#pareto"}
                onClick={(e) => {
                  if (onSecondaryCtaClick) {
                    e.preventDefault();
                    onSecondaryCtaClick();
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 font-medium text-sm transition-all cursor-pointer backdrop-blur-xs"
              >
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>{secondaryCtaText}</span>
              </a>
            </div>

            {/* Key Trust Metrics Row */}
            {showMetricsBar && (
              <div className="w-full pt-6 border-t border-neutral-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-white">99.4%</div>
                  <div className="text-[11px] text-neutral-400 font-medium mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Source Corroboration
                  </div>
                </div>

                <div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">+34.6%</div>
                  <div className="text-[11px] text-neutral-400 font-medium mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> Reading Dwell Time
                  </div>
                </div>

                <div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400">0.058</div>
                  <div className="text-[11px] text-neutral-400 font-medium mt-0.5 flex items-center gap-1">
                    <Compass className="w-3 h-3 text-indigo-400" /> Gini Exposure Parity
                  </div>
                </div>

                <div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-indigo-400">&lt; 10ms</div>
                  <div className="text-[11px] text-neutral-400 font-medium mt-0.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-400" /> Pareto Optimization
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Product Card Hero Showcase */}
          <div className="lg:col-span-6 relative">
            
            {/* Top Floating Badge Accent */}
            <div className="absolute -top-4 -right-2 sm:-top-5 sm:right-6 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/95 border border-emerald-500/40 text-emerald-400 text-xs font-mono shadow-xl backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fact-Checked &amp; Provenance Verified</span>
            </div>

            {/* Bottom Floating Badge Accent */}
            <div className="absolute -bottom-4 -left-2 sm:-bottom-5 sm:left-4 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/95 border border-cyan-500/40 text-cyan-400 text-xs font-mono shadow-xl backdrop-blur-md">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Anti-Filter Bubble Protection Active</span>
            </div>

            {/* Main Product Card Container with Glassmorphism */}
            <div className="relative rounded-2xl border border-neutral-800 bg-neutral-950/95 shadow-2xl p-5 sm:p-6 backdrop-blur-xl transition-all overflow-hidden group">
              
              {/* Subtle Card Glow */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-50" />
              
              {/* Product Card Top Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-5 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-semibold text-white">TrustRank-MOO Hybrid</span>
                  <span className="text-neutral-600">/</span>
                  <span className="text-[11px] font-mono text-neutral-400">v2.4 Live Model</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                    Score: {currentWeights.score}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-neutral-400 border border-neutral-800">
                    {currentWeights.rankTime}
                  </span>
                </div>
              </div>

              {/* Optimization Presets Selector */}
              <div className="mb-5 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-neutral-300">Pareto Objective Preset</span>
                  <span className="text-[11px] font-mono text-emerald-400">Pareto Efficiency: {currentWeights.paretoEfficiency}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-neutral-900/90 border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setActivePreset("balanced")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activePreset === "balanced"
                        ? "bg-white text-black shadow-xs font-semibold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Balanced MOO
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreset("trust")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activePreset === "trust"
                        ? "bg-emerald-500 text-black shadow-xs font-semibold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Trust-Max
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreset("diversity")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activePreset === "diversity"
                        ? "bg-cyan-400 text-black shadow-xs font-semibold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Diversity
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreset("depth")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      activePreset === "depth"
                        ? "bg-indigo-400 text-black shadow-xs font-semibold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Deep Read
                  </button>
                </div>
              </div>

              {/* Interactive Card View Tabs */}
              <div className="flex items-center gap-4 border-b border-neutral-800/80 pb-2 mb-4 text-xs font-medium text-neutral-400 relative z-10">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`pb-1 cursor-pointer transition-colors flex items-center gap-1.5 ${
                    activeTab === "preview"
                      ? "text-white border-b-2 border-emerald-400 font-semibold"
                      : "hover:text-neutral-200"
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Rank #1 Item</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("weights")}
                  className={`pb-1 cursor-pointer transition-colors flex items-center gap-1.5 ${
                    activeTab === "weights"
                      ? "text-white border-b-2 border-emerald-400 font-semibold"
                      : "hover:text-neutral-200"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Objective Equalizer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("credibility")}
                  className={`pb-1 cursor-pointer transition-colors flex items-center gap-1.5 ${
                    activeTab === "credibility"
                      ? "text-white border-b-2 border-emerald-400 font-semibold"
                      : "hover:text-neutral-200"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Factual Audit</span>
                </button>
              </div>

              {/* Tab 1: Rank #1 Recommended Article Preview */}
              {activeTab === "preview" && (
                <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800/90 relative z-10 transition-all">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-neutral-200">
                        {currentArticle.publisher}
                      </span>
                      <span className="text-neutral-400 text-[11px]">{currentArticle.category}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {currentArticle.trustScore}% Trust
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white mb-3 line-clamp-2 leading-snug">
                    {currentArticle.title}
                  </h3>

                  {/* Multi-Dimensional Metrics Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-neutral-800/80 text-[11px]">
                    <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800">
                      <span className="text-neutral-500 block text-[9px] uppercase font-mono">Dwell Prediction</span>
                      <span className="font-semibold text-neutral-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {currentArticle.dwellTime}
                      </span>
                    </div>

                    <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800">
                      <span className="text-neutral-500 block text-[9px] uppercase font-mono">Corroboration</span>
                      <span className="font-semibold text-neutral-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {currentArticle.corroboration}
                      </span>
                    </div>

                    <div className="bg-neutral-950/60 p-2 rounded-lg border border-neutral-800 col-span-2 sm:col-span-1">
                      <span className="text-neutral-500 block text-[9px] uppercase font-mono">Parity Gini</span>
                      <span className="font-semibold text-neutral-200 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-indigo-400" />
                        {currentArticle.biasGini}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Objective Equalizer */}
              {activeTab === "weights" && (
                <div className="space-y-3 relative z-10 py-1">
                  <div>
                    <div className="flex justify-between text-xs font-mono text-neutral-300 mb-1">
                      <span>Source Credibility Weight</span>
                      <span className="text-emerald-400">{currentWeights.credibility}%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: `${currentWeights.credibility}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-neutral-300 mb-1">
                      <span>Reading Completion &amp; Dwell</span>
                      <span className="text-cyan-400">{currentWeights.dwellTime}%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${currentWeights.dwellTime}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-neutral-300 mb-1">
                      <span>Topic &amp; Perspective Diversity</span>
                      <span className="text-indigo-400">{currentWeights.diversity}%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                        style={{ width: `${currentWeights.diversity}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-neutral-300 mb-1">
                      <span>Serendipity &amp; Novelty</span>
                      <span className="text-yellow-400">{currentWeights.novelty}%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                        style={{ width: `${currentWeights.novelty}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Factual Audit Proof */}
              {activeTab === "credibility" && (
                <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 relative z-10 text-xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Provenance Ledger:</span>
                    <span className="font-mono text-emerald-400">SHA-256 Verified Wire Hash</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Fact-Check Cross-Reference:</span>
                    <span className="font-mono text-neutral-200">AFP, Reuters, AP</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-neutral-400">Clickbait Penalty Filter:</span>
                    <span className="font-mono text-emerald-400">0.02% (Strictly Suppressed)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Echo Chamber Coefficient:</span>
                    <span className="font-mono text-cyan-400">&lt; 0.12 (High Perspective Parity)</span>
                  </div>
                </div>
              )}

              {/* Card Bottom Meta Bar */}
              <div className="mt-5 pt-3.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono relative z-10">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  MIND-Small &amp; NewsAPI Integrated
                </span>
                <span className="text-neutral-500 hidden sm:inline">
                  Strict Zero Deceptive Clicks Policy
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ProductCardHero;
