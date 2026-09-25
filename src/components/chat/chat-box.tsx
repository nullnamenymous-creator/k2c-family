'use client';

import React, { useRef, useEffect } from 'react';
import { Room, Profile } from '@/lib/types';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { ChatBubble } from './chat-bubble';
import { ChatInput } from './chat-input';
import { 
  ArrowLeft, 
  Users, 
  Phone, 
  Info, 
  Wifi, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface ChatBoxProps {
  room: Room;
  currentUser: Profile;
  onBack?: () => void;
  isMobile?: boolean;
}

export function ChatBox({ room, currentUser, onBack, isMobile = false }: ChatBoxProps) {
  const {
    messages,
    isLoading,
    sendMessage,
    isRealtimeConnected,
    typingUsers,
    setTyping,
  } = useRealtimeChat(room.id, currentUser);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, typingUsers]);

  // Determine display title and avatar for room
  let displayTitle = room.name || 'Obrolan Keluarga';
  let displaySubtitle = room.is_group ? 'Grup Keluarga' : 'Pesan Langsung';
  let otherParticipant: Profile | undefined;

  if (!room.is_group && room.participants) {
    otherParticipant = room.participants.find((p) => p.id !== currentUser.id);
    if (otherParticipant) {
      displayTitle = otherParticipant.full_name;
      displaySubtitle = `${otherParticipant.role} • ${
        otherParticipant.is_online ? 'Sedang Online' : 'Terakhir dilihat baru saja'
      }`;
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-[#F2F2F7]/50 to-white/30 dark:from-black/60 dark:to-zinc-950/80 backdrop-blur-md relative overflow-hidden">
      {/* Top Header Glass Navigation Bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 py-3 bg-white/70 dark:bg-zinc-900/75 backdrop-blur-2xl border-b border-white/30 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button for mobile */}
          {onBack ? (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-zinc-600 dark:text-zinc-300 hover:text-blue-500 rounded-full hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors"
              title="Kembali ke Daftar Ruang"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link
              href="/"
              className="sm:hidden p-1.5 -ml-1 text-zinc-600 dark:text-zinc-300 hover:text-blue-500 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}

          {/* Room Avatar */}
          <div className="relative flex-shrink-0">
            {room.is_group ? (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white shadow-sm ring-1 ring-white/30">
                <Users className="w-5 h-5" />
              </div>
            ) : otherParticipant?.avatar_url ? (
              <img
                src={otherParticipant.avatar_url}
                alt={displayTitle}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/40 dark:ring-white/10 shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold ring-1 ring-white/30">
                {displayTitle.charAt(0)}
              </div>
            )}

            {/* Glowing Status Dot */}
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-zinc-900 ${
                isRealtimeConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-400'
              }`}
            />
          </div>

          {/* Header Titles */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                {displayTitle}
              </h2>
              {room.is_group && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Grup Keluarga
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="truncate">{displaySubtitle}</span>
              {isRealtimeConnected && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  • <Wifi className="w-3 h-3" /> Realtime
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Icons (iOS Clean Style) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-blue-500 rounded-full hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors"
            title="Panggilan Keluarga"
            onClick={() => alert(`Memulai panggilan santai ke ${displayTitle}...`)}
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700 dark:text-zinc-300" />
          </button>
          <button
            type="button"
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-blue-500 rounded-full hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors"
            title="Info Ruang"
            onClick={() => alert(`Ruang: ${displayTitle}\nTipe: ${room.is_group ? 'Grup Keluarga' : '1-on-1'}\nSupabase Realtime: Aktif`)}
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>
      </header>

      {/* Main Messages Stream */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 sm:px-6 py-4 space-y-1 relative"
      >
        {/* Date Divider (iOS Clean Glass Tag) */}
        <div className="flex justify-center my-3">
          <div className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-white/60 dark:bg-zinc-800/60 backdrop-blur-xl border border-white/30 dark:border-white/10 text-zinc-500 dark:text-zinc-400 shadow-xs">
            Hari ini
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-3 py-4">
            <div className="w-48 h-10 rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/50 animate-pulse" />
            <div className="w-56 h-10 rounded-2xl bg-blue-200/40 dark:bg-blue-900/40 ml-auto animate-pulse" />
            <div className="w-40 h-10 rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/50 animate-pulse" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#007AFF] flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Belum ada percakapan
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
              Mulai obrolan hangat bersama keluarga dengan mengirim pesan pertama di bawah!
            </p>
          </div>
        )}

        {/* Messages List */}
        {messages.map((message) => {
          const isMe = message.sender_id === currentUser.id;
          return (
            <ChatBubble
              key={message.id}
              message={message}
              isMe={isMe}
              showSenderName={room.is_group}
              showAvatar={!isMe}
            />
          );
        })}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 animate-fade-in">
            <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm bg-white/70 dark:bg-zinc-800/70 backdrop-blur-xl border border-white/20 dark:border-white/10 flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[11px] text-zinc-500 italic">
              {typingUsers.join(', ')} sedang mengetik...
            </span>
          </div>
        )}
      </main>

      {/* Floating Translucent Input Dock */}
      <footer className="sticky bottom-0 z-20 w-full">
        <ChatInput
          onSendMessage={sendMessage}
          onTyping={setTyping}
        />
      </footer>
    </div>
  );
}
