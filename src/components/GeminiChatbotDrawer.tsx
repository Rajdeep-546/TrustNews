import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Trash2,
  Bot,
  User,
  Zap,
  Brain,
  ShieldCheck,
  Sliders,
  Newspaper,
  Maximize2,
  Minimize2,
  MessageSquare,
  ExternalLink,
  BookOpen,
  CornerDownRight,
  Globe,
} from 'lucide-react';
import { NewsArticle, UserPersona, MultiObjectiveWeights } from '../types';

export type ChatModelMode = 'fast' | 'general' | 'complex';

export interface ChatbotRole {
  id: string;
  name: string;
  badge: string;
  description: string;
  systemInstruction: string;
  quickPrompts: string[];
}

export interface ChatTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  roleId?: string;
  relatedArticles?: NewsArticle[];
  groundingSources?: Array<{ title: string; uri: string }>;
  searchQueries?: string[];
}

const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  Technology:
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
  Science:
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
  Health:
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
  Economics:
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80',
  Environment:
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=900&q=80',
  Politics:
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=900&q=80',
  Culture:
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
};

const CHATBOT_ROLES: ChatbotRole[] = [
  {
    id: 'credibility_analyst',
    name: 'Credibility & Fact-Check Analyst',
    badge: 'Fact-Check',
    description: 'Answers any question in points + verifies news claims and credibility.',
    systemInstruction:
      'You are the Senior AI Analyst & Editorial Fact-Checker for TrustNews-MOO. Always directly, accurately, and thoroughly answer the user’s exact question first using clear section headers (### Direct Answer, ### Detailed Breakdown in Points, ### Key Takeaways) and numbered points. Only cite workspace feed articles when they are directly relevant to the user’s question.',
    quickPrompts: [
      'Show top breaking news with pictures & point-by-point credibility audit',
      'Analyze the most reliable Science & Technology stories in points',
      'Which articles in the current feed show clickbait vs verified reporting?',
    ],
  },
  {
    id: 'pareto_advisor',
    name: 'Pareto Ranking & MOO Strategist',
    badge: 'Pareto MOO',
    description: 'Answers any question + explains multi-objective ranking & fairness.',
    systemInstruction:
      'You are the Principal Multi-Objective Optimization (MOO) & AI Strategist for TrustNews-MOO. Always directly and accurately answer the user’s exact question first in structured numbered points and bullet points. When asked about ranking or news, explain how relevance, credibility, satisfaction, and diversity interact.',
    quickPrompts: [
      'Recommend optimal Pareto weights for my persona in detailed points',
      'How does Intra-List Diversity prevent filter bubbles across current news?',
      'Compare high-CTR vs high-credibility articles in my feed with details',
    ],
  },
  {
    id: 'wire_briefing',
    name: 'Rapid News Wire Briefing',
    badge: 'Wire Brief',
    description: 'Answers any question + synthesizes multi-point news briefings.',
    systemInstruction:
      'You are the Executive AI Briefing Editor for TrustNews-MOO. Always directly and thoroughly answer the user’s exact question first in clear ### sections, numbered points, and bullet points. When asked for news briefings, synthesize key developments and why they matter.',
    quickPrompts: [
      'Give me an executive point-by-point briefing of top stories with pictures',
      'Summarize the latest Technology, Economics & Policy news in detail',
      'Compare how Tier-1 outlets are covering today’s biggest headlines',
    ],
  },
];

interface GeminiChatbotDrawerProps {
  articles: NewsArticle[];
  selectedPersona: UserPersona;
  weights: MultiObjectiveWeights;
  activeTab: string;
  onSelectArticle?: (article: NewsArticle) => void;
}

const STORAGE_KEY = 'trustnews_gemini_chat_history_v4';

