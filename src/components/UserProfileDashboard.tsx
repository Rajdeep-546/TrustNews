import React, { useState, useEffect } from 'react';
import {
  User,
  Sliders,
  Bookmark,
  Repeat2,
  Activity,
  ShieldCheck,
  Share2,
  Copy,
  Check,
  Edit3,
  Save,
  Globe,
  Gauge,
  Sparkles,
  BookOpen,
  Trash2,
  ArrowLeft,
  Calendar,
  Layers,
  Heart,
  MessageSquare,
  MessageCircle,
  Bell,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import {
  UserProfileData,
  UserPreferencesConfig,
  MultiObjectiveWeights,
  SavedArticle,
  SocialPost,
} from '../types';
import { DEFAULT_WEIGHTS } from '../data/mindSmallDataset';
import { NotificationsFilter } from '@/registry/ruixenui/notifications-filter';
import { PrivateMessengerView, ChatPartner } from './PrivateMessengerView';

export type DashboardSubTab =
  | 'preferences'
  | 'messages'
  | 'notifications'
  | 'reposts'
  | 'saved'
  | 'history';

interface UserProfileDashboardProps {
  initialUserId?: string | null;
  initialDashboardTab?: DashboardSubTab;
  initialMessagePartner?: ChatPartner | null;
  onOpenReader?: (article: any) => void;
  onOpenWireWithRepost?: (article: any) => void;
  onNavigateWire?: () => void;
  onBackToFeed?: () => void;
}

const CATEGORIES_LIST = [
  'Technology',
  'Science',
  'Politics',
  'Economics',
  'Health',
  'Environment',
  'Culture',
  'Sensational',
];

const REGIONS_LIST = [
  { code: 'us', name: 'United States (US)' },
  { code: 'gb', name: 'United Kingdom (UK)' },
  { code: 'in', name: 'India (IN)' },
  { code: 'ca', name: 'Canada (CA)' },
  { code: 'au', name: 'Australia (AU)' },
  { code: 'de', name: 'Germany (DE)' },
  { code: 'fr', name: 'France (FR)' },
  { code: 'jp', name: 'Japan (JP)' },
];

export const UserProfileDashboard: React.FC<UserProfileDashboardProps> = ({
  initialUserId,
  initialDashboardTab,
  initialMessagePartner,
  onOpenReader,
  onOpenWireWithRepost,
  onNavigateWire,
  onBackToFeed,
}) => {
  const {
    currentUser,
    userProfile,
    signIn,
    updateProfileDetails,
    updatePreferences,
    saveCustomWeights,
    savedArticles,
    removeSavedArticle,
    savedAudits,
    getPublicProfile,
    getUserPosts,
    getUserSavedArticles,
    toggleLikePost,
    notifications,
    privateMessages,
  } = useFirebase();

  // Active target user: if initialUserId is provided and differs from currentUser.uid, viewing public profile
  const [viewedUserId, setViewedUserId] = useState<string | null>(initialUserId || currentUser?.uid || null);
  const [publicProfile, setPublicProfile] = useState<UserProfileData | null>(null);
  const [publicPosts, setPublicPosts] = useState<SocialPost[]>([]);
  const [publicSavedArticles, setPublicSavedArticles] = useState<SavedArticle[]>([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);

  // Active Tab in Dashboard
  const [dashboardTab, setDashboardTab] = useState<DashboardSubTab>(
    initialMessagePartner ? 'messages' : initialDashboardTab || 'preferences'
  );
  const [activeMessagePartner, setActiveMessagePartner] = useState<ChatPartner | null>(
    initialMessagePartner || null
  );

  useEffect(() => {
    if (initialMessagePartner) {
      setActiveMessagePartner(initialMessagePartner);
      if (currentUser) setViewedUserId(currentUser.uid);
      setDashboardTab('messages');
    } else if (initialDashboardTab) {
      setDashboardTab(initialDashboardTab);
    }
  }, [initialMessagePartner, initialDashboardTab, currentUser]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const unreadMessagesCount = privateMessages.filter(
    (m) => currentUser && m.recipientId === currentUser.uid && !m.read
  ).length;

  // Preferences Form State
  const [customWeightsState, setCustomWeightsState] = useState<MultiObjectiveWeights>(
    userProfile?.customWeights || DEFAULT_WEIGHTS
  );
  const [customPrefsState, setCustomPrefsState] = useState<UserPreferencesConfig>(
    userProfile?.preferences || {
      preferredCategories: ['Technology', 'Science', 'Politics', 'Economics'],
      readingWpm: 240,
      defaultRegion: 'us',
      showCredibilityBadges: true,
      autoSyncLiveFeed: true,
    }
  );

  // Edit Bio / Name modal
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHandle, setEditHandle] = useState('');
  const [editBio, setEditBio] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isSelf = currentUser && viewedUserId === currentUser.uid;

  // Sync state when userProfile updates
  useEffect(() => {
    if (userProfile && isSelf) {
      if (userProfile.customWeights) setCustomWeightsState(userProfile.customWeights);
      if (userProfile.preferences) setCustomPrefsState(userProfile.preferences);
      setEditName(userProfile.displayName || '');
      setEditHandle(userProfile.handle || '');
      setEditBio(userProfile.bio || '');
    }
  }, [userProfile, isSelf]);

  // Load public profile if viewing another user or when viewedUserId changes
  useEffect(() => {
    if (!viewedUserId) return;

    if (currentUser && viewedUserId === currentUser.uid) {
      // Self profile: load own posts
      getUserPosts(currentUser.uid).then(setPublicPosts);
      return;
    }

    // External user public profile
    setIsLoadingPublic(true);
    Promise.all([
      getPublicProfile(viewedUserId),
      getUserPosts(viewedUserId),
      getUserSavedArticles(viewedUserId),
    ])
      .then(([profile, posts, saved]) => {
        setPublicProfile(profile);
        setPublicPosts(posts);
        setPublicSavedArticles(saved);
      })
      .finally(() => setIsLoadingPublic(false));
  }, [viewedUserId, currentUser]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      await signIn();
      return;
    }

    try {
      await saveCustomWeights(customWeightsState);
      await updatePreferences(customPrefsState);
      showToast('Custom preferences & ranking weights saved!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfileDetails = async () => {
    if (!currentUser) return;
    try {
      const formattedHandle = editHandle.startsWith('@') ? editHandle : `@${editHandle}`;
      await updateProfileDetails({
        displayName: editName.trim() || currentUser.displayName || 'News Researcher',
        handle: formattedHandle.slice(0, 30),
        bio: editBio.trim().slice(0, 500),
      });
      setIsEditingBio(false);
      showToast('Profile information updated successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const copyProfileLink = (uidToCopy: string) => {
    const url = `${window.location.origin}?profile=${uidToCopy}`;
    navigator.clipboard.writeText(url);
    showToast('Profile link copied to clipboard!');
  };

  const displayedProfile = isSelf ? userProfile : publicProfile;
  const displayedSavedArticles = isSelf ? savedArticles : publicSavedArticles;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Return to My Profile bar if viewing another user */}
      {!isSelf && currentUser && (
        <div className="flex items-center justify-between bg-neutral-900/90 border border-neutral-800 rounded-xl px-4 py-2 text-xs">
          <span className="text-neutral-400">
            Viewing public profile:{' '}
            <span className="font-mono text-sky-400 font-bold">
              {displayedProfile?.displayName || displayedProfile?.handle || 'Verified Analyst'}
            </span>
          </span>
          <button
            onClick={() => setViewedUserId(currentUser.uid)}
            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Return to My Dashboard</span>
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="border border-neutral-800 bg-neutral-950/90 backdrop-blur-md rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          {/* Avatar & User Details */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {displayedProfile?.photoURL ? (
                <img
                  src={displayedProfile.photoURL}
                  alt={displayedProfile.displayName}
                  className="w-16 h-16 rounded-2xl border-2 border-neutral-700 object-cover shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-700 border-2 border-neutral-700 flex items-center justify-center text-xl font-bold text-white uppercase shadow-md">
                  {displayedProfile?.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center text-[10px] text-black font-bold">
                ✓
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {displayedProfile?.displayName || (isSelf ? 'My Analyst Profile' : 'Public Analyst')}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {isSelf ? 'Verified Account' : 'Public Profile'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="font-mono text-sky-400 font-medium">
                  {displayedProfile?.handle || '@analyst'}
                </span>
                <span>•</span>
                <span className="text-neutral-500 text-[11px] font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Active since 2026
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isSelf ? (
              <>
                <button
                  onClick={() => setIsEditingBio(!isEditingBio)}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingBio ? 'Cancel' : 'Edit Profile'}</span>
                </button>
                <button
                  onClick={() => copyProfileLink(currentUser.uid)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-xs font-semibold text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Profile</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {viewedUserId && (
                  <button
                    onClick={() => {
                      const targetPartner: ChatPartner = {
                        uid: viewedUserId,
                        displayName: displayedProfile?.displayName || 'Analyst',
                        handle: displayedProfile?.handle || '@analyst',
                        photoURL: displayedProfile?.photoURL,
                      };
                      setActiveMessagePartner(targetPartner);
                      if (currentUser) setViewedUserId(currentUser.uid);
                      setDashboardTab('messages');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Message Analyst</span>
                  </button>
                )}
                <button
                  onClick={() => copyProfileLink(viewedUserId || '')}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-medium text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Profile Link</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bio description */}
        <p className="mt-4 text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
          {displayedProfile?.bio ||
            'News analyst optimizing content exposure with multi-objective trade-offs, dwell analysis, and anti-filter-bubble objectives.'}
        </p>

        {/* Inline Bio Editor Modal */}
        {isEditingBio && (
          <div className="mt-4 pt-4 border-t border-neutral-800/80 space-y-3 bg-neutral-900/40 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-white uppercase font-mono">
              Update Profile Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                  Public Handle
                </label>
                <input
                  type="text"
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  placeholder="@handle"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono text-neutral-400 block mb-1">
                Bio &amp; Research Focus
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingBio(false)}
                className="px-3 py-1 rounded-lg text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfileDetails}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Save className="w-3 h-3" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="mt-5 pt-4 border-t border-neutral-850 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
              <Repeat2 className="w-3 h-3 text-sky-400" /> Reposts &amp; Dispatches
            </div>
            <div className="text-lg font-black text-white mt-1">
              {publicPosts.length}
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
              <Bookmark className="w-3 h-3 text-amber-400" /> Bookmarked Articles
            </div>
            <div className="text-lg font-black text-white mt-1">
              {displayedSavedArticles.length}
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Credibility Floor
            </div>
            <div className="text-lg font-black text-emerald-400 mt-1">
              {Math.round((customWeightsState.gammaCredibility || 0.3) * 100)}%
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3">
            <div className="text-[10px] font-mono uppercase text-neutral-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-indigo-400" /> Reading Pace
            </div>
            <div className="text-lg font-black text-white mt-1 font-mono">
              {customPrefsState.readingWpm || 240} <span className="text-xs font-normal text-neutral-500">WPM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Section Navigation Tabs */}
      <div className="flex items-center gap-1 bg-neutral-950 p-1.5 rounded-xl border border-neutral-850 overflow-x-auto scrollbar-none">
        {isSelf && (
          <button
            onClick={() => setDashboardTab('preferences')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              dashboardTab === 'preferences'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Customize Preferences</span>
          </button>
        )}

        <button
          onClick={() => setDashboardTab('messages')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            dashboardTab === 'messages'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Private Messages</span>
          {unreadMessagesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black font-mono text-[10px] font-black">
              {unreadMessagesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setDashboardTab('notifications')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            dashboardTab === 'notifications'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-sky-400" />
          <span>Notifications</span>
          {unreadNotificationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-black font-mono text-[10px] font-black">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setDashboardTab('reposts')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            dashboardTab === 'reposts'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Repeat2 className="w-3.5 h-3.5 text-sky-400" />
          <span>{isSelf ? 'My Posts & Reposts' : 'Dispatches'} ({publicPosts.length})</span>
        </button>

        <button
          onClick={() => setDashboardTab('saved')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            dashboardTab === 'saved'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Saved Articles ({displayedSavedArticles.length})</span>
        </button>

        {isSelf && (
          <button
            onClick={() => setDashboardTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              dashboardTab === 'history'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Audits &amp; Dwell ({savedAudits.length})</span>
          </button>
        )}
      </div>

      {/* TAB: Private Messages (WhatsApp-style 1-on-1 Messenger) */}
      {dashboardTab === 'messages' && (
        <PrivateMessengerView
          initialPartner={activeMessagePartner}
          onViewProfile={(uid) => {
            setViewedUserId(uid);
            setDashboardTab('reposts');
          }}
        />
      )}

      {/* TAB: Real-time Notifications Filter */}
      {dashboardTab === 'notifications' && (
        <NotificationsFilter
          onSelectNotification={(notif) => {
            if (notif.type === 'message') {
              setActiveMessagePartner({
                uid: notif.senderId,
                displayName: notif.senderName,
                handle: notif.senderHandle,
                photoURL: notif.senderPhoto,
              });
              setDashboardTab('messages');
            } else {
              onNavigateWire?.();
            }
          }}
        />
      )}

      {/* TAB 1: Customize Preferences & Multi-Objective Weights */}
      {isSelf && dashboardTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="space-y-6">
          <div className="border border-neutral-800 bg-neutral-950/80 rounded-2xl p-5 sm:p-6 space-y-6 shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Personal Multi-Objective Ranking Weights
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure your personalized mathematical ranking model. Your custom weights are applied across your news stream.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomWeightsState(DEFAULT_WEIGHTS)}
                  className="text-[11px] font-mono text-neutral-400 hover:text-white underline cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>

              {/* Sliders Grid */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Credibility Gamma */}
                <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Factual Credibility &amp; Provenance (&gamma;)
                    </label>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {Math.round(customWeightsState.gammaCredibility * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={customWeightsState.gammaCredibility}
                    onChange={(e) =>
                      setCustomWeightsState((prev) => ({
                        ...prev,
                        gammaCredibility: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Boosts peer-reviewed and corroborated wires over sensationalist sources.
                  </p>
                </div>

                {/* Satisfaction Beta */}
                <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-sky-400" />
                      Sustained Reading Satisfaction (&beta;)
                    </label>
                    <span className="font-mono text-xs font-bold text-sky-400">
                      {Math.round(customWeightsState.betaSatisfaction * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.6"
                    step="0.05"
                    value={customWeightsState.betaSatisfaction}
                    onChange={(e) =>
                      setCustomWeightsState((prev) => ({
                        ...prev,
                        betaSatisfaction: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Prioritizes stories that users read completely rather than quickly bouncing.
                  </p>
                </div>

                {/* Diversity Delta */}
                <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      Intra-List Diversity &amp; Anti-Bubble (&delta;)
                    </label>
                    <span className="font-mono text-xs font-bold text-purple-400">
                      {Math.round(customWeightsState.deltaDiversity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={customWeightsState.deltaDiversity}
                    onChange={(e) =>
                      setCustomWeightsState((prev) => ({
                        ...prev,
                        deltaDiversity: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Injects varied perspectives and prevents single-category rabbit holes.
                  </p>
                </div>

                {/* Publisher Fairness Epsilon */}
                <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-amber-400" />
                      Publisher Exposure Fairness (&epsilon;)
                    </label>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {Math.round(customWeightsState.epsilonFairness * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.05"
                    value={customWeightsState.epsilonFairness}
                    onChange={(e) =>
                      setCustomWeightsState((prev) => ({
                        ...prev,
                        epsilonFairness: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Allocates exposure to independent regional journals to reduce publisher monopolies.
                  </p>
                </div>
              </div>
            </div>

            {/* Category Preferences */}
            <div className="pt-4 border-t border-neutral-850">
              <h4 className="text-xs font-bold text-white uppercase font-mono mb-2">
                Preferred Topics &amp; News Categories
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORIES_LIST.map((cat) => {
                  const isChecked = customPrefsState.preferredCategories?.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-sky-500/40 bg-sky-950/20 text-white'
                          : 'border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const current = customPrefsState.preferredCategories || [];
                          const next = isChecked
                            ? current.filter((c) => c !== cat)
                            : [...current, cat];
                          setCustomPrefsState((prev) => ({ ...prev, preferredCategories: next }));
                        }}
                        className="rounded border-neutral-700 text-sky-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-medium">{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Reading Pace & Live Region */}
            <div className="pt-4 border-t border-neutral-850 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                    Reading Speed Calibration
                  </label>
                  <span className="font-mono text-xs text-indigo-400 font-bold">
                    {customPrefsState.readingWpm} WPM
                  </span>
                </div>
                <input
                  type="range"
                  min="160"
                  max="450"
                  step="10"
                  value={customPrefsState.readingWpm}
                  onChange={(e) =>
                    setCustomPrefsState((prev) => ({
                      ...prev,
                      readingWpm: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Calibrates read-time countdowns and expected completion ratios.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-white block mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Default Live News Edition
                </label>
                <select
                  value={customPrefsState.defaultRegion || 'us'}
                  onChange={(e) =>
                    setCustomPrefsState((prev) => ({ ...prev, defaultRegion: e.target.value }))
                  }
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-neutral-700"
                >
                  {REGIONS_LIST.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Primary regional geofence for NewsAPI live dispatches.
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-neutral-850 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-neutral-500 font-mono">
                Synced with your personalized analyst profile
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all hover:scale-102"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Preferences</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: Reposts & Social Dispatches */}
      {dashboardTab === 'reposts' && (
        <div className="space-y-4">
          {publicPosts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/40">
              <Repeat2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-neutral-300">No reposts or dispatches yet</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                {isSelf
                  ? 'Head to the Ranked Feed or Social Wire to repost news articles with your own fact-check commentary!'
                  : 'This analyst has not broadcasted any dispatches to the wire yet.'}
              </p>
            </div>
          ) : (
            publicPosts.map((post) => (
              <div
                key={post.id}
                className="border border-neutral-800 bg-neutral-950/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                      <Repeat2 className="w-2.5 h-2.5" />
                      {post.type === 'repost' ? 'News Repost' : 'Dispatch'}
                    </span>
                    <span className="text-neutral-500 text-[11px] font-mono">
                      {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-400 text-xs">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" /> {post.likesCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-sky-400" /> {post.commentsCount || 0}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans">
                  {post.content}
                </p>

                {post.referencedArticle && (
                  <div
                    onClick={() => onOpenReader?.(post.referencedArticle)}
                    className="border border-neutral-800 hover:border-sky-500/50 bg-neutral-900/60 rounded-xl p-3 flex flex-col sm:flex-row gap-3 cursor-pointer group transition-all"
                  >
                    {post.referencedArticle.urlToImage && (
                      <img
                        src={post.referencedArticle.urlToImage}
                        alt={post.referencedArticle.title}
                        className="w-full sm:w-24 h-20 object-cover rounded-lg border border-neutral-800 shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          {post.referencedArticle.publisher}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 ml-auto flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          {Math.round((post.referencedArticle.credibilityScore || 0.8) * 100)}% Credibility
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2">
                        {post.referencedArticle.title}
                      </h4>
                      <p className="text-[10px] font-mono text-sky-400 mt-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Read Article
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Saved Articles & Bookmarks */}
      {dashboardTab === 'saved' && (
        <div className="space-y-4">
          {displayedSavedArticles.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/40">
              <Bookmark className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-neutral-300">No saved articles yet</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                {isSelf
                  ? 'Click the bookmark icon on any article in the live feed or reader modal to store it on your profile!'
                  : 'No public bookmarks found on this profile.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedSavedArticles.map((saved) => (
                <div
                  key={saved.id}
                  className="border border-neutral-800 hover:border-neutral-700 bg-neutral-950/90 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-md group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                        {saved.publisher}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {Math.round((saved.credibilityScore || 0.8) * 100)}% Credible
                      </span>
                    </div>

                    <h4
                      onClick={() => onOpenReader?.(saved)}
                      className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 cursor-pointer"
                    >
                      {saved.title}
                    </h4>

                    {saved.userNotes && (
                      <p className="text-[11px] text-neutral-400 bg-neutral-900/80 border border-neutral-850 p-2 rounded-lg italic">
                        &ldquo;{saved.userNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-850 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-neutral-500">
                      Saved {new Date(saved.savedAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenReader?.(saved)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Read</span>
                      </button>

                      <button
                        onClick={() => onOpenWireWithRepost?.(saved)}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        title="Repost to wire feed"
                      >
                        <Repeat2 className="w-3 h-3" />
                        <span>Repost</span>
                      </button>

                      {isSelf && (
                        <button
                          onClick={() => removeSavedArticle(saved.articleId)}
                          className="p-1 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove from saved articles"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI Fact-Check Audits & Dwell Sessions */}
      {isSelf && dashboardTab === 'history' && (
        <div className="space-y-4">
          <div className="border border-neutral-800 bg-neutral-950/80 rounded-2xl p-5 shadow-md">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Persisted Fact-Check Audits ({savedAudits.length})
            </h3>
            {savedAudits.length === 0 ? (
              <p className="text-xs text-neutral-500 italic py-4 text-center">
                No fact-check audits persisted yet. Visit the AI Fact-Check tab to run real-time source and story audits.
              </p>
            ) : (
              <div className="space-y-2.5">
                {savedAudits.map((audit) => (
                  <div
                    key={audit.id}
                    className="border border-neutral-800 bg-neutral-900/60 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white">{audit.title}</span>
                        <span className="font-mono text-[10px] text-neutral-400">({audit.publisher})</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-1">{audit.reasoning}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        audit.factCheckStatus === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {audit.factCheckStatus}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {Math.round((audit.credibilityScore || 0.8) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
