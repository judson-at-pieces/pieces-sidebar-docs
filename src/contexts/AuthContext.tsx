import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { auditLog } from '@/utils/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isSupabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    console.log('AuthProvider initializing, isSupabaseConfigured:', isSupabaseConfigured);
    
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Set up auth state listener FIRST - this is critical
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        try {
          console.log('Auth state change:', { event, userEmail: session?.user?.email });
          logger.debug('Auth state change', { event, userEmail: session?.user?.email });
          
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            auditLog.authAttempt(session.user.email || '', true, 'github');
            
            // Defer additional processing to avoid blocking the auth state change
            setTimeout(async () => {
              if (mounted) {
                await handleUserProfile(session.user);
                await handlePostSignIn(session.user);
                setLoading(false);
              }
            }, 100);
          } else {
            setUserRoles([]);
            setLoading(false);
          }
        } catch (error: any) {
          logger.error('Error handling auth state change', { error: error.message });
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    // Check if we're handling an OAuth callback
    const isCallbackWithTokens = window.location.pathname === '/auth/callback' && 
                                 window.location.hash.includes('access_token');
    
    if (isCallbackWithTokens) {
      console.log('OAuth callback detected with tokens, letting Supabase process...');
      // Don't call getSession immediately for OAuth callbacks
      // Let the onAuthStateChange handle the session establishment
    } else {
      // For normal page loads, get the initial session
      const initializeAuth = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            logger.error('Error getting initial session', { error: error.message });
          } else if (mounted) {
            console.log('Initial session:', { hasSession: !!session, userEmail: session?.user?.email });
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
              await handleUserProfile(session.user);
              await fetchUserRoles(session.user.id);
            }
          }
        } catch (error: any) {
          logger.error('Error initializing auth', { error: error.message });
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      initializeAuth();
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUserProfile = async (user: User) => {
    try {
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Creating profile for user:', user.email);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null
          });

        if (insertError) {
          logger.error('Error creating user profile', { error: insertError.message });
        } else {
          logger.info('User profile created successfully');
        }
      } else if (profileError) {
        logger.error('Error checking user profile', { error: profileError.message });
      } else {
        console.log('Profile already exists for user:', user.email);
      }
    } catch (error: any) {
      logger.error('Error handling user profile', { error: error.message });
    }
  };

  const handlePostSignIn = async (user: User) => {
    try {
      await fetchUserRoles(user.id);
      
      const validatedCode = sessionStorage.getItem('validated_access_code');
      
      if (validatedCode) {
        sessionStorage.removeItem('validated_access_code');
        
        const { data: existingRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        if (!existingRoles || existingRoles.length === 0) {
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: user.id, role: 'editor' });
          
          if (!error) {
            auditLog.roleChanged(user.id, 'editor', user.id);
            logger.info('Editor role assigned to user after access code validation');
            await fetchUserRoles(user.id);
          }
        }
      } else {
        await fetchUserRoles(user.id);
      }
    } catch (error: any) {
      logger.error('Error handling post sign-in', { error: error.message });
    }
  };

  const fetchUserRoles = async (userId: string) => {
    if (!isSupabaseConfigured || !userId) {
      return;
    }
    
    try {
      logger.debug('Fetching roles for user', { userId: userId.substring(0, 8) + '***' });
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching user roles', { error: error.message });
        return;
      }

      const roles = data?.map(r => r.role) || [];
      console.log('User roles fetched:', { roles });
      logger.debug('User roles fetched', { roles });
      setUserRoles(roles);
    } catch (error: any) {
      logger.error('Error fetching user roles', { error: error.message });
    }
  };

  const signInWithGitHub = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Authentication not available - please contact administrator');
    }
    
    try {
      console.log('Initiating GitHub sign in...');
      console.log('Current URL:', window.location.href);
      console.log('Origin:', window.location.origin);
      
      const redirectTo = `${window.location.origin}/auth/callback`;
      console.log('Redirect URL:', redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectTo
        }
      });
      
      if (error) {
        console.error('GitHub sign in error:', error);
        logger.error('GitHub sign in error', { error: error.message });
        auditLog.authAttempt('', false, 'github');
        throw error;
      }
      
      console.log('GitHub OAuth initiated successfully');
    } catch (error: any) {
      console.error('GitHub sign in error:', error);
      logger.error('GitHub sign in error', { error: error.message });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      sessionStorage.removeItem('validated_access_code');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Sign out error', { error: error.message });
        throw error;
      }
      logger.info('User signed out');
    } catch (error: any) {
      logger.error('Sign out error', { error: error.message });
      throw error;
    }
  };

  const hasRole = (role: string) => {
    return userRoles.includes(role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signInWithGitHub,
      signOut,
      hasRole,
      isSupabaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
