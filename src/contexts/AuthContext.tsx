
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
        fetchUserRoles(session.user.id);
        // Check if user needs role assignment after GitHub sign-in
        checkAndAssignPendingRole(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
            // Check if user needs role assignment after GitHub sign-in
            if (event === 'SIGNED_IN') {
              checkAndAssignPendingRole(session.user.id);
            }
          }, 0);
        } else {
          setUserRoles([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAndAssignPendingRole = async (userId: string) => {
    try {
      // Check if there's a recently used access code without a user_id
      const { data, error } = await supabase
        .from('admin_access_codes')
        .select('*')
        .is('used_by', null)
        .eq('is_active', true)
        .gte('used_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Within last 5 minutes
        .order('used_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking pending access codes:', error);
        return;
      }

      if (data && data.length > 0) {
        // Update the access code with the user_id and assign the role
        const { error: updateError } = await supabase
          .from('admin_access_codes')
          .update({ used_by: userId })
          .eq('id', data[0].id);

        if (updateError) {
          console.error('Error updating access code:', updateError);
          return;
        }

        // Assign editor role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'editor' })
          .select();

        if (roleError) {
          console.error('Error assigning role:', roleError);
        } else {
          // Refresh user roles
          setTimeout(() => {
            fetchUserRoles(userId);
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error in checkAndAssignPendingRole:', error);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }

      setUserRoles(data?.map(r => r.role) || []);
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
