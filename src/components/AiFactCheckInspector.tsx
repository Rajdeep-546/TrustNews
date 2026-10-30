import React, { useState } from 'react';
import { Sparkles, ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, Search, ArrowRight, Loader2, Bookmark, BookmarkCheck } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';

interface CredibilityAnalysisResult {
  sourceReliability: number;
  sourceTier: string;
  provenanceScore: number;
  corroborationScore: number;
  corroborationCount: number;
  clickbaitPenalty: number;
  factualConsistency: number;
  uncertainty: number;
  overallCredibility: number;
  factCheckStatus: 'VERIFIED' | 'UNVERIFIED_DEVELOPING' | 'DISPUTED_SENSATIONAL';
  reasoning: string;
}

const PRESET_CLAIMS = [
  {
    title: 'Astronomers Confirm James Webb Spectroscopic Detection of Biogenic Phosphine in Exoplanet Atmosphere',
    abstract: 'Peer-reviewed spectroscopic analysis from three independent telescope arrays detects 4.2-sigma atmospheric anomaly matching volatile phosphorus compounds on K2-18b.',
    publisher: 'Nature Astronomy',
  },
  {
    title: 'Secret Miracle Seed Discovered by Monks Dissolves All Arterial Plaque in 48 Hours!',
    abstract: 'Cardiologists are desperate to ban this shocking ancient remedy. Just one spoonful before bed cleanses veins completely. Click here before the video gets taken down!',
    publisher: 'Viral Miracle Truths',
  },
  {
    title: 'G7 Finance Ministers Announce Framework for Central Bank Digital Currency Interoperability',
    abstract: 'Joint communiqué outlines shared cryptographic standards and privacy baselines to facilitate real-time wholesale cross-border financial settlement.',
    publisher: 'Reuters Financial Wire',
  },
];

export const AiFactCheckInspector: React.FC = () => {
  const { currentUser, saveAuditToDb, savedAudits } = useFirebase();
  const [title, setTitle] = useState(PRESET_CLAIMS[0].title);
  const [abstract, setAbstract] = useState(PRESET_CLAIMS[0].abstract);
  const [publisher, setPublisher] = useState(PRESET_CLAIMS[0].publisher);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CredibilityAnalysisResult | null>(null);
  const [savedCurrent, setSavedCurrent] = useState(false);

  const handleAnalyze = async (customTitle = title, customAbs = abstract, customPub = publisher) => {
    setLoading(true);
    try {
      const res = await fetch('/api/credibility/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          abstract: customAbs,
          publisher: customPub,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (p: typeof PRESET_CLAIMS[0]) => {
    setTitle(p.title);
    setAbstract(p.abstract);
    setPublisher(p.publisher);
    handleAnalyze(p.title, p.abstract, p.publisher);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> Live AI Credibility & Fact-Check Engine
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">
          Fact-Check & Credibility Assessment Module
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Evaluate any news article, custom headline, or breaking report in real-time. 
          Powered by Gemini 3.8 Flash, this module performs source reliability tiering, provenance tracking, 
          cross-wire corroboration likelihood, linguistic sensationalism detection, and epistemic uncertainty quantification.
        </p>
      </div>

      {/* Preset Test Claims */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Preset Benchmark Claims for Testing:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_CLAIMS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(p)}
              className="p-3 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-left transition-colors cursor-pointer space-y-1"
            >
              <span className="text-[11px] text-indigo-400 font-medium block truncate">
                {p.publisher}
              </span>
              <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">
                {p.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Article Title / Headline:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter news headline..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Source Publisher:</label>
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Reuters, Nature, Viral Buzz"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">Article Abstract / Excerpt:</label>
          <textarea
            rows={3}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Paste article body or lead paragraph..."
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !title}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Evaluating Credibility...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Analyze Credibility & Corroboration
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {result && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-slate-400 block font-mono">Assessment Summary</span>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                Overall Credibility Score: 
                <span className={`font-mono text-lg ${
                  result.overallCredibility >= 0.75 ? 'text-emerald-400' : (result.overallCredibility >= 0.45 ? 'text-amber-400' : 'text-rose-400')
                }`}>
                  {Math.round(result.overallCredibility * 100)}%
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 ${
                result.factCheckStatus === 'VERIFIED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : result.factCheckStatus === 'UNVERIFIED_DEVELOPING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {result.factCheckStatus === 'VERIFIED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {result.factCheckStatus === 'UNVERIFIED_DEVELOPING' && <AlertTriangle className="w-3.5 h-3.5" />}
                {result.factCheckStatus === 'DISPUTED_SENSATIONAL' && <ShieldAlert className="w-3.5 h-3.5" />}
                {result.factCheckStatus}
              </span>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-sans">Source Reliability</span>
              <span className="text-base font-bold text-white">
                {Math.round(result.sourceReliability * 100)}%
              </span>
              <span className="text-[11px] text-slate-500 block truncate font-sans">{result.sourceTier}</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-sans">Cross-Wire Corroboration</span>
              <span className="text-base font-bold text-emerald-400">
                {result.corroborationCount} Outlets
              </span>
              <span className="text-[11px] text-slate-500 block font-sans">
                {Math.round(result.corroborationScore * 100)}% consensus
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-sans">Clickbait Linguistic Risk</span>
              <span className={`text-base font-bold ${
                result.clickbaitPenalty > 0.40 ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {Math.round(result.clickbaitPenalty * 100)}%
              </span>
              <span className="text-[11px] text-slate-500 block font-sans">
                {result.clickbaitPenalty > 0.40 ? 'Sensational markers' : 'Neutral objective style'}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block font-sans">Epistemic Uncertainty</span>
              <span className="text-base font-bold text-amber-400">
                ±{Math.round(result.uncertainty * 100)}%
              </span>
              <span className="text-[11px] text-slate-500 block font-sans">Variance bound</span>
            </div>
          </div>

          {/* Reasoning / Rationale */}
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 uppercase font-mono text-[10px] block">
                Evaluator Reasoning & Audit Log:
              </span>
              {currentUser && (
                <button
                  onClick={() => {
                    saveAuditToDb({
                      ...result,
                      title,
                      publisher,
                    });
                    setSavedCurrent(true);
                  }}
                  disabled={savedCurrent}
                  className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                    savedCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {savedCurrent ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5" /> Saved to Firestore
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" /> Save Audit to Firestore
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-slate-200 leading-relaxed font-sans">
              {result.reasoning}
            </p>
          </div>
        </div>
      )}

      {/* Persisted Audits History from Firestore */}
      {currentUser && savedAudits.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" /> Your Persisted Firestore Audits ({savedAudits.length})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Synced to Firestore Collection
            </span>
          </div>

          <div className="space-y-2">
            {savedAudits.map((audit) => (
              <div
                key={audit.id}
                className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-white block line-clamp-1">{audit.title}</span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{audit.publisher}</span>
                    <span aria-hidden="true">·</span>
                    <span>{audit.sourceTier}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-mono font-bold ${
                    audit.credibilityScore >= 0.75 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {Math.round(audit.credibilityScore * 100)}%
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    audit.factCheckStatus === 'VERIFIED'
                      ? 'text-emerald-300 bg-emerald-500/10'
                      : 'text-amber-300 bg-amber-500/10'
                  }`}>
                    {audit.factCheckStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