export const GeminiChatbotDrawer: React.FC<GeminiChatbotDrawerProps> = ({
  articles,
  selectedPersona,
  weights,
  activeTab,
  onSelectArticle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(CHATBOT_ROLES[0].id);
  const [modelMode, setModelMode] = useState<ChatModelMode>('fast');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedRole =
    CHATBOT_ROLES.find((r) => r.id === selectedRoleId) || CHATBOT_ROLES[0];

  const buildWelcomeTurn = (): ChatTurn => ({
    id: 'welcome-turn',
    role: 'model',
    text: [
      '### Executive Intelligence Ready',
      'Welcome to **TrustNews Gemini Analyst**. Ask me **any question** for a detailed, point-by-point answer, or ask about news topics to receive visual story cards with photographs and credibility metrics.',
      '### How I Can Help',
      '1. **Ask Any Question**: Get structured, in-depth answers in clear points on any topic, concept, or event.',
      '2. **Visual News & Fact-Check**: Ask about any news topic or feed category to see matching news cards with pictures and source verification.',
      '3. **Pareto Ranking Insights**: Optimize your multi-objective recommendation weights and diversity settings.',
    ].join('\n'),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    modelUsed: 'gemini-3.1-flash-lite',
    roleId: CHATBOT_ROLES[0].id,
    relatedArticles: [],
  });

  const [messages, setMessages] = useState<ChatTurn[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Ignore storage read errors
      }
    }
    return [buildWelcomeTurn()];
  });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const latestMessageRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-25)));
      } catch {
        // Ignore quota errors
      }
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    if (isLoading && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    } else if (latestMessageRef.current) {
      // Scroll to the top of the newest message so the user reads the text answer first
      latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const buildWorkspaceContext = () => {
    const sampleArticles = articles.slice(0, 10).map(
      (a, idx) =>
        `${idx + 1}. "${a.title}" | Publisher: ${a.publisher} (${a.sourceTier}) | Category: ${
          a.category
        } | Reliability: ${(a.sourceReliability * 100).toFixed(0)}% | Corroboration: ${
          a.corroborationCount
        } sources | Clickbait Index: ${(a.clickbaitIndex * 100).toFixed(
          0
        )}% | Summary: ${a.abstract.slice(0, 160)}`
    );

    return [
      `Active View Tab: ${activeTab}`,
      `Active Reader Persona: ${selectedPersona.name} (${selectedPersona.role}) — Recent Categories: ${selectedPersona.recentReadCategories.join(', ')}`,
      `Current Multi-Objective Weights: alphaClick=${weights.alphaClick.toFixed(
        2
      )}, betaSatisfaction=${weights.betaSatisfaction.toFixed(
        2
      )}, gammaCredibility=${weights.gammaCredibility.toFixed(
        2
      )}, deltaDiversity=${weights.deltaDiversity.toFixed(
        2
      )}, epsilonFairness=${weights.epsilonFairness.toFixed(
        2
      )}, zetaFreshness=${weights.zetaFreshness.toFixed(2)}`,
      `Active Feed Catalog (${articles.length} total articles):\n${sampleArticles.join('\n')}`,
    ].join('\n');
  };

  const handleSendMessage = async (promptOverride?: string) => {
    const textToSend = (promptOverride !== undefined ? promptOverride : input).trim();
    if (!textToSend || isLoading) return;

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      roleId: selectedRole.id,
    };

    const updatedHistory = [...messages, userTurn];
    setMessages(updatedHistory);
    if (promptOverride === undefined) {
      setInput('');
    }
    setIsLoading(true);

    try {
      const apiMessages = updatedHistory
        .filter((m) => m.id !== 'welcome-turn')
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const slimCandidates = articles.slice(0, 24).map((a) => ({
        id: a.id,
        title: a.title,
        abstract: a.abstract,
        publisher: a.publisher,
        category: a.category,
        sourceTier: a.sourceTier,
        sourceReliability: a.sourceReliability,
        clickbaitIndex: a.clickbaitIndex,
        corroborationCount: a.corroborationCount,
        factCheckStatus: a.factCheckStatus,
        expectedReadTimeSec: a.expectedReadTimeSec,
        urlToImage: a.urlToImage,
        url: a.url,
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: apiMessages,
          systemInstruction: selectedRole.systemInstruction,
          roleName: selectedRole.name,
          mode: modelMode,
          useSearchGrounding,
          contextSummary: buildWorkspaceContext(),
          articleCount: articles.length,
          topHeadlines: articles.slice(0, 5).map((a) => `${a.title} (${a.publisher})`),
          candidateArticles: slimCandidates,
        }),
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      const replyText =
        data?.reply ||
        'I encountered a temporary issue generating a response. Please try asking again.';

      const modelTurn: ChatTurn = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data?.modelUsed || 'gemini-3.8-flash',
        roleId: selectedRole.id,
        relatedArticles: Array.isArray(data?.relatedArticles)
          ? data.relatedArticles
          : [],
        groundingSources: Array.isArray(data?.groundingSources)
          ? data.groundingSources
          : [],
        searchQueries: Array.isArray(data?.searchQueries)
          ? data.searchQueries
          : [],
      };

      setMessages((prev) => [...prev, modelTurn]);
    } catch {
      const fallbackTurn: ChatTurn = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: '### Connection Notice\n1. **Request Interrupted**: Please resend your question and I will answer it right away.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.1-flash-lite',
        roleId: selectedRole.id,
        relatedArticles: [],
      };
      setMessages((prev) => [...prev, fallbackTurn]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const resetTurn = buildWelcomeTurn();
    setMessages([resetTurn]);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
  };

  const renderInlineFormatting = (text: string) => {
    const segments = text.split(/(\*\*.*?\*\*)/g);
    return segments.map((seg, i) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {seg.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{seg}</span>;
    });
  };

  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed === '---') {
        return <div key={lineIdx} className="h-1.5" />;
      }

      // Markdown Section Headings (### or ##)
      if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
        const headingText = trimmed.replace(/^#{2,3}\s+/, '').replace(/\*\*/g, '');
        return (
          <div
            key={lineIdx}
            className="pt-2.5 pb-1 first:pt-0 border-b border-white/10 mb-1.5 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
              {headingText}
            </h4>
          </div>
        );
      }

      // Numbered Points (e.g. "1. **Point**: details")
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numberedMatch) {
        const num = numberedMatch[1].padStart(2, '0');
        const body = numberedMatch[2];
        return (
          <div
            key={lineIdx}
            className="flex items-start gap-2.5 py-1.5 px-2.5 my-1 rounded-xl bg-white/[0.03] border border-white/[0.06]"
          >
            <span className="font-mono text-[10px] font-bold text-sky-400 mt-0.5 shrink-0">
              {num}.
            </span>
            <div className="flex-1 text-xs text-neutral-200 leading-relaxed">
              {renderInlineFormatting(body)}
            </div>
          </div>
        );
      }

      // Bullet Points (- or *)
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.slice(2);
        return (
          <div key={lineIdx} className="flex items-start gap-2 pl-1.5 my-1">
            <CornerDownRight className="w-3 h-3 text-emerald-400 mt-1 shrink-0" />
            <div className="flex-1 text-xs text-neutral-200 leading-relaxed">
              {renderInlineFormatting(content)}
            </div>
          </div>
        );
      }

      return (
        <p key={lineIdx} className="my-1 text-xs text-neutral-200 leading-relaxed">
          {renderInlineFormatting(line)}
        </p>
      );
    });
  };

  const getRoleIcon = (id: string) => {
    if (id === 'pareto_advisor') return <Sliders className="w-3.5 h-3.5 text-amber-400" />;
    if (id === 'wire_briefing') return <Newspaper className="w-3.5 h-3.5 text-emerald-400" />;
    return <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />;
  };

  return (
    <>
      {/* Floating Launcher Button (Compact Icon-Only) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open TrustNews Gemini Chatbot"
          title="Gemini AI Chat"
          className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-950/90 hover:bg-neutral-900 text-white border border-white/15 hover:border-sky-500/50 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
        >
          <Sparkles className="w-4 h-4 text-sky-400 group-hover:text-sky-300 transition-transform duration-200 group-hover:rotate-12" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-neutral-950" />
        </button>
      )}

      {/* Multi-Turn Chat Drawer / Modal */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-neutral-950/98 border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden ${
            isExpanded
              ? 'inset-3 sm:inset-6 rounded-2xl'
              : 'bottom-4 right-4 left-4 sm:left-auto sm:w-[480px] h-[680px] max-h-[88vh] rounded-2xl'
          }`}
        >
          {/* Top Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-neutral-900/90 via-neutral-900/60 to-neutral-950 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white truncate">
                    TrustNews Gemini Analyst
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                    · Multi-Turn
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 truncate">
                  {selectedRole.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleClearHistory}
                title="Clear conversation history"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? 'Restore compact size' : 'Expand chat window'}
                className="hidden sm:inline-flex p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chatbot"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Role & Model Mode Bar */}
          <div className="px-3.5 py-2.5 border-b border-white/10 bg-neutral-900/50 space-y-2">
            {/* Specialist Role Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {CHATBOT_ROLES.map((role) => {
                const active = role.id === selectedRole.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer border ${
                      active
                        ? 'bg-white/12 text-white border-white/25 shadow-xs'
                        : 'bg-transparent text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-white/5'
                    }`}
                  >
                    {getRoleIcon(role.id)}
                    <span>{role.badge}</span>
                  </button>
                );
              })}
            </div>

            {/* Model / Complexity Mode & Google Search Grounding Selector */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setUseSearchGrounding((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono border transition-colors cursor-pointer ${
                  useSearchGrounding
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/35'
                    : 'bg-neutral-950 text-neutral-500 border-white/10 hover:text-neutral-300'
                }`}
                title="Toggle real-time Google Search Grounding (gemini-3.8-flash + googleSearch)"
              >
                <Globe className="w-3 h-3" />
                <span>Google Search: {useSearchGrounding ? 'ON' : 'OFF'}</span>
              </button>

              <div className="flex items-center gap-1 bg-neutral-950/90 p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setModelMode('fast')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer ${
                    modelMode === 'fast'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Fast grounded responses"
                >
                  <Zap className="w-3 h-3" />
                  <span>Fast</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModelMode('general')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer ${
                    modelMode === 'general'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Balanced analytical mode"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Balanced</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModelMode('complex')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer ${
                    modelMode === 'complex'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Deep multi-objective analysis"
                >
                  <Brain className="w-3 h-3" />
                  <span>Deep Audit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Conversation Thread */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4 scroll-smooth"
          >
            {messages.map((turn, turnIdx) => {
              const isUser = turn.role === 'user';
              const isLatestTurn = turnIdx === messages.length - 1;
              const hasArticles =
                !isUser &&
                Array.isArray(turn.relatedArticles) &&
                turn.relatedArticles.length > 0;

              return (
                <div
                  key={turn.id}
                  ref={isLatestTurn ? latestMessageRef : null}
                  className={`flex items-start gap-2.5 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isUser
                        ? 'bg-sky-600 text-white'
                        : 'bg-neutral-800 border border-white/10 text-sky-400'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-xs ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-tr-xs'
                        : 'bg-neutral-900/95 border border-white/10 text-neutral-200 rounded-tl-xs'
                    }`}
                  >
                    {/* Structured Point-by-Point Text */}
                    <div className="space-y-1">{renderFormattedText(turn.text)}</div>

                    {/* Visual News Cards with Pictures & Credibility Details */}
                    {hasArticles && (
                      <div className="mt-3.5 pt-3 border-t border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          <span>Verified Feed Stories & Visual Evidence</span>
                          <span>{turn.relatedArticles!.length} matched</span>
                        </div>

                        <div className="space-y-2.5">
                          {turn.relatedArticles!.map((art, idx) => {
                            const reliabilityPct = Math.round(
                              (Number(art.sourceReliability) || 0.88) * 100
                            );
                            const clickbaitPct = Math.round(
                              (Number(art.clickbaitIndex) || 0.08) * 100
                            );
                            const fallbackImg =
                              FALLBACK_CATEGORY_IMAGES[art.category] ||
                              FALLBACK_CATEGORY_IMAGES.Technology;
                            const imgSrc =
                              art.urlToImage && art.urlToImage.startsWith('http')
                                ? art.urlToImage
                                : fallbackImg;

                            return (
                              <div
                                key={`${turn.id}-art-${art.id || idx}`}
                                className="rounded-xl bg-neutral-950/90 border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
                              >
                                {/* Article Picture Header */}
                                <div className="relative h-32 w-full bg-neutral-900 overflow-hidden">
                                  <img
                                    src={imgSrc}
                                    alt={art.title}
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      if (target.src !== fallbackImg) {
                                        target.src = fallbackImg;
                                      }
                                    }}
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/35 to-transparent" />
                                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-neutral-200">
                                    <span>
                                      {art.category} · {art.publisher}
                                    </span>
                                    <span className="text-emerald-300 font-semibold">
                                      {reliabilityPct}% Trust
                                    </span>
                                  </div>
                                </div>

                                {/* Detailed Story Body */}
                                <div className="p-2.5 space-y-1.5">
                                  <h5 className="text-xs font-bold text-white leading-snug">
                                    {art.title}
                                  </h5>
                                  <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                                    {art.abstract}
                                  </p>

                                  {/* Unboxed Analytical Metadata Line */}
                                  <div className="pt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono text-neutral-400">
                                    <span className="text-sky-300">
                                      {art.factCheckStatus === 'VERIFIED'
                                        ? 'Verified Wire'
                                        : 'Developing Report'}
                                    </span>
                                    <span>·</span>
                                    <span>{art.corroborationCount || 4} corroborating sources</span>
                                    <span>·</span>
                                    <span>Clickbait: {clickbaitPct}%</span>
                                    <span>·</span>
                                    <span>
                                      {Math.max(1, Math.round((art.expectedReadTimeSec || 180) / 60))}m
                                      read
                                    </span>
                                  </div>

                                  {/* Interactive Actions */}
                                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      {onSelectArticle && (
                                        <button
                                          type="button"
                                          onClick={() => onSelectArticle(art)}
                                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                                        >
                                          <BookOpen className="w-3 h-3" />
                                          <span>Read Full Story</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={() =>
                                          handleSendMessage(
                                            `Analyze "${art.title}" by ${art.publisher} in detailed points: verify its claims, source reliability, and ranking score.`
                                          )
                                        }
                                        className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                                      >
                                        <Sparkles className="w-3 h-3 text-amber-400" />
                                        <span>Deep Audit</span>
                                      </button>
                                    </div>

                                    {art.url && art.url.startsWith('http') && (
                                      <a
                                        href={art.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors"
                                      >
                                        <span>Source</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Google Search Grounding Citations */}
                    {!isUser &&
                      Array.isArray(turn.groundingSources) &&
                      turn.groundingSources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-mono text-sky-300">
                            <span className="flex items-center gap-1.5 uppercase tracking-wider">
                              <Globe className="w-3 h-3 text-sky-400" />
                              <span>Google Search Grounding Citations</span>
                            </span>
                            <span className="text-neutral-400">
                              {turn.groundingSources.length} sources
                            </span>
                          </div>
                          <div className="space-y-1">
                            {turn.groundingSources.map((src, sIdx) => (
                              <a
                                key={`${turn.id}-gsrc-${sIdx}`}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-950/80 border border-white/8 hover:border-sky-500/40 text-[11px] text-neutral-300 hover:text-white transition-colors"
                              >
                                <span className="truncate">{src.title || src.uri}</span>
                                <ExternalLink className="w-3 h-3 text-sky-400 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                    <div
                      className={`mt-2 pt-1.5 border-t flex items-center justify-between gap-2 text-[10px] font-mono ${
                        isUser
                          ? 'border-white/15 text-sky-100/80'
                          : 'border-white/5 text-neutral-500'
                      }`}
                    >
                      <span>{turn.timestamp}</span>
                      {!isUser && turn.modelUsed && (
                        <span className="truncate text-neutral-400">{turn.modelUsed}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-white/10 text-sky-400 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="rounded-2xl rounded-tl-xs bg-neutral-900/95 border border-white/10 px-3.5 py-2.5 text-xs text-neutral-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  <span>
                    Synthesizing point-by-point analysis & visual news cards...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Starter / Quick Context Prompts */}
          <div className="px-3.5 py-2 border-t border-white/10 bg-neutral-900/40">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {selectedRole.quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-[11px] text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-white/10 rounded-lg px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-white/10 bg-neutral-950 flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Ask ${selectedRole.badge} for point-by-point news analysis with pictures...`}
              className="flex-1 resize-none rounded-xl bg-neutral-900 border border-white/12 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500/60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="h-9 px-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
