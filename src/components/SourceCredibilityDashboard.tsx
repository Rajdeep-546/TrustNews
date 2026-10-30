import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Search, Filter, TrendingUp, AlertTriangle, 
  ExternalLink, Calendar, CheckCircle2, ShieldAlert, Info,
  Sliders, ArrowUpRight, ArrowDownRight, Layers, X
} from 'lucide-react';
import { NewsSourceProfile, SourceTier } from '../types';
import { NEWS_SOURCES_REGISTRY } from '../data/newsSourcesData';

type TierFilter = 'ALL' | 'HIGH_TRUST' | 'MODERATE_TRUST' | 'LOW_TRUST_TABLOID';
type StatusFilter = 'ALL' | 'BOOSTED' | 'NORMAL' | 'FILTERED_OUT';

export const SourceCredibilityDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedSourceForDossier, setSelectedSourceForDossier] = useState<NewsSourceProfile | null>(null);

  // Selected source IDs for comparative time-series trend plotting
  const [comparedSourceIds, setComparedSourceIds] = useState<string[]>([
    'src_reuters',
    'src_mit_tech',
    'src_star_tabloid',
  ]);

  // Filter sources
  const filteredSources = useMemo(() => {
    return NEWS_SOURCES_REGISTRY.filter(source => {
      // Search
      const matchesSearch = 
        source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        source.ownershipType.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Tier filter
      if (tierFilter === 'HIGH_TRUST' && source.overallCredibilityScore < 0.85) return false;
      if (tierFilter === 'MODERATE_TRUST' && (source.overallCredibilityScore < 0.65 || source.overallCredibilityScore >= 0.85)) return false;
      if (tierFilter === 'LOW_TRUST_TABLOID' && source.overallCredibilityScore >= 0.65) return false;

      // Status filter
      if (statusFilter === 'BOOSTED' && source.rankingExposureStatus !== 'BOOSTED') return false;
      if (statusFilter === 'NORMAL' && source.rankingExposureStatus !== 'NORMAL') return false;
      if (statusFilter === 'FILTERED_OUT' && source.rankingExposureStatus !== 'FILTERED_OUT') return false;

      return true;
    });
  }, [searchQuery, tierFilter, statusFilter]);

  // Aggregate KPIs
  const totalCount = NEWS_SOURCES_REGISTRY.length;
  const highTrustCount = NEWS_SOURCES_REGISTRY.filter(s => s.overallCredibilityScore >= 0.85).length;
  const filteredOutCount = NEWS_SOURCES_REGISTRY.filter(s => s.rankingExposureStatus === 'FILTERED_OUT').length;
  const avgCredibility = (NEWS_SOURCES_REGISTRY.reduce((acc, s) => acc + s.overallCredibilityScore, 0) / totalCount) * 100;

  // Time-Series Plot Dimensions
  const plotWidth = 680;
  const plotHeight = 240;
  const padLeft = 45;
  const padBottom = 35;
  const padRight = 25;
  const padTop = 20;

  const months = NEWS_SOURCES_REGISTRY[0]?.monthlyHistory.map(m => m.month) || [];
  const numMonths = months.length;

  const scaleX = (idx: number) => padLeft + (idx / (numMonths - 1)) * (plotWidth - padLeft - padRight);
  const scaleY = (score: number) => plotHeight - padBottom - (score * (plotHeight - padTop - padBottom));

  const palette = ['#10b981', '#6366f1', '#f43f5e', '#f59e0b', '#38bdf8'];

  const toggleComparedSource = (id: string) => {
    if (comparedSourceIds.includes(id)) {
      if (comparedSourceIds.length > 1) {
        setComparedSourceIds(comparedSourceIds.filter(item => item !== id));
      }
    } else {
      if (comparedSourceIds.length < 5) {
        setComparedSourceIds([...comparedSourceIds, id]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Transparency & Provenance Registry
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">
          News Source Credibility & 12-Month Temporal Audit Dashboard
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Complete transparency into the trust-aware ranking mechanism. Each publisher's credibility index is computed 
          from verified journalistic standards, primary source attribution, cross-wire corroboration consensus, 
          and factual retraction histories. Low-credibility sources ($&lt; 0.40$) are automatically filtered out 
          by the Trust Gate, preventing sensational clickbait from monopolizing reader exposure.
        </p>
      </div>

      {/* Aggregate Registry KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">Monitored Publishers</span>
          <span className="text-xl font-bold font-mono text-white tracking-tight tabular-nums">
            {totalCount} Sources
          </span>
          <span className="text-[11px] text-slate-500 block font-mono">
            Across 5 Source Tiers
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">High-Trust Tier 1/2</span>
          <span className="text-xl font-bold font-mono text-emerald-400 tracking-tight tabular-nums">
            {highTrustCount} Sources
          </span>
          <span className="text-[11px] text-emerald-500/80 block font-mono">
            {Math.round((highTrustCount / totalCount) * 100)}% of candidate pool
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">Suppressed by Trust Gate</span>
          <span className="text-xl font-bold font-mono text-rose-400 tracking-tight tabular-nums">
            {filteredOutCount} Tabloids
          </span>
          <span className="text-[11px] text-slate-500 block font-mono">
            τ &lt; 0.40 Gate Enforced
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[11px] text-slate-400 font-medium block">Mean Registry Credibility</span>
          <span className="text-xl font-bold font-mono text-indigo-400 tracking-tight tabular-nums">
            {avgCredibility.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-500 block font-mono">
            12-month net trend: +1.4%
          </span>
        </div>
      </div>

      {/* 12-Month Temporal Trends Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> 12-Month Credibility Score Trends (Nov '25 – Oct '26)
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select publishers below to compare historical trust trajectories and algorithmic exposure multipliers.
            </p>
          </div>

          {/* Quick source selector toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            {NEWS_SOURCES_REGISTRY.slice(0, 7).map((s, idx) => {
              const isSelected = comparedSourceIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleComparedSource(s.id)}
                  className={`px-2 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-slate-600'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG Time-Series Chart */}
        <div className="w-full bg-slate-950 rounded-lg p-3 border border-slate-800/80 overflow-hidden">
          <svg viewBox={`0 0 ${plotWidth} ${plotHeight}`} className="w-full h-auto select-none">
            {/* Horizontal Grid lines */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((val) => (
              <g key={`y-${val}`}>
                <line
                  x1={padLeft}
                  y1={scaleY(val)}
                  x2={plotWidth - padRight}
                  y2={scaleY(val)}
                  stroke="#1e293b"
                  strokeDasharray="3,3"
                />
                <text
                  x={padLeft - 6}
                  y={scaleY(val) + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {Math.round(val * 100)}%
                </text>
              </g>
            ))}

            {/* Trust Threshold Gate Line (tau = 0.40) */}
            <line
              x1={padLeft}
              y1={scaleY(0.40)}
              x2={plotWidth - padRight}
              y2={scaleY(0.40)}
              stroke="#e11d48"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.8"
            />
            <text
              x={plotWidth - padRight - 8}
              y={scaleY(0.40) - 5}
              textAnchor="end"
              fill="#fb7185"
              fontSize="9"
              fontFamily="monospace"
            >
              Trust Gate Threshold (τ = 0.40)
            </text>

            {/* X-axis months */}
            {months.map((m, idx) => (
              <text
                key={m}
                x={scaleX(idx)}
                y={plotHeight - 12}
                textAnchor="middle"
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
              >
                {m}
              </text>
            ))}

            {/* Source lines */}
            {comparedSourceIds.map((sourceId, sIdx) => {
              const src = NEWS_SOURCES_REGISTRY.find(s => s.id === sourceId);
              if (!src) return null;
              const color = palette[sIdx % palette.length];

              const pathData = src.monthlyHistory
                .map((pt, pIdx) => `${pIdx === 0 ? 'M' : 'L'} ${scaleX(pIdx)} ${scaleY(pt.score)}`)
                .join(' ');

              return (
                <g key={src.id}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  {src.monthlyHistory.map((pt, pIdx) => (
                    <circle
                      key={`${src.id}-${pIdx}`}
                      cx={scaleX(pIdx)}
                      cy={scaleY(pt.score)}
                      r="3.5"
                      fill={color}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      className="cursor-pointer hover:r-5 transition-all"
                    >
                      <title>{`${src.name} (${pt.month}): ${Math.round(pt.score * 100)}% | Exposure: ${pt.exposureMultiplier}x`}</title>
                    </circle>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 pt-1 text-xs">
          {comparedSourceIds.map((sourceId, idx) => {
            const src = NEWS_SOURCES_REGISTRY.find(s => s.id === sourceId);
            if (!src) return null;
            const color = palette[idx % palette.length];

            return (
              <div key={src.id} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-slate-200 font-medium">{src.name}</span>
                <span className="font-mono text-slate-400 tabular-nums">
                  ({Math.round(src.overallCredibilityScore * 100)}%)
                </span>
                <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                  src.rankingExposureStatus === 'BOOSTED'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : src.rankingExposureStatus === 'FILTERED_OUT'
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-slate-400 bg-slate-800'
                }`}>
                  {src.exposureMultiplier}x Exposure
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Filter Toolbar & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search publisher, domain, or ownership model..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            />
          </div>

          {/* Tier Filter segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setTierFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                tierFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setTierFilter('HIGH_TRUST')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                tierFilter === 'HIGH_TRUST'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              High Trust (≥ 85%)
            </button>
            <button
              onClick={() => setTierFilter('MODERATE_TRUST')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                tierFilter === 'MODERATE_TRUST'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Solid (65–84%)
            </button>
            <button
              onClick={() => setTierFilter('LOW_TRUST_TABLOID')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                tierFilter === 'LOW_TRUST_TABLOID'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Tabloid (&lt; 65%)
            </button>
          </div>
        </div>
      </div>

      {/* Sources Data Grid / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">
            Publishers Registry ({filteredSources.length} of {NEWS_SOURCES_REGISTRY.length} listed)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Click row for full transparent audit dossier
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Publisher & Domain</th>
                <th className="py-3 px-3">Ownership Model</th>
                <th className="py-3 px-3 text-right">Standards</th>
                <th className="py-3 px-3 text-right">Provenance</th>
                <th className="py-3 px-3 text-right">Corroboration</th>
                <th className="py-3 px-3 text-right">Sensationalism</th>
                <th className="py-3 px-3 text-right">Credibility Index</th>
                <th className="py-3 px-3 text-right">Re-Ranking Impact</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSources.map((source) => {
                const isFilteredOut = source.rankingExposureStatus === 'FILTERED_OUT';
                const isBoosted = source.rankingExposureStatus === 'BOOSTED';

                return (
                  <tr
                    key={source.id}
                    onClick={() => setSelectedSourceForDossier(source)}
                    className={`cursor-pointer transition-colors ${
                      isFilteredOut
                        ? 'bg-rose-950/10 hover:bg-rose-950/20'
                        : isBoosted
                        ? 'hover:bg-slate-800/60'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Publisher */}
                    <td className="py-3 px-4 font-sans text-slate-200">
                      <div className="space-y-0.5">
                        <span className="font-semibold block text-white">{source.name}</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span>{source.domain}</span>
                          <span aria-hidden="true">·</span>
                          <span>Est. {source.establishedYear}</span>
                        </div>
                      </div>
                    </td>

                    {/* Ownership */}
                    <td className="py-3 px-3 font-sans text-slate-300">
                      <span className="text-[11px] block">{source.ownershipType}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{source.country}</span>
                    </td>

                    {/* Component scores */}
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {Math.round(source.journalisticStandardsScore * 100)}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {Math.round(source.attributionProvenanceScore * 100)}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                      {Math.round(source.corroborationConsensusScore * 100)}%
                    </td>
                    <td className={`py-3 px-3 text-right tabular-nums ${
                      source.sensationalismIndex > 0.40 ? 'text-rose-400 font-semibold' : 'text-slate-400'
                    }`}>
                      {Math.round(source.sensationalismIndex * 100)}%
                    </td>

                    {/* Overall Credibility */}
                    <td className="py-3 px-3 text-right">
                      <div className="space-y-1 inline-block text-right">
                        <span className={`text-sm font-bold tabular-nums block ${
                          source.overallCredibilityScore >= 0.85
                            ? 'text-emerald-400'
                            : source.overallCredibilityScore >= 0.65
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}>
                          {Math.round(source.overallCredibilityScore * 100)}%
                        </span>
                        <div className="w-16 bg-slate-800 h-1 rounded-full overflow-hidden ml-auto">
                          <div
                            className={`h-full rounded-full ${
                              source.overallCredibilityScore >= 0.85
                                ? 'bg-emerald-500'
                                : source.overallCredibilityScore >= 0.65
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.round(source.overallCredibilityScore * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Re-ranking Impact */}
                    <td className="py-3 px-3 text-right">
                      <span className={`text-[11px] font-semibold font-mono block ${
                        isBoosted
                          ? 'text-emerald-400'
                          : isFilteredOut
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}>
                        {isFilteredOut ? 'Filtered (τ < 0.40)' : `${source.exposureMultiplier}x Multiplier`}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans block">
                        {isBoosted ? '+35% Exposure Boost' : isFilteredOut ? 'Zero Feed Placement' : 'Standard Weight'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSourceForDossier(source);
                        }}
                        className="px-2.5 py-1 text-[11px] text-indigo-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors font-sans"
                      >
                        Audit Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Dossier Modal / Drawer */}
      {selectedSourceForDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedSourceForDossier.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedSourceForDossier.domain} · Est. {selectedSourceForDossier.establishedYear}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSourceForDossier(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Credibility Score Big KPI */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Current Audit Credibility</span>
                <span className={`text-2xl font-bold font-mono ${
                  selectedSourceForDossier.overallCredibilityScore >= 0.85
                    ? 'text-emerald-400'
                    : selectedSourceForDossier.overallCredibilityScore >= 0.65
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {Math.round(selectedSourceForDossier.overallCredibilityScore * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    selectedSourceForDossier.overallCredibilityScore >= 0.85
                      ? 'bg-emerald-500'
                      : selectedSourceForDossier.overallCredibilityScore >= 0.65
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.round(selectedSourceForDossier.overallCredibilityScore * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 block pt-1 font-sans">
                {selectedSourceForDossier.sourceTier}
              </span>
            </div>

            {/* Ranking Mechanism Impact */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-2 text-xs">
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Re-Ranking Mechanism Treatment
              </span>
              <p className="text-indigo-200 leading-relaxed font-sans">
                {selectedSourceForDossier.rankingExposureStatus === 'BOOSTED' && (
                  <>Receives a <strong className="text-white">+{Math.round((selectedSourceForDossier.exposureMultiplier - 1) * 100)}% exposure boost</strong> in the TrustAware-MOO pipeline, ensuring corroborated reporting surfaces above unverified competitors.</>
                )}
                {selectedSourceForDossier.rankingExposureStatus === 'NORMAL' && (
                  <>Evaluated with standard baseline exposure weighting ({selectedSourceForDossier.exposureMultiplier}x multiplier), constrained by MMR topic diversity.</>
                )}
                {selectedSourceForDossier.rankingExposureStatus === 'FILTERED_OUT' && (
                  <>Completely disqualified by the <strong className="text-rose-400">Hard Trust Gate (τ ≥ 0.40)</strong>. Articles from this source are suppressed from recommended feeds regardless of predicted click count.</>
                )}
              </p>
            </div>

            {/* Component Breakdown */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                Audited Component Metrics
              </span>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded border border-slate-800">
                  <span className="text-slate-300 font-sans">Journalistic Standards & Oversight</span>
                  <span className="text-white font-semibold">{Math.round(selectedSourceForDossier.journalisticStandardsScore * 100)}%</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded border border-slate-800">
                  <span className="text-slate-300 font-sans">Primary Source Provenance & Citations</span>
                  <span className="text-white font-semibold">{Math.round(selectedSourceForDossier.attributionProvenanceScore * 100)}%</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded border border-slate-800">
                  <span className="text-slate-300 font-sans">Fact-Checking & Retraction Policy</span>
                  <span className="text-white font-semibold">{Math.round(selectedSourceForDossier.factCheckPolicyScore * 100)}%</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded border border-slate-800">
                  <span className="text-slate-300 font-sans">Cross-Wire Corroboration Consensus</span>
                  <span className="text-emerald-400 font-semibold">{Math.round(selectedSourceForDossier.corroborationConsensusScore * 100)}%</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded border border-slate-800">
                  <span className="text-slate-300 font-sans">Sensationalism & Clickbait Index</span>
                  <span className={`font-semibold ${
                    selectedSourceForDossier.sensationalismIndex > 0.40 ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {Math.round(selectedSourceForDossier.sensationalismIndex * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                Independent Audit Findings
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                {selectedSourceForDossier.keyAuditNotes}
              </p>
            </div>

            {/* 12-Month Table inside modal */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                12-Month Historical Record
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-mono text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-2">Month</th>
                      <th className="py-2 px-2 text-right">Score</th>
                      <th className="py-2 px-2 text-right">Corroborated</th>
                      <th className="py-2 px-2 text-right">Retractions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedSourceForDossier.monthlyHistory.map((pt) => (
                      <tr key={pt.month} className="hover:bg-slate-800/40">
                        <td className="py-1.5 px-2 text-slate-300">{pt.month}</td>
                        <td className="py-1.5 px-2 text-right text-emerald-400 font-semibold">{Math.round(pt.score * 100)}%</td>
                        <td className="py-1.5 px-2 text-right text-slate-300">{pt.corroboratedArticles}</td>
                        <td className={`py-1.5 px-2 text-right ${pt.retractionsOrCorrections > 2 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {pt.retractionsOrCorrections}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
