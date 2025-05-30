
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
        checkAndEnsureUserRole(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check roles and assign editor if user has no roles
          setTimeout(async () => {
            await checkAndEnsureUserRole(session.user.id);
          }, 500);
        } else {
          setUserRoles([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAndEnsureUserRole = async (userId: string) => {
    try {
      console.log('Checking roles for user:', userId);
      
      // Fetch current user roles
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }

      console.log('Current user roles:', roles);

      // If user has no roles, assign editor role
      if (!roles || roles.length === 0) {
        console.log('User has no roles, assigning editor role...');
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'editor' });

        if (insertError) {
          console.error('Error assigning editor role:', insertError);
        } else {
          console.log('Successfully assigned editor role');
        }
      }

      // Update local state with current roles
      const rolesList = roles?.map(r => r.role) || [];
      if (rolesList.length === 0) {
        // If we just assigned editor role, add it to local state
        setUserRoles(['editor']);
      } else {
        setUserRoles(rolesList);
      }
    } catch (error) {
      console.error('Error in checkAndEnsureUserRole:', error);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      console.log('Fetching roles for user:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }

      const roles = data?.map(r => r.role) || [];
      console.log('User roles:', roles);
      setUserRoles(roles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  };

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    if (error) {
      console.error('Error signing in with GitHub:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
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
