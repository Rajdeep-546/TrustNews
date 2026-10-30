import { NewsArticle, UserPersona, MultiObjectiveWeights, BaselineModelId, ScoredArticle } from '../types';

export type { ScoredArticle };

/**
 * Calculates raw topical relevance between user and article
 */
export function calculateRelevance(user: UserPersona, article: NewsArticle): number {
  const baseAffinity = user.categoryAffinities[article.category] ?? 0.35;
  // Subcategory specific boost if recently read
  const recentAffinity = user.recentReadCategories.filter(c => c === article.category).length * 0.05;
  return Math.min(1.0, Math.max(0.05, baseAffinity + recentAffinity));
}

/**
 * Calculates long-term engagement potential
 * Distinguishes sustained reading from accidental clicks
 */
export function calculateEngagementPotential(user: UserPersona, article: NewsArticle): number {
  // Expected completion based on article length and user reading speed
  const expectedDwell = (article.wordCount / user.readingPaceWpm) * 60;
  const historicalDwellRatio = Math.min(1.2, article.avgObservedDwellSec / Math.max(1, expectedDwell));
  const completionFactor = article.historicalCompletionRate;
  const repeatFactor = article.repeatVisitRate;
  const bounceRisk = article.historicalBounceRate;

  // Engagement score: high completion + repeat visits - bounce probability
  const score = (0.45 * historicalDwellRatio) + (0.35 * completionFactor) + (0.25 * repeatFactor) - (0.30 * bounceRisk);
  return Math.max(0.05, Math.min(1.0, score));
}

/**
 * Calculates user satisfaction metric
 * Distinguishes genuine satisfaction from clickbait-driven engagement
 */
export function calculateSatisfaction(user: UserPersona, article: NewsArticle): number {
  const dwellSatisfaction = Math.min(1.0, article.avgObservedDwellSec / article.expectedReadTimeSec);
  const clickbaitPenalty = article.clickbaitIndex * (1.0 - user.toleranceForSensationalism);
  const credibilityBonus = article.sourceReliability * 0.2;

  // Genuine satisfaction requires meaningful dwell time without bait deception
  const rawSatisfaction = (0.50 * dwellSatisfaction) + (0.30 * article.historicalCompletionRate) + credibilityBonus - (0.45 * clickbaitPenalty);
  return Math.max(0.02, Math.min(1.0, rawSatisfaction));
}

/**
 * Trust & Credibility Scoring engine
 * Combines source reliability, provenance, corroboration, and fact checking
 */
export function calculateCredibility(article: NewsArticle): number {
  const wReliability = 0.35;
  const wProvenance = 0.25;
  const wCorroboration = 0.25;
  const wFactCheck = 0.15;

  let factCheckWeight = 0.5;
  if (article.factCheckStatus === 'VERIFIED') factCheckWeight = 1.0;
  if (article.factCheckStatus === 'UNVERIFIED_DEVELOPING') factCheckWeight = 0.65;
  if (article.factCheckStatus === 'DISPUTED_SENSATIONAL') factCheckWeight = 0.10;

  // Uncertainty penalty: high epistemic uncertainty reduces effective trust
  const baseScore = (
    wReliability * article.sourceReliability +
    wProvenance * article.provenanceScore +
    wCorroboration * article.corroborationScore +
    wFactCheck * factCheckWeight
  );

  const uncertaintyDiscount = article.uncertainty * 0.18;
  const clickbaitDiscount = article.clickbaitIndex * 0.22;

  return Math.max(0.04, Math.min(0.99, baseScore - uncertaintyDiscount - clickbaitDiscount));
}

/**
 * Article novelty based on inverse category frequency in user's recent history
 */
export function calculateNovelty(user: UserPersona, article: NewsArticle): number {
  const countInRecent = user.recentReadCategories.filter(c => c === article.category).length;
  // If user rarely reads this category, novelty is high (encourages exploration)
  const frequency = countInRecent / Math.max(1, user.recentReadCategories.length);
  return Math.max(0.1, 1.0 - frequency);
}

/**
 * Freshness decay: exponential half-life
 */
export function calculateFreshness(article: NewsArticle): number {
  const lambda = 0.035; // ~20 hour half-life
  return Math.exp(-lambda * article.publishedHoursAgo);
}

