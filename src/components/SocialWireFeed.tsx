import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Repeat2,
  Heart,
  Share2,
  Trash2,
  Send,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  Check,
  Flame,
  Globe,
  Tag,
  Search,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { SocialPost, ArticleComment, NewsArticle, ScoredArticle } from '../types';

interface SocialWireFeedProps {
  onOpenReader?: (article: any) => void;
  onViewProfile?: (userId: string) => void;
  repostDraftArticle?: NewsArticle | ScoredArticle | null;
  onClearRepostDraft?: () => void;
}

export const SocialWireFeed: React.FC<SocialWireFeedProps> = ({
  onOpenReader,
  onViewProfile,
  repostDraftArticle,
  onClearRepostDraft,
}) => {
  const {
    currentUser,
    userProfile,
    signIn,
    wirePosts,
    createWirePost,
    deleteWirePost,
    toggleLikePost,
    addComment,
    getComments,
    deleteComment,
    saveArticle,
    isArticleSaved,
  } = useFirebase();

  const [composerText, setComposerText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'reposts' | 'my_posts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active repost attachment (either from prop or manual)
  const [attachedArticle, setAttachedArticle] = useState<any>(repostDraftArticle || null);

  // Expanded comments for posts: mapping postId -> boolean
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsMap, setCommentsMap] = useState<Record<string, ArticleComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (repostDraftArticle) {
      setAttachedArticle(repostDraftArticle);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [repostDraftArticle]);

  // Load comments when a post's comments section is opened
  const toggleComments = async (postId: string) => {
    const nextState = !expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: nextState }));

    if (nextState && !commentsMap[postId]) {
      const items = await getComments('post', postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: items }));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() && !attachedArticle) return;

    if (!currentUser) {
      await signIn();
      return;
    }

    setIsSubmitting(true);
    try {
      let finalContent = composerText.trim();
      if (selectedTag && !finalContent.includes(selectedTag)) {
        finalContent = `${selectedTag} ${finalContent}`;
      }

      const isRepost = Boolean(attachedArticle);
      await createWirePost(finalContent, attachedArticle || undefined, isRepost ? 'repost' : 'post');

      setComposerText('');
      setSelectedTag(null);
      setAttachedArticle(null);
      if (onClearRepostDraft) onClearRepostDraft();
      showToast('Dispatch broadcasted to the Social Wire!');
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    if (!currentUser) {
      await signIn();
      return;
    }

    setIsSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const newComment = await addComment('post', postId, text);
      if (newComment) {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment],
        }));
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteComment(commentId);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const handleSharePost = (postId: string) => {
    const url = `${window.location.origin}?wirePost=${postId}`;
    navigator.clipboard.writeText(url);
    showToast('Direct wire dispatch link copied to clipboard!');
  };

  // Filter posts
  const filteredPosts = wirePosts.filter((post) => {
    if (activeFilter === 'reposts' && post.type !== 'repost') return false;
    if (activeFilter === 'my_posts' && post.authorId !== currentUser?.uid) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchContent = post.content.toLowerCase().includes(q);
      const matchAuthor = post.authorName.toLowerCase().includes(q) || post.authorHandle.toLowerCase().includes(q);
      const matchArticle = post.referencedArticle?.title.toLowerCase().includes(q) || post.referencedArticle?.publisher.toLowerCase().includes(q);
      return matchContent || matchAuthor || matchArticle;
    }
    return true;
  });

  const TAGS = ['#BreakingNews', '#FactCheck', '#TechInnovation', '#Economics', '#Geopolitics', '#ScienceAudit'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="border border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                <Flame className="w-3 h-3 text-sky-400" />
                Live Social Wire
              </span>
              <span className="text-neutral-500 text-xs">•</span>
              <span className="text-xs text-neutral-400 font-mono">x.com Style News Feed</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Real-Time News Wire &amp; Repost Network
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mt-1">
              Broadcast fact-checks, share article commentary, repost breaking stories to your profile, and engage in open analytical discourse.
            </p>
          </div>

          {currentUser && (
            <button
              onClick={() => onViewProfile?.(currentUser.uid)}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-200 hover:text-white transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>View My Activity</span>
            </button>
          )}
        </div>
      </div>

      {/* Wire Post Composer */}
      <div className="border border-neutral-800 bg-neutral-900/70 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="shrink-0">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-10 h-10 rounded-full border border-neutral-700 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 border border-neutral-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                {currentUser?.displayName?.[0] || 'U'}
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleCreatePost} className="flex-1 space-y-3">
            <textarea
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder={
                currentUser
                  ? attachedArticle
                    ? `What are your thoughts on "${attachedArticle.title.slice(0, 50)}..."?`
                    : "What's happening in the news cycle? Share fact-checks, commentary, or breaking notes..."
                  : 'Sign in to broadcast dispatches or repost news to your profile...'
              }
              rows={attachedArticle ? 2 : 3}
              maxLength={2000}
              className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40 rounded-xl p-3 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-hidden transition-all resize-none font-sans"
            />

            {/* Attached Repost Article Preview */}
            {attachedArticle && (
              <div className="border border-sky-500/30 bg-sky-950/20 rounded-xl p-3 relative group">
                <button
                  type="button"
                  onClick={() => {
                    setAttachedArticle(null);
                    if (onClearRepostDraft) onClearRepostDraft();
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-neutral-900/80 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors cursor-pointer text-[10px]"
                  title="Remove attached article"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                    <Repeat2 className="w-2.5 h-2.5" />
                    Attached for Repost
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {attachedArticle.publisher}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white line-clamp-2">
                  {attachedArticle.title}
                </h4>
                {attachedArticle.abstract && (
                  <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                    {attachedArticle.abstract}
                  </p>
                )}
              </div>
            )}

            {/* Tags picker */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              <span className="text-[10px] text-neutral-500 uppercase font-mono shrink-0 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" /> Topic:
              </span>
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedTag === tag
                      ? 'bg-sky-500 text-white font-bold'
                      : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 border border-neutral-700/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
              <span className="text-[10px] font-mono text-neutral-500">
                {2000 - composerText.length} characters remaining
              </span>

              <div className="flex items-center gap-2">
                {!currentUser ? (
                  <button
                    type="button"
                    onClick={() => signIn()}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-xs"
                  >
                    Sign In to Broadcast
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || (!composerText.trim() && !attachedArticle)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isSubmitting ? 'Broadcasting...' : attachedArticle ? 'Repost to Wire' : 'Dispatch Post'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Wire Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-neutral-800 text-white shadow-xs font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Dispatches ({wirePosts.length})
          </button>
          <button
            onClick={() => setActiveFilter('reposts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'reposts'
                ? 'bg-neutral-800 text-white shadow-xs font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Repeat2 className="w-3 h-3 text-sky-400" />
            <span>News Reposts</span>
          </button>
          {currentUser && (
            <button
              onClick={() => setActiveFilter('my_posts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'my_posts'
                  ? 'bg-neutral-800 text-white shadow-xs font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3 h-3 text-amber-400" />
              <span>My Dispatches</span>
            </button>
          )}
        </div>

        {/* Search within wire */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wire posts & commentary..."
            className="w-full sm:w-64 bg-neutral-900/90 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-700 transition-all font-mono"
          />
        </div>
      </div>

      {/* Wire Feed List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/40">
            <Globe className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-300">No wire dispatches found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'Be the first to broadcast a fact-check analysis or repost breaking news!'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const hasLiked = currentUser ? post.likedBy?.includes(currentUser.uid) : false;
            const isAuthor = currentUser?.uid === post.authorId;
            const formattedTime = new Date(post.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const formattedDate = new Date(post.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });

            return (
              <article
                key={post.id}
                className="border border-neutral-800 bg-neutral-950/90 hover:border-neutral-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-md group"
              >
                {/* Repost Header Indicator if it's a repost */}
                {post.type === 'repost' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-sky-400 font-mono mb-2 pb-2 border-b border-neutral-850">
                    <Repeat2 className="w-3 h-3 text-sky-400" />
                    <span>Reposted News with Analytical Commentary</span>
                  </div>
                )}

                {/* Author Info & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onViewProfile?.(post.authorId)}
                      className="shrink-0 cursor-pointer group/avatar"
                    >
                      {post.authorPhoto ? (
                        <img
                          src={post.authorPhoto}
                          alt={post.authorName}
                          className="w-10 h-10 rounded-full border border-neutral-700 group-hover/avatar:border-sky-400 transition-colors object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 border border-neutral-700 group-hover/avatar:border-sky-400 flex items-center justify-center text-xs font-bold text-white uppercase transition-colors">
                          {post.authorName[0]}
                        </div>
                      )}
                    </button>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewProfile?.(post.authorId)}
                          className="text-xs sm:text-sm font-bold text-white hover:text-sky-400 transition-colors text-left cursor-pointer flex items-center gap-1"
                        >
                          <span>{post.authorName}</span>
                          <span className="w-3 h-3 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[8px]">
                            ✓
                          </span>
                        </button>
                        <span className="text-neutral-500 text-xs">•</span>
                        <span className="text-[11px] font-mono text-neutral-400">
                          {post.authorHandle}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {formattedDate} at {formattedTime}
                      </span>
                    </div>
                  </div>

                  {/* Options (e.g. Delete if author) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewProfile?.(post.authorId)}
                      className="px-2 py-1 rounded text-[10px] font-mono text-neutral-400 hover:text-white hover:bg-neutral-850 border border-transparent hover:border-neutral-700 transition-all cursor-pointer"
                      title="View user profile by unique ID"
                    >
                      View Profile
                    </button>
                    {isAuthor && (
                      <button
                        onClick={() => deleteWirePost(post.id)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete dispatch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <p className="mt-3 text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-line font-sans">
                  {post.content}
                </p>

                {/* Embedded Reposted Article Card */}
                {post.referencedArticle && (
                  <div
                    onClick={() => onOpenReader?.(post.referencedArticle)}
                    className="mt-3.5 border border-neutral-800 hover:border-sky-500/50 bg-neutral-900/60 hover:bg-neutral-900/90 rounded-xl p-3 sm:p-4 transition-all cursor-pointer group/art shadow-inner"
                  >
                    <div className="flex flex-col sm:flex-row gap-3">
                      {post.referencedArticle.urlToImage && (
                        <img
                          src={post.referencedArticle.urlToImage}
                          alt={post.referencedArticle.title}
                          className="w-full sm:w-28 h-24 object-cover rounded-lg border border-neutral-800 group-hover/art:scale-102 transition-transform shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                            {post.referencedArticle.publisher}
                          </span>
                          {post.referencedArticle.category && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              {post.referencedArticle.category}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-emerald-400 ml-auto flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            {Math.round((post.referencedArticle.credibilityScore || 0.8) * 100)}% Credibility
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover/art:text-sky-300 transition-colors line-clamp-2">
                          {post.referencedArticle.title}
                        </h4>
                        {post.referencedArticle.abstract && (
                          <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                            {post.referencedArticle.abstract}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-sky-400 group-hover/art:translate-x-1 transition-transform">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Click to open Reader
                          </span>
                          {post.referencedArticle.url && (
                            <span className="text-neutral-500 flex items-center gap-1">
                              External source <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Interaction Bar (Like, Comment, Repost, Save, Share) */}
                <div className="mt-4 pt-3 border-t border-neutral-850 flex items-center justify-between text-neutral-400 text-xs">
                  {/* Like Button */}
                  <button
                    onClick={() => toggleLikePost(post.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      hasLiked
                        ? 'text-rose-400 bg-rose-500/10 font-medium'
                        : 'hover:text-rose-400 hover:bg-neutral-900'
                    }`}
                    title={hasLiked ? 'Unlike' : 'Like dispatch'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                    <span className="font-mono text-[11px]">{post.likesCount || 0}</span>
                  </button>

                  {/* Comment Button */}
                  <button
                    onClick={() => toggleComments(post.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      expandedComments[post.id]
                        ? 'text-sky-400 bg-sky-500/10 font-medium'
                        : 'hover:text-sky-400 hover:bg-neutral-900'
                    }`}
                    title="View & leave comments"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="font-mono text-[11px]">
                      {commentsMap[post.id]?.length ?? post.commentsCount ?? 0}
                    </span>
                  </button>

                  {/* Quote / Repost this Dispatch */}
                  <button
                    onClick={() => {
                      if (post.referencedArticle) {
                        setAttachedArticle(post.referencedArticle);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        setComposerText(`"${post.content.slice(0, 100)}..." via ${post.authorHandle}\n\n`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:text-emerald-400 hover:bg-neutral-900 transition-colors cursor-pointer"
                    title="Quote or Repost to wire"
                  >
                    <Repeat2 className="w-3.5 h-3.5" />
                    <span className="font-mono text-[11px] hidden sm:inline">Repost</span>
                  </button>

                  {/* Save Article (if article exists) */}
                  {post.referencedArticle && (
                    <button
                      onClick={async () => {
                        const saved = isArticleSaved(post.referencedArticle!.id);
                        if (saved) {
                          showToast('Article is already bookmarked in your profile!');
                        } else {
                          await saveArticle(post.referencedArticle as any);
                          showToast('Article saved to your profile bookmarks!');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        isArticleSaved(post.referencedArticle.id)
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'hover:text-amber-400 hover:bg-neutral-900'
                      }`}
                      title="Save article to profile"
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isArticleSaved(post.referencedArticle.id) ? 'fill-amber-400' : ''}`} />
                      <span className="font-mono text-[11px] hidden sm:inline">
                        {isArticleSaved(post.referencedArticle.id) ? 'Saved' : 'Save'}
                      </span>
                    </button>
                  )}

                  {/* Share Link */}
                  <button
                    onClick={() => handleSharePost(post.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
                    title="Copy direct link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Inline Comments Section */}
                {expandedComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-neutral-850 space-y-3 bg-neutral-900/40 rounded-xl p-3">
                    <h5 className="text-[11px] font-mono uppercase text-neutral-400 font-bold flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-sky-400" />
                      Discussion Comments ({commentsMap[post.id]?.length || 0})
                    </h5>

                    {/* Comments List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-none pr-1">
                      {(!commentsMap[post.id] || commentsMap[post.id].length === 0) ? (
                        <p className="text-[11px] text-neutral-500 italic py-2">
                          No comments yet. Share your analytical thoughts!
                        </p>
                      ) : (
                        commentsMap[post.id].map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-neutral-950/70 border border-neutral-800/80 rounded-lg p-2.5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white">
                                  {comment.authorName}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-500">
                                  {comment.authorHandle}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-600">
                                  • {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {currentUser?.uid === comment.authorId && (
                                <button
                                  onClick={() => handleDeleteComment(post.id, comment.id)}
                                  className="text-neutral-500 hover:text-red-400 text-[10px] p-0.5 cursor-pointer"
                                  title="Delete comment"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                            <p className="text-neutral-300 leading-normal font-sans">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }
                        }}
                        placeholder="Write a comment..."
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-sky-500 font-sans"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={isSubmittingComment[post.id] || !commentInputs[post.id]?.trim()}
                        className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
