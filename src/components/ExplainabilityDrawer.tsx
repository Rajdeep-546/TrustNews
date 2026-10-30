import React, { useState } from 'react';
import { X, CheckCircle2, AlertOctagon, HelpCircle, Network, Sparkles, Scale, Info } from 'lucide-react';
import { ScoredArticle, UserPersona } from '../types';

interface ExplainabilityDrawerProps {
  article: ScoredArticle | null;
  user: UserPersona;
  onClose: () => void;
}

export const ExplainabilityDrawer: React.FC<ExplainabilityDrawerProps> = ({
  article,
  user,
  onClose,
}) => {
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  if (!article) return null;

  const scores = article.computedScores;
  const dec = scores.decomposed;

  const fetchAiExplanation = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/explain/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article,
          userPersona: user,
          rank: scores.rank,
          scoreBreakdown: {
            relevance: dec.relevancePt,
            credibility: dec.credibilityPt,
            satisfaction: dec.satisfactionPt,
            diversity: dec.diversityPt,
            clickbaitPenalty: dec.clickbaitPenaltyPt,
          },
        }),
      });
      const data = await res.json();
      setAiRationale(data.explanation);
    } catch {
      setAiRationale(`Ranked #${scores.rank} because it matches your interest in ${article.category} while maintaining high verified factual standards.`);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono font-bold text-xs">
              #{scores.rank}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">Ranking Explainability & Transparency</h3>
              <p className="text-xs text-slate-400">Score decomposition & credibility audit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Article Summary */}
        <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/80 space-y-2">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="text-indigo-400 font-medium">{article.category}</span>
            <span>·</span>
            <span>{article.publisher}</span>
          </div>
          <h4 className="text-sm font-medium text-slate-200 leading-snug">{article.title}</h4>
        </div>

        {/* Multi-Objective Score Waterfall Decomposition */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Score Component Breakdown
            </span>
            <span className="text-xs font-mono text-indigo-400 font-semibold">
              Final Rank Score: {scores.finalRankScore.toFixed(3)}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Relevance */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-slate-950/40 rounded border border-slate-800/40">
              <span className="text-slate-300">Topical Relevance Match</span>
              <span className="font-mono text-emerald-400 font-medium">+{dec.relevancePt.toFixed(3)}</span>
            </div>

            {/* Credibility */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-slate-950/40 rounded border border-slate-800/40">
              <span className="text-slate-300">Verified Credibility & Provenance</span>
              <span className="font-mono text-emerald-400 font-medium">+{dec.credibilityPt.toFixed(3)}</span>
            </div>

            {/* Satisfaction */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-slate-950/40 rounded border border-slate-800/40">
              <span className="text-slate-300">Predicted Reading Satisfaction & Dwell</span>
              <span className="font-mono text-emerald-400 font-medium">+{dec.satisfactionPt.toFixed(3)}</span>
            </div>

            {/* Diversity */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-slate-950/40 rounded border border-slate-800/40">
              <span className="text-slate-300">Intra-List Diversity (ILD) Boost</span>
              <span className="font-mono text-indigo-400 font-medium">+{dec.diversityPt.toFixed(3)}</span>
            </div>

            {/* Novelty */}
            <div className="flex items-center justify-between py-1.5 px-3 bg-slate-950/40 rounded border border-slate-800/40">
              <span className="text-slate-300">Exploration Novelty (Echo Chamber Mitigation)</span>
              <span className="font-mono text-indigo-400 font-medium">+{dec.noveltyPt.toFixed(3)}</span>
            </div>

            {/* Clickbait Penalty */}
            {dec.clickbaitPenaltyPt > 0 && (
              <div className="flex items-center justify-between py-1.5 px-3 bg-rose-950/20 rounded border border-rose-800/30">
                <span className="text-rose-300">Sensational Clickbait Penalty</span>
                <span className="font-mono text-rose-400 font-medium">-{dec.clickbaitPenaltyPt.toFixed(3)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Credibility Evidence & Epistemic Uncertainty */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Network className="w-4 h-4 text-indigo-400" /> Factual Provenance & Corroboration
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60 space-y-1">
              <span className="text-slate-400 block">Source Reliability</span>
              <span className="text-sm font-semibold text-white font-mono">
                {Math.round(article.sourceReliability * 100)}%
              </span>
              <span className="text-[11px] text-slate-500 block truncate">{article.sourceTier}</span>
            </div>

            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60 space-y-1">
              <span className="text-slate-400 block">Independent Corroboration</span>
              <span className="text-sm font-semibold text-emerald-400 font-mono">
                {article.corroborationCount} Outlets
              </span>
              <span className="text-[11px] text-slate-500 block">Cross-wire factual alignment</span>
            </div>
          </div>

          {/* Uncertainty Error Bar */}
          <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Epistemic Uncertainty Margin</span>
              <span className="font-mono text-slate-400">
                ±{Math.round(article.uncertainty * 100)}% variance
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400/80 h-full rounded-full"
                style={{ width: `${Math.round(article.uncertainty * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Low uncertainty indicates high agreement between independent wire services, verified author credentials, and archival consistency.
            </p>
          </div>
        </div>

        {/* Plain-Language Transparency Justification */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Plain-Language Transparency Rationale
            </span>
            {!aiRationale && (
              <button
                onClick={fetchAiExplanation}
                disabled={loadingAi}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
              >
                {loadingAi ? 'Synthesizing...' : 'Generate with Gemini'}
              </button>
            )}
          </div>

          <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-lg text-xs text-indigo-200 leading-relaxed">
            {aiRationale ? (
              <p>{aiRationale}</p>
            ) : (
              <p>
                Recommended at rank #{scores.rank} for <strong className="text-white">{user.name}</strong> because it establishes a 
                strong topical alignment with your {article.category} interests ({Math.round(scores.relevance * 100)}%), while upholding 
                rigorous source reliability from {article.publisher} with {article.corroborationCount} corroborated independent reports.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
