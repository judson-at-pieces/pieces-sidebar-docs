
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { auditLog } from '@/utils/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('Auth state change', { event, userEmail: session?.user?.email });
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Audit log for authentication
          auditLog.authAttempt(session.user.email || '', true, 'github');
          
          // Check for validated access code and handle role assignment
          setTimeout(async () => {
            await handlePostSignIn(session.user);
          }, 500);
        } else {
          setUserRoles([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handlePostSignIn = async (user: User) => {
    try {
      // First fetch current roles
      await fetchUserRoles(user.id);
      
      // Check if there's a validated access code in session storage
      const validatedCode = sessionStorage.getItem('validated_access_code');
      
      if (validatedCode) {
        // Clear the stored code
        sessionStorage.removeItem('validated_access_code');
        
        // Check if user has any roles
        const { data: existingRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        if (!existingRoles || existingRoles.length === 0) {
          // User has no roles and used a valid access code, assign editor role
          const { error } = await supabase
            .from('user_roles')
            .insert({ user_id: user.id, role: 'editor' });
          
          if (!error) {
            auditLog.roleChanged(user.id, 'editor', user.id);
            logger.info('Editor role assigned to user after access code validation');
            
            // Refresh roles
            await fetchUserRoles(user.id);
          }
        }
      } else {
        // No access code, just fetch roles normally
        await fetchUserRoles(user.id);
      }
    } catch (error: any) {
      logger.error('Error handling post sign-in', { error: error.message });
    }
  };

  const fetchUserRoles = async (userId: string) => {
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
      logger.debug('User roles fetched', { roles });
      setUserRoles(roles);
    } catch (error: any) {
      logger.error('Error fetching user roles', { error: error.message });
    }
  };

  const signInWithGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) {
        logger.error('GitHub sign in error', { error: error.message });
        auditLog.authAttempt('', false, 'github');
        throw error;
      }
    } catch (error: any) {
      logger.error('GitHub sign in error', { error: error.message });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear any stored access code on sign out
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
      hasRole
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
