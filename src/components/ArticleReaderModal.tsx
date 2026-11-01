import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Zap,
  Share2,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  FileText,
  Bookmark,
  Repeat2,
  MessageSquare,
  Send,
  Check
} from 'lucide-react';
import { ScoredArticle, UserPersona, ArticleComment } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import { useOverlayBackHandler } from '../utils/backNavigation';

export interface ArticleReaderModalProps {
  article: ScoredArticle | null;
  user?: UserPersona;
  onClose: () => void;
  onLogInteraction?: (articleId: string, dwellSec: number, feedback: 'positive' | 'negative' | 'flagged' | null) => void;
  onNextArticle?: () => void;
  onPrevArticle?: () => void;
  hasNextArticle?: boolean;
  hasPrevArticle?: boolean;
  currentIndex?: number;
  totalArticles?: number;
  onOpenFactCheck?: (article: ScoredArticle) => void;
  onRepostArticle?: (article: ScoredArticle) => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  article,
  user,
  onClose,
  onLogInteraction,
  onNextArticle,
  onPrevArticle,
  hasNextArticle = false,
  hasPrevArticle = false,
  currentIndex,
  totalArticles,
  onRepostArticle,
}) => {
  const {
    currentUser,
    signIn,
    saveArticle,
    removeSavedArticle,
    isArticleSaved,
    addComment,
    getComments,
  } = useFirebase();

  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | 'flagged' | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [readerToast, setReaderToast] = useState<string | null>(null);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [articleComments, setArticleComments] = useState<ArticleComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isSaved = article ? isArticleSaved(article.id) : false;

  useEffect(() => {
    if (!article) return;
    getComments('article', article.id).then(setArticleComments);
  }, [article?.id]);

  useEffect(() => {
    if (readerToast) {
      const timer = setTimeout(() => setReaderToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [readerToast]);

  useEffect(() => {
    if (!article) return;
    setSecondsElapsed(0);
    setFeedback(null);
    setCopied(false);

    // Cancel speech when article changes
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }

    const timer = setInterval(() => {
      setSecondsElapsed((prev: number) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [article?.id]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Keyboard navigation: Left/Right arrows for Next/Prev, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && hasNextArticle && onNextArticle) {
        e.preventDefault();
        onNextArticle();
      } else if (e.key === 'ArrowLeft' && hasPrevArticle && onPrevArticle) {
        e.preventDefault();
        onPrevArticle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNextArticle, onPrevArticle, hasNextArticle, hasPrevArticle]);

  useOverlayBackHandler(
    Boolean(article),
    () => {
      if (article) {
        onLogInteraction?.(article.id, secondsElapsed, feedback);
      }
      onClose();
    },
    'article-reader'
  );

  if (!article) return null;

  const readingPaceWpm = user?.readingPaceWpm || 240;
  const expectedSec = Math.max(30, Math.round((article.wordCount / readingPaceWpm) * 60));
  const completionRatio = Math.min(1.0, secondsElapsed / expectedSec);

  const handleFinish = (fb: 'positive' | 'negative' | 'flagged' | null = feedback) => {
    onLogInteraction?.(article.id, secondsElapsed, fb);
    onClose();
  };

  const handleShare = () => {
    if (article.url) {
      navigator.clipboard?.writeText(article.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const textToSpeak = `${article.title}. Reported by ${article.publisher}. ${article.abstract}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    if (!currentUser) {
      await signIn();
      return;
    }
    setIsSubmittingComment(true);
    try {
      const comment = await addComment('article', article.id, newCommentText.trim());
      if (comment) {
        setArticleComments((prev: ArticleComment[]) => [...prev, comment]);
        setNewCommentText('');
        setReaderToast('Comment published to article discussion!');
      }
    } catch (err) {
      console.error('Error adding article comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Key synthesized takeaways
  const takeaways = [
    `Primary Wire Dispatch: ${article.abstract.slice(0, 160)}${article.abstract.length > 160 ? '...' : ''}`,
    `Factual Credibility Audit: Cross-checked across ${article.corroborationCount} independent news wires with a verified ${Math.round(article.sourceReliability * 100)}% reliability index.`,
    `Domain & Strategic Impact: Developments in ${article.category} categorized under ${article.sourceTier}. Clickbait linguistic penalty evaluated at ${(article.clickbaitIndex * 100).toFixed(0)}%.`
  ];

  // Contextual topic keywords derived from article
  const topicTags = [
    article.category,
    ...(article.subcategory ? [article.subcategory.replace(' Wire', '')] : []),
    ...(article.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 5 && !['Beyond', 'Before', 'During', 'Across', 'Report', 'Market', 'Public', 'Global', 'Future', 'Second', 'Models'].includes(w))
      .slice(0, 3)),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);

  const textClass = textSize === 'xlarge'
    ? 'text-lg sm:text-xl leading-relaxed'
    : textSize === 'large'
    ? 'text-base sm:text-lg leading-relaxed'
    : 'text-sm sm:text-base leading-relaxed';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={article.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleFinish();
        }
      }}
    >
      <div
        className={`relative w-full flex flex-col rounded-3xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl overflow-hidden ring-1 ring-white/10 transition-all duration-300 ${
          isExpanded
            ? 'max-w-5xl h-[95vh]'
            : 'max-w-3xl max-h-[92vh]'
        }`}
      >
        {/* Top Reading Progress Bar */}
        <div className="w-full bg-neutral-900 h-1 shrink-0 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500 transition-all duration-300"
            style={{ width: `${Math.round(completionRatio * 100)}%` }}
          />
        </div>

        {/* Top Minimal Navigation Strip */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-850 bg-neutral-900/70 backdrop-blur-md shrink-0 gap-2">
          {/* Left: Back Button, Category, Publisher & Trust Badge */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <button
              type="button"
              onClick={() => handleFinish()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-200 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Back"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>Back</span>
            </button>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-neutral-800 text-white border border-neutral-700">
              {article.category}
            </span>
            <span className="text-xs text-neutral-300 font-semibold truncate max-w-[140px] sm:max-w-[200px]">
              {article.publisher}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/50">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              {Math.round(article.sourceReliability * 100)}% Trust
            </span>

            {currentIndex !== undefined && totalArticles !== undefined && (
              <span className="text-[11px] font-mono text-neutral-400 hidden md:inline-block">
                Article {currentIndex + 1} of {totalArticles}
              </span>
            )}
          </div>

          {/* Right: Quick Controls (Next/Prev, Audio, Text Size, Expand, Close) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Previous Article Button */}
            {onPrevArticle && (
              <button
                onClick={onPrevArticle}
                disabled={!hasPrevArticle}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Previous Article (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Next Article Button */}
            {onNextArticle && (
              <button
                onClick={onNextArticle}
                disabled={!hasNextArticle}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                title="Next Article (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Listen / TTS Button */}
            <button
              onClick={toggleAudio}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                isPlayingAudio
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 animate-pulse'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title={isPlayingAudio ? 'Pause Narration' : 'Listen to Brief (TTS)'}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Font Size Cycle Button */}
            <button
              onClick={() => {
                setTextSize((prev: 'normal' | 'large' | 'xlarge') =>
                  prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'normal'
                );
              }}
              className="px-2 py-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
              title={`Text Size: ${textSize} (Click to toggle)`}
            >
              {textSize === 'normal' ? 'A' : textSize === 'large' ? 'A+' : 'A++'}
            </button>

            {/* Fullscreen / Expand Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors hidden sm:block cursor-pointer"
              title={isExpanded ? 'Collapse View' : 'Expand View'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => handleFinish()}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer ml-1"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-7 md:p-8 space-y-6 scrollbar-thin">
          
          {/* Cover Media Header */}
          {article.urlToImage && (
            <div className="relative w-full h-52 sm:h-72 md:h-80 rounded-2xl overflow-hidden border border-neutral-800/90 bg-neutral-900 shadow-xl group">
              <img
                src={article.urlToImage}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
              
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-neutral-300 flex-wrap gap-2">
                <span className="bg-black/80 px-2.5 py-1 rounded-lg backdrop-blur-md border border-neutral-800">
                  {article.publishedHoursAgo}h ago · {article.publisher}
                </span>
                <span className="bg-black/80 px-2.5 py-1 rounded-lg backdrop-blur-md border border-neutral-800 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  ~{Math.max(1, Math.round(article.wordCount / 220))} min read ({article.wordCount} words)
                </span>
              </div>
            </div>
          )}

          {/* Enhanced Headline & Comprehensive Intelligence Section */}
          <div className="space-y-4">
            {/* Top Category, Source Tier & Corroboration Badges */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-750 text-cyan-300 font-semibold flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {article.category}
              </span>

              {article.subcategory && (
                <span className="px-2 py-1 rounded-md bg-neutral-900/80 border border-neutral-800 text-neutral-300">
                  {article.subcategory}
                </span>
              )}

              <span className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 font-semibold flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {Math.round(article.sourceReliability * 100)}% Trust · {article.sourceTier ? article.sourceTier.split('(')[0].trim() : 'Tier 1'}
              </span>

              <span className="text-neutral-400 hidden sm:inline-flex items-center gap-1">
                <span className="text-cyan-400 font-bold">Rank #{article.computedScores.rank}</span>
                <span>·</span>
                <span>Pareto Score: {article.computedScores.finalRankScore.toFixed(3)}</span>
                <span>·</span>
                <span>{article.corroborationCount} Independent Wires</span>
              </span>
            </div>

            {/* Main Headline */}
            <h1 className={`font-extrabold text-white tracking-tight leading-snug ${
              textSize === 'xlarge' ? 'text-2xl sm:text-3xl' : textSize === 'large' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
            }`}>
              {article.title}
            </h1>

            {/* Rich Editorial Byline & Provenance Information Card */}
            <div className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-3">
              {/* Row 1: Author, Publisher, Read Time & External Link */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Author Avatar / Initial */}
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-cyan-300 shrink-0">
                    {article.author ? article.author.replace(/^(Dr\.|Prof\.)\s*/, '')[0].toUpperCase() : 'W'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white">
                        {article.author || 'Investigative Newsroom Wire'}
                      </span>
                      <span className="text-neutral-500 font-mono text-[11px]">·</span>
                      <span className="text-neutral-300 font-mono text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {article.publisher}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-0.5 flex-wrap">
                      <span>{article.publishedHoursAgo}h ago</span>
                      <span>·</span>
                      <span>~{Math.max(1, Math.round(article.wordCount / 220))} min read ({article.wordCount} words)</span>
                      <span>·</span>
                      <span className="text-emerald-400">Objective Phrasing ({Math.round((1 - article.clickbaitIndex) * 100)}% neutral)</span>
                    </div>
                  </div>
                </div>

                {/* External link to original article if URL exists */}
                {article.url && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-medium transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <span>Original Source</span>
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  </a>
                )}
              </div>

              {/* Row 2: Objective Heuristic Quick Pill Strip */}
              <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-950/70 border border-neutral-850">
                  <span className="text-neutral-400">Factual Trust:</span>
                  <span className="font-bold text-emerald-400">{Math.round(article.sourceReliability * 100)}%</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-950/70 border border-neutral-850">
                  <span className="text-neutral-400">Relevance:</span>
                  <span className="font-bold text-cyan-400">{Math.round(article.computedScores.relevance * 100)}%</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-950/70 border border-neutral-850">
                  <span className="text-neutral-400">Corroborated:</span>
                  <span className="font-bold text-neutral-200">{article.corroborationCount} Wires</span>
                </div>
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-950/70 border border-neutral-850">
                  <span className="text-neutral-400">Target Dwell:</span>
                  <span className="font-bold text-neutral-200">{article.expectedReadTimeSec}s</span>
                </div>
              </div>

              {/* Row 3: Contextual Topic Keywords */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] font-mono uppercase text-neutral-500 font-semibold">Keywords:</span>
                {topicTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-950/80 text-neutral-300 border border-neutral-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 60-Second Executive Summary Box */}
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/15 p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 tracking-wide uppercase font-mono">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Executive Brief &amp; Core Takeaway</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                AI Verified
              </span>
            </div>

            <p className={`text-neutral-200 leading-relaxed font-sans ${textClass}`}>
              {article.abstract}
            </p>
          </div>

          {/* In-Depth Synthesized Story & Analytical Context */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 tracking-wide uppercase font-mono">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Comprehensive Story &amp; Context</span>
            </div>

            <div className={`space-y-4 text-neutral-300 ${textClass}`}>
              <p className="leading-relaxed">
                As reported by <strong className="text-white font-medium">{article.publisher}</strong>, this development in <strong className="text-neutral-200 font-medium">{article.category}</strong> highlights key ongoing transformations. The dispatch was verified against multiple news services to ensure objective framing and high factual accuracy.
              </p>
              <p className="leading-relaxed">
                TrustAware-MOO evaluated this dispatch with a factual reliability index of <strong className="text-emerald-400 font-mono">{Math.round(article.sourceReliability * 100)}%</strong>, assessing multi-objective criteria including topical relevance, predicted reader satisfaction, and echo-chamber mitigation.
              </p>
              <p className="leading-relaxed">
                Readers monitoring developments in {article.category} can verify corroborating coverage or review the publisher’s full text through the original source link below.
              </p>
            </div>
          </div>

          {/* Key Insights & Takeaways */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Key Wire Takeaways</span>
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm text-neutral-300">
              {takeaways.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-850"
                >
                  <span className="w-5 h-5 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trust & Provenance Metrics Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs pt-2">
            <div className="p-3 rounded-xl border border-neutral-850 bg-neutral-900/50">
              <span className="block text-[10px] font-mono text-neutral-400 uppercase">Factual Trust</span>
              <span className="text-base font-mono font-bold text-emerald-400">
                {Math.round(article.sourceReliability * 100)}%
              </span>
            </div>
            <div className="p-3 rounded-xl border border-neutral-850 bg-neutral-900/50">
              <span className="block text-[10px] font-mono text-neutral-400 uppercase">Corroboration</span>
              <span className="text-base font-mono font-bold text-cyan-400">
                {article.corroborationCount} Wires
              </span>
            </div>
            <div className="p-3 rounded-xl border border-neutral-850 bg-neutral-900/50">
              <span className="block text-[10px] font-mono text-neutral-400 uppercase">Clickbait Score</span>
              <span className={`text-base font-mono font-bold ${article.clickbaitIndex > 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {Math.round(article.clickbaitIndex * 100)}%
              </span>
            </div>
            <div className="p-3 rounded-xl border border-neutral-850 bg-neutral-900/50">
              <span className="block text-[10px] font-mono text-neutral-400 uppercase">Target Dwell</span>
              <span className="text-base font-mono font-bold text-white">
                ~{Math.round(article.expectedReadTimeSec / 60)} min
              </span>
            </div>
          </div>

          {/* Live Dwell Progress */}
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono py-2 px-1 border-t border-neutral-900">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Dwell Reading Time:</span>
              <span className="text-white font-bold">{secondsElapsed}s</span>
              <span className="text-neutral-500">/ ~{expectedSec}s target</span>
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">
              {Math.round(completionRatio * 100)}% read
            </span>
          </div>

          {/* Toast Notification */}
          {readerToast && (
            <div className="bg-neutral-900 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{readerToast}</span>
            </div>
          )}

          {/* Article Comments Drawer */}
          {showCommentsDrawer && (
            <div className="mt-4 pt-4 border-t border-neutral-800 space-y-3 bg-neutral-900/50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Article Discussion &amp; Peer Notes ({articleComments.length})
                </h5>
                <button
                  onClick={() => setShowCommentsDrawer(false)}
                  className="text-[11px] text-neutral-500 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* Comments list */}
              <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-none pr-1">
                {articleComments.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic py-2">
                    No comments yet on this article. Be the first to share an analytical observation!
                  </p>
                ) : (
                  articleComments.map((comm: ArticleComment) => (
                    <div
                      key={comm.id}
                      className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-2.5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{comm.authorName}</span>
                          <span className="text-[10px] font-mono text-neutral-400">{comm.authorHandle}</span>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-600">
                          {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-neutral-300 leading-normal font-sans">{comm.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={currentUser ? 'Leave an analytical note or fact-check comment...' : 'Sign in to comment...'}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newCommentText.trim()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Post</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-neutral-850 bg-neutral-900/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Quick Feedback Chips & Share */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => {
                setFeedback('positive');
                onLogInteraction?.(article.id, secondsElapsed, 'positive');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                feedback === 'positive'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Accurate</span>
            </button>

            <button
              onClick={() => {
                setFeedback('flagged');
                onLogInteraction?.(article.id, secondsElapsed, 'flagged');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                feedback === 'flagged'
                  ? 'bg-rose-950 text-rose-300 border border-rose-600'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>Sensational</span>
            </button>

            {/* Save / Bookmark Button */}
            <button
              onClick={async () => {
                if (isSaved) {
                  await removeSavedArticle(article.id);
                  setReaderToast('Removed from saved bookmarks');
                } else {
                  await saveArticle(article);
                  setReaderToast('Saved article to your profile!');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isSaved
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800'
              }`}
              title={isSaved ? 'Remove from profile bookmarks' : 'Save article to profile'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            {/* Repost to Wire */}
            {onRepostArticle && (
              <button
                onClick={() => {
                  onRepostArticle(article);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
                title="Repost story to Social Wire with your commentary"
              >
                <Repeat2 className="w-3.5 h-3.5" />
                <span>Repost</span>
              </button>
            )}

            {/* Toggle Comments in Reader */}
            <button
              onClick={() => setShowCommentsDrawer(!showCommentsDrawer)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showCommentsDrawer
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border-neutral-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comments ({articleComments.length})</span>
            </button>

            {article.url && (
              <button
                onClick={handleShare}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                title="Copy Wire Link"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Navigation & External Read Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Next Article CTA */}
            {onNextArticle && hasNextArticle && (
              <button
                onClick={onNextArticle}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-700"
              >
                <span>Next Article</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Read Full Article on Publisher */}
            {article.url ? (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 sm:px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Read Full on {article.publisher}</span>
                <ExternalLink className="w-3.5 h-3.5 text-black" />
              </a>
            ) : (
              <button
                onClick={() => handleFinish()}
                className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all cursor-pointer"
              >
                Done Reading
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

