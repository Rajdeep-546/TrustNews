import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Search,
  Lock,
  Check,
  CheckCheck,
  ArrowLeft,
  MessageCircle,
  Trash2,
  UserPlus,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { PrivateMessage } from '../types';

export interface ChatPartner {
  uid: string;
  displayName: string;
  handle: string;
  photoURL?: string;
}

interface PrivateMessengerViewProps {
  initialPartner?: ChatPartner | null;
  onViewProfile?: (uid: string) => void;
}

export const PrivateMessengerView: React.FC<PrivateMessengerViewProps> = ({
  initialPartner,
  onViewProfile,
}) => {
  const {
    currentUser,
    signIn,
    privateMessages,
    sendDirectMessage,
    markConversationRead,
    deleteDirectMessage,
    wirePosts,
    getPublicProfile,
  } = useFirebase();

  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(
    initialPartner || null
  );
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(Boolean(initialPartner));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync if initialPartner prop changes
  useEffect(() => {
    if (initialPartner && initialPartner.uid !== currentUser?.uid) {
      setSelectedPartner(initialPartner);
      setMobileShowChat(true);
    }
  }, [initialPartner, currentUser?.uid]);

  // Build list of known contacts from existing privateMessages + wirePosts authors
  const contactsAndConversations = useMemo(() => {
    if (!currentUser) return [];

    const partnerMap = new Map<
      string,
      {
        partner: ChatPartner;
        lastMessage?: PrivateMessage;
        unreadCount: number;
      }
    >();

    // 1. Add initialPartner if provided
    if (initialPartner && initialPartner.uid !== currentUser.uid) {
      partnerMap.set(initialPartner.uid, {
        partner: initialPartner,
        unreadCount: 0,
      });
    }

    // 2. Process all privateMessages involving currentUser
    for (const msg of privateMessages) {
      const isOutgoing = msg.senderId === currentUser.uid;
      const partnerUid = isOutgoing ? msg.recipientId : msg.senderId;
      if (!partnerUid || partnerUid === currentUser.uid) continue;

      const partnerInfo: ChatPartner = isOutgoing
        ? {
            uid: msg.recipientId,
            displayName: msg.recipientName || 'Analyst',
            handle: msg.recipientHandle || '@analyst',
            photoURL: msg.recipientPhoto,
          }
        : {
            uid: msg.senderId,
            displayName: msg.senderName || 'Analyst',
            handle: msg.senderHandle || '@analyst',
            photoURL: msg.senderPhoto,
          };

      const existing = partnerMap.get(partnerUid);
      const isUnreadIncoming = !isOutgoing && !msg.read;

      partnerMap.set(partnerUid, {
        partner: existing?.partner?.photoURL ? existing.partner : partnerInfo,
        lastMessage: msg, // privateMessages is sorted ascending, so last one wins
        unreadCount: (existing?.unreadCount || 0) + (isUnreadIncoming ? 1 : 0),
      });
    }

    // 3. Also include community analysts from wirePosts so user can message anyone easily
    for (const post of wirePosts) {
      if (post.authorId && post.authorId !== currentUser.uid && !partnerMap.has(post.authorId)) {
        partnerMap.set(post.authorId, {
          partner: {
            uid: post.authorId,
            displayName: post.authorName || 'Analyst',
            handle: post.authorHandle || '@analyst',
            photoURL: post.authorPhoto,
          },
          unreadCount: 0,
        });
      }
    }

    const list = Array.from(partnerMap.values());
    // Sort: conversations with messages first (most recent on top), then community contacts
    list.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return (
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
        );
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.partner.displayName.localeCompare(b.partner.displayName);
    });

    return list;
  }, [currentUser, privateMessages, wirePosts, initialPartner]);

  // Auto-select first conversation on desktop if none selected
  useEffect(() => {
    if (!selectedPartner && contactsAndConversations.length > 0) {
      setSelectedPartner(contactsAndConversations[0].partner);
    }
  }, [contactsAndConversations, selectedPartner]);

  // Filter messages for the currently selected partner
  const activeConversationMessages = useMemo(() => {
    if (!currentUser || !selectedPartner) return [];
    return privateMessages.filter(
      (m) =>
        (m.senderId === currentUser.uid && m.recipientId === selectedPartner.uid) ||
        (m.senderId === selectedPartner.uid && m.recipientId === currentUser.uid)
    );
  }, [currentUser, selectedPartner, privateMessages]);

  // Mark incoming messages from selectedPartner as read when viewing conversation
  useEffect(() => {
    if (!currentUser || !selectedPartner) return;
    const hasUnread = activeConversationMessages.some(
      (m) => m.senderId === selectedPartner.uid && !m.read
    );
    if (hasUnread) {
      markConversationRead(selectedPartner.uid);
    }
  }, [currentUser, selectedPartner, activeConversationMessages, markConversationRead]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationMessages.length, selectedPartner?.uid]);

  // Fetch public profile if selectedPartner only has a uid
  useEffect(() => {
    if (selectedPartner && selectedPartner.displayName === 'Analyst') {
      getPublicProfile(selectedPartner.uid).then((prof) => {
        if (prof) {
          setSelectedPartner({
            uid: prof.uid,
            displayName: prof.displayName,
            handle: prof.handle,
            photoURL: prof.photoURL,
          });
        }
      });
    }
  }, [selectedPartner, getPublicProfile]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || !messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      const text = messageInput.trim();
      setMessageInput('');
      await sendDirectMessage(selectedPartner, text);
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contactsAndConversations.filter(({ partner, lastMessage }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      partner.displayName.toLowerCase().includes(q) ||
      partner.handle.toLowerCase().includes(q) ||
      (lastMessage?.content || '').toLowerCase().includes(q)
    );
  });

  if (!currentUser) {
    return (
      <div className="border border-neutral-800 bg-neutral-950/90 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <MessageCircle className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-base font-bold text-white">
            Private Analyst Messenger
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Sign in to send and receive private 1-on-1 messages with other analysts. Messages are strictly private and visible only to you and the recipient.
          </p>
        </div>
        <button
          onClick={() => signIn()}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors cursor-pointer shadow-md"
        >
          Sign In to Open Messenger
        </button>
      </div>
    );
  }

  const QUICK_REPLIES = [
    '👋 Hey! Saw your analysis on the wire.',
    '📊 Great fact-check breakdown!',
    '🔍 Can we collaborate on verifying this source?',
  ];

  return (
    <div className="border border-neutral-800 bg-neutral-950/95 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[580px] sm:h-[640px]">
      {/* LEFT PANE: Conversations & Contacts List */}
      <div
        className={`w-full md:w-80 lg:w-88 border-r border-neutral-800/90 flex flex-col bg-neutral-950 ${
          mobileShowChat ? 'hidden md:flex' : 'flex h-full'
        }`}
      >
        {/* Left Header */}
        <div className="p-3.5 sm:p-4 border-b border-neutral-800/90 bg-neutral-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Private Chats
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> End-to-End Private
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
              {contactsAndConversations.length} Contacts
            </span>
          </div>

          {/* Search Contacts / Messages */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats or analysts..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500/50 font-sans"
            />
          </div>
        </div>

        {/* Conversations Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-900 scrollbar-none">
          {filteredContacts.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <UserPlus className="w-6 h-6 text-neutral-600 mx-auto" />
              <p className="text-xs font-medium text-neutral-400">No contacts found</p>
              <p className="text-[11px] text-neutral-500">
                Visit the Social Wire and click &ldquo;Message&rdquo; on any post author to start a private conversation.
              </p>
            </div>
          ) : (
            filteredContacts.map(({ partner, lastMessage, unreadCount }) => {
              const isSelected = selectedPartner?.uid === partner.uid;
              const isOutgoingLast = lastMessage?.senderId === currentUser.uid;

              return (
                <button
                  key={partner.uid}
                  onClick={() => {
                    setSelectedPartner(partner);
                    setMobileShowChat(true);
                  }}
                  className={`w-full p-3.5 text-left transition-all flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/25 border-l-2 border-l-emerald-400'
                      : 'hover:bg-neutral-900/70'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {partner.photoURL ? (
                      <img
                        src={partner.photoURL}
                        alt={partner.displayName}
                        className="w-10 h-10 rounded-full border border-neutral-700 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 border border-neutral-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                        {partner.displayName?.[0] || 'A'}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
                  </div>

                  {/* Name & Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">
                        {partner.displayName}
                      </span>
                      {lastMessage ? (
                        <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                          {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                          New Chat
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] font-mono text-neutral-500 truncate">
                      {partner.handle}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-[11px] text-neutral-400 truncate">
                        {lastMessage ? (
                          <>
                            {isOutgoingLast && (
                              <span className="text-emerald-400 mr-1">You:</span>
                            )}
                            {lastMessage.content}
                          </>
                        ) : (
                          <span className="italic text-neutral-500">
                            Tap to start a private conversation
                          </span>
                        )}
                      </p>

                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-black font-mono text-[10px] font-black flex items-center justify-center shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANE: Active WhatsApp-Style Chat Window */}
      <div
        className={`flex-1 flex flex-col bg-neutral-950/90 ${
          !mobileShowChat ? 'hidden md:flex' : 'flex h-full'
        }`}
      >
        {selectedPartner ? (
          <>
            {/* Chat Header */}
            <div className="px-3.5 sm:px-5 py-3 border-b border-neutral-800/90 bg-neutral-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                  title="Back to chats"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="relative shrink-0">
                  {selectedPartner.photoURL ? (
                    <img
                      src={selectedPartner.photoURL}
                      alt={selectedPartner.displayName}
                      className="w-9 h-9 rounded-full border border-neutral-700 object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 border border-neutral-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                      {selectedPartner.displayName?.[0] || 'A'}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {selectedPartner.displayName}
                    </h4>
                    <span className="text-[10px] font-mono text-sky-400 truncate">
                      {selectedPartner.handle}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-emerald-400/90 flex items-center gap-1 truncate">
                    <Lock className="w-2.5 h-2.5 shrink-0" />
                    <span>Private chat • Only you &amp; {selectedPartner.displayName} can see messages</span>
                  </p>
                </div>
              </div>

              {onViewProfile && (
                <button
                  onClick={() => onViewProfile(selectedPartner.uid)}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-medium text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">View Profile</span>
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] scrollbar-none">
              {/* Privacy Notice Banner */}
              <div className="max-w-md mx-auto mb-3 px-3 py-2 rounded-xl bg-neutral-900/90 border border-emerald-500/20 text-center">
                <p className="text-[10px] font-mono text-emerald-300 flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>
                    Messages in this chat are private and visible strictly to you and{' '}
                    {selectedPartner.displayName}.
                  </span>
                </p>
              </div>

              {activeConversationMessages.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <Sparkles className="w-7 h-7 text-emerald-400/70 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-neutral-200">
                      Start a private conversation with {selectedPartner.displayName}
                    </p>
                    <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                      Send a direct message below or tap a quick starter prompt.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 max-w-md mx-auto">
                    {QUICK_REPLIES.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setMessageInput(prompt)}
                        className="px-2.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                activeConversationMessages.map((msg) => {
                  const isMine = msg.senderId === currentUser.uid;
                  const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}
                    >
                      <div
                        className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-md relative ${
                          isMine
                            ? 'bg-emerald-600 text-white rounded-tr-xs'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-tl-xs'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-line break-words font-sans">
                          {msg.content}
                        </p>

                        <div
                          className={`mt-1 flex items-center justify-end gap-1.5 text-[9px] font-mono ${
                            isMine ? 'text-emerald-100/80' : 'text-neutral-500'
                          }`}
                        >
                          <span>{timeStr}</span>
                          {isMine && (
                            <>
                              {msg.read ? (
                                <span title="Read by recipient" className="inline-flex">
                                  <CheckCheck className="w-3 h-3 text-sky-200" />
                                </span>
                              ) : (
                                <span title="Sent" className="inline-flex">
                                  <Check className="w-3 h-3 text-emerald-200/80" />
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteDirectMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-rose-200 transition-opacity ml-1 cursor-pointer"
                                title="Delete message"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-3.5 border-t border-neutral-800/90 bg-neutral-900/70 flex items-center gap-2"
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message ${selectedPartner.displayName}...`}
                maxLength={2000}
                className="flex-1 min-w-0 bg-neutral-950 border border-neutral-800 focus:border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-hidden transition-colors font-sans"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || isSending}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Select an Analyst to Message</h4>
            <p className="text-xs text-neutral-500 max-w-xs">
              Choose a contact on the left or click &ldquo;Message&rdquo; on any post in the Social Wire to open a private 1-on-1 chat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
