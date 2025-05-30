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
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential issues with immediate DB calls
          setTimeout(async () => {
            await fetchUserRoles(session.user.id);
            
            // Check if user needs role assignment after GitHub sign-in
            if (event === 'SIGNED_IN') {
              console.log('User signed in, checking for pending role assignment...');
              await checkAndAssignPendingRole(session.user.id);
              // Refresh roles after potential assignment
              setTimeout(() => {
                fetchUserRoles(session.user.id);
              }, 2000); // Increased delay to ensure DB operations complete
            }
          }, 100);
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
      console.log('Checking for pending access codes for user:', userId);
      
      // Check if there's a recently used access code that either has no user_id or matches this user
      const { data, error } = await supabase
        .from('admin_access_codes')
        .select('*')
        .eq('is_active', true)
        .not('used_at', 'is', null) // Code has been used
        .gte('used_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Within last 15 minutes
        .or(`used_by.is.null,used_by.eq.${userId}`) // Either no user assigned or already assigned to this user
        .order('used_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking pending access codes:', error);
        return;
      }

      console.log('Found access codes:', data);

      if (data && data.length > 0) {
        const accessCode = data[0];
        console.log('Processing access code:', accessCode.code, 'used_by:', accessCode.used_by);
        
        // Update the access code with the user_id if not already set
        if (!accessCode.used_by) {
          console.log('Assigning access code to user:', userId);
          const { error: updateError } = await supabase
            .from('admin_access_codes')
            .update({ used_by: userId })
            .eq('id', accessCode.id);

          if (updateError) {
            console.error('Error updating access code:', updateError);
            return;
          }
        }

        // Check if user already has editor role
        const { data: existingRoles, error: roleCheckError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'editor');

        if (roleCheckError) {
          console.error('Error checking existing roles:', roleCheckError);
          return;
        }

        console.log('Existing editor roles for user:', existingRoles);

        if (!existingRoles || existingRoles.length === 0) {
          // Assign editor role
          console.log('Assigning editor role to user:', userId);
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'editor' });

          if (roleError) {
            console.error('Error assigning role:', roleError);
          } else {
            console.log('Successfully assigned editor role to user');
          }
        } else {
          console.log('User already has editor role');
        }
      } else {
        console.log('No pending access codes found for user within the time window');
      }
    } catch (error) {
      console.error('Error in checkAndAssignPendingRole:', error);
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
