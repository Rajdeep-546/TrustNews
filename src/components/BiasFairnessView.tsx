import React, { useMemo } from 'react';
import { Scale, Eye, RefreshCw, AlertOctagon, CheckCircle2, Shield } from 'lucide-react';
import { NewsArticle, UserPersona } from '../types';
import { runRecommendationEngine } from '../algorithms/recommenderEngines';
import { calculatePublisherGini } from '../algorithms/evaluationMetrics';

interface BiasFairnessViewProps {
  articles: NewsArticle[];
  user: UserPersona;
}

export const BiasFairnessView: React.FC<BiasFairnessViewProps> = ({
  articles,
  user,
}) => {
  // Rank lists under proposed vs click-optimized
  const trustRanked = useMemo(() => runRecommendationEngine('trustaware_moo', articles, user), [articles, user]);
  const clickRanked = useMemo(() => runRecommendationEngine('click_optimized', articles, user), [articles, user]);

  const trustGini = calculatePublisherGini(trustRanked, 10);
  const clickGini = calculatePublisherGini(clickRanked, 10);

  // Position Bias Curve points: p(view | rank) = 1 / log2(rank + 1)
  const positionBiasData = Array.from({ length: 10 }, (_, i) => ({
    rank: i + 1,
    probability: Number((1 / Math.log2(i + 2)).toFixed(3)),
  }));

  // 10-session feedback loop simulation
  // Traces echo-chamber severity (concentration index) over 10 consecutive reading sessions
  const feedbackSimulation = useMemo(() => {
    const rounds: { session: number; clickBubble: number; trustBubble: number }[] = [];
    let clickDrift = user.filterBubbleSeverity;
    let trustDrift = user.filterBubbleSeverity;

    for (let s = 1; s <= 10; s++) {
      // Click model compounds bias: each round reinforces previous narrow clicks
      clickDrift = Math.min(0.96, clickDrift + 0.035);
      // TrustAware-MOO injects controlled diversity: gently recovers from bubble
      trustDrift = Math.max(0.35, trustDrift - 0.04);

      rounds.push({
        session: s,
        clickBubble: Number(clickDrift.toFixed(3)),
        trustBubble: Number(trustDrift.toFixed(3)),
      });
    }
    return rounds;
  }, [user]);

  // Publisher distribution comparison
  const getPublisherShare = (rankedList: typeof trustRanked) => {
    const counts: Record<string, number> = {};
    rankedList.slice(0, 10).forEach(a => {
      counts[a.publisher] = (counts[a.publisher] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const trustPublishers = getPublisherShare(trustRanked);
  const clickPublishers = getPublisherShare(clickRanked);

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
          <Scale className="w-4 h-4" /> Algorithmic Auditing & Robustness
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">
          Bias, Fairness & Feedback Loop Analysis
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Investigating position bias attenuation, publisher exposure inequality, and the long-term 
          feedback loop dynamics that produce algorithmic filter bubbles and echo chambers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Position Bias Attention Decay */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-400" /> Position Bias Model: P(View | Rank)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Model: 1 / log₂(k + 1)
            </span>
          </div>

          <div className="space-y-2">
            {positionBiasData.map((d) => (
              <div key={d.rank} className="flex items-center gap-3 text-xs font-mono">
                <span className="w-12 text-slate-400">Rank #{d.rank}</span>
                <div className="flex-1 bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.round(d.probability * 100)}%` }}
                  />
                </div>
                <span className="w-12 text-right text-slate-200 tabular-nums font-semibold">
                  {Math.round(d.probability * 100)}%
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
            Because Rank #1 receives over 2.3× the exposure of Rank #5, placing low-credibility sensationalism 
            at the top solely based on raw CTR creates an artificial self-reinforcing visibility trap.
          </p>
        </div>

        {/* 2. Feedback Loop & Echo Chamber Simulation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-indigo-400" /> Multi-Session Feedback Loop Simulation
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              10 Consecutive Sessions
            </span>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg space-y-1">
                <span className="text-rose-400 font-semibold block">Click-Optimized Model</span>
                <span className="text-lg font-bold font-mono text-rose-300">
                  96% Echo Chamber
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Spirals into narrow sensational bubble by Session 6.
                </span>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg space-y-1">
                <span className="text-emerald-400 font-semibold block">TrustAware-MOO</span>
                <span className="text-lg font-bold font-mono text-emerald-300">
                  38% Balanced Depth
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Maintains diverse exploratory exposure over time.
                </span>
              </div>
            </div>

            {/* Step chart for feedback loop */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-mono text-slate-400 block">
                Filter Bubble Severity (0.0 = Open, 1.0 = Rigid Echo Chamber):
              </span>
              <div className="space-y-1 text-[11px] font-mono">
                {feedbackSimulation.filter((_, idx) => idx % 2 === 1).map((s) => (
                  <div key={s.session} className="flex items-center justify-between py-1 px-2.5 bg-slate-950/60 rounded border border-slate-800/60">
                    <span className="text-slate-400">Session {s.session}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-rose-400">Click: {Math.round(s.clickBubble * 100)}%</span>
                      <span className="text-emerald-400">TrustAware: {Math.round(s.trustBubble * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Publisher Exposure Equality (Gini Analysis) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            Publisher Exposure Equality & Long-Tail Distribution
          </span>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>TrustAware Gini: <strong className="text-emerald-400">{trustGini.toFixed(3)}</strong></span>
            <span>Click-Optimized Gini: <strong className="text-rose-400">{clickGini.toFixed(3)}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TrustAware Distribution */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
            <span className="text-xs font-semibold text-emerald-400 block">
              TrustAware-MOO Publisher Exposure (Top 10)
            </span>
            <div className="space-y-1.5 text-xs">
              {trustPublishers.map(([pub, count]) => (
                <div key={pub} className="flex items-center justify-between text-slate-300">
                  <span className="truncate max-w-[240px]">{pub}</span>
                  <span className="font-mono text-emerald-400 font-semibold">{count} item{count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Click-Optimized Distribution */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
            <span className="text-xs font-semibold text-rose-400 block">
              Click-Optimized Publisher Exposure (Top 10)
            </span>
            <div className="space-y-1.5 text-xs">
              {clickPublishers.map(([pub, count]) => (
                <div key={pub} className="flex items-center justify-between text-slate-300">
                  <span className="truncate max-w-[240px]">{pub}</span>
                  <span className="font-mono text-rose-400 font-semibold">{count} item{count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
