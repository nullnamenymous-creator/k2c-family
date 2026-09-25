'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { RoomList } from '@/components/chat/room-list';
import { MOCK_ROOMS } from '@/lib/mock-data';
import { Room } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser, availableProfiles, switchProfile, signOut } = useAuth();
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);

  // Extract active room id from pathname if on /room/[id]
  const isRoomActive = pathname.startsWith('/room/');
  const activeRoomId = isRoomActive ? pathname.split('/room/')[1] : undefined;

  // Fetch rooms from Supabase if table exists, otherwise keep mock rooms
  useEffect(() => {
    async function loadRooms() {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*, participants:room_participants(user:profiles(*))');

        if (!error && data && data.length > 0) {
          const formatted: Room[] = data.map((r: any) => ({
            id: r.id,
            name: r.name,
            is_group: r.is_group,
            created_at: r.created_at,
            participants: r.participants?.map((p: any) => p.user) || [],
          }));
          setRooms(formatted);
        }
      } catch {
        // keep fallback mock rooms
      }
    }

    loadRooms();
  }, [currentUser.id]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F2F2F7] dark:bg-black">
      {/* Sidebar: Room List */}
      <aside
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
          isRoomActive ? 'hidden md:flex' : 'flex'
        }`}
      >
        <RoomList
          rooms={rooms}
          activeRoomId={activeRoomId}
          currentUser={currentUser}
          availableProfiles={availableProfiles}
          onSelectProfile={switchProfile}
          onSignOut={signOut}
        />
      </aside>

      {/* Main Content: Chat Box / Room View */}
      <main
        className={`flex-1 h-full relative ${
          !isRoomActive ? 'hidden md:flex' : 'flex'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
