'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { MOCK_ROOMS } from '@/lib/mock-data';
import { ChatBox } from '@/components/chat/chat-box';

export default function ChatMainPage() {
  const { currentUser } = useAuth();
  // Default to main family group
  const defaultRoom = MOCK_ROOMS[0];

  return (
    <div className="w-full h-full">
      <ChatBox
        room={defaultRoom}
        currentUser={currentUser}
      />
    </div>
  );
}
