"use client";

import React, { useState } from "react";
import {
  Bell,
  MessageSquare,
  Heart,
  CheckCheck,
  Trash2,
  Check,
  Filter,
  MessageCircle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { useFirebase } from "../../src/context/FirebaseContext";
import { UserNotification } from "../../src/types";

export type NotificationFilterTab = "all" | "unread" | "comment" | "message" | "like";

export interface NotificationsFilterProps {
  onSelectNotification?: (notification: UserNotification) => void;
  className?: string;
  compact?: boolean;
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffSec = Math.max(1, Math.floor(diffMs / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoDate).toLocaleDateString([], { month: "short", day: "numeric" });
}

export const NotificationsFilter: React.FC<NotificationsFilterProps> = ({
  onSelectNotification,
  className = "",
  compact = false,
}) => {
  const {
    currentUser,
    signIn,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useFirebase();

  const [activeFilter, setActiveFilter] = useState<NotificationFilterTab>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const commentCount = notifications.filter((n) => n.type === "comment").length;
  const messageCount = notifications.filter((n) => n.type === "message").length;
  const likeCount = notifications.filter((n) => n.type === "like").length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === "unread") return !item.read;
    if (activeFilter === "comment") return item.type === "comment";
    if (activeFilter === "message") return item.type === "message";
    if (activeFilter === "like") return item.type === "like";
    return true;
  });

  const filterTabs: { id: NotificationFilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: notifications.length },
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "comment", label: "Comments", count: commentCount },
    { id: "message", label: "Messages", count: messageCount },
    { id: "like", label: "Likes", count: likeCount },
  ];

  const getTypeIcon = (type: UserNotification["type"]) => {
    switch (type) {
      case "comment":
        return (
          <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <MessageSquare className="w-2.5 h-2.5" />
          </div>
        );
      case "message":
        return (
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <MessageCircle className="w-2.5 h-2.5" />
          </div>
        );
      case "like":
        return (
          <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Heart className="w-2.5 h-2.5 fill-rose-400" />
          </div>
        );
    }
  };

  return (
    <div
      className={`w-full rounded-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur-2xl text-neutral-100 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-neutral-800/90 flex items-center justify-between gap-2 bg-neutral-900/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sky-400 shrink-0">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black font-mono text-[9px] font-black flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight truncate">
                Activity &amp; Alerts
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 truncate">
              Real-time alerts for comments on your posts &amp; private messages
            </p>
          </div>
        </div>

        {currentUser && unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsRead()}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Mark all notifications as read"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
        )}
      </div>

      {/* Filter Pills Bar */}
      <div className="px-3 py-2 border-b border-neutral-800/80 bg-neutral-950 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <Filter className="w-3 h-3 text-neutral-500 shrink-0 mr-1" />
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800/70"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                  isActive
                    ? "bg-black/15 text-black font-bold"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notification Items List */}
      <div
        className={`divide-y divide-neutral-850 overflow-y-auto scrollbar-none ${
          compact ? "max-h-[340px]" : "max-h-[420px]"
        }`}
      >
        {!currentUser ? (
          <div className="p-8 text-center space-y-3">
            <Bell className="w-8 h-8 text-neutral-600 mx-auto" />
            <div>
              <p className="text-xs font-semibold text-neutral-300">
                Sign in to view your notifications
              </p>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-xs mx-auto">
                Receive instant alerts when someone comments on your post or sends you a private message.
              </p>
            </div>
            <button
              onClick={() => signIn()}
              className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Sign In with Google
            </button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Sparkles className="w-7 h-7 text-neutral-600 mx-auto" />
            <p className="text-xs font-semibold text-neutral-300">
              No {activeFilter !== "all" ? activeFilter : ""} notifications yet
            </p>
            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
              When another user comments on your post or sends you a direct message, it will appear here in real time.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.read) {
                  markNotificationRead(item.id);
                }
                onSelectNotification?.(item);
              }}
              className={`p-3.5 transition-all flex items-start gap-3 group cursor-pointer ${
                !item.read
                  ? "bg-sky-950/15 hover:bg-sky-950/25"
                  : "bg-transparent hover:bg-neutral-900/60"
              }`}
            >
              {/* Sender Avatar + Type Badge */}
              <div className="relative shrink-0">
                {item.senderPhoto ? (
                  <img
                    src={item.senderPhoto}
                    alt={item.senderName}
                    className="w-9 h-9 rounded-full border border-neutral-700 object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 border border-neutral-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {item.senderName?.[0] || "U"}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1">{getTypeIcon(item.type)}</div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="text-xs font-bold text-white truncate">
                      {item.senderName}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 truncate">
                      {item.senderHandle}
                    </span>
                    <span className="text-xs text-neutral-300">
                      {item.title ||
                        (item.type === "comment"
                          ? "commented on your post"
                          : item.type === "message"
                          ? "sent you a private message"
                          : "liked your post")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!item.read && (
                      <span
                        className="w-2 h-2 rounded-full bg-sky-400 shrink-0"
                        title="Unread"
                      />
                    )}
                    <span className="text-[10px] font-mono text-neutral-500">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Message/Comment Preview */}
                {item.content && (
                  <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800/80 text-xs text-neutral-200 line-clamp-2 break-words font-sans">
                    &ldquo;{item.content}&rdquo;
                  </div>
                )}

                {/* Quick Action Footer */}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-400 group-hover:underline">
                    <span>
                      {item.type === "message"
                        ? "Open Private Chat"
                        : "View Post & Discussion"}
                    </span>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>

                  <div
                    className="flex items-center gap-1 opacity-80 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!item.read && (
                      <button
                        onClick={() => markNotificationRead(item.id)}
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(item.id)}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function NotificationsFilterDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center px-4">
      <NotificationsFilter />
    </div>
  );
}
