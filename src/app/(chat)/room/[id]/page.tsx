'use client';

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth-context';
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
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoomDetails() {
      setLoading(true);
      setError(null);
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
          setRoom(null);
          setError('Ruang obrolan tidak ditemukan atau tidak dapat diakses.');
        }
      } catch (err) {
        console.error('[Room] Failed to load room:', err);
        setRoom(null);
        setError('Gagal memuat ruang obrolan.');
      } finally {
        setLoading(false);
      }
    }

    loadRoomDetails();
  }, [roomId]);

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#F2F2F7] dark:bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#F2F2F7] dark:bg-black text-center px-6">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{error || 'Ruang obrolan tidak tersedia.'}</p>
        <button onClick={() => router.push('/')} className="text-sm font-medium text-[#007AFF]">Kembali ke daftar ruang</button>
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