/**
 * Semantic distance between two articles (for Intra-List Diversity)
 */
export function articleDistance(a1: NewsArticle, a2: NewsArticle): number {
  let dist = 0.0;
  if (a1.category !== a2.category) dist += 0.65;
  if (a1.subcategory !== a2.subcategory) dist += 0.20;
  if (a1.publisher !== a2.publisher) dist += 0.15;
  return dist;
}

/**
 * Unified Scoring & Ranking Engine supporting all 7 Baselines & Proposed Framework
 */
export function runRecommendationEngine(
  modelId: BaselineModelId,
  articles: NewsArticle[],
  user: UserPersona,
  customWeights?: MultiObjectiveWeights
): ScoredArticle[] {
  const weights: MultiObjectiveWeights = customWeights || {
    alphaClick: 0.25,
    betaSatisfaction: 0.25,
    gammaCredibility: 0.30,
    deltaDiversity: 0.12,
    epsilonFairness: 0.05,
    zetaFreshness: 0.03,
  };

  // Base scores for all articles
  const scoredPool: ScoredArticle[] = articles.map(art => {
    const rel = calculateRelevance(user, art);
    const eng = calculateEngagementPotential(user, art);
    const sat = calculateSatisfaction(user, art);
    const cred = calculateCredibility(art);
    const nov = calculateNovelty(user, art);
    const fresh = calculateFreshness(art);

    // Click prediction score (CTR prediction)
    const predictedCTR = (art.historicalClicks / Math.max(1, art.historicalImpressions)) * 10;
    // Sensation curiosity amplifies CTR on raw click models
    const sensationalCTR = predictedCTR * (1.0 + art.clickbaitIndex * 1.5) * rel;

    let finalScore = 0;
    const decomposed = {
      relevancePt: 0,
      credibilityPt: 0,
      satisfactionPt: 0,
      diversityPt: 0,
      noveltyPt: 0,
      clickbaitPenaltyPt: 0,
    };

    switch (modelId) {
      case 'popularity':
        // Pure popularity: driven by raw historical clicks and CTR
        finalScore = (art.historicalClicks / 20000) * 0.7 + fresh * 0.3;
        decomposed.relevancePt = finalScore;
        break;

      case 'collaborative_filtering':
        // Simulated CF: latent similarity to user interaction patterns
        finalScore = rel * 0.65 + (art.repeatVisitRate * 0.35);
        decomposed.relevancePt = rel * 0.65;
        decomposed.satisfactionPt = art.repeatVisitRate * 0.35;
        break;

      case 'content_based':
        // Content-based: category match + freshness
        finalScore = rel * 0.75 + fresh * 0.25;
        decomposed.relevancePt = rel * 0.75;
        break;

      case 'click_optimized':
        // Click-Optimized: CTR maximizer with NO credibility check!
        // Clickbait gets heavily rewarded here (the classic industry failure mode)
        finalScore = sensationalCTR * 0.75 + rel * 0.25;
        decomposed.relevancePt = rel * 0.25;
        decomposed.satisfactionPt = sensationalCTR * 0.75;
        break;

      case 'hybrid_recommender':
        // Hybrid: standard relevance + engagement
        finalScore = rel * 0.50 + eng * 0.40 + fresh * 0.10;
        decomposed.relevancePt = rel * 0.50;
        decomposed.satisfactionPt = eng * 0.40;
        break;

      case 'credibility_heuristic':
        // Credibility Heuristic: standard relevance + binary threshold on source tier
        const isReliable = art.sourceReliability >= 0.75 ? 1.0 : 0.2;
        finalScore = rel * 0.55 + isReliable * 0.35 + fresh * 0.10;
        decomposed.relevancePt = rel * 0.55;
        decomposed.credibilityPt = isReliable * 0.35;
        break;

      case 'trustaware_moo':
      default:
        // Proposed Trust-Aware Multi-Objective Optimization Score:
        // Balances Short-term CTR, Long-term Satisfaction, Credibility Corroboration, Diversity, and Novelty
        const relPt = weights.alphaClick * rel;
        const credPt = weights.gammaCredibility * cred;
        const satPt = weights.betaSatisfaction * sat;
        const novPt = (weights.deltaDiversity * 0.5) * nov;
        const freshPt = weights.zetaFreshness * fresh;
        const cbPenalty = art.clickbaitIndex > 0.4 ? (art.clickbaitIndex * 0.35) : 0;

        finalScore = relPt + credPt + satPt + novPt + freshPt - cbPenalty;

        decomposed.relevancePt = Number(relPt.toFixed(3));
        decomposed.credibilityPt = Number(credPt.toFixed(3));
        decomposed.satisfactionPt = Number(satPt.toFixed(3));
        decomposed.noveltyPt = Number(novPt.toFixed(3));
        decomposed.clickbaitPenaltyPt = Number(cbPenalty.toFixed(3));
        break;
    }

    return {
      ...art,
      computedScores: {
        relevance: Number(rel.toFixed(3)),
        engagement: Number(eng.toFixed(3)),
        satisfaction: Number(sat.toFixed(3)),
        credibility: Number(cred.toFixed(3)),
        diversityContribution: 0,
        novelty: Number(nov.toFixed(3)),
        finalRankScore: Number(finalScore.toFixed(3)),
        rank: 0,
        decomposed,
      },
    };
  });

  // For non-MOO models: standard greedy descending sort
  if (modelId !== 'trustaware_moo') {
    const sorted = [...scoredPool].sort((a, b) => b.computedScores.finalRankScore - a.computedScores.finalRankScore);
    return sorted.map((art, idx) => ({
      ...art,
      computedScores: {
        ...art.computedScores,
        rank: idx + 1,
      },
    }));
  }

  // --- PROPOSED TRUSTAWARE-MOO RE-RANKING PIPELINE ---
  // Stage 1: Candidate Generation (All articles scored)
  // Stage 2: Hard Credibility Threshold Filter (drops untrusted/debunked articles below tau = 0.40)
  const filteredCandidates = scoredPool.filter(art => art.computedScores.credibility >= 0.40);

  // Stage 3 & 4: Maximal Marginal Relevance with Credibility & Exposure Balancing (MMR-Trust)
  const rankedList: ScoredArticle[] = [];
  const candidatePool = [...filteredCandidates];
  const publisherCounts: Record<string, number> = {};

  while (candidatePool.length > 0) {
    let bestIdx = -1;
    let bestMMRScore = -Infinity;

    // Window of recently ranked articles to ensure immediate neighbors are topically diverse
    const recentWindow = rankedList.slice(-8);

    for (let i = 0; i < candidatePool.length; i++) {
      const candidate = candidatePool[i];
      const baseScore = candidate.computedScores.finalRankScore;

      // Diversity distance to recently ranked list
      let minDistance = 1.0;
      if (recentWindow.length > 0) {
        let maxSimilarity = 0;
        for (const selected of recentWindow) {
          const dist = articleDistance(candidate, selected);
          const sim = 1.0 - (dist / 0.85);
          if (sim > maxSimilarity) maxSimilarity = sim;
        }
        minDistance = Math.max(0, 1.0 - maxSimilarity);
      }

      // Exposure fairness: penalize over-represented publishers
      const currentPubCount = publisherCounts[candidate.publisher] || 0;
      const fairnessPenalty = currentPubCount * (weights.epsilonFairness * 0.4);

      // Combined MMR-Trust Score
      const mmrScore = (
        (1.0 - weights.deltaDiversity) * baseScore +
        weights.deltaDiversity * minDistance -
        fairnessPenalty
      );

      if (mmrScore > bestMMRScore) {
        bestMMRScore = mmrScore;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      const selected = candidatePool.splice(bestIdx, 1)[0];
      const pub = selected.publisher;
      publisherCounts[pub] = (publisherCounts[pub] || 0) + 1;

      // Update diversity score component
      selected.computedScores.diversityContribution = Number((weights.deltaDiversity * (bestMMRScore - selected.computedScores.finalRankScore + 0.1)).toFixed(3));
      selected.computedScores.decomposed.diversityPt = selected.computedScores.diversityContribution;
      selected.computedScores.rank = rankedList.length + 1;
      rankedList.push(selected);
    } else {
      break;
    }
  }

  // Append remaining candidates if any
  for (const remaining of candidatePool) {
    remaining.computedScores.rank = rankedList.length + 1;
    rankedList.push(remaining);
  }

  return rankedList;
}
