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
  signUp: (data: { email: string; password?: string; full_name: string; roll_number?: string; department?: string; semester?: string }) => Promise<{ user?: any; session?: any } | void>;
  signInAsGuest: () => void;
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
            let { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile) {
              setUser(profile);
              localStorage.setItem('sankalp_auth_logged_in', 'true');
              localStore.setActiveUserId(profile.id);
            } else {
              // Create default profile if not present
              const newProf: StudentProfile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
                department: session.user.user_metadata?.department || 'Computer Science & Engineering',
                semester: session.user.user_metadata?.semester || '6th Semester',
                roll_number: session.user.user_metadata?.roll_number || '21CS000',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              await supabase.from('profiles').upsert([newProf]);
              setUser(newProf);
              localStorage.setItem('sankalp_auth_logged_in', 'true');
              localStore.setActiveUserId(newProf.id);
            }
          } else if (mounted) {
            setUser(null);
            localStorage.removeItem('sankalp_auth_logged_in');
            localStore.setActiveUserId(null);
          }

          // Listen to auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user && mounted && supabase) {
              let { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
              if (!profile) {
                const newProf: StudentProfile = {
                  id: session.user.id,
                  email: session.user.email || '',
                  full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student',
                  department: session.user.user_metadata?.department || 'Computer Science & Engineering',
                  semester: session.user.user_metadata?.semester || '6th Semester',
                  roll_number: session.user.user_metadata?.roll_number || '21CS000',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                await supabase.from('profiles').upsert([newProf]);
                profile = newProf;
              }
              setUser(profile);
              localStorage.setItem('sankalp_auth_logged_in', 'true');
              localStore.setActiveUserId(profile.id);
            } else if (mounted) {
              setUser(null);
              localStorage.removeItem('sankalp_auth_logged_in');
              localStore.setActiveUserId(null);
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } else {
          // Local offline mode: check active session
          const localAuth = localStorage.getItem('sankalp_auth_logged_in');
          const activeUserId = localStore.getActiveUserId();
          if (localAuth === 'true' && activeUserId) {
            const users = localStore.getRegisteredUsers();
            const userRecord = users.find(u => u.id === activeUserId);
            if (userRecord) {
              setUser(userRecord.profile);
            } else {
              setUser(localStore.getProfile());
            }
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
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          const lowerMsg = (error.message || '').toLowerCase();
          if (lowerMsg.includes('email not confirmed')) {
            throw new Error('Email not confirmed. Please check your email inbox to verify, or disable "Confirm email" in your Supabase Dashboard under Authentication -> Providers -> Email.');
          }
          if (lowerMsg.includes('invalid login credentials')) {
            throw new Error('Invalid email or password. Please verify your credentials or register for an account.');
          }
          throw error;
        }

        if (authData?.session?.user) {
          let { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.session.user.id)
            .maybeSingle();

          if (!profile) {
            const newProf: StudentProfile = {
              id: authData.session.user.id,
              email: authData.session.user.email || email.trim(),
              full_name: authData.session.user.user_metadata?.full_name || email.trim().split('@')[0],
              department: authData.session.user.user_metadata?.department || 'Computer Science & Engineering',
              semester: authData.session.user.user_metadata?.semester || '6th Semester',
              roll_number: authData.session.user.user_metadata?.roll_number || '21CS001',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            await supabase.from('profiles').upsert([newProf]);
            profile = newProf;
          }
          setUser(profile);
          localStorage.setItem('sankalp_auth_logged_in', 'true');
          localStore.setActiveUserId(profile.id);
        }
      } else {
        // Local Auth Sign In
        await new Promise(r => setTimeout(r, 300));
        const cleanEmail = email.trim().toLowerCase();
        const userRecord = localStore.findUserByEmail(cleanEmail);
        if (!userRecord) {
          if (cleanEmail === INITIAL_MOCK_USER.email.toLowerCase()) {
            localStore.setActiveUserId(INITIAL_MOCK_USER.id);
            localStorage.setItem('sankalp_auth_logged_in', 'true');
            setUser(INITIAL_MOCK_USER);
            return;
          }
          throw new Error('No account found with this email. Please register first.');
        }
        if (userRecord.password && password && userRecord.password !== password) {
          throw new Error('Invalid email or password. Please double check your credentials.');
        }
        localStore.setActiveUserId(userRecord.id || userRecord.profile?.id || null);
        localStore.saveProfile(userRecord.profile);
        localStorage.setItem('sankalp_auth_logged_in', 'true');
        setUser(userRecord.profile);
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
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            data: {
              full_name: data.full_name.trim(),
              roll_number: data.roll_number?.trim() || '21CS001',
              department: data.department || 'Computer Science & Engineering',
              semester: data.semester || '6th Semester',
            },
          },
        });
        if (error) throw error;

        if (authData.session?.user) {
          const newProf: StudentProfile = {
            id: authData.session.user.id,
            email: data.email.trim(),
            full_name: data.full_name.trim(),
            roll_number: data.roll_number?.trim() || '21CS001',
            department: data.department || 'Computer Science & Engineering',
            semester: data.semester || '6th Semester',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await supabase.from('profiles').upsert([newProf]);
          setUser(newProf);
          localStorage.setItem('sankalp_auth_logged_in', 'true');
          localStore.setActiveUserId(newProf.id);
        }
        return authData;
      } else {
        // Local registration
        await new Promise(r => setTimeout(r, 300));
        const cleanEmail = data.email.trim().toLowerCase();
        const existing = localStore.findUserByEmail(cleanEmail);
        if (existing) {
          throw new Error('An account with this email address already exists. Please log in.');
        }
        const newProf: StudentProfile = {
          id: 'usr_' + Math.random().toString(36).substring(2, 10),
          full_name: data.full_name.trim(),
          roll_number: data.roll_number?.trim() || '21CS001',
          department: data.department || 'Computer Science & Engineering',
          semester: data.semester || '6th Semester',
          email: data.email.trim(),
          bio: 'Student at SANKALP Smart Campus',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStore.saveRegisteredUser({
          id: newProf.id,
          email: cleanEmail,
          password: data.password || '',
          profile: newProf,
        });
        localStore.setActiveUserId(newProf.id);
        localStore.saveProfile(newProf);
        localStorage.setItem('sankalp_auth_logged_in', 'true');
        setUser(newProf);
        return { user: newProf, session: { user: newProf } as any };
      }
    } finally {
      setLoading(false);
    }
  };

  const signInAsGuest = () => {
    const profile = localStore.getProfile();
    localStore.setActiveUserId(profile.id);
    localStorage.setItem('sankalp_auth_logged_in', 'true');
    setUser(profile);
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('sankalp_auth_logged_in');
      localStore.setActiveUserId(null);
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
      signInAsGuest,
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
