'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { RoomList } from '@/components/chat/room-list';
import { PushNotifications } from '@/components/push-notifications';
import { Room, Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { usePathname, useRouter } from 'next/navigation';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, availableProfiles, signOut, isLoading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);

  const isRoomActive = pathname.startsWith('/room/');
  const activeRoomId = isRoomActive ? pathname.split('/room/')[1] : undefined;

  const loadRooms = useCallback(async () => {
    if (!currentUser) {
      setRooms([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, participants:room_participants(user:profiles(*))');

      if (error) throw error;

      setRooms((data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        is_group: r.is_group,
        created_at: r.created_at,
        participants: r.participants?.map((p: any) => p.user).filter(Boolean) || [],
      })));
    } catch (error) {
      console.error('[Chat] Failed to load rooms:', error);
      setRooms([]);
    }
  }, [currentUser]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!isLoading && !currentUser) router.replace('/login');
  }, [isLoading, currentUser, router]);

  const openDirectChat = async (profile: Profile) => {
    if (!currentUser || profile.id === currentUser.id) return;

    try {
      const response = await fetch('/api/chat/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
        cache: 'no-store',
      });
      const result = await response.json();

      if (!response.ok || !result.roomId) {
        throw new Error(result.error || 'Gagal membuka chat pribadi.');
      }

      // The DM may have been created after the initial room-list query.
      // Refresh the real Supabase room list before navigating so "Pribadi"
      // immediately reflects the newly created conversation.
      await loadRooms();
      router.push('/room/' + result.roomId);
    } catch (error) {
      console.error('[DM] Failed to open direct chat:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F2F2F7] dark:bg-black">
        <div className="w-8 h-8 rounded-full border-2 border-[#007AFF] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F2F2F7] dark:bg-black">
      <PushNotifications />
      <aside className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${isRoomActive ? 'hidden md:flex' : 'flex'}`}>
        <RoomList
          rooms={rooms}
          activeRoomId={activeRoomId}
          currentUser={currentUser}
          availableProfiles={availableProfiles}
          onSignOut={signOut}
          onOpenDirect={openDirectChat}
        />
      </aside>
      <main className={`flex-1 h-full relative ${!isRoomActive ? 'hidden md:flex' : 'flex'}`}>
        {children}
      </main>
    </div>
  );
}
