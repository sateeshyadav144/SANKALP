import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StudentProfile } from '../types';
import { localStore } from '../services/storageService';
import { INITIAL_MOCK_USER } from '../services/mockData';

interface AuthContextType {
  user: StudentProfile | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (data: { email: string; password?: string; full_name: string; roll_number?: string; department?: string; semester?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (profile: Partial<StudentProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile) {
              setUser(profile);
            } else {
              // Create default profile if not present
              const newProf: StudentProfile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || 'Student',
                department: 'Computer Science & Engineering',
                semester: '6th Semester',
                roll_number: session.user.user_metadata?.roll_number || '21CS000',
              };
              await supabase.from('profiles').insert([newProf]);
              setUser(newProf);
            }
          } else if (mounted) {
            // Check if demo user is kept logged in
            const localAuth = localStorage.getItem('sankalp_auth_logged_in');
            if (localAuth === 'true') {
              setUser(localStore.getProfile());
            } else {
              setUser(null);
            }
          }

          // Listen to auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user && mounted && supabase) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              if (profile) setUser(profile);
            } else if (mounted) {
              const localAuth = localStorage.getItem('sankalp_auth_logged_in');
              if (localAuth === 'true') {
                setUser(localStore.getProfile());
              } else {
                setUser(null);
              }
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } else {
          // Local offline / demo mode
          const localAuth = localStorage.getItem('sankalp_auth_logged_in');
          if (localAuth === 'true') {
            setUser(localStore.getProfile());
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password?: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        if (!password) throw new Error('Password is required');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Mock Auth Sign In
        await new Promise(r => setTimeout(r, 400));
        let profile = localStore.getProfile();
        if (profile.email !== email && email !== INITIAL_MOCK_USER.email) {
          // New student registered locally
          profile = localStore.saveProfile({
            email,
            full_name: email.split('@')[0].toUpperCase(),
          });
        }
        localStorage.setItem('sankalp_auth_logged_in', 'true');
        setUser(profile);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: {
    email: string;
    password?: string;
    full_name: string;
    roll_number?: string;
    department?: string;
    semester?: string;
  }) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        if (!data.password) throw new Error('Password is required');
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.full_name,
              roll_number: data.roll_number,
              department: data.department,
              semester: data.semester,
            },
          },
        });
        if (error) throw error;
      } else {
        // Local registration
        await new Promise(r => setTimeout(r, 400));
        const newProf: StudentProfile = {
          id: 'usr_' + Math.random().toString(36).substring(2, 9),
          full_name: data.full_name,
          roll_number: data.roll_number || '21CS001',
          department: data.department || 'Computer Science & Engineering',
          semester: data.semester || '6th Semester',
          email: data.email,
          bio: 'Student at SANKALP Smart Campus',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStore.saveProfile(newProf);
        localStorage.setItem('sankalp_auth_logged_in', 'true');
        setUser(newProf);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('sankalp_auth_logged_in');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } else {
      await new Promise(r => setTimeout(r, 500));
      // In demo mode, simulated success
    }
  };

  const updateProfile = async (profileData: Partial<StudentProfile>) => {
    if (!user) return;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      setUser(data);
    } else {
      const updated = localStore.saveProfile(profileData);
      setUser(updated);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isSupabaseConnected: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
