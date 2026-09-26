'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { ChatBox } from '@/components/chat/chat-box';
import { Room } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';

export default function ChatMainPage() {
  const { currentUser } = useAuth();
  const [room, setRoom] = React.useState<Room | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!currentUser) return;

    async function loadDefaultRoom() {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*, participants:room_participants(user:profiles(*))')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[Chat] Failed to load default room:', error);
        setRoom(null);
      } else if (data) {
        setRoom({
          id: data.id,
          name: data.name,
          is_group: data.is_group,
          created_at: data.created_at,
          participants: data.participants?.map((p: any) => p.user).filter(Boolean) || [],
        });
      } else {
        setRoom(null);
      }
      setLoading(false);
    }

    loadDefaultRoom();
  }, [currentUser?.id]);

  if (!currentUser) return null;
  if (loading) return <div className="flex h-full w-full items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" /></div>;
  if (!room) return <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">Belum ada ruang obrolan.</div>;

  return (
    <div className="w-full h-full">
      <ChatBox room={room} currentUser={currentUser} />
    </div>
  );
}
