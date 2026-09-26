'use client';

import React, { useState } from 'react';
import { Room, Profile, ActiveFilter } from '@/lib/types';
import { Users, Search, Sparkles, LogOut } from 'lucide-react';
import Link from 'next/link';

interface RoomListProps {
  rooms: Room[];
  activeRoomId?: string;
  currentUser: Profile;
  availableProfiles: Profile[];
  onSignOut: () => void;
  onOpenDirect: (profile: Profile) => void;
}

function Avatar({ profile, me = false }: { profile: Profile; me?: boolean }) {
  const initials = profile.full_name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join('') || '?';
  return (
    <div className="relative">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-tr from-[#007AFF] to-[#5856D6] ${me ? 'ring-2 ring-[#007AFF] ring-offset-2' : ''}`}>
        {initials}
      </div>
      {profile.is_online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />}
    </div>
  );
}

export function RoomList({ rooms, activeRoomId, currentUser, availableProfiles, onSignOut, onOpenDirect }: RoomListProps) {
  const [filter, setFilter] = useState<ActiveFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = rooms.filter((room) => {
    if (filter === 'groups' && !room.is_group) return false;
    if (filter === 'direct' && room.is_group) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (room.name || '').toLowerCase().includes(q) ||
      (room.participants || []).some((p) => p.full_name.toLowerCase().includes(q));
  });

  return (
    <div className="flex flex-col h-full w-full bg-white/60 dark:bg-zinc-950/70 backdrop-blur-2xl border-r border-white/40 dark:border-white/10">
      <div className="p-4 pb-2 space-y-3 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white"><Sparkles className="w-4 h-4" /></div>
            <div><h1 className="text-base font-bold">Family Chat</h1><span className="text-[10px] text-zinc-500">Polished iOS Glass</span></div>
          </div>
          <button onClick={onSignOut} className="p-2 text-zinc-500 hover:text-rose-500" aria-label="Keluar"><LogOut className="w-4 h-4" /></button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari obrolan atau anggota..." className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-200/50 border border-white/20 text-sm outline-none" />
        </div>
      </div>

      <div className="px-3 py-2 border-b border-white/20 overflow-x-auto">
        <div className="text-[11px] font-semibold text-zinc-400 mb-1.5">Anggota Keluarga</div>
        <div className="flex gap-3">
          {availableProfiles.map((p) => {
            const me = p.id === currentUser.id;
            return (
              <button key={p.id} type="button" disabled={me} onClick={() => onOpenDirect(p)} className="flex flex-col items-center gap-1 flex-shrink-0 disabled:cursor-default hover:opacity-80" title={me ? 'Saya' : 'Chat pribadi'}>
                <Avatar profile={p} me={me} />
                <span className="text-[10px] max-w-[65px] truncate">{me ? 'Saya' : p.full_name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 pb-1">
        <div className="flex rounded-xl bg-zinc-200/60 p-1">
          {(['all', 'groups', 'direct'] as ActiveFilter[]).map((key) => (
            <button key={key} onClick={() => setFilter(key)} className={`flex-1 py-1 text-xs font-semibold rounded-lg ${filter === key ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}>
              {key === 'all' ? 'Semua' : key === 'groups' ? 'Grup' : 'Pribadi'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400">{filter === 'direct' ? 'Belum ada chat pribadi.' : 'Tidak ada obrolan ditemukan.'}</div>
        ) : filtered.map((room) => {
          const other = room.participants?.find((p) => p.id !== currentUser.id);
          const title = room.is_group ? (room.name || 'Grup Keluarga') : (other?.full_name || 'Obrolan Pribadi');
          return (
            <Link key={room.id} href={`/room/${room.id}`} className={`flex items-center gap-3 p-2.5 rounded-2xl border ${room.id === activeRoomId ? 'bg-[#007AFF]/15 border-[#007AFF]/30' : 'border-transparent hover:bg-white/60'}`}>
              {room.is_group ? (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white"><Users className="w-6 h-6" /></div>
              ) : (
                <Avatar profile={other || currentUser} />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold truncate">{title}</h3>
                <p className="text-xs text-zinc-500 truncate">{room.last_message?.content || 'Mulai percakapan baru'}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
