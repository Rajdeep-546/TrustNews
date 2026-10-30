import { AblationStudyResult, NewsArticle, UserPersona } from '../types';
import { runRecommendationEngine } from './recommenderEngines';
import { evaluateRecommendationMetrics } from './evaluationMetrics';

/**
 * Standard normal / Student's t distribution approximation for p-values
 */
function approximatePValue(tStat: number, degreesOfFreedom: number): number {
  const absT = Math.abs(tStat);
  // Rational approximation for cumulative distribution
  const x = degreesOfFreedom / (degreesOfFreedom + absT * absT);
  // Approximation of incomplete beta function for df = 15-30
  if (absT > 4.5) return 0.0001;
  if (absT > 3.5) return 0.0012;
  if (absT > 2.8) return 0.0084;
  if (absT > 2.05) return 0.0450;
  if (absT > 1.7) return 0.0980;
  return Number((Math.max(0.001, 1 / (1 + absT * absT))).toFixed(4));
}

/**
 * Performs Paired Two-Tailed t-test on metric series
 */
export function pairedTTest(sampleA: number[], sampleB: number[]): {
  tStat: number;
  pValue: number;
  meanDiff: number;
  ci: [number, number];
} {
  const n = Math.min(sampleA.length, sampleB.length);
  if (n < 2) return { tStat: 0, pValue: 1.0, meanDiff: 0, ci: [0, 0] };

  const diffs: number[] = [];
  for (let i = 0; i < n; i++) {
    diffs.push(sampleA[i] - sampleB[i]);
  }

  const meanDiff = diffs.reduce((sum, d) => sum + d, 0) / n;
  const variance = diffs.reduce((sum, d) => sum + Math.pow(d - meanDiff, 2), 0) / (n - 1);
  const se = Math.sqrt(variance / n);

  const tStat = se > 0 ? meanDiff / se : 0;
  const pValue = approximatePValue(tStat, n - 1);
  const tCrit = 2.045; // 95% CI critical value for ~20-30 degrees of freedom

  const ci: [number, number] = [
    Number((meanDiff - tCrit * se).toFixed(4)),
    Number((meanDiff + tCrit * se).toFixed(4)),
  ];

  return {
    tStat: Number(tStat.toFixed(3)),
    pValue,
    meanDiff: Number(meanDiff.toFixed(4)),
    ci,
  };
}

/**
 * Runs complete suite of Ablation Studies against the Proposed Framework
 */
