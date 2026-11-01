"use client";

import React, { useState } from "react";
import { HaloReel, type HaloReelItem } from "@/registry/ruixenui/halo-reel";
import { ActiveTab } from "./Header";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Sliders,
  Scale,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Filter
} from "lucide-react";

const CDN = "https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev";

export interface CategoryCardItem extends HaloReelItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  description: string;
  trustScore?: number;
  badge?: string;
  tab: ActiveTab;
  categoryFilter?: string;
  statsLabel?: string;
  keyMetric?: string;
}

const NEWS_CATEGORY_CARDS: CategoryCardItem[] = [
  {
    id: "card-health",
    category: "Health",
    title: "Synthetic mRNA Cancer Trials",
    subtitle: "Nature Medicine Journal",
    description: "Multinational Phase-III study confirms 64% recurrence-free survival with personalized neoantigen mRNA therapy.",
    trustScore: 99,
    tab: "feed",
    categoryFilter: "Health",
    statsLabel: "Credibility Floor",
    keyMetric: "99.2% Factual",
    src: `${CDN}/stock-images/821d815affa6496c39cbdeeec7a84603.jpg`,
    alt: "Health & Oncology - Nature Medicine",
  },
  {
    id: "card-env",
    category: "Environment",
    title: "Global Methane Reduction Accord",
    subtitle: "Reuters News Wire",
    description: "82 nations ratify binding satellite-verified targets requiring 75% elimination of flaring emissions by 2030.",
    trustScore: 98,
    tab: "feed",
    categoryFilter: "Environment",
    statsLabel: "Corroboration",
    keyMetric: "7 Wires Verified",
    src: `${CDN}/stock-images/767d99bb371a54d0d36751e8cecae43c.jpg`,
    alt: "Environment & Climate Policy - Reuters Wire",
  },
  {
    id: "card-econ",
    category: "Economics",
    title: "Central Bank Lending Rate Pause",
    subtitle: "The Financial Times",
    description: "Monetary policy committee votes unanimously to hold benchmark lending at 4.75% amid cooling core inflation.",
    trustScore: 96,
    tab: "feed",
    categoryFilter: "Economics",
    statsLabel: "Market Impact",
    keyMetric: "Tier 1 Wire",
    src: `${CDN}/gradients/shade_shiters/shade-shifters-05.png`,
    alt: "Economics & Monetary Policy - Financial Times",
  },
  {
    id: "card-tech",
    category: "Technology",
    title: "Quantum-Resistant TLS Protocols",
    subtitle: "MIT Tech Review",
    description: "Post-quantum cryptographic lattices ratified across global financial backbones to neutralize Shor's algorithm.",
    trustScore: 94,
    tab: "feed",
    categoryFilter: "Technology",
    statsLabel: "Peer Review",
    keyMetric: "NIST Standard",
    src: `${CDN}/stock-images/937438c560ada1c83317f2c11b3454b0.jpg`,
    alt: "AI & Quantum Computing - MIT Tech Review",
  },
  {
    id: "card-sci",
    category: "Science",
    title: "CRISPR Arid Crop Resilience",
    subtitle: "Science Journal",
    description: "Field trials across 6 arid zones achieve 38% yield preservation with targeted epigenetic drought adaptation.",
    trustScore: 97,
    tab: "feed",
    categoryFilter: "Science",
    statsLabel: "Field Trials",
    keyMetric: "Double-Blind",
    src: `${CDN}/stock-images/98f89cb9994f5c382ab964062c4039db.jpg`,
    alt: "Biomedical & Agriculture Science - Science Journal",
  },
  {
    id: "card-cyber",
    category: "Technology",
    title: "Firmware Zero-Day Patching",
    subtitle: "Wired Tech Security",
    description: "Hardware secure enclave vulnerability neutralized across 140M telecom edge switches before active exploitation.",
    trustScore: 91,
    tab: "feed",
    categoryFilter: "Technology",
    statsLabel: "Patch Coverage",
    keyMetric: "140M Devices",
    src: `${CDN}/gradients/moon/moon-grade-03.png`,
    alt: "Cybersecurity & Infrastructure - Wired Tech",
  },
  {
    id: "card-factcheck",
    category: "Fact-Check",
    title: "Gemini 3.8 Flash Claim Verifier",
    subtitle: "Autonomous Wire Corroboration",
    description: "Real-time AI verification cross-examining breaking claims against historical wire consensus and provenance graphs.",
    badge: "AI RAG",
    tab: "factcheck",
    statsLabel: "Verification",
    keyMetric: "12ms Latency",
    src: `${CDN}/gradients/hero_gradient/hero-gradients-01.png`,
    alt: "AI Fact-Checking Engine - Gemini 3.8",
  },
  {
    id: "card-sources",
    category: "Registry",
    title: "18-Wire Source Registry",
    subtitle: "Audited News Outlets",
    description: "Continuous 12-month factual accuracy tracking, provenance indices, and historical correction frequencies.",
    trustScore: 97,
    tab: "sources",
    statsLabel: "Network Size",
    keyMetric: "18 Audited Outlets",
    src: `${CDN}/stock-images/ddcbee38be8b7274e19e132d7ab35b53.jpg`,
    alt: "Source Credibility Registry - 18 Wires",
  },
  {
    id: "card-pareto",
    category: "Optimization",
    title: "Multi-Objective Pareto Engine",
    subtitle: "5-Objective Scalarization",
    description: "Replaces clickbait CTR maximization with Pareto-optimal balancing of dwell, credibility, diversity, and freshness.",
    badge: "MOO Frontier",
    tab: "pareto",
    statsLabel: "Optimization",
    keyMetric: "5-Dim Pareto",
    src: `${CDN}/gradients/shade_shiters/shade-shifters-09.png`,
    alt: "Pareto Frontier Re-Ranking Engine",
  },
  {
    id: "card-fairness",
    category: "Fairness",
    title: "Exposure Lorenz & Gini Audit",
    subtitle: "Echo Chamber Mitigator",
    description: "Mitigates attention monopolies to ensure fair discovery of high-integrity independent investigative journalism.",
    badge: "Gini 0.42",
    tab: "fairness",
    statsLabel: "Inequality",
    keyMetric: "-43% Gini Bias",
    src: `${CDN}/gradients/moon/moon-grade-06.png`,
    alt: "Bias & Exposure Fairness Analysis",
  },
];

