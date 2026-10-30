import { NewsArticle, UserPersona, MultiObjectiveWeights, ParetoSolution } from '../types';
import { runRecommendationEngine } from './recommenderEngines';
import { evaluateRecommendationMetrics } from './evaluationMetrics';

/**
 * Checks if solution A Pareto-dominates solution B (maximization of all objectives)
 */
function dominates(a: ParetoSolution, b: ParetoSolution): boolean {
  const atLeastAsGood = 
    a.shortTermCTR >= b.shortTermCTR &&
    a.longTermSatisfaction >= b.longTermSatisfaction &&
    a.credibilityScore >= b.credibilityScore &&
    a.diversityILD >= b.diversityILD;

  const strictlyBetter = 
    a.shortTermCTR > b.shortTermCTR ||
    a.longTermSatisfaction > b.longTermSatisfaction ||
    a.credibilityScore > b.credibilityScore ||
    a.diversityILD > b.diversityILD;

  return atLeastAsGood && strictlyBetter;
}

/**
 * Generates an empirical Pareto Frontier across multi-objective trade-offs
 */
export function generateParetoFrontier(
  articles: NewsArticle[],
  user: UserPersona,
  gridSteps: number = 7
): ParetoSolution[] {
  const solutions: ParetoSolution[] = [];
  let idCounter = 1;

  // Systematic grid search over weight vectors
  // alphaClick + betaSat + gammaCred + deltaDiv + epsilonFairness = 1.0
  const weightsList: MultiObjectiveWeights[] = [
    // Click-heavy (CTR focus)
    { alphaClick: 0.70, betaSatisfaction: 0.10, gammaCredibility: 0.10, deltaDiversity: 0.05, epsilonFairness: 0.03, zetaFreshness: 0.02 },
    { alphaClick: 0.60, betaSatisfaction: 0.15, gammaCredibility: 0.15, deltaDiversity: 0.05, epsilonFairness: 0.03, zetaFreshness: 0.02 },
    
    // Balanced Trust & Satisfaction (Proposed default)
    { alphaClick: 0.25, betaSatisfaction: 0.25, gammaCredibility: 0.30, deltaDiversity: 0.12, epsilonFairness: 0.05, zetaFreshness: 0.03 },
    { alphaClick: 0.20, betaSatisfaction: 0.30, gammaCredibility: 0.30, deltaDiversity: 0.12, epsilonFairness: 0.05, zetaFreshness: 0.03 },
    
    // High Trust & Corroboration focus
    { alphaClick: 0.10, betaSatisfaction: 0.20, gammaCredibility: 0.50, deltaDiversity: 0.12, epsilonFairness: 0.05, zetaFreshness: 0.03 },
    { alphaClick: 0.05, betaSatisfaction: 0.20, gammaCredibility: 0.60, deltaDiversity: 0.10, epsilonFairness: 0.03, zetaFreshness: 0.02 },

    // High Diversity & Filter Bubble Buster
    { alphaClick: 0.15, betaSatisfaction: 0.20, gammaCredibility: 0.25, deltaDiversity: 0.30, epsilonFairness: 0.08, zetaFreshness: 0.02 },
    { alphaClick: 0.10, betaSatisfaction: 0.20, gammaCredibility: 0.30, deltaDiversity: 0.32, epsilonFairness: 0.06, zetaFreshness: 0.02 },

    // Deep Read / Sustained Dwell Focus
    { alphaClick: 0.15, betaSatisfaction: 0.50, gammaCredibility: 0.20, deltaDiversity: 0.10, epsilonFairness: 0.03, zetaFreshness: 0.02 },
    { alphaClick: 0.10, betaSatisfaction: 0.45, gammaCredibility: 0.30, deltaDiversity: 0.10, epsilonFairness: 0.03, zetaFreshness: 0.02 },

    // Intermediate trade-off points
    { alphaClick: 0.40, betaSatisfaction: 0.20, gammaCredibility: 0.25, deltaDiversity: 0.10, epsilonFairness: 0.03, zetaFreshness: 0.02 },
    { alphaClick: 0.30, betaSatisfaction: 0.35, gammaCredibility: 0.20, deltaDiversity: 0.10, epsilonFairness: 0.03, zetaFreshness: 0.02 },
    { alphaClick: 0.35, betaSatisfaction: 0.15, gammaCredibility: 0.35, deltaDiversity: 0.10, epsilonFairness: 0.03, zetaFreshness: 0.02 },
    { alphaClick: 0.18, betaSatisfaction: 0.25, gammaCredibility: 0.38, deltaDiversity: 0.14, epsilonFairness: 0.03, zetaFreshness: 0.02 },
    { alphaClick: 0.22, betaSatisfaction: 0.22, gammaCredibility: 0.32, deltaDiversity: 0.18, epsilonFairness: 0.04, zetaFreshness: 0.02 },
  ];

  for (const w of weightsList) {
    const ranked = runRecommendationEngine('trustaware_moo', articles, user, w);
    const metrics = evaluateRecommendationMetrics(ranked, user, 10);

    // Approximate objective evaluations
    const shortTermCTR = Number((0.55 + w.alphaClick * 0.40 - (1 - metrics.ndcg5) * 0.15).toFixed(3));
    const longTermSatisfaction = Number((metrics.avgCompletionRate * 0.6 + (1 - metrics.bounceRate) * 0.4).toFixed(3));
    const credibilityScore = metrics.meanCredibility;
    const diversityILD = metrics.intraListDiversity;
    const exposureFairness = Number((1.0 - metrics.publisherGini).toFixed(3));

    solutions.push({
      id: `SOL_${idCounter++}`,
      weights: w,
      shortTermCTR,
      longTermSatisfaction,
      credibilityScore,
      diversityILD,
      exposureFairness,
      isParetoOptimal: false,
      paretoRank: 1,
    });
  }

  // Non-dominated sorting
  for (let i = 0; i < solutions.length; i++) {
    let dominated = false;
    for (let j = 0; j < solutions.length; j++) {
      if (i !== j && dominates(solutions[j], solutions[i])) {
        dominated = true;
        break;
      }
    }
    solutions[i].isParetoOptimal = !dominated;
    solutions[i].paretoRank = dominated ? 2 : 1;
  }

  return solutions;
}

