/**
 * Core Type Definitions for Trust-Aware News Ranking Framework
 */

export type SourceTier = 
  | 'Tier 1 (Global Wire / Peer-Reviewed / Public Service)'
  | 'Tier 2 (Major Editorial Newspaper / Specialized)'
  | 'Tier 3 (Independent / Regional)'
  | 'Tier 4 (Tabloid / Sensationalist)'
  | 'Tier 5 (Unverified Blog / Sponsored Content)';

export type FactCheckStatus = 'VERIFIED' | 'UNVERIFIED_DEVELOPING' | 'DISPUTED_SENSATIONAL';

export interface MonthlyCredibilityPoint {
  month: string; // "Nov 25", "Dec 25", ... "Oct 26"
  score: number; // 0.0 to 1.0
  corroboratedArticles: number;
  retractionsOrCorrections: number;
  exposureMultiplier: number;
}

export interface NewsSourceProfile {
  id: string;
  name: string;
  domain: string;
  ownershipType: 'Public Service Wire' | 'Peer-Reviewed Journal' | 'Major Commercial Newspaper' | 'Specialized Digital Media' | 'Regional Independent' | 'Tabloid Syndicate' | 'Sponsored / Unverified';
  sourceTier: SourceTier;
  country: string;
  establishedYear: number;
  overallCredibilityScore: number;
  journalisticStandardsScore: number;
  attributionProvenanceScore: number;
  factCheckPolicyScore: number;
  corroborationConsensusScore: number;
  sensationalismIndex: number; // 0.0 to 1.0
  rankingExposureStatus: 'BOOSTED' | 'NORMAL' | 'PENALIZED' | 'FILTERED_OUT';
  exposureMultiplier: number;
  monthlyHistory: MonthlyCredibilityPoint[];
  keyAuditNotes: string;
  totalArticlesInPool: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  abstract: string;
  category: 'Politics' | 'Technology' | 'Science' | 'Health' | 'Economics' | 'Environment' | 'Culture' | 'Sensational';
  subcategory: string;
  publisher: string;
  sourceTier: SourceTier;
  sourceReliability: number; // 0.0 to 1.0
  provenanceScore: number; // 0.0 to 1.0 (verified author, citations)
  corroborationCount: number; // Independent news outlets reporting congruent facts
  corroborationScore: number; // 0.0 to 1.0
  factCheckStatus: FactCheckStatus;
  clickbaitIndex: number; // 0.0 to 1.0 (linguistic sensationalism)
  uncertainty: number; // 0.0 to 1.0 (credibility variance/entropy)
  wordCount: number;
  expectedReadTimeSec: number;
  publishedHoursAgo: number;
  
  // Implicit behavioral history from synthetic population (MIND-style)
  historicalClicks: number;
  historicalImpressions: number;
  avgObservedDwellSec: number;
  historicalCompletionRate: number; // 0.0 to 1.0
  historicalBounceRate: number; // < 10 sec dwell rate
  repeatVisitRate: number; // multi-session return rate

  // Optional live NewsAPI metadata
  url?: string;
  urlToImage?: string;
  author?: string;
  isLiveNews?: boolean;

  // Computed scores for the active user context
  scores?: {
    relevance: number;
    engagement: number;
    satisfaction: number;
    credibility: number;
    diversityContribution: number;
    novelty: number;
    finalRankScore: number;
    rank: number;
    decomposed: {
      relevancePt: number;
      credibilityPt: number;
      satisfactionPt: number;
      diversityPt: number;
      noveltyPt: number;
      clickbaitPenaltyPt: number;
    };
  };
}

export interface ScoredArticle extends NewsArticle {
  computedScores: {
    relevance: number;
    engagement: number;
    satisfaction: number;
    credibility: number;
    diversityContribution: number;
    novelty: number;
    finalRankScore: number;
    rank: number;
    decomposed: {
      relevancePt: number;
      credibilityPt: number;
      satisfactionPt: number;
      diversityPt: number;
      noveltyPt: number;
      clickbaitPenaltyPt: number;
    };
  };
}

export interface UserPersona {
  id: string;
  name: string;
  role: string;
  description: string;
  categoryAffinities: Record<string, number>; // Category weights 0.0 to 1.0
  readingPaceWpm: number;
  bounceThresholdSec: number;
  toleranceForSensationalism: number; // 0.0 (strict) to 1.0 (indulgent)
  recentReadCategories: string[];
  filterBubbleSeverity: number; // Current historical concentration
}

export interface MultiObjectiveWeights {
  alphaClick: number;        // Short-term CTR prediction weight
  betaSatisfaction: number;  // Long-term completion & sustained dwell
  gammaCredibility: number;  // Factual reliability & provenance
  deltaDiversity: number;    // Intra-List Diversity (ILD) boost
  epsilonFairness: number;   // Long-tail publisher exposure boost
  zetaFreshness: number;     // Article recency decay
}

export type BaselineModelId = 
  | 'popularity'
  | 'collaborative_filtering'
  | 'content_based'
  | 'click_optimized'
  | 'hybrid_recommender'
  | 'credibility_heuristic'
  | 'trustaware_moo';

export interface ModelMetadata {
  id: BaselineModelId;
  name: string;
  shortLabel: string;
  paradigm: string;
  description: string;
  color: string;
}

export interface MetricSummary {
  ndcg5: number;
  ndcg10: number;
  mrr: number;
  precisionAt5: number;
  avgDwellTimeSec: number;
  avgCompletionRate: number;
  bounceRate: number;
  meanCredibility: number;
  lowCredibilityExposure: number; // % of recommended items with credibility < 0.50
  clickbaitLeakageRate: number;
  intraListDiversity: number; // ILD 0.0 to 1.0
  categoryEntropy: number; // Shannon entropy
  noveltyScore: number; // Self-information
  publisherGini: number; // 0 (equal) to 1 (monopoly)
}

export interface ParetoSolution {
  id: string;
  weights: MultiObjectiveWeights;
  shortTermCTR: number;
  longTermSatisfaction: number;
  credibilityScore: number;
  diversityILD: number;
  exposureFairness: number;
  isParetoOptimal: boolean;
  paretoRank: number;
}

export interface AblationStudyResult {
  variantId: string;
  variantName: string;
  description: string;
  ndcg10: number;
  satisfactionRate: number;
  credibility: number;
  diversityILD: number;
  publisherGini: number;
  tStatistic: number;
  pValue: number;
  confidenceInterval: [number, number];
  isSignificant: boolean;
}

export interface SavedArticle {
  id: string;
  articleId: string;
  userId: string;
  title: string;
  publisher: string;
  category: string;
  url?: string;
  urlToImage?: string;
  credibilityScore?: number;
  userNotes?: string;
  savedAt: string;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPhoto?: string;
  content: string;
  type: 'post' | 'repost';
  referencedArticle?: {
    id: string;
    title: string;
    publisher: string;
    category?: string;
    url?: string;
    urlToImage?: string;
    credibilityScore?: number;
    abstract?: string;
  };
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  repostsCount?: number;
  createdAt: string;
}

export interface ArticleComment {
  id: string;
  targetType: 'article' | 'post';
  targetId: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
}

export interface UserPreferencesConfig {
  preferredCategories: string[];
  readingWpm: number;
  defaultRegion: string;
  showCredibilityBadges: boolean;
  autoSyncLiveFeed: boolean;
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  handle: string;
  bio?: string;
  email?: string;
  photoURL?: string;
  customWeights?: MultiObjectiveWeights;
  preferences?: UserPreferencesConfig;
  savedCount?: number;
  repostsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

