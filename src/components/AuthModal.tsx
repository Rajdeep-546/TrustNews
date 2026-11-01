import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Box } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { AuthUI } from '@/components/ui/auth-ui';
import { useOverlayBackHandler } from '../utils/backNavigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultIsSignIn?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultIsSignIn = true,
}) => {
  const {
    currentUser,
    pendingOtpSession,
    signIn,
    signInWithEmail,
    signUpWithEmail,
    verifyEmailOtp,
    verifyFirebaseEmailLink,
    resendEmailOtp,
    cancelPendingOtp,
    signOutUser,
  } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useOverlayBackHandler(isOpen, onClose, 'auth_modal');

  if (!isOpen || typeof document === 'undefined') return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signIn();
      onClose();
    } catch (e: any) {
      console.error('Google sign-in error:', e);
      setAuthError(e?.message || 'Authentication was interrupted or canceled. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithEmail(email, password);
      if (!result.requiresOtp) {
        onClose();
      }
    } catch (e: any) {
      console.error('Email sign-in error:', e);
      setAuthError(e?.message || 'Incorrect email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await signUpWithEmail(name, email, password);
      if (!result.requiresOtp) {
        onClose();
      }
    } catch (e: any) {
      console.error('Email sign-up error:', e);
      setAuthError(e?.message || 'Unable to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await verifyEmailOtp(code);
      onClose();
    } catch (e: any) {
      console.error('OTP verification error:', e);
      setAuthError(e?.message || 'Invalid OTP code. Please check the 6-digit code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckFirebaseLink = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await verifyFirebaseEmailLink();
      onClose();
    } catch (e: any) {
      setAuthError(e?.message || 'Email link not verified yet. Please enter the 6-digit OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await resendEmailOtp();
    } catch (e: any) {
      setAuthError(e?.message || 'Failed to resend OTP verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOtp = async () => {
    setAuthError(null);
    await cancelPendingOtp();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {currentUser ? (
        <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-neutral-100 my-auto">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-black text-lg shadow-sm">
              <Box className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Account Authentication</h3>
              <p className="text-xs text-neutral-400 font-mono">Verified Analyst Profile</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-emerald-300">Authenticated &amp; Verified Session</span>
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
                  <p className="text-sm font-bold text-white truncate">
                    {currentUser.displayName || 'Authenticated User'}
                  </p>
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
        </div>
      ) : (
        <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-950 text-white shadow-2xl overflow-hidden my-auto max-h-[92vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close login modal"
            className="absolute top-3.5 right-3.5 z-30 p-2 rounded-full border border-neutral-700 bg-neutral-900/90 backdrop-blur-md text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shadow-md"
          >
            <X className="w-4 h-4" />
          </button>

          <AuthUI
            defaultIsSignIn={defaultIsSignIn}
            onGoogleSignIn={handleGoogleSignIn}
            onEmailSignIn={handleEmailSignIn}
            onEmailSignUp={handleEmailSignUp}
            pendingOtp={
              pendingOtpSession
                ? {
                    email: pendingOtpSession.email,
                    emailDispatched: pendingOtpSession.otpDispatch.emailDispatched,
                  }
                : null
            }
            onVerifyOtp={handleVerifyOtp}
            onCheckFirebaseLink={handleCheckFirebaseLink}
            onResendOtp={handleResendOtp}
            onCancelOtp={handleCancelOtp}
            isLoading={isLoading}
            errorMessage={authError}
            className="min-h-[540px]"
          />
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AuthModal;
