-- ==============================================================================
-- FAMILY CHAT PWA - SUPABASE POSTGRESQL SCHEMA & REALTIME CONFIGURATION
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES
-- 2.1 Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'Anggota Keluarga', -- 'Ayah', 'Ibu', 'Kakak', 'Adik', dll
  avatar_url TEXT,
  is_online BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Rooms Table (Family Group / Direct 1-on-1)
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT, -- NULL untuk 1-on-1 DM, e.g. "Keluarga Cemara" untuk Group
  is_group BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Room Participants Table
CREATE TABLE IF NOT EXISTS public.room_participants (
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, user_id)
);

-- 2.4 Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages(room_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON public.room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON public.room_participants(room_id);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3.1 Profiles Policies
CREATE POLICY "Authenticated users can view family profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3.2 Rooms Policies
CREATE POLICY "Users can view rooms they belong to"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants
      WHERE room_participants.room_id = rooms.id
        AND room_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3.3 Room Participants Policies
CREATE POLICY "Users can view participants of their rooms"
  ON public.room_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = room_participants.room_id
        AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert room participants"
  ON public.room_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3.4 Messages Policies
CREATE POLICY "Users can view messages from their rooms"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants
      WHERE room_participants.room_id = messages.room_id
        AND room_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages into their rooms"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.room_participants
      WHERE room_participants.room_id = messages.room_id
        AND room_participants.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 4. REALTIME PUBLICATION SETUP
-- ==============================================================================
-- Set REPLICA IDENTITY FULL to ensure DELETE and UPDATE events contain old values
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.room_participants REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'room_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
  END IF;
END $$;

-- ==============================================================================
-- 5. TRIGGER FOR NEW SIGNUPS -> AUTO CREATE PROFILE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, avatar_url, is_online, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Anggota Keluarga'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80'),
    true,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET is_online = true,
      updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. DUMMY SEED SCRIPT (FOR TESTING / LOCAL SETUP)
-- Note: Replace dummy UUIDs with real auth.users if inserting directly into Supabase Dashboard
-- ==============================================================================

-- If running in local Supabase or testing environment:
/*
-- Dummy profile UUIDs
-- User 1: Ayah (a1111111-1111-1111-1111-111111111111)
-- User 2: Ibu  (b2222222-2222-2222-2222-222222222222)
-- User 3: Kakak(c3333333-3333-3333-3333-333333333333)
-- User 4: Adik (d4444444-4444-4444-4444-444444444444)

-- Insert mock rooms
INSERT INTO public.rooms (id, name, is_group) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Keluarga Cemara', true),
  ('00000000-0000-0000-0000-000000000002', NULL, false),
  ('00000000-0000-0000-0000-000000000003', NULL, false);
*/
