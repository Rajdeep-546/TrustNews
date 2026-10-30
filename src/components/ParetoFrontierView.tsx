import React, { useMemo } from 'react';
import { Sliders, Sparkles, AlertCircle, Info, Target, Zap } from 'lucide-react';
import { NewsArticle, UserPersona, MultiObjectiveWeights, ParetoSolution } from '../types';
import { generateParetoFrontier, findBestParetoOperatingPoint } from '../algorithms/multiObjectiveOptimizer';

interface ParetoFrontierViewProps {
  articles: NewsArticle[];
  user: UserPersona;
  weights: MultiObjectiveWeights;
  onUpdateWeights: (weights: MultiObjectiveWeights) => void;
}

export const ParetoFrontierView: React.FC<ParetoFrontierViewProps> = ({
  articles,
  user,
  weights,
  onUpdateWeights,
}) => {
  // Generate empirical Pareto frontier
  const frontier = useMemo(() => {
    return generateParetoFrontier(articles, user, 8);
  }, [articles, user]);

  // Find active operating point
  const activeOperatingPoint = useMemo(() => {
    return findBestParetoOperatingPoint(frontier, weights);
  }, [frontier, weights]);

  // SVG Chart Dimensions
  const width = 640;
  const height = 360;
  const padLeft = 60;
  const padBottom = 50;
  const padRight = 30;
  const padTop = 30;

  // Scale functions: X = Short-Term CTR (0.4 to 1.0), Y = Trust & Long-Term Satisfaction (0.4 to 1.0)
  const minX = 0.50;
  const maxX = 0.98;
  const minY = 0.50;
  const maxY = 0.98;

  const scaleX = (val: number) => padLeft + ((val - minX) / (maxX - minX)) * (width - padLeft - padRight);
  const scaleY = (val: number) => height - padBottom - ((val - minY) / (maxY - minY)) * (height - padTop - padBottom);

  const handleSliderChange = (key: keyof MultiObjectiveWeights, value: number) => {
    const updated = { ...weights, [key]: value };
    // Normalize sum to 1.0 approx
    const total = updated.alphaClick + updated.betaSatisfaction + updated.gammaCredibility + updated.deltaDiversity + updated.epsilonFairness;
    if (total > 0) {
      onUpdateWeights(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider">
          <Target className="w-4 h-4" /> Multi-Objective Optimization Formulation
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">
          Pareto Frontier & Objective Trade-Off Explorer
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Conventional news rankers treat recommendation as a single-objective CTR maximization problem, 
          which severely degrades trust, induces echo chambers, and amplifies sensationalist clickbait. 
          The Pareto frontier reveals non-dominated operating vectors that achieve high long-term satisfaction 
          and factual credibility without substantial loss of relevance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Pareto Scatter Plot */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">
              Pareto Frontier: Short-Term CTR vs. Trust & Long-Term Satisfaction
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Pareto Optimal (Front 1)
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" /> Dominated
              </span>
            </div>
          </div>

          {/* SVG Plot */}
          <div className="w-full bg-slate-950 rounded-lg p-3 border border-slate-800/80 overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
              {/* Grid Lines */}
              {[0.6, 0.7, 0.8, 0.9].map((tick) => (
                <g key={`grid-${tick}`}>
                  <line
                    x1={padLeft}
                    y1={scaleY(tick)}
                    x2={width - padRight}
                    y2={scaleY(tick)}
                    stroke="#1e293b"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={padLeft - 8}
                    y={scaleY(tick) + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {tick.toFixed(1)}
                  </text>

                  <line
                    x1={scaleX(tick)}
                    y1={padTop}
                    x2={scaleX(tick)}
                    y2={height - padBottom}
                    stroke="#1e293b"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={scaleX(tick)}
                    y={height - padBottom + 16}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {tick.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* Axes */}
              <line
                x1={padLeft}
                y1={height - padBottom}
                x2={width - padRight}
                y2={height - padBottom}
                stroke="#475569"
                strokeWidth="1.5"
              />
              <line
                x1={padLeft}
                y1={padTop}
                x2={padLeft}
                y2={height - padBottom}
                stroke="#475569"
                strokeWidth="1.5"
              />

              {/* Axis Labels */}
              <text
                x={width / 2}
                y={height - 12}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
                fontWeight="500"
              >
                Objective 1: Short-Term CTR Prediction →
              </text>
              <text
                x={-(height / 2)}
                y={18}
                transform="rotate(-90)"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
                fontWeight="500"
              >
                Objective 2: Verified Trust & Satisfaction →
              </text>

              {/* Pareto Curve connecting optimal points */}
              {(() => {
                const optimalPoints = frontier
                  .filter(s => s.isParetoOptimal)
                  .sort((a, b) => a.shortTermCTR - b.shortTermCTR);

                if (optimalPoints.length < 2) return null;
                const pathData = optimalPoints
                  .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(p.shortTermCTR)} ${scaleY(p.longTermSatisfaction)}`)
                  .join(' ');

                return (
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    opacity="0.6"
                  />
                );
              })()}

              {/* Scatter Points */}
              {frontier.map((sol) => {
                const cx = scaleX(sol.shortTermCTR);
                const cy = scaleY(sol.longTermSatisfaction);
                const isSelected = activeOperatingPoint.id === sol.id;
                const isOptimal = sol.isParetoOptimal;

                return (
                  <g key={sol.id} className="cursor-pointer">
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="12"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isOptimal ? 6 : 4}
                      fill={isSelected ? '#6366f1' : (isOptimal ? '#10b981' : '#64748b')}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      opacity={isOptimal ? 1.0 : 0.6}
                    />
                  </g>
                );
              })}

              {/* Active Selection Callout */}
              <g transform={`translate(${scaleX(activeOperatingPoint.shortTermCTR) + 8}, ${scaleY(activeOperatingPoint.longTermSatisfaction) - 10})`}>
                <rect x="0" y="0" width="130" height="24" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
                <text x="6" y="16" fill="#c7d2fe" fontSize="10" fontFamily="monospace">
                  Active Vector ({activeOperatingPoint.shortTermCTR.toFixed(2)}, {activeOperatingPoint.longTermSatisfaction.toFixed(2)})
                </text>
              </g>
            </svg>
          </div>

          <p className="text-[11px] text-slate-400 font-mono italic">
            *Green dashed boundary indicates the non-dominated empirical Pareto frontier. Solutions situated underneath are Pareto-inferior.
          </p>
        </div>

        {/* Dynamic Objective Weighting Sliders */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" /> Dynamic Objective Weights
            </span>
            <span className="text-[11px] text-indigo-400 font-mono">
              Scalarization: Chebyshev
            </span>
          </div>

          {/* Slider 1: Short Term CTR */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">α : Short-Term CTR Prediction</span>
              <span className="font-mono text-indigo-400 font-semibold">{weights.alphaClick.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.80"
              step="0.05"
              value={weights.alphaClick}
              onChange={(e) => handleSliderChange('alphaClick', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Slider 2: Satisfaction & Completion */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">β : Long-Term Satisfaction & Dwell</span>
              <span className="font-mono text-indigo-400 font-semibold">{weights.betaSatisfaction.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.80"
              step="0.05"
              value={weights.betaSatisfaction}
              onChange={(e) => handleSliderChange('betaSatisfaction', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Slider 3: Trust & Credibility */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">γ : Source Credibility & Provenance</span>
              <span className="font-mono text-indigo-400 font-semibold">{weights.gammaCredibility.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.80"
              step="0.05"
              value={weights.gammaCredibility}
              onChange={(e) => handleSliderChange('gammaCredibility', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Slider 4: Diversity (ILD) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">δ : Intra-List Diversity (ILD)</span>
              <span className="font-mono text-indigo-400 font-semibold">{weights.deltaDiversity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="0.50"
              step="0.02"
              value={weights.deltaDiversity}
              onChange={(e) => handleSliderChange('deltaDiversity', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Slider 5: Fairness */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">ε : Long-Tail Publisher Fairness</span>
              <span className="font-mono text-indigo-400 font-semibold">{weights.epsilonFairness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="0.30"
              step="0.01"
              value={weights.epsilonFairness}
              onChange={(e) => handleSliderChange('epsilonFairness', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Selected Operating Point Metrics */}
          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2 pt-3">
            <span className="text-xs font-semibold text-slate-300 block">
              Active Operating Point Vector
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="text-slate-400">Predicted CTR: <strong className="text-white">{activeOperatingPoint.shortTermCTR.toFixed(2)}</strong></div>
              <div className="text-slate-400">Satisfaction: <strong className="text-emerald-400">{activeOperatingPoint.longTermSatisfaction.toFixed(2)}</strong></div>
              <div className="text-slate-400">Credibility: <strong className="text-emerald-400">{activeOperatingPoint.credibilityScore.toFixed(2)}</strong></div>
              <div className="text-slate-400">Diversity ILD: <strong className="text-indigo-400">{activeOperatingPoint.diversityILD.toFixed(2)}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
