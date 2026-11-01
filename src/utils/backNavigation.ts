import { useEffect, useRef } from 'react';

interface BackHandlerEntry {
  id: string;
  onBack: () => void;
}

const activeOverlayHandlers: BackHandlerEntry[] = [];
let pageStepBackHandler: (() => boolean) | null = null;
let sentinelInitialized = false;
let isHandlingPopState = false;

/**
 * Safely push a state entry to browser history without throwing in sandboxed iframes
 */
export function safePushHistoryState(state: Record<string, unknown>, url?: string) {
  if (typeof window === 'undefined') return;
  try {
    window.history.pushState(
      { ...state, _tnApp: true, _ts: Date.now() },
      '',
      url || window.location.href
    );
  } catch {
    // Ignore security exceptions in restricted iframe contexts
  }
}

/**
 * Safely replace current history state without throwing in sandboxed iframes
 */
export function safeReplaceHistoryState(state: Record<string, unknown>, url?: string) {
  if (typeof window === 'undefined') return;
  try {
    window.history.replaceState(
      { ...state, _tnApp: true, _ts: Date.now() },
      '',
      url || window.location.href
    );
  } catch {
    // Ignore security exceptions in restricted iframe contexts
  }
}

/**
 * Initialize a sentinel history entry and global popstate listener so mobile hardware
 * Back button presses are intercepted cleanly without unloading the app or iframe.
 */
export function initGlobalBackNavigation(onPageStepBack: () => boolean) {
  pageStepBackHandler = onPageStepBack;

  if (typeof window === 'undefined' || sentinelInitialized) return;
  sentinelInitialized = true;

  // Create a base sentinel state + active state so the first mobile Back press stays in-app
  const currentHref = window.location.href;
  safeReplaceHistoryState({ _tnSentinel: true, tab: 'overview' }, currentHref);
  safePushHistoryState({ _tnActive: true, tab: 'overview' }, currentHref);

  window.addEventListener('popstate', () => {
    if (isHandlingPopState) return;
    isHandlingPopState = true;

    try {
      // 1. First priority: close topmost open modal / overlay / drawer / mobile menu
      if (activeOverlayHandlers.length > 0) {
        const topHandler = activeOverlayHandlers.pop();
        if (topHandler) {
          topHandler.onBack();
        }
        // Keep history buffer armed so subsequent Back presses continue to work
        safePushHistoryState({ _tnActive: true });
        return;
      }

      // 2. Second priority: step back through page/tab/pagination history stack
      if (pageStepBackHandler) {
        const handled = pageStepBackHandler();
        // Always re-arm the sentinel entry so phone Back button never exits the iframe
        safePushHistoryState({ _tnActive: true });
        if (handled) {
          return;
        }
      } else {
        safePushHistoryState({ _tnActive: true });
      }
    } finally {
      setTimeout(() => {
        isHandlingPopState = false;
      }, 40);
    }
  });
}

/**
 * Trigger the exact same layered Back action from any UI "Back" button click
 * without relying on browser history.back() which can navigate parent iframes.
 */
export function triggerLayeredBack(): boolean {
  if (activeOverlayHandlers.length > 0) {
    const topHandler = activeOverlayHandlers.pop();
    if (topHandler) {
      topHandler.onBack();
      return true;
    }
  }
  if (pageStepBackHandler) {
    return pageStepBackHandler();
  }
  return false;
}

/**
 * React hook for modals, search overlays, drawers, and mobile menus to intercept
 * phone Back button presses and layered Back actions when open.
 */
export function useOverlayBackHandler(isOpen: boolean, onClose: () => void, debugLabel = 'overlay') {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const id = `${debugLabel}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const entry: BackHandlerEntry = {
      id,
      onBack: () => {
        onCloseRef.current();
      },
    };

    activeOverlayHandlers.push(entry);
    // Push a history state so mobile hardware Back button triggers popstate for this overlay
    safePushHistoryState({ _tnOverlay: id });

    return () => {
      const idx = activeOverlayHandlers.findIndex((item) => item.id === id);
      if (idx !== -1) {
        activeOverlayHandlers.splice(idx, 1);
      }
    };
  }, [isOpen, debugLabel]);
}
