import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemoSession: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  startDemoSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoSession, setIsDemoSession] = useState<boolean>(false);

  useEffect(() => {
    // Check if user previously launched an explicit Demo session
    const storedDemoFlag = localStorage.getItem('finsight_is_demo');
    if (storedDemoFlag === 'true') {
      const mockUser = { id: 'demo_user', email: 'demo@finsight.app' } as User;
      const mockProfile: Profile = {
        id: 'demo_user',
        email: 'demo@finsight.app',
        full_name: 'Demo Recruiter User',
        avatar_url: null,
        currency: 'INR',
      };
      setUser(mockUser);
      setProfile(mockProfile);
      setIsDemoSession(true);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Fetch active real session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const startDemoSession = () => {
    const mockUser = { id: 'demo_user', email: 'demo@finsight.app' } as User;
    const mockProfile: Profile = {
      id: 'demo_user',
      email: 'demo@finsight.app',
      full_name: 'Demo Recruiter User',
      avatar_url: null,
      currency: 'INR',
    };
    setUser(mockUser);
    setProfile(mockProfile);
    setIsDemoSession(true);
    localStorage.setItem('finsight_is_demo', 'true');
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    localStorage.removeItem('finsight_is_demo');
    setIsDemoSession(false);

    if (!isSupabaseConfigured()) {
      const mockUser = { id: `usr_${Date.now()}`, email } as User;
      const mockProfile: Profile = { id: mockUser.id, email, full_name: fullName, avatar_url: null, currency: 'INR' };
      setUser(mockUser);
      setProfile(mockProfile);
      return { error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { error };

    if (data.user) {
      setUser(data.user);
      setProfile({
        id: data.user.id,
        email: data.user.email || email,
        full_name: fullName,
        avatar_url: null,
        currency: 'INR',
      });
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    localStorage.removeItem('finsight_is_demo');
    setIsDemoSession(false);

    if (!isSupabaseConfigured()) {
      const mockUser = { id: `usr_${Date.now()}`, email } as User;
      const mockProfile: Profile = { id: mockUser.id, email, full_name: email.split('@')[0], avatar_url: null, currency: 'INR' };
      setUser(mockUser);
      setProfile(mockProfile);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem('finsight_is_demo');
    setIsDemoSession(false);
    setUser(null);
    setProfile(null);

    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { error: null };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isDemoSession,
        signUp,
        signIn,
        signOut,
        resetPassword,
        startDemoSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
