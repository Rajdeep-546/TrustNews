import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  auth,
  db,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  requestEmailOtp,
  verifyEmailOtpCode,
  checkFirebaseEmailLinkVerified,
  logoutUser,
  handleFirestoreError,
  OperationType,
  getCachedAuthUser,
  setCachedAuthUser,
  OtpDispatchResponse,
} from '../firebase';
import { resolveUserAvatarUrl } from '../utils/avatar';
import {
  MultiObjectiveWeights,
  SavedArticle,
  SocialPost,
  ArticleComment,
  UserProfileData,
  UserPreferencesConfig,
  NewsArticle,
  ScoredArticle,
  UserNotification,
  PrivateMessage,
} from '../types';

export interface PendingOtpSession {
  user: User;
  email: string;
  displayName: string;
  otpDispatch: OtpDispatchResponse;
}

interface FirebaseContextType {
  currentUser: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  pendingOtpSession: PendingOtpSession | null;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ requiresOtp: boolean }>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<{ requiresOtp: boolean }>;
  verifyEmailOtp: (code: string) => Promise<void>;
  verifyFirebaseEmailLink: () => Promise<boolean>;
  resendEmailOtp: () => Promise<OtpDispatchResponse>;
  cancelPendingOtp: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfileDetails: (details: Partial<UserProfileData>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferencesConfig>) => Promise<void>;
  saveCustomWeights: (weights: MultiObjectiveWeights) => Promise<void>;
  logReadingSessionToDb: (
    articleId: string,
    articleTitle: string,
    publisher: string,
    dwellSec: number,
    completionRatio: number,
    feedback: 'positive' | 'negative' | 'flagged' | null
  ) => Promise<void>;
  savedAudits: any[];
  saveAuditToDb: (auditData: any) => Promise<void>;

  // Saved Articles
  savedArticles: SavedArticle[];
  saveArticle: (article: NewsArticle | ScoredArticle, note?: string) => Promise<boolean>;
  removeSavedArticle: (articleId: string) => Promise<void>;
  isArticleSaved: (articleId: string) => boolean;
  getUserSavedArticles: (userId: string) => Promise<SavedArticle[]>;

  // Social Wire Posts
  wirePosts: SocialPost[];
  createWirePost: (
    content: string,
    referencedArticle?: any,
    type?: 'post' | 'repost'
  ) => Promise<string | null>;
  deleteWirePost: (postId: string) => Promise<void>;
  toggleLikePost: (postId: string) => Promise<void>;
  getUserPosts: (userId: string) => Promise<SocialPost[]>;

  // Comments
  addComment: (
    targetType: 'article' | 'post',
    targetId: string,
    content: string
  ) => Promise<ArticleComment | null>;
  getComments: (targetType: 'article' | 'post', targetId: string) => Promise<ArticleComment[]>;
  deleteComment: (commentId: string) => Promise<void>;

  // Public Profile
  getPublicProfile: (userId: string) => Promise<UserProfileData | null>;

  // Notifications
  notifications: UserNotification[];
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;

  // Private Direct Messages (WhatsApp style - only sender & recipient can see)
  privateMessages: PrivateMessage[];
  sendDirectMessage: (
    recipient: { uid: string; displayName: string; handle: string; photoURL?: string },
    content: string
  ) => Promise<PrivateMessage | null>;
  markConversationRead: (partnerUid: string) => Promise<void>;
  deleteDirectMessage: (messageId: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
}

