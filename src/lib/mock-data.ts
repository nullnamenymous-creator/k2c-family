import { Profile, Room, Message } from './types';

export const MOCK_PROFILES: Profile[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    full_name: 'Budi Santoso',
    role: 'Ayah',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&h=250&q=80',
    is_online: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Siti Rahma',
    role: 'Ibu',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&h=250&q=80',
    is_online: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    full_name: 'Kenzo Pratama',
    role: 'Kakak',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80',
    is_online: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    full_name: 'Alya Putri',
    role: 'Adik',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&h=250&q=80',
    is_online: false,
  },
];

export const MOCK_ROOMS: Room[] = [
  {
    id: 'room-group-keluarga',
    name: 'Keluarga Cemara',
    is_group: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    participants: MOCK_PROFILES,
    unread_count: 0,
    last_message: {
      id: 'msg-last-1',
      room_id: 'room-group-keluarga',
      sender_id: '22222222-2222-2222-2222-222222222222',
      content: 'Jangan lupa nanti malam kita makan malam bareng ya semua ❤️',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
  },
  {
    id: 'room-dm-ibu',
    name: null,
    is_group: false,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    participants: [MOCK_PROFILES[2], MOCK_PROFILES[1]], // Kakak & Ibu
    unread_count: 1,
    last_message: {
      id: 'msg-last-2',
      room_id: 'room-dm-ibu',
      sender_id: '22222222-2222-2222-2222-222222222222',
      content: 'Kak, tadi paket pesanan kamu sudah sampai di rumah ya.',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
  },
  {
    id: 'room-dm-ayah',
    name: null,
    is_group: false,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    participants: [MOCK_PROFILES[2], MOCK_PROFILES[0]], // Kakak & Ayah
    unread_count: 0,
    last_message: {
      id: 'msg-last-3',
      room_id: 'room-dm-ayah',
      sender_id: '11111111-1111-1111-1111-111111111111',
      content: 'Mobil sudah selesai diservis, nanti Ayah jemput jam 5.',
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
  },
  {
    id: 'room-dm-adik',
    name: null,
    is_group: false,
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    participants: [MOCK_PROFILES[2], MOCK_PROFILES[3]], // Kakak & Adik
    unread_count: 0,
    last_message: {
      id: 'msg-last-4',
      room_id: 'room-dm-adik',
      sender_id: '44444444-4444-4444-4444-444444444444',
      content: 'Kakak, ajarin tugas matematika besok ya please 🙏',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  'room-group-keluarga': [
    {
      id: 'm1',
      room_id: 'room-group-keluarga',
      sender_id: '11111111-1111-1111-1111-111111111111',
      content: 'Selamat pagi keluarga! Semoga hari ini berkah dan lancar semua urusan.',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      sender: MOCK_PROFILES[0],
    },
    {
      id: 'm2',
      room_id: 'room-group-keluarga',
      sender_id: '22222222-2222-2222-2222-222222222222',
      content: 'Aamiin ya rabbal alamin. Ayah hati-hati di jalan ya.',
      created_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
      sender: MOCK_PROFILES[1],
    },
    {
      id: 'm3',
      room_id: 'room-group-keluarga',
      sender_id: '44444444-4444-4444-4444-444444444444',
      content: 'Pagi Ayah Ibu Kakak! Hari ini Alya ada praktikum sains 🔬',
      created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      sender: MOCK_PROFILES[3],
    },
    {
      id: 'm4',
      room_id: 'room-group-keluarga',
      sender_id: '33333333-3333-3333-3333-333333333333',
      content: 'Semangat Alya! Nanti sore aku beli martabak kesukaan kita ya.',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      sender: MOCK_PROFILES[2],
    },
    {
      id: 'm5',
      room_id: 'room-group-keluarga',
      sender_id: '22222222-2222-2222-2222-222222222222',
      content: 'Jangan lupa nanti malam kita makan malam bareng ya semua ❤️',
      created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      sender: MOCK_PROFILES[1],
    },
  ],
  'room-dm-ibu': [
    {
      id: 'm-ibu-1',
      room_id: 'room-dm-ibu',
      sender_id: '33333333-3333-3333-3333-333333333333',
      content: 'Bu, tadi kurir ada telepon gak buat antar paket?',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      sender: MOCK_PROFILES[2],
    },
    {
      id: 'm-ibu-2',
      room_id: 'room-dm-ibu',
      sender_id: '22222222-2222-2222-2222-222222222222',
      content: 'Kak, tadi paket pesanan kamu sudah sampai di rumah ya.',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      sender: MOCK_PROFILES[1],
    },
  ],
  'room-dm-ayah': [
    {
      id: 'm-ayah-1',
      room_id: 'room-dm-ayah',
      sender_id: '33333333-3333-3333-3333-333333333333',
      content: 'Yah, mobil gimana tadi? Sudah aman remnya?',
      created_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
      sender: MOCK_PROFILES[2],
    },
    {
      id: 'm-ayah-2',
      room_id: 'room-dm-ayah',
      sender_id: '11111111-1111-1111-1111-111111111111',
      content: 'Mobil sudah selesai diservis, nanti Ayah jemput jam 5.',
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      sender: MOCK_PROFILES[0],
    },
  ],
  'room-dm-adik': [
    {
      id: 'm-adik-1',
      room_id: 'room-dm-adik',
      sender_id: '44444444-4444-4444-4444-444444444444',
      content: 'Kakak, ajarin tugas matematika besok ya please 🙏',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      sender: MOCK_PROFILES[3],
    },
  ],
};
