import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, Database, AlertCircle, Box } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, signIn, signOutUser } = useFirebase();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signIn();
      onClose();
    } catch (e: any) {
      console.error('Sign-in error:', e);
      setAuthError(e?.message || 'Authentication was interrupted or canceled. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-neutral-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-black text-lg shadow-sm">
            <Box className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Account Authentication</h3>
            <p className="text-xs text-neutral-400 font-mono">Verified Analyst Profile</p>
          </div>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            {/* Authenticated User Profile Card */}
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-emerald-300">Authenticated via Google</span>
              </div>

              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-neutral-700 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-neutral-700 bg-neutral-800 flex items-center justify-center font-bold text-sm text-neutral-200">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{currentUser.displayName || 'Authenticated User'}</p>
                  <p className="text-xs text-neutral-400 font-mono truncate">{currentUser.email}</p>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                await signOutUser();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-neutral-300 leading-relaxed">
              Sign in with your verified Google account to sync your reading history, personalized Multi-Objective Pareto weights, and AI fact-checking credibility audits across sessions.
            </p>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{authError}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all cursor-pointer shadow-md disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Connecting to Google...' : 'Sign In with Google'}</span>
            </button>

            {/* Real Security Credentials Note */}
            <div className="rounded-xl border border-neutral-850 bg-neutral-900/40 p-3 space-y-1.5 text-[11px] text-neutral-400">
              <div className="flex items-center gap-1.5 text-neutral-200 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Trust Client Security</span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Direct OAuth 2.0 popup via Firebase Auth SDK. No passwords stored on server; all database queries guarded by Firestore ABAC rules.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
