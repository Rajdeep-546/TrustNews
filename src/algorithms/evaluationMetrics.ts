import { ScoredArticle, MetricSummary, UserPersona } from '../types';
import { articleDistance } from './recommenderEngines';

/**
 * Calculates Discounted Cumulative Gain at K
 */
function dcgAtK(scores: number[], k: number): number {
  let dcg = 0;
  for (let i = 0; i < Math.min(scores.length, k); i++) {
    const rel = scores[i];
    dcg += (Math.pow(2, rel) - 1) / Math.log2(i + 2); // rank 1 is index 0 -> log2(2) = 1
  }
  return dcg;
}

/**
 * Calculates Normalized Discounted Cumulative Gain (NDCG@K)
 */
export function calculateNDCG(rankedArticles: ScoredArticle[], k: number): number {
  const relScores = rankedArticles.map(a => Math.max(0, a.computedScores.relevance));
  const actualDCG = dcgAtK(relScores, k);

  // Ideal DCG (sorted in perfect descending order of relevance)
  const idealScores = [...relScores].sort((a, b) => b - a);
  const idealDCG = dcgAtK(idealScores, k);

  if (idealDCG === 0) return 1.0;
  return Number((actualDCG / idealDCG).toFixed(4));
}

/**
 * Mean Reciprocal Rank (MRR) - rank of first relevant article (relevance >= 0.70)
 */
export function calculateMRR(rankedArticles: ScoredArticle[]): number {
  for (let i = 0; i < rankedArticles.length; i++) {
    if (rankedArticles[i].computedScores.relevance >= 0.70) {
      return Number((1 / (i + 1)).toFixed(4));
    }
  }
  return 0.1;
}

/**
 * Precision at K (fraction of top K articles with relevance >= 0.65)
 */
export function calculatePrecisionAtK(rankedArticles: ScoredArticle[], k: number): number {
  const topK = rankedArticles.slice(0, k);
  const relevantCount = topK.filter(a => a.computedScores.relevance >= 0.65).length;
  return Number((relevantCount / Math.max(1, topK.length)).toFixed(4));
}

/**
 * Intra-List Diversity (ILD) - average pairwise semantic distance
 * ILD = 2 / (K * (K - 1)) * sum_{i < j} dist(a_i, a_j)
 */
export function calculateILD(rankedArticles: ScoredArticle[], k: number = 10): number {
  const topK = rankedArticles.slice(0, k);
  const n = topK.length;
  if (n <= 1) return 0;

  let totalDist = 0;
  let pairs = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      totalDist += articleDistance(topK[i], topK[j]);
      pairs++;
    }
  }

  return Number((totalDist / pairs).toFixed(4));
}

/**
 * Shannon Category Entropy
 * H(C) = - sum p_c * log2(p_c)
 */
export function calculateCategoryEntropy(rankedArticles: ScoredArticle[], k: number = 10): number {
  const topK = rankedArticles.slice(0, k);
  const counts: Record<string, number> = {};
  for (const a of topK) {
    counts[a.category] = (counts[a.category] || 0) + 1;
  }

  let entropy = 0;
  const n = topK.length;
  for (const cat in counts) {
    const p = counts[cat] / n;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  return Number(entropy.toFixed(3));
}

/**
 * Novelty Score based on self-information: - 1/K * sum log2(P(c))
 */
export function calculateNoveltyScore(rankedArticles: ScoredArticle[], user: UserPersona, k: number = 10): number {
  const topK = rankedArticles.slice(0, k);
  let totalNov = 0;
  for (const a of topK) {
    const pastCount = user.recentReadCategories.filter(c => c === a.category).length;
    const p = Math.max(0.05, pastCount / Math.max(1, user.recentReadCategories.length));
    totalNov += -Math.log2(p);
  }
  return Number((totalNov / Math.max(1, topK.length)).toFixed(3));
}

/**
 * Exposure Fairness: Gini Coefficient of publisher impression share
 * Gini = sum_{i=1}^n (2i - n - 1) * x_i / (n * sum x_i)
 * 0.0 = perfect equality across publishers; 1.0 = single publisher monopoly
 */
export function calculatePublisherGini(rankedArticles: ScoredArticle[], k: number = 10): number {
  const topK = rankedArticles.slice(0, k);
  const publisherImpressions: Record<string, number> = {};

  // Weight impressions by position bias: 1 / log2(rank + 1)
  topK.forEach((art, rank) => {
    const positionWeight = 1 / Math.log2(rank + 2);
    publisherImpressions[art.publisher] = (publisherImpressions[art.publisher] || 0) + positionWeight;
  });

  const values = Object.values(publisherImpressions).sort((a, b) => a - b);
  const n = values.length;
  if (n <= 1) return 1.0;

  const totalSum = values.reduce((sum, v) => sum + v, 0);
  if (totalSum === 0) return 0;

  let weightedSum = 0;
  for (let i = 0; i < n; i++) {
    weightedSum += (2 * (i + 1) - n - 1) * values[i];
  }

  const gini = weightedSum / (n * totalSum);
  return Number(Math.max(0, Math.min(1.0, gini)).toFixed(4));
}

/**
 * Evaluates full metric suite on recommended article list
 */
export function evaluateRecommendationMetrics(
  rankedArticles: ScoredArticle[],
  user: UserPersona,
  k: number = 10
): MetricSummary {
  const topK = rankedArticles.slice(0, k);

  const ndcg5 = calculateNDCG(rankedArticles, 5);
  const ndcg10 = calculateNDCG(rankedArticles, 10);
  const mrr = calculateMRR(rankedArticles);
  const precisionAt5 = calculatePrecisionAtK(rankedArticles, 5);

  // Position bias weighted averages
  let totalDwell = 0;
  let totalCompletion = 0;
  let totalBounce = 0;
  let totalCredibility = 0;
  let lowCredCount = 0;
  let clickbaitCount = 0;

  topK.forEach(art => {
    totalDwell += art.avgObservedDwellSec;
    totalCompletion += art.historicalCompletionRate;
    totalBounce += art.historicalBounceRate;
    totalCredibility += art.computedScores.credibility;
    if (art.computedScores.credibility < 0.50) lowCredCount++;
    if (art.clickbaitIndex > 0.60) clickbaitCount++;
  });

  const n = Math.max(1, topK.length);

  return {
    ndcg5,
    ndcg10,
    mrr,
    precisionAt5,
    avgDwellTimeSec: Math.round(totalDwell / n),
    avgCompletionRate: Number((totalCompletion / n).toFixed(3)),
    bounceRate: Number((totalBounce / n).toFixed(3)),
    meanCredibility: Number((totalCredibility / n).toFixed(3)),
    lowCredibilityExposure: Number((lowCredCount / n).toFixed(3)),
    clickbaitLeakageRate: Number((clickbaitCount / n).toFixed(3)),
    intraListDiversity: calculateILD(rankedArticles, k),
    categoryEntropy: calculateCategoryEntropy(rankedArticles, k),
    noveltyScore: calculateNoveltyScore(rankedArticles, user, k),
    publisherGini: calculatePublisherGini(rankedArticles, k),
  };
}