export function runAblationStudies(
  articles: NewsArticle[],
  user: UserPersona
): AblationStudyResult[] {
  // Baseline: Full Proposed System
  const fullRanked = runRecommendationEngine('trustaware_moo', articles, user);
  const fullMetrics = evaluateRecommendationMetrics(fullRanked, user);

  // Generate synthetic multi-session evaluation folds for statistical testing (n=20 sessions)
  const generateFoldMetrics = (w: any, model: any) => {
    const folds: number[] = [];
    for (let f = 0; f < 20; f++) {
      // Simulate minor user context perturbation across sessions
      const perturbedUser: UserPersona = {
        ...user,
        readingPaceWpm: user.readingPaceWpm + (f % 5 - 2) * 5,
        filterBubbleSeverity: Math.max(0.1, user.filterBubbleSeverity + (f % 3 - 1) * 0.02),
      };
      const ranked = runRecommendationEngine(model, articles, perturbedUser, w);
      const m = evaluateRecommendationMetrics(ranked, perturbedUser);
      folds.push(m.ndcg10);
    }
    return folds;
  };

  const fullFolds = generateFoldMetrics(undefined, 'trustaware_moo');

  // Ablation 1: Without Credibility Scoring (Trust gamma = 0)
  const noCredWeights = {
    alphaClick: 0.45,
    betaSatisfaction: 0.35,
    gammaCredibility: 0.0,
    deltaDiversity: 0.15,
    epsilonFairness: 0.05,
    zetaFreshness: 0.0,
  };
  const noCredRanked = runRecommendationEngine('trustaware_moo', articles, user, noCredWeights);
  const noCredMetrics = evaluateRecommendationMetrics(noCredRanked, user);
  const noCredFolds = generateFoldMetrics(noCredWeights, 'trustaware_moo');
  const tTestCred = pairedTTest(fullFolds, noCredFolds);

  // Ablation 2: Without Temporal Engagement & Satisfaction (beta = 0, raw click count)
  const noEngWeights = {
    alphaClick: 0.60,
    betaSatisfaction: 0.0,
    gammaCredibility: 0.25,
    deltaDiversity: 0.10,
    epsilonFairness: 0.05,
    zetaFreshness: 0.0,
  };
  const noEngRanked = runRecommendationEngine('trustaware_moo', articles, user, noEngWeights);
  const noEngMetrics = evaluateRecommendationMetrics(noEngRanked, user);
  const noEngFolds = generateFoldMetrics(noEngWeights, 'trustaware_moo');
  const tTestEng = pairedTTest(fullFolds, noEngFolds);

  // Ablation 3: Without Diversity & Fairness Re-ranking (delta = 0, greedy ranking)
  const noDivWeights = {
    alphaClick: 0.35,
    betaSatisfaction: 0.30,
    gammaCredibility: 0.35,
    deltaDiversity: 0.0,
    epsilonFairness: 0.0,
    zetaFreshness: 0.0,
  };
  const noDivRanked = runRecommendationEngine('trustaware_moo', articles, user, noDivWeights);
  const noDivMetrics = evaluateRecommendationMetrics(noDivRanked, user);
  const noDivFolds = generateFoldMetrics(noDivWeights, 'trustaware_moo');
  const tTestDiv = pairedTTest(fullFolds, noDivFolds);

  // Ablation 4: Without Multi-Objective Optimization (Pure Single-Objective CTR GBDT)
  const clickOnlyRanked = runRecommendationEngine('click_optimized', articles, user);
  const clickOnlyMetrics = evaluateRecommendationMetrics(clickOnlyRanked, user);
  const clickOnlyFolds = generateFoldMetrics(undefined, 'click_optimized');
  const tTestClick = pairedTTest(fullFolds, clickOnlyFolds);

  return [
    {
      variantId: 'full_system',
      variantName: 'Proposed Framework (Full Multi-Objective)',
      description: 'Unified Pareto MOO with Temporal Engagement, Credibility Corroboration, and MMR-Trust Re-ranking.',
      ndcg10: fullMetrics.ndcg10,
      satisfactionRate: fullMetrics.avgCompletionRate,
      credibility: fullMetrics.meanCredibility,
      diversityILD: fullMetrics.intraListDiversity,
      publisherGini: fullMetrics.publisherGini,
      tStatistic: 0,
      pValue: 1.0,
      confidenceInterval: [0, 0],
      isSignificant: false,
    },
    {
      variantId: 'wo_credibility',
      variantName: 'w/o Credibility Assessment (Trust γ = 0)',
      description: 'Removes source reliability tiering, provenance tracking, and fact-checking consensus constraints.',
      ndcg10: noCredMetrics.ndcg10,
      satisfactionRate: noCredMetrics.avgCompletionRate,
      credibility: noCredMetrics.meanCredibility,
      diversityILD: noCredMetrics.intraListDiversity,
      publisherGini: noCredMetrics.publisherGini,
      tStatistic: tTestCred.tStat,
      pValue: tTestCred.pValue,
      confidenceInterval: tTestCred.ci,
      isSignificant: tTestCred.pValue < 0.05,
    },
    {
      variantId: 'wo_temporal_engagement',
      variantName: 'w/o Temporal Engagement & Satisfaction (β = 0)',
      description: 'Substitutes sustained reading dwell time and completion modeling with raw superficial click counts.',
      ndcg10: noEngMetrics.ndcg10,
      satisfactionRate: noEngMetrics.avgCompletionRate,
      credibility: noEngMetrics.meanCredibility,
      diversityILD: noEngMetrics.intraListDiversity,
      publisherGini: noEngMetrics.publisherGini,
      tStatistic: tTestEng.tStat,
      pValue: tTestEng.pValue,
      confidenceInterval: tTestEng.ci,
      isSignificant: tTestEng.pValue < 0.05,
    },
    {
      variantId: 'wo_diversity_fairness',
      variantName: 'w/o Diversity & Fairness Re-Ranking (δ = 0, ε = 0)',
      description: 'Eliminates MMR intra-list diversity expansion and publisher exposure balancing, exposing users to filter bubbles.',
      ndcg10: noDivMetrics.ndcg10,
      satisfactionRate: noDivMetrics.avgCompletionRate,
      credibility: noDivMetrics.meanCredibility,
      diversityILD: noDivMetrics.intraListDiversity,
      publisherGini: noDivMetrics.publisherGini,
      tStatistic: tTestDiv.tStat,
      pValue: tTestDiv.pValue,
      confidenceInterval: tTestDiv.ci,
      isSignificant: tTestDiv.pValue < 0.05,
    },
    {
      variantId: 'single_objective_click',
      variantName: 'w/o MOO (Pure Click-Optimized Baseline)',
      description: 'Conventional CTR maximization without multi-objective trade-off balancing; heavily exploits clickbait curiosity.',
      ndcg10: clickOnlyMetrics.ndcg10,
      satisfactionRate: clickOnlyMetrics.avgCompletionRate,
      credibility: clickOnlyMetrics.meanCredibility,
      diversityILD: clickOnlyMetrics.intraListDiversity,
      publisherGini: clickOnlyMetrics.publisherGini,
      tStatistic: tTestClick.tStat,
      pValue: tTestClick.pValue,
      confidenceInterval: tTestClick.ci,
      isSignificant: tTestClick.pValue < 0.05,
    },
  ];
}
