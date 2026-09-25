'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Message, Profile } from '@/lib/types';
import { MOCK_MESSAGES, MOCK_PROFILES } from '@/lib/mock-data';

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

  // Helper to resolve sender profile by ID
  const resolveSender = useCallback((senderId: string): Profile => {
    if (senderId === currentUser.id) return currentUser;
    const found = MOCK_PROFILES.find((p) => p.id === senderId);
    if (found) return found;
    return {
      id: senderId,
      full_name: 'Anggota Keluarga',
      role: 'Keluarga',
      avatar_url: null,
      is_online: true,
    };
  }, [currentUser]);

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

        if (sbError || !data) {
          // Fallback to mock data or localStorage
          const localStored = typeof window !== 'undefined' 
            ? localStorage.getItem(`family_chat_room_${roomId}`) 
            : null;
          
          if (localStored) {
            try {
              setMessages(JSON.parse(localStored));
            } catch {
              setMessages(MOCK_MESSAGES[roomId] || []);
            }
          } else {
            setMessages(MOCK_MESSAGES[roomId] || []);
          }
        } else {
          // Normalize sender if joined from profiles
          const formattedMessages: Message[] = data.map((msg: any) => ({
            id: msg.id,
            room_id: msg.room_id,
            sender_id: msg.sender_id,
            content: msg.content,
            created_at: msg.created_at,
            sender: msg.sender || resolveSender(msg.sender_id),
            status: 'delivered',
          }));
          setMessages(formattedMessages);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setMessages(MOCK_MESSAGES[roomId] || []);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchMessages();

    // Setup Supabase Realtime channel subscription
    const channelName = `room:${roomId}`;
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

          // Fetch sender info if needed
          let senderInfo: Profile = resolveSender(newRow.sender_id);
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newRow.sender_id)
              .single();
            if (profileData) {
              senderInfo = profileData;
            }
          } catch {
            // keep fallback sender
          }

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
            // Avoid duplicate optimistic inserts
            if (prev.some((m) => m.id === incomingMsg.id)) {
              return prev;
            }
            // Replace matching temporary optimistic message
            const existingOptimistic = prev.findIndex(
              (m) =>
                m.sender_id === incomingMsg.sender_id &&
                m.content === incomingMsg.content &&
                m.status === 'sending'
            );
            if (existingOptimistic !== -1) {
              const updated = [...prev];
              updated[existingOptimistic] = incomingMsg;
              return updated;
            }
            return [...prev, incomingMsg];
          });
        }
      )
      // Broadcast channel for instant peer-to-peer optimistic sync & typing indicator
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (!payload || payload.sender_id === currentUser.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
      })
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
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else {
          setIsRealtimeConnected(false);
        }
      });

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, currentUser.id, resolveSender]);

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

      // 1. Instant local optimistic update
      setMessages((prev) => {
        const next = [...prev, optimisticMessage];
        if (typeof window !== 'undefined') {
          localStorage.setItem(`family_chat_room_${roomId}`, JSON.stringify(next));
        }
        return next;
      });

      // 2. Broadcast immediately over realtime channel for ultra-low latency peer sync
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: {
            ...optimisticMessage,
            id: tempId,
            status: 'delivered',
          },
        });
      }

      try {
        // 3. Persist to Supabase Database
        const { data, error: insertError } = await supabase
          .from('messages')
          .insert({
            room_id: roomId,
            sender_id: currentUser.id,
            content: trimmed,
          })
          .select('*, sender:profiles(*)')
          .single();

        if (insertError) {
          console.warn('[Supabase Insert Notice]: Persisting locally due to schema/network:', insertError.message);
          // Mark optimistic message as sent locally
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...m, status: 'sent' } : m
            )
          );
        } else if (data) {
          // Replace optimistic message with actual Supabase record
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? {
                    id: data.id,
                    room_id: data.room_id,
                    sender_id: data.sender_id,
                    content: data.content,
                    created_at: data.created_at,
                    sender: data.sender || currentUser,
                    status: 'delivered',
                  }
                : m
            )
          );
        }
        return true;
      } catch (err: any) {
        console.error('Failed to send message to Supabase:', err);
        // Keep optimistic message marked as sent
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, status: 'sent' } : m
          )
        );
        return true;
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
