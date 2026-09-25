export interface Profile {
  id: string;
  full_name: string;
  role: 'Ayah' | 'Ibu' | 'Kakak' | 'Adik' | string;
  avatar_url: string | null;
  is_online: boolean;
  updated_at?: string;
}

export interface Room {
  id: string;
  name: string | null; // NULL for direct 1-on-1 DM, e.g. "Keluarga Cemara" for group
  is_group: boolean;
  created_at: string;
  participants?: Profile[];
  last_message?: Message | null;
  unread_count?: number;
}

export interface RoomParticipant {
  room_id: string;
  user_id: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export type ActiveFilter = 'all' | 'groups' | 'direct';