interface HaloReelDemoProps {
  onNavigateTab?: (tab: ActiveTab, category?: string) => void;
}

export default function HaloReelDemo({ onNavigateTab }: HaloReelDemoProps) {
  const [selectedCard, setSelectedCard] = useState<CategoryCardItem>(NEWS_CATEGORY_CARDS[0]);

  const handleCardClick = (item: HaloReelItem) => {
    const card = item as CategoryCardItem;
    setSelectedCard(card);
  };

  const handleOpenAction = (card: CategoryCardItem) => {
    if (onNavigateTab) {
      onNavigateTab(card.tab, card.categoryFilter);
    }
  };

  return (
    <div className="relative isolate w-full space-y-4">
      {/* 3D Orbit Reel with strict stacking context isolation */}
      <div className="relative isolate overflow-hidden rounded-2xl sm:rounded-3xl border border-neutral-800/80 bg-neutral-950/60 shadow-2xl backdrop-blur-xs">
        <HaloReel
          items={NEWS_CATEGORY_CARDS}
          aria-label="Verified News Categories and Algorithms"
          centerLabel={
            <div className="select-none flex flex-col items-center px-2">
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                TRUSTNEWS · ORBIT
              </span>
              <span className="text-lg sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                Verified Categories
              </span>
              <span className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">
                Swipe or tap any card to inspect &amp; filter
              </span>
            </div>
          }
          cardWidth={148}
          cardHeight={206}
          minScale={0.44}
          radiusYRatio={0.35}
          holdDuration={1200}
          stepDuration={700}
          onItemClick={handleCardClick}
          className="h-[340px] sm:h-[430px] md:h-[490px] lg:h-[530px] w-full"
        />
      </div>

      {/* Horizontal Touch-Scrollable Quick Category Strip for Phone & Tablet View */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar touch-pan-x">
        {NEWS_CATEGORY_CARDS.map((card) => {
          const isSelected = selectedCard?.id === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedCard(card)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer border flex items-center gap-1.5 ${
                isSelected
                  ? "bg-white text-black font-bold border-white shadow-sm"
                  : "bg-neutral-900/90 text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <span>{card.category}</span>
              {card.trustScore && (
                <span
                  className={`text-[10px] ${
                    isSelected ? "text-emerald-700 font-extrabold" : "text-emerald-400"
                  }`}
                >
                  {card.trustScore}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Card Interactive Insight Banner */}
      {selectedCard && (
        <div className="relative z-10 rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-xl transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Card Information */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-neutral-900 border border-neutral-700 text-xs font-mono font-semibold text-white">
                  {selectedCard.category}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {selectedCard.subtitle}
                </span>
                {selectedCard.trustScore && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/50 text-[11px] font-mono text-emerald-400 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {selectedCard.trustScore}% Trust Score
                  </span>
                )}
                {selectedCard.keyMetric && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-800/40 text-[11px] font-mono text-cyan-300">
                    {selectedCard.keyMetric}
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {selectedCard.title}
              </h3>

              <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl leading-relaxed">
                {selectedCard.description}
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={() => handleOpenAction(selectedCard)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {selectedCard.tab === "feed" ? (
                  <>
                    <Filter className="w-3.5 h-3.5 text-black" />
                    <span>Filter Feed: {selectedCard.category}</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5 text-black" />
                    <span>Open {selectedCard.category} Module</span>
                  </>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
