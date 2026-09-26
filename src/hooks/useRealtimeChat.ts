'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Message, Profile } from '@/lib/types';

interface UseRealtimeChatReturn {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<boolean>;
  isRealtimeConnected: boolean;
  typingUsers: string[];
  setTyping: (isTyping: boolean) => void;
}

export function useRealtimeChat(
  roomId: string,
  currentUser: Profile
): UseRealtimeChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const mountedRef = useRef(true);


  // Load initial messages
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function fetchMessages() {
      try {
        // Try fetching from Supabase
        const { data, error: sbError } = await supabase
          .from('messages')
          .select('*, sender:profiles(*)')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (!isMounted) return;

        if (sbError) {
          throw sbError;
        }

        const formattedMessages: Message[] = (data || []).map((msg: any) => ({
          id: msg.id,
          room_id: msg.room_id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
          sender: msg.sender || undefined,
          status: 'delivered',
        }));
        setMessages(formattedMessages);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('[Chat] Failed to load messages:', err);
        setMessages([]);
        setError(err?.message || 'Gagal memuat pesan.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchMessages();

    // Setup Supabase Realtime channel subscription.
    const channelName = `room:${roomId}`;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const refreshMessages = async () => {
      const { data, error: refreshError } = await supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (!mountedRef.current || refreshError) {
        if (refreshError) console.error('[Chat] Failed to refresh after realtime reconnect:', refreshError);
        return;
      }

      setMessages((data || []).map((msg: any) => ({
        id: msg.id,
        room_id: msg.room_id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        sender: msg.sender || undefined,
        status: 'delivered',
      })));
    };

    const scheduleReconnect = () => {
      if (!mountedRef.current || reconnectTimerRef.current) return;
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(1000 * 2 ** attempt, 15000);
      reconnectAttemptRef.current = Math.min(attempt + 1, 4);
      setIsRealtimeConnected(false);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (!mountedRef.current) return;
        const existing = channelRef.current;
        if (existing) supabase.removeChannel(existing);
        createChannel();
      }, delay);
    };

    const createChannel = () => {
      if (!mountedRef.current) return;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { ack: true },
          presence: { key: currentUser.id },
        },
      });

      channelRef.current = channel;

      channel
      // Listen to PostgreSQL changes on messages table
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newRow = payload.new as any;
          if (!newRow) return;

          let senderInfo: Profile | undefined;
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newRow.sender_id)
            .maybeSingle();
          senderInfo = profileData || undefined;

          const incomingMsg: Message = {
            id: newRow.id,
            room_id: newRow.room_id,
            sender_id: newRow.sender_id,
            content: newRow.content,
            created_at: newRow.created_at,
            sender: senderInfo,
            status: 'delivered',
          };

          setMessages((prev) => {
            // PostgreSQL Realtime is the persisted source of truth. The sender
            // already replaces its own optimistic row after INSERT succeeds.
            if (prev.some((m) => m.id === incomingMsg.id)) {
              return prev;
            }
            return [...prev, incomingMsg].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }
      )
      // Broadcast channel is used only for ephemeral typing indicators.
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload || payload.userId === currentUser.id) return;
        if (payload.isTyping) {
          setTypingUsers((prev) =>
            prev.includes(payload.name) ? prev : [...prev, payload.name]
          );
        } else {
          setTypingUsers((prev) => prev.filter((name) => name !== payload.name));
        }
      })
      .subscribe((status) => {
        if (!mountedRef.current) return;

        if (status === 'SUBSCRIBED') {
          reconnectAttemptRef.current = 0;
          clearReconnectTimer();
          setIsRealtimeConnected(true);
          void refreshMessages();
          return;
        }

        setIsRealtimeConnected(false);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          scheduleReconnect();
        }
      });
    };

    mountedRef.current = true;
    reconnectAttemptRef.current = 0;
    createChannel();

    const handleOnline = () => {
      reconnectAttemptRef.current = 0;
      scheduleReconnect();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        reconnectAttemptRef.current = 0;
        scheduleReconnect();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      mountedRef.current = false;
      clearReconnectTimer();
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsRealtimeConnected(false);
      setTypingUsers([]);
    };
  }, [roomId, currentUser.id]);

  // Send message with optimistic update
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const trimmed = content.trim();
      if (!trimmed || isSending) return false;

      setIsSending(true);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const optimisticMessage: Message = {
        id: tempId,
        room_id: roomId,
        sender_id: currentUser.id,
        content: trimmed,
        created_at: new Date().toISOString(),
        sender: currentUser,
        status: 'sending',
      };

      // Clear the previous send error before starting a new transaction.
      setError(null);

      // 1. Instant local optimistic update
      setMessages((prev) => {
        const next = [...prev, optimisticMessage];
        return next;
      });

      // 2. Persist first. PostgreSQL Realtime is the source of truth for peer delivery.
      try {
        // Persist to Supabase Database
        const { data, error: insertError } = await supabase
          .from('messages')
          .insert({
            room_id: roomId,
            sender_id: currentUser.id,
            content: trimmed,
          })
          .select('*, sender:profiles(*)')
          .single();

        if (insertError || !data) {
          throw insertError || new Error('Supabase tidak mengembalikan pesan yang tersimpan.');
        }

        // Replace the optimistic row with the persisted record and remove any
        // PostgreSQL Realtime copy that may have arrived first.
        const persistedMessage: Message = {
          id: data.id,
          room_id: data.room_id,
          sender_id: data.sender_id,
          content: data.content,
          created_at: data.created_at,
          sender: data.sender || currentUser,
          status: 'delivered',
        };
        setMessages((prev) => {
          const withoutTransactionCopies = prev.filter(
            (m) => m.id !== tempId && m.id !== persistedMessage.id
          );
          return [...withoutTransactionCopies, persistedMessage].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });

        void fetch('/api/push/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, messageId: persistedMessage.id }),
          cache: 'no-store',
        }).catch((pushError) => {
          console.warn('[WebPush] Notification dispatch failed:', pushError);
        });

        return true;
      } catch (err: any) {
        console.error('Failed to send message to Supabase:', err);
        // Roll back the optimistic message: failed persistence must never look sent.
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError(err?.message || 'Pesan gagal disimpan ke server.');
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [roomId, currentUser, isSending]
  );

  // Broadcast typing indicator
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: currentUser.id,
            name: currentUser.full_name,
            isTyping,
          },
        });
      }
    },
    [currentUser]
  );

  return {
    messages,
    isLoading,
    isSending,
    error,
    sendMessage,
    isRealtimeConnected,
    typingUsers,
    setTyping,
  };
}
