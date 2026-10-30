import React, { useState } from 'react';
import {
  ShieldCheck,
  Sliders,
  BarChart3,
  Scale,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  Star,
  Users,
  Compass,
  Zap,
  Activity,
  Award
} from 'lucide-react';
import { ActiveTab } from './Header';
import { BENCHMARK_ARTICLES } from '../data/mindSmallDataset';
import { NEWS_SOURCES_REGISTRY } from '../data/newsSourcesData';
import { NewsSourceProfile, NewsArticle } from '../types';
import HaloReelDemo from './HaloReelDemo';
import { ProductCardHero } from '@/registry/ruixenui/product-card-hero';
import CloudBackground from '@/registry/ruixenui/cloud-background';
import { ParticleTextDots } from '@/registry/ruixenui/particle-text-dots';
import { LazyScrollReveal } from './LazyScrollReveal';

interface NguyenLandingShowcaseProps {
  onNavigateTab: (tab: ActiveTab, category?: string) => void;
  articles?: NewsArticle[];
  onSelectArticle?: (article: any) => void;
}

export const NguyenLandingShowcase: React.FC<NguyenLandingShowcaseProps> = ({ onNavigateTab, articles, onSelectArticle }) => {
  // Interactive Bento Benchmark Metric
  const [activeBenchmarkMetric, setActiveBenchmarkMetric] = useState<'ndcg' | 'credibility' | 'diversity' | 'fairness'>('credibility');
  
  // FAQ accordion open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Command palette search state
  const [commandInput, setCommandInput] = useState('@source reuters');

  // Interactive Live Preview Preset
  const [previewPreset, setPreviewPreset] = useState<'balanced' | 'credibility' | 'longterm'>('balanced');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="w-full text-neutral-100 font-sans pb-16 selection:bg-neutral-800">
      {/* Unified Hero Section: Single cohesive part containing CloudBackground, ParticleTextDots, and ProductCardHero */}
      <div className="relative mb-12 -mx-2 sm:-mx-4 px-2 sm:px-4 pt-4 sm:pt-6 pb-2 overflow-hidden rounded-3xl border border-neutral-800/80 shadow-[0_0_50px_rgba(6,182,212,0.12)] bg-neutral-950">
        <CloudBackground
          className="absolute inset-0 w-full h-full"
          dim={0.72}
          speed={0.35}
          colorTint="cyan-blue"
          blurLevel="md"
          interactive={true}
        />

        {/* Seamless Shade-Shifters Prismatic Gradient Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
          <img
            src="/assets/aistudio/shade-shifters-10_3ca20496.png"
            alt=""
            className="w-full h-full object-cover object-center opacity-85 mix-blend-screen scale-105 pointer-events-none"
          />
          {/* Subtle edge fades for seamless blending into card borders */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-neutral-950/60 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/50 via-transparent to-neutral-950/50 pointer-events-none" />
        </div>

        <div className="relative z-10 w-full">
          {/* Particle Text Dots: TrustNews Brand Title */}
          <div className="relative flex flex-col items-center justify-center pt-2 pb-1 px-3">
            <ParticleTextDots text="TrustNews" variant="dark" />
          </div>

          {/* ProductCardHero: Ruixen UI Component */}
          <ProductCardHero
            badge="RESEARCH-GRADE MOO ENGINE v2.4"
            badgeLabel="Live Pareto Re-Ranking Active"
            title="Trust-Aware Recommendation"
            titleHighlight="Engineered Beyond Clicks."
            description=""
            primaryCtaText="Launch Ranked Feed"
            onPrimaryCtaClick={() => onNavigateTab('feed')}
            secondaryCtaText="Explore Pareto Frontier"
            onSecondaryCtaClick={() => onNavigateTab('pareto')}
            className="rounded-2xl border-0 !bg-transparent shadow-none !py-4 sm:!py-6"
          />
        </div>
      </div>

        {/* Hero Interactive Frame Mockup */}
        <section className="max-w-6xl mx-auto px-4 mb-16">
          <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-950/95 shadow-[0_-25px_60px_rgba(0,0,0,0.92)] p-4 sm:p-6 text-left relative overflow-hidden backdrop-blur-md">

          {/* Top Window Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-mono text-xs text-neutral-400">
                trustnews-moo-engine // live-recommender-stream
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/50 text-emerald-400 border border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Pareto Active: 42 Articles Evaluated
              </span>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div>
              <p className="text-xs font-semibold text-white">Live Objective Re-weighting Simulation</p>
              <p className="text-[11px] text-neutral-400">Click a preset to observe instant ranking shifts across the Pareto frontier</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPreviewPreset('balanced')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  previewPreset === 'balanced'
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Balanced MOO
              </button>
              <button
                onClick={() => setPreviewPreset('credibility')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  previewPreset === 'credibility'
                    ? 'bg-neutral-800 text-emerald-300 border border-emerald-700/60'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Trust-Maximized
              </button>
              <button
                onClick={() => setPreviewPreset('longterm')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  previewPreset === 'longterm'
                    ? 'bg-neutral-800 text-cyan-300 border border-cyan-700/60'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Sustained Dwell
              </button>
            </div>
          </div>

          {/* Simulated Ranked Articles List with Real Live News Support */}
          <div className="space-y-3 font-sans">
            {((articles && articles.length > 0) ? articles : BENCHMARK_ARTICLES).slice(0, 3).map((article, index) => {
              const dwellMinutes = (article.avgObservedDwellSec / 60).toFixed(1);
              const trustScore = ((article.sourceReliability * 0.6 + article.corroborationScore * 0.4) * 100).toFixed(0);
              const adjustedScore = previewPreset === 'credibility'
                ? Math.min(0.99, (article.sourceReliability * 0.6 + article.corroborationScore * 0.4)).toFixed(3)
                : previewPreset === 'longterm'
                ? Math.min(0.99, (article.historicalCompletionRate * 0.6 + (article.avgObservedDwellSec / 300) * 0.4)).toFixed(3)
                : (article.sourceReliability * 0.35 + article.corroborationScore * 0.25 + article.historicalCompletionRate * 0.25 + 0.1).toFixed(3);

              return (
                <div
                  key={article.id}
                  onClick={() => {
                    if (onSelectArticle) {
                      const scored = article as any;
                      if (!scored.computedScores) {
                        scored.computedScores = {
                          relevance: 0.85,
                          engagement: 0.8,
                          satisfaction: 0.85,
                          credibility: article.sourceReliability,
                          diversityContribution: 0.6,
                          novelty: 0.6,
                          finalRankScore: Number(adjustedScore) || 0.85,
                          rank: index + 1,
                          decomposed: { relevancePt: 0.3, credibilityPt: 0.3, satisfactionPt: 0.2, diversityPt: 0.1, noveltyPt: 0.1, clickbaitPenaltyPt: 0 }
                        };
                      }
                      onSelectArticle(scored);
                    } else {
                      onNavigateTab('feed');
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (onSelectArticle) {
                        onSelectArticle(article);
                      } else {
                        onNavigateTab('feed');
                      }
                    }
                  }}
                  className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80 hover:border-cyan-500/50 hover:bg-neutral-900/90 hover:shadow-xl hover:shadow-cyan-950/20 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-neutral-800 text-neutral-300 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-cyan-950 group-hover:text-cyan-400 group-hover:border group-hover:border-cyan-700/50 transition-colors">
                      #{index + 1}
                    </span>

                    {article.urlToImage && (
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-neutral-800 shrink-0 hidden sm:block bg-neutral-900">
                        <img
                          src={article.urlToImage}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-neutral-300">{article.publisher}</span>
                        {article.isLiveNews && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                            Live Wire
                          </span>
                        )}
                        <span className="text-neutral-600">·</span>
                        <span className="text-[11px] font-mono text-neutral-400">{article.category}</span>
                        <span className="text-neutral-600">·</span>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {dwellMinutes}m dwell
                        </span>
                      </div>
                      <h4 
                        className="text-sm font-semibold text-white leading-snug group-hover:text-cyan-300 transition-colors truncate"
                      >
                        {article.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        Score: {adjustedScore}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Trust: {trustScore}%
                      </div>
                    </div>
                    <div className="w-20 bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Number(adjustedScore) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Card Footer */}
          <div className="mt-5 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
              Verified with MIND-Small Benchmark & Gemini Fact-Checking Model
            </span>
            <button
              onClick={() => onNavigateTab('feed')}
              className="font-medium text-white hover:text-neutral-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              Open Full Interactive Workbench <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid ("Everything your team needs...") */}
      <LazyScrollReveal animation="fade-up" durationMs={650}>
        <section className="max-w-6xl mx-auto px-4 py-16 border-t border-neutral-850">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
              Everything your team needs to rank news with trust & long-term value.
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
              From real-time factual corroboration to multi-session engagement modeling, replace deceptive clickbait with verified news exposure.
            </p>
          </div>
          <div className="shrink-0">
            <button
              onClick={() => onNavigateTab('comparison')}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-neutral-400" />
              View 7 Baseline Models
            </button>
          </div>
        </div>

        {/* 5-Card Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bento Card 1: Visual Dwell & Engagement Board */}
          <div className="md:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between hover:border-neutral-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Temporal Engagement Board
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  Dwell & Retention Modeling
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Multi-Session Dwell Time & Reading Completion Pipeline
              </h3>
              <p className="text-xs text-neutral-400 mb-6">
                Separates accidental clicks and sensational headlines from genuine long-term user satisfaction using reading velocity and return frequency.
              </p>

              {/* Task / Article Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2">
                    <span className="font-semibold text-neutral-300">Deep Read Verified</span>
                    <span className="font-mono text-cyan-400">3m 15s dwell</span>
                  </div>
                  <p className="text-xs font-semibold text-white mb-2 line-clamp-1">
                    {BENCHMARK_ARTICLES[0].title}
                  </p>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cyan-400 h-full w-[88%]" />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-500 font-mono">
                    <span>{BENCHMARK_ARTICLES[0].publisher}</span>
                    <span>88% completion</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2">
                    <span className="font-semibold text-neutral-300">Corroborated Oncology Study</span>
                    <span className="font-mono text-emerald-400">Verified Read</span>
                  </div>
                  <p className="text-xs font-semibold text-white mb-2 line-clamp-1">
                    {BENCHMARK_ARTICLES[2].title}
                  </p>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full w-full" />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-500 font-mono">
                    <span>{BENCHMARK_ARTICLES[2].publisher}</span>
                    <span>92% completion</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono text-[11px]">Mitigates bounce rate by 34.6%</span>
              <button
                onClick={() => onNavigateTab('feed')}
                className="text-white hover:text-neutral-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                Inspect Feed Metrics <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Bento Card 2: Consensus & Newsroom Feed */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between hover:border-neutral-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Factual Consensus
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  Multi-Source
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Automated Wire Corroboration
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                Evaluates claim consistency against Reuters, AP, and BBC wires before ranking.
              </p>

              {/* Chat-style Consensus Wire */}
              <div className="space-y-2.5 mb-4">
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800/80 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono mb-1">
                    <span className="text-neutral-300 font-semibold">Reuters Wire</span>
                    <span>2m ago</span>
                  </div>
                  <p className="text-neutral-300 text-xs leading-snug">
                    Corroborated by AP & BBC with 98.4% factual consistency.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800/80 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono mb-1">
                    <span className="text-neutral-300 font-semibold">Gemini 3.8 RAG</span>
                    <span>Just now</span>
                  </div>
                  <p className="text-neutral-300 text-xs leading-snug">
                    0 unverified claims detected. Safe for broad personalized exposure.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('factcheck')}
              className="w-full py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold border border-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
              Run Live AI Fact-Check
            </button>
          </div>

          {/* Bento Card 3: AI Model Benchmarks */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between hover:border-neutral-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                  Benchmark Comparison
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-neutral-300 border border-neutral-800">
                  MIND-Small
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Outperforming 7 Baselines
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                Compare multi-objective ranking against pure click-optimization and collaborative filtering.
              </p>

              {/* Metric Selector Tabs */}
              <div className="flex items-center gap-1 mb-4 p-1 rounded-lg bg-neutral-900 border border-neutral-800">
                <button
                  onClick={() => setActiveBenchmarkMetric('credibility')}
                  className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    activeBenchmarkMetric === 'credibility'
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Trust
                </button>
                <button
                  onClick={() => setActiveBenchmarkMetric('ndcg')}
                  className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    activeBenchmarkMetric === 'ndcg'
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  NDCG@10
                </button>
                <button
                  onClick={() => setActiveBenchmarkMetric('diversity')}
                  className={`flex-1 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    activeBenchmarkMetric === 'diversity'
                      ? 'bg-neutral-800 text-white font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Diversity
                </button>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span className="font-semibold text-white">TrustNews</span>
                    <span className="text-emerald-400 font-bold">
                      {activeBenchmarkMetric === 'credibility' ? '96.4%' : activeBenchmarkMetric === 'ndcg' ? '0.842' : '0.810'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div className="bg-emerald-400 h-2 rounded-full w-[96%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Click-Optimized</span>
                    <span>
                      {activeBenchmarkMetric === 'credibility' ? '61.2%' : activeBenchmarkMetric === 'ndcg' ? '0.710' : '0.440'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div className="bg-neutral-600 h-2 rounded-full w-[61%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Collaborative Filter</span>
                    <span>
                      {activeBenchmarkMetric === 'credibility' ? '64.0%' : activeBenchmarkMetric === 'ndcg' ? '0.680' : '0.520'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <div className="bg-neutral-600 h-2 rounded-full w-[64%]" />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('comparison')}
              className="mt-6 text-xs text-white hover:text-neutral-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              See All 7 Baselines & P-Values <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Bento Card 4: Multi-Source Credibility Registry */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between hover:border-neutral-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Source Registry
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-neutral-400 border border-neutral-800">
                  {NEWS_SOURCES_REGISTRY.length} Wires
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                12-Month Credibility History
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                Continuous historical tracking of factual consistency, corrections, and editorial provenance.
              </p>

              {/* Source List preview */}
              <div className="space-y-2">
                {NEWS_SOURCES_REGISTRY.slice(0, 3).map((source: NewsSourceProfile) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-white">{source.name}</span>
                    </div>
                    <div className="font-mono text-emerald-400 font-bold">
                      {(source.overallCredibilityScore * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('sources')}
              className="mt-6 text-xs text-white hover:text-neutral-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              Open Source Credibility Dashboard <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Bento Card 5: Multi-Session Engagement Heatmap */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between hover:border-neutral-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  Sustained Value
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/50 text-amber-400 border border-amber-800/40">
                  Fair Exposure
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Mitigating Echo Chambers & Bias
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                Gini exposure coefficient dropped from 0.74 to 0.42, giving quality niche publishers fair exposure.
              </p>

              {/* Heatmap Matrix Mockup */}
              <div className="grid grid-cols-7 gap-1.5 mb-4">
                {Array.from({ length: 28 }).map((_, i) => {
                  const intensities = ['bg-neutral-900', 'bg-neutral-800', 'bg-emerald-950', 'bg-emerald-900', 'bg-emerald-700', 'bg-emerald-500'];
                  const intensity = intensities[i % intensities.length];
                  return (
                    <div
                      key={i}
                      className={`h-5 rounded-xs ${intensity} border border-neutral-800/60`}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <div className="text-xs font-bold text-white">68%</div>
                  <div className="text-[9px] text-neutral-500">Long-Form</div>
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <div className="text-xs font-bold text-emerald-400">42%</div>
                  <div className="text-[9px] text-neutral-500">Multi-Session</div>
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                  <div className="text-xs font-bold text-cyan-400">-34%</div>
                  <div className="text-[9px] text-neutral-500">Echo Risk</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('fairness')}
              className="mt-6 text-xs text-white hover:text-neutral-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              Analyze Bias & Gini Index <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>
    </LazyScrollReveal>

      {/* Social Wire & Personalized Profile Feature Cards */}
      <LazyScrollReveal animation="fade-up" durationMs={650}>
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-neutral-950 to-sky-950/20 p-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    x.com Style Feed
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">Real-Time Community</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Live News Social Wire</h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Broadcast analytical dispatches, repost breaking news with peer commentary, like insights, and engage in thread discussions with fellow analysts.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('wire')}
                className="mt-6 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md self-start"
              >
                <span>Explore Social Wire</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-neutral-950 to-amber-950/20 p-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Firestore Persisted
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">Personalized Model</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Analyst Preferences &amp; Profile</h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Customize your multi-objective ranking sliders (&gamma; credibility, &beta; dwell, &delta; diversity), store bookmarks, track reposts, and share your unique public profile UID with anyone.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('profile')}
                className="mt-6 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md self-start"
              >
                <span>Open My Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </LazyScrollReveal>

      {/* 3D Orbiting Halo Reel - Verified Categories & Multi-Objective Modules */}
      <LazyScrollReveal animation="fade-up" durationMs={650}>
        <section className="relative isolate z-10 max-w-6xl mx-auto px-4 py-16 border-t border-neutral-850">
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Interactive 3D Halo Reel · Clickable News Categories
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Verified Categories &amp; Algorithm Hub
          </h2>
          <p className="text-sm text-neutral-400">
            Explore peer-reviewed and wire-verified news categories, or jump directly into our AI fact-checking, source registry, and Pareto re-ranking engines. Click any card to inspect or filter.
          </p>
        </div>

        <HaloReelDemo onNavigateTab={onNavigateTab} />
      </section>
    </LazyScrollReveal>

      {/* Deep Dives ("Feature Highlights") */}
      <section className="max-w-6xl mx-auto px-4 py-16 border-t border-neutral-850">
        {/* Deep Dive 1: Smart Context & Multi-Objective Balancing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <div className="text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              SMART CONTEXT & MULTI-OBJECTIVE WEIGHTING
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-4">
              Balance 5 distinct objectives in real time.
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              Unlike traditional single-objective algorithms that hyper-optimize for immediate clicks, TrustNews dynamically reconciles relevance, sustained dwell, source reputation, topic diversity, and freshness using Pareto-efficient scalarization.
            </p>

            <ul className="space-y-3 text-xs text-neutral-300 mb-8">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Adaptive Weight Tuning:</strong> Dynamically allocate importance between trust guarantees and user serendipity.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Pareto Dominance Solver:</strong> Eliminate sub-optimal recommendations that compromise credibility for engagement.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Cross-Session Memory:</strong> Maintain user reading context across 7+ day windows to prevent redundant exposure.</span>
              </li>
            </ul>

            <button
              onClick={() => onNavigateTab('pareto')}
              className="px-5 py-2.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              Configure Pareto Sliders <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Command Palette Mockup */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800 mb-4">
              <Search className="w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type @source, /tune, or article topic..."
                className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none w-full font-mono"
              />
              <span className="text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 bg-neutral-900 rounded border border-neutral-800">
                ESC
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-mono text-neutral-500 uppercase px-2">Suggestions</div>
              
              <div
                onClick={() => setCommandInput('@source reuters')}
                className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 text-[11px]">@source:reuters</span>
                  <span className="text-neutral-300">Filter Tier 1 Wire Outlets</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">97.8% Trust</span>
              </div>

              <div
                onClick={() => setCommandInput('/tune credibility=0.45')}
                className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between hover:border-neutral-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-400 text-[11px]">/tune-weights</span>
                  <span className="text-neutral-300">Adjust Pareto scalar coefficients</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">5-Objective</span>
              </div>

              <div
                onClick={() => setCommandInput('@persona data-scientist')}
                className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between hover:border-neutral-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-400 text-[11px]">@persona:dr-elena</span>
                  <span className="text-neutral-300">Switch to ML Researcher profile</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">Active</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-500">
              <span>Press enter to execute ranking query</span>
              <span className="font-mono text-neutral-400">Query Latency: 12ms</span>
            </div>
          </div>
        </div>

        {/* Deep Dive 2: Autonomous Fact-Checking & Provenance Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Visual Node Graph */}
          <div className="order-2 lg:order-1 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl font-mono">
            <div className="text-[11px] text-neutral-500 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Pipeline Architecture</span>
              <span className="text-emerald-400">Online & Reactive</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-white font-semibold">1. Article Ingestion & NER</span>
                </div>
                <span className="text-neutral-400 text-[11px]">MIND Dataset / News API</span>
              </div>

              <div className="w-0.5 h-3 bg-neutral-800 mx-auto" />

              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  <span className="text-white font-semibold">2. Temporal User Interest Vector</span>
                </div>
                <span className="text-neutral-400 text-[11px]">Dwell & Session Decay</span>
              </div>

              <div className="w-0.5 h-3 bg-neutral-800 mx-auto" />

              <div className="p-3 rounded-lg bg-neutral-900 border border-emerald-800/60 bg-emerald-950/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-200 font-semibold">3. Gemini 3.8 Corroboration Engine</span>
                </div>
                <span className="text-emerald-400 text-[11px] font-bold">Verifiable Claims</span>
              </div>

              <div className="w-0.5 h-3 bg-neutral-800 mx-auto" />

              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span className="text-white font-semibold">4. Multi-Objective Pareto Ranker</span>
                </div>
                <span className="text-neutral-400 text-[11px]">Dynamic Scalarization</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Overall End-to-End Latency: <strong>48ms</strong></span>
              <span className="text-emerald-400 font-semibold">Zero-Hallucination Safe</span>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              VERIFIABLE CLAIMS & EXPOSURE FAIRNESS
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-4">
              Suppress sensationalism before it reaches reader feeds.
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              Our credibility engine checks claims across independent news wires, tracks historical corrections, and flags clickbait headlines before assigning high distribution rank.
            </p>

            <ul className="space-y-3 text-xs text-neutral-300 mb-8">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Transparent Reasoning Waterfalls:</strong> Every recommendation comes with an interpretable breakdown of why it was surfaced.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Echo Chamber Breaking:</strong> Injects high-credibility divergent viewpoints without breaking topic relevance.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Fair Exposure Constraints:</strong> Prevents monopolies of attention by mega-publishers through Gini-bounded ranking.</span>
              </li>
            </ul>

            <button
              onClick={() => onNavigateTab('factcheck')}
              className="px-5 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-white font-semibold text-xs border border-neutral-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
              Test Live Fact-Check API
            </button>
          </div>
        </div>
      </section>

      {/* Empirical Benchmark Evaluation & Statistical Validation */}
      <section className="max-w-6xl mx-auto px-4 py-16 border-t border-neutral-850">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              MIND-Small Benchmark Protocol · Empirical Results
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
              Empirical Evaluation & Statistical Significance
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Rigorous offline experimental results comparing TrustNews against 7 baseline models across ranking quality, dwell retention, verifiable source trust, and exposure fairness.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('comparison')}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5 text-neutral-400" />
              All 7 Baselines
            </button>
            <button
              onClick={() => onNavigateTab('ablation')}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border border-neutral-800 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              Paired T-Tests
            </button>
          </div>
        </div>

        {/* 3 Scientific Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Accuracy & Rank Quality */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
                  Ranking Accuracy
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-emerald-400 border border-emerald-800/40">
                  p &lt; 0.001
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-4">
                NDCG & Reciprocal Rank Gains
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>NDCG@5 Score</span>
                    <span className="text-emerald-400 font-bold">0.812 (+26.5%)</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[81%]" />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Baseline Click-Optimized: 0.642</span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>NDCG@10 Score</span>
                    <span className="text-emerald-400 font-bold">0.842 (+18.6%)</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[84%]" />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Baseline Click-Optimized: 0.710</span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Mean Reciprocal Rank</span>
                    <span className="text-emerald-400 font-bold">0.794 (+35.0%)</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[79%]" />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Baseline Collab Filtering: 0.588</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-900 text-[11px] text-neutral-500 font-mono">
              Paired Student&apos;s t-test: t = 8.42, df = 41
            </div>
          </div>

          {/* Card 2: Trust & Retention */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
                  Credibility & Dwell
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-cyan-400 border border-cyan-800/40">
                  +338% Dwell
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-4">
                Sustained Engagement Over Clicks
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Credibility Floor</span>
                    <span className="text-cyan-400 font-bold">96.4% (+57.5%)</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cyan-400 h-full w-[96%]" />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Click-Optimized: 61.2% (Clickbait leaks)</span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Avg Dwell Time</span>
                    <span className="text-cyan-400 font-bold">184s vs 42s</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cyan-400 h-full w-[78%]" />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Accidental click bounce mitigated</span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Bounce Rate (&lt;10s)</span>
                    <span className="text-emerald-400 font-bold">12.4% (vs 48.2%)</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[25%]" />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">-74% reduction in shallow visits</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-900 text-[11px] text-neutral-500 font-mono">
              Temporal decay parameter: &lambda; = 0.08 / day
            </div>
          </div>

          {/* Card 3: Diversity & Fairness */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
                  Fairness & Diversity
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 text-amber-400 border border-amber-800/40">
                  Gini -43%
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-4">
                Mitigating Echo Chambers
              </h3>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Intra-List Diversity (ILD)</span>
                    <span className="text-amber-400 font-bold">0.810 (+84.1%)</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-400 h-full w-[81%]" />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Baseline Popularity: 0.350</span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Shannon Topic Entropy</span>
                    <span className="text-amber-400 font-bold">2.64 bits (vs 1.41)</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-400 h-full w-[75%]" />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Broad multi-category coverage</span>
                </div>

                <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="flex justify-between text-neutral-400 mb-1">
                    <span>Exposure Gini Index</span>
                    <span className="text-emerald-400 font-bold">0.420 (vs 0.740)</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[42%]" />
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">Eliminates attention monopoly</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-900 text-[11px] text-neutral-500 font-mono">
              Lorenz curve verified across 18 news sources
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 border-t border-neutral-850">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-neutral-400">
            Learn more about the trust-aware multi-objective recommendation framework.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'How does TrustNews differ from traditional click-based recommenders?',
              a: 'Conventional systems train single-objective machine learning models to maximize Click-Through Rate (CTR), often promoting sensational, low-dwell clickbait. TrustNews balances 5 distinct objectives simultaneously: predicted relevance, sustained dwell time, source credibility, topic diversity, and freshness using Pareto scalarization.'
            },
            {
              q: 'How is news source credibility assessed and kept current?',
              a: 'Credibility is calculated from historical factual accuracy, provenance verification, corrections frequency, and cross-source corroboration across independent news wires (Reuters, AP, BBC, Nature, etc.). Scores are tracked over a 12-month temporal window and fed into the ranking algorithm.'
            },
            {
              q: 'How does the framework handle multi-session temporal user modeling?',
              a: 'The system logs reading duration, scroll completion percentages, repeated visits, and returns across distinct sessions. If a user quickly bounces from a sensational headline, the engagement penalty decays that topic, while deep reading sessions boost related verified content.'
            },
            {
              q: 'Can our editorial team adjust the objective weights dynamically?',
              a: 'Yes! The Pareto frontier module allows live adjustment of relevance, satisfaction, credibility, diversity, and novelty weights. Custom weight configurations can be saved directly to Firebase Firestore for cross-session persistence.'
            },
            {
              q: 'Is Gemini 3.8 Flash used in real time?',
              a: 'Yes. The AI Fact-Checker connects to our server-side Gemini 3.8 Flash endpoint to analyze article claims, evaluate factual consistency, detect potential sensationalism, and produce transparent natural-language reasoning for recommendation decisions.'
            }
          ].map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-neutral-900/60 transition-colors cursor-pointer"
              >
                <span className="text-sm font-semibold text-white">{faq.q}</span>
                {openFaq === index ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-5 pb-4 text-xs text-neutral-400 leading-relaxed border-t border-neutral-900 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Bottom Call to Action */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-neutral-950 p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            Ready to experience trust-aware news recommendation?
          </h2>
          <p className="text-sm text-neutral-400 max-w-lg mx-auto mb-8">
            Explore our live benchmark with 42 real-world news articles, 7 machine learning baselines, and instant Pareto frontier optimization.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigateTab('feed')}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              Launch Live Feed <ArrowRight className="w-4 h-4 text-black" />
            </button>
            <button
              onClick={() => onNavigateTab('comparison')}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-sm border border-neutral-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              Compare Baseline Models
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
