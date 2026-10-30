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
import { auth, db, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from '../firebase';
import {
  MultiObjectiveWeights,
  SavedArticle,
  SocialPost,
  ArticleComment,
  UserProfileData,
  UserPreferencesConfig,
  NewsArticle,
  ScoredArticle,
} from '../types';

interface FirebaseContextType {
  currentUser: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  signIn: () => Promise<void>;
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

  // Social Wire Posts (x.com style)
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAudits, setSavedAudits] = useState<any[]>([]);
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [wirePosts, setWirePosts] = useState<SocialPost[]>([]);

  // 1. Auth Listener & User Profile Initialization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const initialHandle = (user.displayName || user.email?.split('@')[0] || 'reader')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 20);

        const initialProfile: UserProfileData = {
          uid: user.uid,
          displayName: user.displayName || 'News Researcher',
          handle: `@${initialHandle || 'analyst'}`,
          bio: 'Researcher analyzing news through multi-objective optimization and credibility heuristics.',
          email: user.email || '',
          photoURL: user.photoURL || '',
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
            setUserProfile(data);
          }
        } catch (error) {
          // If offline or token service initializing, provide resilient local profile fallback
          setUserProfile(initialProfile);
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserProfile(null);
        setSavedArticles([]);
        setSavedAudits([]);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const signIn = async () => {
    await loginWithGoogle();
  };

  const signOutUser = async () => {
    await logoutUser();
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
        authorPhoto: currentUser.photoURL || undefined,
        content: content.trim().slice(0, 2000),
        type,
        referencedArticle: referencedArticle
          ? {
              id: referencedArticle.id || '',
              title: referencedArticle.title || '',
              publisher: referencedArticle.publisher || '',
              category: referencedArticle.category || 'General',
              url: referencedArticle.url || '',
              urlToImage: referencedArticle.urlToImage || '',
              credibilityScore: referencedArticle.scores?.credibility ?? referencedArticle.sourceReliability ?? 0.8,
              abstract: (referencedArticle.abstract || '').slice(0, 250),
            }
          : undefined,
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        repostsCount: 0,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'posts', postId), postData);

      if (type === 'repost') {
        const newReposts = (userProfile?.repostsCount || 0) + 1;
        await updateProfileDetails({ repostsCount: newReposts });
      }

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
        authorPhoto: currentUser.photoURL || undefined,
        content: content.trim().slice(0, 2000),
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'comments', commentId), commentDoc);

      // Increment post comment counter if targeting a wire post
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

  // --- Public Profile Lookup (Anyone can view by unique UID) ---
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
        signIn,
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
