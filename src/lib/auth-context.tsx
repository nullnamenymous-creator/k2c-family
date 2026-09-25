'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from './types';
import { MOCK_PROFILES } from './mock-data';
import { supabase } from './supabase/client';

interface AuthContextType {
  currentUser: Profile;
  setCurrentUser: (profile: Profile) => void;
  availableProfiles: Profile[];
  switchProfile: (profileId: string) => void;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isSupabaseAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [currentUser, setCurrentUser] = useState<Profile>(MOCK_PROFILES[2]); // Default Kakak (Kenzo)
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseAuth, setIsSupabaseAuth] = useState(false);

  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Check Supabase active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsSupabaseAuth(true);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setCurrentUser(profile);
          } else {
            const fallbackProfile: Profile = {
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Keluarga',
              role: session.user.user_metadata?.role || 'Anggota Keluarga',
              avatar_url: session.user.user_metadata?.avatar_url || null,
              is_online: true,
            };
            setCurrentUser(fallbackProfile);
          }
        } else {
          // 2. Check localStorage for selected profile
          const savedProfileId = localStorage.getItem('family_chat_active_user_id');
          if (savedProfileId) {
            const found = MOCK_PROFILES.find((p) => p.id === savedProfileId);
            if (found) {
              setCurrentUser(found);
            }
          }
        }

        // Try to fetch latest profiles from Supabase if table exists
        const { data: remoteProfiles } = await supabase.from('profiles').select('*');
        if (remoteProfiles && remoteProfiles.length > 0) {
          setAvailableProfiles(remoteProfiles);
        }
      } catch (err) {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setIsSupabaseAuth(true);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) setCurrentUser(profile);
        } else {
          setIsSupabaseAuth(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const switchProfile = (profileId: string) => {
    const target = availableProfiles.find((p) => p.id === profileId);
    if (target) {
      setCurrentUser(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem('family_chat_active_user_id', target.id);
      }
    }
  };

  const signOut = async () => {
    if (isSupabaseAuth) {
      await supabase.auth.signOut();
    }
    setCurrentUser(MOCK_PROFILES[0]); // Reset to Ayah
    if (typeof window !== 'undefined') {
      localStorage.removeItem('family_chat_active_user_id');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableProfiles,
        switchProfile,
        isLoading,
        signOut,
        isSupabaseAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
