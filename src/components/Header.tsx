import React, { useState, useEffect } from 'react';
import { UserPersona, UserNotification } from '../types';
import { useFirebase } from '../context/FirebaseContext';
import { NavbarFloating, ActiveTab } from '@/registry/ruixenui/navbar-floating';
import { AuthModal } from './AuthModal';

export type { ActiveTab } from '@/registry/ruixenui/navbar-floating';

export interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedPersona?: UserPersona;
  personas?: UserPersona[];
  onSelectPersona?: (persona: UserPersona) => void;
  onOpenSearch?: () => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  onSelectNotification?: (notification: UserNotification) => void;
  canGoBack?: boolean;
  onStepBack?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  selectedPersona,
  personas = [],
  onSelectPersona,
  onOpenSearch,
  onOpenMessages,
  onOpenNotifications,
  onSelectNotification,
  canGoBack,
  onStepBack,
  theme = 'dark',
  onToggleTheme,
}) => {
  const { currentUser, signOutUser, savedAudits, notifications, privateMessages } = useFirebase();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalDefaultSignIn, setAuthModalDefaultSignIn] = useState(true);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const unreadMessagesCount = currentUser
    ? privateMessages.filter((m) => m.recipientId === currentUser.uid && !m.read).length
    : 0;

  // Global keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  return (
    <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-md text-neutral-100">
      <NavbarFloating
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenSearch={onOpenSearch}
        canGoBack={canGoBack}
        onStepBack={onStepBack}
        theme={theme}
        onToggleTheme={onToggleTheme}
        currentUser={
          currentUser
            ? {
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                verified: currentUser.emailVerified,
              }
            : null
        }
        onSignIn={() => {
          setAuthModalDefaultSignIn(true);
          setIsAuthModalOpen(true);
        }}
        onSignUp={() => {
          setAuthModalDefaultSignIn(false);
          setIsAuthModalOpen(true);
        }}
        onSignOut={signOutUser}
        savedAuditsCount={savedAudits?.length || 0}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadMessagesCount={unreadMessagesCount}
        onOpenMessages={onOpenMessages}
        onOpenNotifications={onOpenNotifications}
        onSelectNotification={onSelectNotification}
        githubUrl={import.meta.env.VITE_GITHUB_REPO_URL || "https://github.com/rajdeepbaruah/trustnews-moo"}
      />

      {/* Real Auth & Profile Modal (AuthUI) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultIsSignIn={authModalDefaultSignIn}
      />
    </header>
  );
};

export default Header;
