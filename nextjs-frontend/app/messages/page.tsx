"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUser } from "@/lib/auth";
import type { Conversation, Message, User } from "@/types";

async function fetchJsonWithRetry<T>(
  url: string,
  attempts = 3,
  delayMs = 500,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError ?? new Error(`Request failed for ${url}`);
}

function ConvAvatar({
  name,
  picture,
  size = "md",
}: {
  name?: string;
  picture?: string;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";
  return picture ? (
    <img
      src={picture}
      alt={name}
      className={`${cls} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div
      className={`${cls} rounded-full bg-gradient-to-br from-[#d35400] to-amber-400 flex items-center justify-center text-white font-bold shrink-0`}
    >
      {(name || "U").charAt(0).toUpperCase()}
    </div>
  );
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showConvsOnMobile, setShowConvsOnMobile] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(u);
  }, []);

  // Load conversations
  const loadConversations = useCallback(
    async (u?: User) => {
      const userId = (u || user)?.id;
      if (!userId) return;
      try {
        const data = await fetchJsonWithRetry<Conversation[]>(
          `/api/conversations/${userId}`,
        );
        setConversations(Array.isArray(data) ? data : []);
      } catch {
        /* empty */
      }
      setLoading(false);
    },
    [user],
  );

  useEffect(() => {
    if (!user) return;
    loadConversations(user);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => {
      loadConversations(user);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [user, loadConversations]);

  // Deep-link from URL params
  useEffect(() => {
    const convParam =
      searchParams.get("conversation") || searchParams.get("conv");
    if (convParam && conversations.length > 0) {
      const id = parseInt(convParam, 10);
      if (conversations.find((c) => c.id === id)) {
        openConversation(id);
      }
    }
  }, [conversations, searchParams]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId: number) => {
    setChatLoading(true);
    try {
      const data = await fetchJsonWithRetry<Message[]>(
        `/api/messages/${convId}`,
      );
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      /* empty */
    }
    setChatLoading(false);
  }, []);

  const openConversation = useCallback(
    async (convId: number) => {
      setSelectedConvId(convId);
      setShowConvsOnMobile(false);
      await loadMessages(convId);
      // Mark as read
      if (user?.id) {
        await fetch(`/api/messages/mark-read/${convId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        }).catch(() => {});
        // Refresh conversation list to clear unread badge
        loadConversations();
      }
      inputRef.current?.focus();
    },
    [user, loadMessages, loadConversations],
  );

  useEffect(() => {
    if (!selectedConvId) return;
    const interval = window.setInterval(() => {
      loadMessages(selectedConvId);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [selectedConvId, loadMessages]);

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim() || !user || !selectedConvId || sending) return;
      setSending(true);
      const content = text.trim();
      setText("");
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: selectedConvId,
            senderId: user.id,
            message: content,
          }),
        });
        const j = await res.json();
        if (!j.success) {
          alert("Failed to send message.");
          setText(content);
        }
      } catch {
        alert("Failed to send message.");
        setText(content);
      }
      setSending(false);
    },
    [text, user, selectedConvId, sending],
  );

  // SSE setup
  useEffect(() => {
    if (!user?.id) return;
    const sse = new EventSource(`/api/sse/${user.id}`);
    sseRef.current = sse;

    sse.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "new_message") {
          loadConversations();
          if (selectedConvId === event.data?.conversationId) {
            loadMessages(event.data.conversationId);
          }
        }
      } catch {
        /* empty */
      }
    };

    sse.onerror = () => {
      sse.close();
      // Reconnect handled by new effect when user changes
    };

    return () => sse.close();
  }, [user?.id, selectedConvId, loadConversations, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  const getOtherParty = (conv: Conversation) => {
    if (!user) return { name: "—", picture: "", id: 0 };
    if (user.role === "buyer")
      return {
        name: conv.sellerName || conv.storeName || "—",
        picture: conv.sellerPicture || conv.storeLogo || "",
        id: conv.sellerId,
      };
    return {
      name: conv.buyerName || "—",
      picture: conv.buyerPicture || "",
      id: conv.buyerId,
    };
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          {/* Two-panel layout */}
          <div
            className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-5"
            style={{ height: "calc(100vh - 180px)", minHeight: 560 }}
          >
            {/* Conversations panel */}
            <div
              className={`bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col ${showConvsOnMobile ? "flex" : "hidden md:flex"}`}
            >
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">
                  Conversations
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 bg-gray-100 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    No conversations yet.
                    <br />
                    Contact a seller from a listing to start chatting.
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const other = getOtherParty(conv);
                    const isActive = conv.id === selectedConvId;
                    const hasUnread = (conv.unreadCount ?? 0) > 0;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => openConversation(conv.id)}
                        className={`w-full text-left px-5 py-4 border-b border-gray-100 flex gap-3 hover:bg-gray-50 transition-colors ${isActive ? "bg-[#f0f4ff] border-l-[3px] border-l-[#d35400]" : ""} ${hasUnread && !isActive ? "bg-amber-50" : ""}`}
                      >
                        <ConvAvatar name={other.name} picture={other.picture} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-1">
                            <p className="font-semibold text-sm text-gray-900 truncate">
                              {other.name}
                            </p>
                            <span className="text-xs text-gray-400 shrink-0">
                              {conv.lastMessageTime
                                ? new Date(
                                    conv.lastMessageTime,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                          {conv.storeName && other.id !== user?.id && (
                            <p className="text-xs text-gray-500 truncate">
                              {conv.storeName}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-0.5">
                            <p
                              className={`text-xs truncate ${hasUnread ? "text-gray-800 font-medium" : "text-gray-400"}`}
                            >
                              {conv.lastMessage || "No messages yet"}
                            </p>
                            {hasUnread && (
                              <span className="ml-2 text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                                {conv.unreadCount}
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

            {/* Chat panel */}
            <div
              className={`bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden ${!showConvsOnMobile ? "flex" : "hidden md:flex"}`}
            >
              {selectedConv ? (
                <>
                  {/* Chat header */}
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                    <button
                      onClick={() => setShowConvsOnMobile(true)}
                      className="md:hidden mr-1 text-gray-500"
                    >
                      ← Back
                    </button>
                    {(() => {
                      const o = getOtherParty(selectedConv);
                      return <ConvAvatar name={o.name} picture={o.picture} />;
                    })()}
                    <div>
                      <h3 className="font-bold text-gray-900 text-base leading-tight">
                        {getOtherParty(selectedConv).name}
                      </h3>
                      {selectedConv.storeName && (
                        <p className="text-xs text-gray-500">
                          {selectedConv.storeName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-5 bg-gray-50 flex flex-col gap-3">
                    {chatLoading ? (
                      <div className="text-center text-gray-400 text-sm py-10">
                        Loading messages…
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-10">
                        No messages yet. Say hello!
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isSent = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`max-w-[70%] flex flex-col gap-1 ${isSent ? "self-end items-end" : "self-start items-start"}`}
                          >
                            {!isSent && (
                              <span className="text-xs text-gray-400 px-1">
                                {msg.senderName}
                              </span>
                            )}
                            <div
                              className={`px-3.5 py-2.5 rounded-xl text-sm leading-relaxed break-words whitespace-pre-wrap ${isSent ? "bg-[#d35400] text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"}`}
                            >
                              {msg.content || msg.message}
                            </div>
                            <span className="text-xs text-gray-400 px-1">
                              {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )
                                : ""}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message input */}
                  <form
                    onSubmit={sendMessage}
                    className="px-4 py-3 border-t border-gray-200 flex gap-3 items-center"
                  >
                    <input
                      ref={inputRef}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(e as unknown as React.FormEvent);
                        }
                      }}
                      placeholder="Type a message…"
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#d35400]"
                    />
                    <button
                      type="submit"
                      disabled={!text.trim() || sending}
                      className="bg-[#d35400] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#b84700] disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                      </svg>
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Your messages
                  </h3>
                  <p className="text-sm text-gray-400">
                    Select a conversation from the list to start chatting.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          Loading messages…
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
