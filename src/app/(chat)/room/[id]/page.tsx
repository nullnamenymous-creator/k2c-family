'use client';

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth-context';
import { MOCK_ROOMS, MOCK_PROFILES } from '@/lib/mock-data';
import { ChatBox } from '@/components/chat/chat-box';
import { Room } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;
  const router = useRouter();
  const { currentUser } = useAuth();
  const [room, setRoom] = useState<Room | null>(() => {
    return MOCK_ROOMS.find((r) => r.id === roomId) || null;
  });
  const [loading, setLoading] = useState(!room);

  useEffect(() => {
    async function loadRoomDetails() {
      // 1. Check local mock rooms
      const mockFound = MOCK_ROOMS.find((r) => r.id === roomId);
      if (mockFound) {
        setRoom(mockFound);
        setLoading(false);
        return;
      }

      // 2. Fetch from Supabase
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*, participants:room_participants(user:profiles(*))')
          .eq('id', roomId)
          .single();

        if (data && !error) {
          const formatted: Room = {
            id: data.id,
            name: data.name,
            is_group: data.is_group,
            created_at: data.created_at,
            participants: data.participants?.map((p: any) => p.user) || [],
          };
          setRoom(formatted);
        } else {
          // Fallback generic room
          setRoom({
            id: roomId,
            name: 'Obrolan Keluarga',
            is_group: false,
            created_at: new Date().toISOString(),
            participants: MOCK_PROFILES,
          });
        }
      } catch (err) {
        setRoom({
          id: roomId,
          name: 'Obrolan Keluarga',
          is_group: false,
          created_at: new Date().toISOString(),
          participants: MOCK_PROFILES,
        });
      } finally {
        setLoading(false);
      }
    }

    loadRoomDetails();
  }, [roomId]);

  if (loading || !room) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#F2F2F7] dark:bg-black">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
          <span className="text-xs text-zinc-500">Memuat obrolan...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ChatBox
        room={room}
        currentUser={currentUser}
        onBack={() => router.push('/')}
      />
    </div>
  );
}