const DEFAULT_PREFERENCES: UserPreferencesConfig = {
  preferredCategories: ['Technology', 'Science', 'Politics', 'Economics'],
  readingWpm: 240,
  defaultRegion: 'us',
  showCredibilityBadges: true,
  autoSyncLiveFeed: true,
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCachedAuthUser());
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingOtpSession, setPendingOtpSession] = useState<PendingOtpSession | null>(null);
  const awaitingOtpRef = React.useRef<boolean>(false);
  const [savedAudits, setSavedAudits] = useState<any[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [wirePosts, setWirePosts] = useState<SocialPost[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);

  const hydrateUserProfile = useCallback(async (user: User) => {
    const cleanUid = sanitizeId(user.uid);
    const userDocRef = doc(db, 'users', cleanUid);
    const initialHandle = (user.displayName || user.email?.split('@')[0] || 'reader')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);

    const resolvedAvatar = resolveUserAvatarUrl(
      user.photoURL,
      user.displayName || user.email,
      cleanUid
    );

    const initialProfile: UserProfileData = {
      uid: cleanUid,
      displayName: user.displayName || 'News Researcher',
      handle: `@${initialHandle || 'analyst'}`,
      bio: 'Researcher analyzing news through multi-objective optimization and credibility heuristics.',
      email: user.email || '',
      photoURL: resolvedAvatar,
      preferences: DEFAULT_PREFERENCES,
      savedCount: 0,
      repostsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        try {
          await setDoc(userDocRef, initialProfile);
        } catch (writeErr) {
          console.warn('Initial profile write pending (client offline):', writeErr);
        }
        setUserProfile(initialProfile);
      } else {
        const data = userDoc.data() as UserProfileData;
        const hydratedAvatar = resolveUserAvatarUrl(
          data.photoURL || user.photoURL,
          data.displayName || user.displayName || user.email,
          cleanUid
        );
        const mergedProfile: UserProfileData = {
          ...data,
          photoURL: hydratedAvatar,
        };
        if (!data.photoURL && hydratedAvatar) {
          setDoc(userDocRef, { photoURL: hydratedAvatar }, { merge: true }).catch(() => {});
        }
        setUserProfile(mergedProfile);
      }
    } catch (error) {
      setUserProfile(initialProfile);
      handleFirestoreError(error, OperationType.GET, `users/${cleanUid}`);
    }
  }, []);

  // 1. Auth Listener & User Profile Initialization
  useEffect(() => {
    const cached = getCachedAuthUser();
    if (cached) {
      setCurrentUser(cached);
      setLoading(false);
      hydrateUserProfile(cached);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Do not auto-complete sign-in while waiting for the user to verify their 6-digit OTP
        if (awaitingOtpRef.current) {
          setLoading(false);
          return;
        }
        const synced = setCachedAuthUser({
          uid: user.uid,
          displayName: user.displayName || 'News Researcher',
          email: user.email || '',
          photoURL: user.photoURL || null,
          emailVerified: true,
        });
        setCurrentUser(synced);
        setLoading(false);
        await hydrateUserProfile(synced);
      } else {
        const stillCached = getCachedAuthUser();
        if (!stillCached) {
          setCurrentUser(null);
          setUserProfile(null);
          setSavedArticles([]);
          setSavedAudits([]);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [hydrateUserProfile]);

  // 2. Real-time listener for current user's saved articles
  useEffect(() => {
    if (!currentUser) {
      setSavedArticles([]);
      return;
    }

    const path = `users/${currentUser.uid}/saved_articles`;
    const savedQuery = query(
      collection(db, 'users', currentUser.uid, 'saved_articles'),
      orderBy('savedAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      savedQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as SavedArticle[];
        setSavedArticles(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 3. Real-time listener for global Social Wire Posts (x.com style)
  useEffect(() => {
    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const posts = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as SocialPost[];
        setWirePosts(posts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'posts');
      }
    );

    return () => unsubscribe();
  }, []);

  // 4. Audits listener
  useEffect(() => {
    if (!currentUser) {
      setSavedAudits([]);
      return;
    }

    const path = `users/${currentUser.uid}/audits`;
    const auditsQuery = query(
      collection(db, 'users', currentUser.uid, 'audits'),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsubscribe = onSnapshot(
      auditsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setSavedAudits(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 5. Real-time listener for current user's Notifications
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const notifQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', currentUser.uid),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      notifQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as UserNotification[];
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 6. Real-time listener for current user's Private Messages (recipientId == uid OR senderId == uid, plus message notifications fallback)
  const rawMessagesRef = React.useRef<Map<string, PrivateMessage>>(new Map());
  const receivedMapRef = React.useRef<Map<string, PrivateMessage>>(new Map());
  const sentMapRef = React.useRef<Map<string, PrivateMessage>>(new Map());

  const rebuildPrivateMessages = useCallback(
    (uid: string, currentNotifs: UserNotification[]) => {
      const merged = new Map<string, PrivateMessage>();

      for (const [id, msg] of receivedMapRef.current.entries()) {
        merged.set(id, msg);
      }
      for (const [id, msg] of sentMapRef.current.entries()) {
        merged.set(id, msg);
      }

      // Also ensure any 'message' notification in Notifications is visible in Private Messages
      for (const notif of currentNotifs) {
        if (notif.type !== 'message') continue;
        const alreadyHasMatch = Array.from(merged.values()).some(
          (m) =>
            m.id === notif.id ||
            (m.senderId === notif.senderId &&
              m.recipientId === notif.recipientId &&
              m.content === notif.content)
        );
        if (!alreadyHasMatch) {
          const sortedPair = [notif.senderId, notif.recipientId || uid].sort();
          const conversationId = `conv_${sanitizeId(sortedPair[0])}_${sanitizeId(sortedPair[1])}`;
          merged.set(notif.id, {
            id: notif.id,
            conversationId,
            senderId: notif.senderId,
            senderName: notif.senderName || 'Analyst',
            senderHandle: notif.senderHandle || '@analyst',
            ...(notif.senderPhoto ? { senderPhoto: notif.senderPhoto } : {}),
            recipientId: notif.recipientId || uid,
            recipientName: userProfile?.displayName || 'Analyst',
            recipientHandle: userProfile?.handle || '@analyst',
            participants: [notif.senderId, notif.recipientId || uid],
            content: notif.content,
            read: Boolean(notif.read),
            createdAt: notif.createdAt,
          });
        }
      }

      rawMessagesRef.current = merged;
      const items = Array.from(merged.values());
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setPrivateMessages(items);
    },
    [userProfile?.displayName, userProfile?.handle]
  );

  useEffect(() => {
    if (!currentUser) {
      receivedMapRef.current.clear();
      sentMapRef.current.clear();
      rawMessagesRef.current.clear();
      setPrivateMessages([]);
      return;
    }

    const receivedQuery = query(
      collection(db, 'messages'),
      where('recipientId', '==', currentUser.uid),
      limit(200)
    );

    const sentQuery = query(
      collection(db, 'messages'),
      where('senderId', '==', currentUser.uid),
      limit(200)
    );

    const unsubReceived = onSnapshot(
      receivedQuery,
      (snapshot) => {
        const nextMap = new Map<string, PrivateMessage>();
        snapshot.docs.forEach((docSnap) => {
          nextMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as PrivateMessage);
        });
        receivedMapRef.current = nextMap;
        rebuildPrivateMessages(currentUser.uid, notifications);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'messages');
      }
    );

    const unsubSent = onSnapshot(
      sentQuery,
      (snapshot) => {
        const nextMap = new Map<string, PrivateMessage>();
        snapshot.docs.forEach((docSnap) => {
          nextMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as PrivateMessage);
        });
        sentMapRef.current = nextMap;
        rebuildPrivateMessages(currentUser.uid, notifications);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'messages');
      }
    );

    return () => {
      unsubReceived();
      unsubSent();
    };
  }, [currentUser, rebuildPrivateMessages]);

  // Keep privateMessages synced if notifications list updates with any message notifications
  useEffect(() => {
    if (!currentUser) return;
    rebuildPrivateMessages(currentUser.uid, notifications);
  }, [currentUser, notifications, rebuildPrivateMessages]);

  const signIn = async () => {
    awaitingOtpRef.current = false;
    setPendingOtpSession(null);
    const loggedInUser = await loginWithGoogle();
    if (loggedInUser) {
      setCurrentUser(loggedInUser);
      await hydrateUserProfile(loggedInUser);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ requiresOtp: boolean }> => {
    awaitingOtpRef.current = true;
    try {
      const result = await loginWithEmail(email, password);
      if (result.requiresOtpVerification && result.otpDispatch) {
        setPendingOtpSession({
          user: result.user,
          email: result.user.email || email.trim().toLowerCase(),
          displayName: result.user.displayName || 'News Researcher',
          otpDispatch: result.otpDispatch,
        });
        return { requiresOtp: true };
      }
      awaitingOtpRef.current = false;
      setCurrentUser(result.user);
      await hydrateUserProfile(result.user);
      return { requiresOtp: false };
    } catch (err) {
      awaitingOtpRef.current = false;
      throw err;
    }
  };

  const signUpWithEmail = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ requiresOtp: boolean }> => {
    awaitingOtpRef.current = true;
    try {
      const result = await registerWithEmail(name, email, password);
      if (result.requiresOtpVerification && result.otpDispatch) {
        setPendingOtpSession({
          user: result.user,
          email: result.user.email || email.trim().toLowerCase(),
          displayName: name.trim() || result.user.displayName || 'News Researcher',
          otpDispatch: result.otpDispatch,
        });
        return { requiresOtp: true };
      }
      awaitingOtpRef.current = false;
      setCurrentUser(result.user);
      await hydrateUserProfile(result.user);
      return { requiresOtp: false };
    } catch (err) {
      awaitingOtpRef.current = false;
      throw err;
    }
  };

  const verifyEmailOtp = async (code: string) => {
    if (!pendingOtpSession) {
      throw new Error('No pending email verification session found. Please sign in again.');
    }
    await verifyEmailOtpCode(pendingOtpSession.email, code);
    awaitingOtpRef.current = false;
    const finalizedUser = setCachedAuthUser({
      uid: pendingOtpSession.user.uid,
      displayName: pendingOtpSession.displayName,
      email: pendingOtpSession.email,
      photoURL: pendingOtpSession.user.photoURL || null,
      emailVerified: true,
    });
    setPendingOtpSession(null);
    setCurrentUser(finalizedUser);
    await hydrateUserProfile(finalizedUser);
  };

  const verifyFirebaseEmailLink = async (): Promise<boolean> => {
    if (!pendingOtpSession) {
      throw new Error('No pending email verification session found.');
    }
    const verified = await checkFirebaseEmailLinkVerified();
    if (!verified) {
      throw new Error(
        'Your email link has not been clicked yet. Please click the verification link sent to your email inbox or enter the 6-digit OTP code above.'
      );
    }
    awaitingOtpRef.current = false;
    const finalizedUser = setCachedAuthUser({
      uid: pendingOtpSession.user.uid,
      displayName: pendingOtpSession.displayName,
      email: pendingOtpSession.email,
      photoURL: pendingOtpSession.user.photoURL || null,
      emailVerified: true,
    });
    setPendingOtpSession(null);
    setCurrentUser(finalizedUser);
    await hydrateUserProfile(finalizedUser);
    return true;
  };

  const resendEmailOtp = async (): Promise<OtpDispatchResponse> => {
    if (!pendingOtpSession) {
      throw new Error('No pending email verification session found.');
    }
    const dispatch = await requestEmailOtp(pendingOtpSession.email);
    setPendingOtpSession((prev) => (prev ? { ...prev, otpDispatch: dispatch } : null));
    return dispatch;
  };

  const cancelPendingOtp = async () => {
    awaitingOtpRef.current = false;
    setPendingOtpSession(null);
    await logoutUser();
  };

  const signOutUser = async () => {
    awaitingOtpRef.current = false;
    setPendingOtpSession(null);
    await logoutUser();
    setCurrentUser(null);
    setUserProfile(null);
    setSavedArticles([]);
    setSavedAudits([]);
    setNotifications([]);
    setPrivateMessages([]);
  };

  const updateProfileDetails = async (details: Partial<UserProfileData>) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}`;
    try {
      const updated = {
        ...details,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      setUserProfile((prev) => (prev ? { ...prev, ...updated } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const updatePreferences = async (newPrefs: Partial<UserPreferencesConfig>) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}`;
    try {
      const mergedPrefs: UserPreferencesConfig = {
        ...(userProfile?.preferences || DEFAULT_PREFERENCES),
        ...newPrefs,
      };
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          preferences: mergedPrefs,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              preferences: mergedPrefs,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const saveCustomWeights = async (weights: MultiObjectiveWeights) => {
    if (!currentUser) return;
    const path = `users/${currentUser.uid}`;
    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          uid: currentUser.uid,
          customWeights: weights,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              customWeights: weights,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const logReadingSessionToDb = async (
    articleId: string,
    articleTitle: string,
    publisher: string,
    dwellSec: number,
    completionRatio: number,
    feedback: 'positive' | 'negative' | 'flagged' | null
  ) => {
    if (!currentUser) return;
    const sessionId = `sess_${Date.now()}`;
    const path = `users/${currentUser.uid}/reading_sessions/${sessionId}`;

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'reading_sessions', sessionId), {
        id: sessionId,
        userId: currentUser.uid,
        articleId: sanitizeId(articleId),
        articleTitle: articleTitle.slice(0, 300),
        publisher: publisher.slice(0, 150),
        dwellTimeSec: dwellSec,
        completionRatio: Math.min(1.0, Math.max(0, completionRatio)),
        userFeedback: feedback || 'none',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const saveAuditToDb = async (auditData: any) => {
    if (!currentUser) return;
    const auditId = `audit_${Date.now()}`;
    const path = `users/${currentUser.uid}/audits/${auditId}`;

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'audits', auditId), {
        id: auditId,
        userId: currentUser.uid,
        title: (auditData.title || '').slice(0, 300),
        publisher: (auditData.publisher || 'Unknown').slice(0, 150),
        sourceTier: (auditData.sourceTier || 'Unclassified').slice(0, 100),
        credibilityScore: auditData.overallCredibility ?? 0.5,
        factCheckStatus: auditData.factCheckStatus || 'UNVERIFIED_DEVELOPING',
        reasoning: (auditData.reasoning || '').slice(0, 2000),
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  // --- Saved Articles Management ---
  const saveArticle = async (article: NewsArticle | ScoredArticle, note = ''): Promise<boolean> => {
    if (!currentUser) {
      await signIn();
      return false;
    }

    const cleanArticleId = sanitizeId(article.id);
    const docId = `saved_${cleanArticleId}`;
    const path = `users/${currentUser.uid}/saved_articles/${docId}`;

    try {
      const savedDoc: SavedArticle = {
        id: docId,
        articleId: article.id,
        userId: currentUser.uid,
        title: article.title.slice(0, 400),
        publisher: article.publisher.slice(0, 150),
        category: article.category || 'General',
        url: article.url || '',
        urlToImage: article.urlToImage || '',
        credibilityScore: (article as any).scores?.credibility ?? (article as any).sourceReliability ?? 0.75,
        userNotes: note.slice(0, 1000),
        savedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', currentUser.uid, 'saved_articles', docId), savedDoc);

      // Increment profile savedCount
      const newCount = (userProfile?.savedCount || 0) + 1;
      await updateProfileDetails({ savedCount: newCount });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  };

  const removeSavedArticle = async (articleId: string) => {
    if (!currentUser) return;
    const cleanArticleId = sanitizeId(articleId);
    const docId = `saved_${cleanArticleId}`;
    const path = `users/${currentUser.uid}/saved_articles/${docId}`;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'saved_articles', docId));
      const newCount = Math.max(0, (userProfile?.savedCount || 1) - 1);
      await updateProfileDetails({ savedCount: newCount });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const isArticleSaved = useCallback(
    (articleId: string) => {
      const cleanArticleId = sanitizeId(articleId);
      const docId = `saved_${cleanArticleId}`;
      return savedArticles.some((item) => item.id === docId || item.articleId === articleId);
    },
    [savedArticles]
  );

  const getUserSavedArticles = async (userId: string): Promise<SavedArticle[]> => {
    const cleanUid = sanitizeId(userId);
    const path = `users/${cleanUid}/saved_articles`;
    try {
      const q = query(
        collection(db, 'users', cleanUid, 'saved_articles'),
        orderBy('savedAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SavedArticle[];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  };

  // --- Social Wire Posts & Reposts ---
  const createWirePost = async (
    content: string,
    referencedArticle?: any,
    type: 'post' | 'repost' = 'post'
  ): Promise<string | null> => {
    if (!currentUser) {
      await signIn();
      return null;
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `posts/${postId}`;

    try {
      const authorHandle = userProfile?.handle || `@${(currentUser.displayName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)}`;
      const postData: SocialPost = {
        id: postId,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Researcher',
        authorHandle,
        ...(currentUser.photoURL ? { authorPhoto: currentUser.photoURL } : {}),
        content: content.trim().slice(0, 2000),
        type,
        ...(referencedArticle
          ? {
              referencedArticle: {
                id: referencedArticle.id || '',
                title: referencedArticle.title || '',
                publisher: referencedArticle.publisher || '',
                category: referencedArticle.category || 'General',
                url: referencedArticle.url || '',
                urlToImage: referencedArticle.urlToImage || '',
                credibilityScore:
                  referencedArticle.scores?.credibility ??
                  referencedArticle.computedScores?.credibility ??
                  referencedArticle.sourceReliability ??
                  0.8,
                abstract: (referencedArticle.abstract || '').slice(0, 250),
              },
            }
          : {}),
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        repostsCount: 0,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'posts', postId), postData);

      const newReposts = (userProfile?.repostsCount || 0) + 1;
      await updateProfileDetails({ repostsCount: newReposts });

      return postId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return null;
    }
  };

  const deleteWirePost = async (postId: string) => {
    if (!currentUser) return;
    const cleanPostId = sanitizeId(postId);
    const path = `posts/${cleanPostId}`;
    try {
      await deleteDoc(doc(db, 'posts', cleanPostId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const toggleLikePost = async (postId: string) => {
    if (!currentUser) {
      await signIn();
      return;
    }

    const cleanPostId = sanitizeId(postId);
    const path = `posts/${cleanPostId}`;

    try {
      const postRef = doc(db, 'posts', cleanPostId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return;

      const post = postSnap.data() as SocialPost;
      const currentLikes: string[] = post.likedBy || [];
      const hasLiked = currentLikes.includes(currentUser.uid);

      const updatedLikedBy = hasLiked
        ? currentLikes.filter((uid) => uid !== currentUser.uid)
        : [...currentLikes, currentUser.uid];

      await setDoc(
        postRef,
        {
          likedBy: updatedLikedBy,
          likesCount: updatedLikedBy.length,
        },
        { merge: true }
      );

      // Send notification to post author when another user likes their post
      if (!hasLiked && post.authorId !== currentUser.uid) {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const senderHandle =
          userProfile?.handle ||
          `@${(currentUser.displayName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)}`;
        const notifData: UserNotification = {
          id: notifId,
          recipientId: post.authorId,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Analyst',
          senderHandle,
          ...(currentUser.photoURL ? { senderPhoto: currentUser.photoURL } : {}),
          type: 'like',
          title: 'liked your post',
          content: post.content.slice(0, 140),
          targetId: cleanPostId,
          read: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'notifications', notifId), notifData);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const getUserPosts = async (userId: string): Promise<SocialPost[]> => {
    const path = 'posts';
    try {
      const q = query(
        collection(db, 'posts'),
        where('authorId', '==', userId),
        limit(50)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as SocialPost[];
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  };

  // --- Comments Management ---
  const addComment = async (
    targetType: 'article' | 'post',
    targetId: string,
    content: string
  ): Promise<ArticleComment | null> => {
    if (!currentUser) {
      await signIn();
      return null;
    }

    const commentId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `comments/${commentId}`;

    try {
      const authorHandle = userProfile?.handle || `@${(currentUser.displayName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)}`;
      const commentDoc: ArticleComment = {
        id: commentId,
        targetType,
        targetId: sanitizeId(targetId),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'News Analyst',
        authorHandle,
        ...(currentUser.photoURL ? { authorPhoto: currentUser.photoURL } : {}),
        content: content.trim().slice(0, 2000),
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'comments', commentId), commentDoc);

      // Increment post comment counter if targeting a wire post and notify post author
      if (targetType === 'post') {
        const cleanPostId = sanitizeId(targetId);
        const postRef = doc(db, 'posts', cleanPostId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const postData = postSnap.data() as SocialPost;
          await setDoc(
            postRef,
            { commentsCount: (postData.commentsCount || 0) + 1 },
            { merge: true }
          );

          // Notify post author when another user comments on their post
          if (postData.authorId !== currentUser.uid) {
            const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const notifDoc: UserNotification = {
              id: notifId,
              recipientId: postData.authorId,
              senderId: currentUser.uid,
              senderName: currentUser.displayName || 'News Analyst',
              senderHandle: authorHandle,
              ...(currentUser.photoURL ? { senderPhoto: currentUser.photoURL } : {}),
              type: 'comment',
              title: 'commented on your post',
              content: content.trim().slice(0, 200),
              targetId: cleanPostId,
              read: false,
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'notifications', notifId), notifDoc);
          }
        }
      }

      return commentDoc;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return null;
    }
  };

  const getComments = async (
    targetType: 'article' | 'post',
    targetId: string
  ): Promise<ArticleComment[]> => {
    const cleanTargetId = sanitizeId(targetId);
    const path = 'comments';

    try {
      const q = query(
        collection(db, 'comments'),
        where('targetType', '==', targetType),
        where('targetId', '==', cleanTargetId),
        limit(50)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ArticleComment[];
      return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!currentUser) return;
    const cleanCommentId = sanitizeId(commentId);
    const path = `comments/${cleanCommentId}`;
    try {
      await deleteDoc(doc(db, 'comments', cleanCommentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // --- Notifications Management ---
  const markNotificationRead = async (notificationId: string) => {
    if (!currentUser) return;
    const cleanId = sanitizeId(notificationId);
    const path = `notifications/${cleanId}`;
    try {
      await setDoc(doc(db, 'notifications', cleanId), { read: true }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) =>
        setDoc(doc(db, 'notifications', sanitizeId(n.id)), { read: true }, { merge: true }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `notifications/${n.id}`)
        )
      )
    );
  };

  const deleteNotification = async (notificationId: string) => {
    if (!currentUser) return;
    const cleanId = sanitizeId(notificationId);
    const path = `notifications/${cleanId}`;
    try {
      await deleteDoc(doc(db, 'notifications', cleanId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // --- Private 1-on-1 Direct Messaging (WhatsApp style) ---
  const sendDirectMessage = async (
    recipient: { uid: string; displayName: string; handle: string; photoURL?: string },
    content: string
  ): Promise<PrivateMessage | null> => {
    if (!currentUser) {
      await signIn();
      return null;
    }

    const trimmed = content.trim().slice(0, 2000);
    if (!trimmed) return null;

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `messages/${msgId}`;
    const sortedPair = [currentUser.uid, recipient.uid].sort();
    const conversationId = `conv_${sanitizeId(sortedPair[0])}_${sanitizeId(sortedPair[1])}`;

    try {
      const senderHandle =
        userProfile?.handle ||
        `@${(currentUser.displayName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)}`;

      const msgDoc: PrivateMessage = {
        id: msgId,
        conversationId,
        senderId: currentUser.uid,
        senderName: userProfile?.displayName || currentUser.displayName || 'Analyst',
        senderHandle,
        ...(currentUser.photoURL ? { senderPhoto: currentUser.photoURL } : {}),
        recipientId: recipient.uid,
        recipientName: recipient.displayName || 'Analyst',
        recipientHandle: recipient.handle || '@analyst',
        ...(recipient.photoURL ? { recipientPhoto: recipient.photoURL } : {}),
        participants: [currentUser.uid, recipient.uid],
        content: trimmed,
        read: false,
        createdAt: new Date().toISOString(),
      };

      // Optimistically update local state immediately
      sentMapRef.current.set(msgId, msgDoc);
      rebuildPrivateMessages(currentUser.uid, notifications);

      await setDoc(doc(db, 'messages', msgId), msgDoc);

      // Also create a real-time notification for the recipient if messaging another user
      if (recipient.uid !== currentUser.uid) {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const notifDoc: UserNotification = {
          id: notifId,
          recipientId: recipient.uid,
          senderId: currentUser.uid,
          senderName: msgDoc.senderName,
          senderHandle,
          ...(currentUser.photoURL ? { senderPhoto: currentUser.photoURL } : {}),
          type: 'message',
          title: 'sent you a private message',
          content: trimmed.slice(0, 200),
          targetId: currentUser.uid,
          read: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'notifications', notifId), notifDoc);
      }

      return msgDoc;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      return null;
    }
  };

  const markConversationRead = async (partnerUid: string) => {
    if (!currentUser) return;
    const unreadIncoming = privateMessages.filter(
      (m) => m.senderId === partnerUid && m.recipientId === currentUser.uid && !m.read
    );
    await Promise.all(
      unreadIncoming.map((m) => {
        const cleanId = sanitizeId(m.id);
        if (cleanId.startsWith('notif_')) {
          return setDoc(doc(db, 'notifications', cleanId), { read: true }, { merge: true }).catch((err) =>
            handleFirestoreError(err, OperationType.UPDATE, `notifications/${m.id}`)
          );
        }
        return setDoc(doc(db, 'messages', cleanId), { read: true }, { merge: true }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `messages/${m.id}`)
        );
      })
    );
  };

  const deleteDirectMessage = async (messageId: string) => {
    if (!currentUser) return;
    const cleanId = sanitizeId(messageId);
    const isNotifBacked = cleanId.startsWith('notif_');
    const path = isNotifBacked ? `notifications/${cleanId}` : `messages/${cleanId}`;
    try {
      receivedMapRef.current.delete(cleanId);
      sentMapRef.current.delete(cleanId);
      if (isNotifBacked) {
        await deleteDoc(doc(db, 'notifications', cleanId));
      } else {
        await deleteDoc(doc(db, 'messages', cleanId));
      }
      rebuildPrivateMessages(currentUser.uid, notifications);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  // --- Public Profile Lookup ---
  const getPublicProfile = async (userId: string): Promise<UserProfileData | null> => {
    const cleanUid = sanitizeId(userId);
    const path = `users/${cleanUid}`;
    try {
      const docSnap = await getDoc(doc(db, 'users', cleanUid));
      if (docSnap.exists()) {
        return docSnap.data() as UserProfileData;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        pendingOtpSession,
        signIn,
        signInWithEmail,
        signUpWithEmail,
        verifyEmailOtp,
        verifyFirebaseEmailLink,
        resendEmailOtp,
        cancelPendingOtp,
        signOutUser,
        updateProfileDetails,
        updatePreferences,
        saveCustomWeights,
        logReadingSessionToDb,
        savedAudits,
        saveAuditToDb,
        savedArticles,
        saveArticle,
        removeSavedArticle,
        isArticleSaved,
        getUserSavedArticles,
        wirePosts,
        createWirePost,
        deleteWirePost,
        toggleLikePost,
        getUserPosts,
        addComment,
        getComments,
        deleteComment,
        getPublicProfile,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        privateMessages,
        sendDirectMessage,
        markConversationRead,
        deleteDirectMessage,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