/**
 * Finds the nearest Pareto optimal point using Chebyshev scalarization
 */
export function findBestParetoOperatingPoint(
  frontier: ParetoSolution[],
  desiredWeights: MultiObjectiveWeights
): ParetoSolution {
  // Reference ideal point (utopia point)
  const ideal = {
    shortTermCTR: 0.95,
    longTermSatisfaction: 0.95,
    credibilityScore: 0.98,
    diversityILD: 0.85,
  };

  let bestSol = frontier[0];
  let minChebyshevDistance = Infinity;

  const validPool = frontier.filter(s => s.isParetoOptimal).length > 0
    ? frontier.filter(s => s.isParetoOptimal)
    : frontier;

  for (const sol of validPool) {
    // Weighted distance from utopia point
    const dCTR = desiredWeights.alphaClick * Math.abs(ideal.shortTermCTR - sol.shortTermCTR);
    const dSat = desiredWeights.betaSatisfaction * Math.abs(ideal.longTermSatisfaction - sol.longTermSatisfaction);
    const dCred = desiredWeights.gammaCredibility * Math.abs(ideal.credibilityScore - sol.credibilityScore);
    const dDiv = desiredWeights.deltaDiversity * Math.abs(ideal.diversityILD - sol.diversityILD);

    const maxDeficit = Math.max(dCTR, dSat, dCred, dDiv);
    if (maxDeficit < minChebyshevDistance) {
      minChebyshevDistance = maxDeficit;
      bestSol = sol;
    }
  }

  return bestSol;
}

/**
 * Calculates optimal Pareto weights calibrated to a specific user persona's cognitive profile.
 * When Strict Personalization is enabled, these weights dynamically adapt the multi-objective ranking.
 */
export function calculatePersonaParetoWeights(persona: UserPersona): MultiObjectiveWeights {
  if (persona.id === 'U001') {
    // Dr. Elena Vance: Principal Research Scientist - Rigorous trust & deep dwell
    return {
      alphaClick: 0.06,
      betaSatisfaction: 0.28,
      gammaCredibility: 0.45,
      deltaDiversity: 0.13,
      epsilonFairness: 0.05,
      zetaFreshness: 0.03,
    };
  }
  if (persona.id === 'U002') {
    // Marcus Chen: Technology Founder - Fast pace & real-time tech/market freshness
    return {
      alphaClick: 0.32,
      betaSatisfaction: 0.14,
      gammaCredibility: 0.25,
      deltaDiversity: 0.07,
      epsilonFairness: 0.04,
      zetaFreshness: 0.18,
    };
  }
  if (persona.id === 'U003') {
    // Aisha Patel: Investigative Editor - High viewpoint diversity & corroboration
    return {
      alphaClick: 0.04,
      betaSatisfaction: 0.18,
      gammaCredibility: 0.34,
      deltaDiversity: 0.32,
      epsilonFairness: 0.10,
      zetaFreshness: 0.02,
    };
  }
  if (persona.id === 'U004') {
    // Jordan Taylor: Casual Mobile Reader - Short sessions & quick CTR responsiveness
    return {
      alphaClick: 0.42,
      betaSatisfaction: 0.12,
      gammaCredibility: 0.15,
      deltaDiversity: 0.16,
      epsilonFairness: 0.05,
      zetaFreshness: 0.10,
    };
  }
  if (persona.id === 'U005') {
    // Prof. David K: Academic Ethicist - Maximum source credibility & publisher fairness
    return {
      alphaClick: 0.03,
      betaSatisfaction: 0.20,
      gammaCredibility: 0.46,
      deltaDiversity: 0.12,
      epsilonFairness: 0.16,
      zetaFreshness: 0.03,
    };
  }

  // Dynamic calculation for custom or procedural personas
  const rawCredibility = 0.15 + (1.0 - Math.min(1.0, persona.toleranceForSensationalism)) * 0.35;
  const rawDiversity = 0.06 + Math.min(1.0, persona.filterBubbleSeverity) * 0.24;
  const rawSatisfaction = 0.10 + (Math.min(15, persona.bounceThresholdSec) / 15) * 0.18;
  const rawFreshness = persona.readingPaceWpm > 240 ? 0.14 : 0.04;
  const rawFairness = 0.05 + (1.0 - Math.min(1.0, persona.toleranceForSensationalism)) * 0.06;
  const rawClick = Math.max(0.05, 1.0 - (rawCredibility + rawDiversity + rawSatisfaction + rawFreshness + rawFairness));

  const total = rawCredibility + rawDiversity + rawSatisfaction + rawFreshness + rawFairness + rawClick;
  return {
    alphaClick: Number((rawClick / total).toFixed(3)),
    betaSatisfaction: Number((rawSatisfaction / total).toFixed(3)),
    gammaCredibility: Number((rawCredibility / total).toFixed(3)),
    deltaDiversity: Number((rawDiversity / total).toFixed(3)),
    epsilonFairness: Number((rawFairness / total).toFixed(3)),
    zetaFreshness: Number((rawFreshness / total).toFixed(3)),
  };
}
