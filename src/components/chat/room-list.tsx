'use client';

import React, { useState } from 'react';
import { Room, Profile, ActiveFilter } from '@/lib/types';
import { 
  Users, 
  Search, 
  Plus, 
  MessageSquare, 
  UserCheck, 
  Sparkles,
  ChevronDown,
  LogOut
} from 'lucide-react';
import Link from 'next/link';

interface RoomListProps {
  rooms: Room[];
  activeRoomId?: string;
  currentUser: Profile;
  availableProfiles: Profile[];
  onSelectProfile: (profileId: string) => void;
  onSignOut: () => void;
}

export function RoomList({
  rooms,
  activeRoomId,
  currentUser,
  availableProfiles,
  onSelectProfile,
  onSignOut,
}: RoomListProps) {
  const [filter, setFilter] = useState<ActiveFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  // Filter rooms based on segmented control and search
  const filteredRooms = rooms.filter((room) => {
    // 1. Tab filter
    if (filter === 'groups' && !room.is_group) return false;
    if (filter === 'direct' && room.is_group) return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const roomName = room.name?.toLowerCase() || '';
      const participantNames = room.participants
        ?.map((p) => p.full_name.toLowerCase())
        .join(' ') || '';
      const lastMsg = room.last_message?.content?.toLowerCase() || '';
      return roomName.includes(q) || participantNames.includes(q) || lastMsg.includes(q);
    }
    return true;
  });

  // Helper to get room display title & avatar
  const getRoomMeta = (room: Room) => {
    if (room.is_group) {
      return {
        title: room.name || 'Grup Keluarga',
        subtitle: `${room.participants?.length || 4} Anggota`,
        isGroup: true,
        avatar: null,
      };
    }
    const other = room.participants?.find((p) => p.id !== currentUser.id);
    return {
      title: other?.full_name || 'Obrolan Pribadi',
      subtitle: other?.role || 'Keluarga',
      isGroup: false,
      avatar: other?.avatar_url || null,
      isOnline: other?.is_online,
    };
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Ayah': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'Ibu': return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'Kakak': return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Adik': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white/60 dark:bg-zinc-950/70 backdrop-blur-2xl border-r border-white/40 dark:border-white/10 select-none">
      {/* Top Header: App Branding & Profile Switcher */}
      <div className="p-4 pb-2 border-b border-white/20 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white shadow-sm ring-1 ring-white/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
                Family Chat
              </h1>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                Polished iOS Glass
              </span>
            </div>
          </div>

          {/* Active Profile Switcher Capsule */}
          <div className="relative">
            <button
              onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-white/40 dark:border-white/15 hover:bg-white/90 dark:hover:bg-zinc-800 transition-all shadow-xs"
            >
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.full_name.charAt(0)}
                </div>
              )}
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {currentUser.role}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {/* Profile Switcher Popover Dropdown */}
            {showProfileSwitcher && (
              <div className="absolute right-0 top-9 w-60 p-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/40 dark:border-white/15 shadow-ios-float z-50 animate-slide-up">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Ganti Akun Keluarga
                </div>
                <div className="space-y-1">
                  {availableProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => {
                        onSelectProfile(profile.id);
                        setShowProfileSwitcher(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-all ${
                        profile.id === currentUser.id
                          ? 'bg-[#007AFF] text-white font-semibold shadow-xs'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
                      }`}
                    >
                      <img
                        src={profile.avatar_url || ''}
                        alt={profile.full_name}
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-white/30"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{profile.full_name}</div>
                        <div className={`text-[10px] ${profile.id === currentUser.id ? 'text-white/80' : 'text-zinc-400'}`}>
                          {profile.role}
                        </div>
                      </div>
                      {profile.id === currentUser.id && (
                        <UserCheck className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 my-1 pt-1">
                  <button
                    onClick={() => {
                      onSignOut();
                      setShowProfileSwitcher(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar (iOS Glass Pill) */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari obrolan atau anggota..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50 border border-white/20 dark:border-white/5 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
          />
        </div>
      </div>

      {/* Horizontal Active Family Row */}
      <div className="px-3 py-2 border-b border-white/20 dark:border-white/5 overflow-x-auto no-scrollbar">
        <div className="text-[11px] font-semibold text-zinc-400 px-1 mb-1.5">
          Anggota Keluarga
        </div>
        <div className="flex items-center gap-3">
          {availableProfiles.map((p) => {
            const isMe = p.id === currentUser.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProfile(p.id)}
                className="flex flex-col items-center gap-1 cursor-pointer group flex-shrink-0"
              >
                <div className="relative">
                  <img
                    src={p.avatar_url || ''}
                    alt={p.full_name}
                    className={`w-11 h-11 rounded-full object-cover transition-transform group-hover:scale-105 ${
                      isMe ? 'ring-2 ring-[#007AFF] ring-offset-2 dark:ring-offset-zinc-900' : 'ring-1 ring-white/40'
                    }`}
                  />
                  {p.is_online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-zinc-900 shadow-sm" />
                  )}
                </div>
                <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 max-w-[50px] truncate text-center">
                  {isMe ? 'Saya' : p.role}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* iOS Segmented Control */}
      <div className="p-3 pb-1">
        <div className="flex rounded-xl bg-zinc-200/60 dark:bg-zinc-900/60 p-1 border border-white/10">
          {(['all', 'groups', 'direct'] as ActiveFilter[]).map((tabKey) => {
            const label = tabKey === 'all' ? 'Semua' : tabKey === 'groups' ? 'Grup' : 'Pribadi';
            const isActive = filter === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => setFilter(tabKey)}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rooms Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {filteredRooms.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400">
            Tidak ada obrolan ditemukan.
          </div>
        ) : (
          filteredRooms.map((room) => {
            const meta = getRoomMeta(room);
            const isActive = room.id === activeRoomId;
            const lastMsg = room.last_message;
            const formattedTime = lastMsg
              ? new Date(lastMsg.created_at).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })
              : '';

            return (
              <Link
                key={room.id}
                href={`/room/${room.id}`}
                className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-150 ${
                  isActive
                    ? 'bg-[#007AFF]/15 dark:bg-[#007AFF]/25 border border-[#007AFF]/30'
                    : 'hover:bg-white/60 dark:hover:bg-zinc-900/60 border border-transparent'
                }`}
              >
                {/* Room Avatar */}
                <div className="relative flex-shrink-0">
                  {meta.isGroup ? (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white shadow-sm ring-1 ring-white/30">
                      <Users className="w-6 h-6" />
                    </div>
                  ) : meta.avatar ? (
                    <img
                      src={meta.avatar}
                      alt={meta.title}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-white/30 dark:ring-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {meta.title.charAt(0)}
                    </div>
                  )}

                  {!meta.isGroup && meta.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-zinc-900 shadow-sm" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
                      {meta.title}
                    </h3>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex-shrink-0 ml-1">
                      {formattedTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">
                      {lastMsg ? lastMsg.content : 'Mulai percakapan baru'}
                    </p>

                    {room.unread_count && room.unread_count > 0 ? (
                      <span className="w-5 h-5 rounded-full bg-[#007AFF] text-white text-[10px] font-bold flex items-center justify-center ml-2 shadow-xs">
                        {room.unread_count}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
