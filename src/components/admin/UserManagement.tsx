import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, UserPlus, Shield, User, RefreshCw, UserCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  roles: string[];
  has_profile: boolean;
}

export function UserManagement() {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!hasRole('admin')) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Access denied: Admin role required</AlertDescription>
      </Alert>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      // First get all user IDs from user_roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get unique user IDs
      const userIds = [...new Set(userRoles?.map(role => role.user_id) || [])];

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Create a set of profile IDs for faster lookup
      const profileIds = new Set(profiles?.map(p => p.id) || []);
      
      // Create a map of existing profiles
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Get all user IDs (from both roles and profiles)
      const allUserIds = new Set([
        ...userIds,
        ...(profiles?.map(p => p.id) || [])
      ]);

      const usersWithRoles = Array.from(allUserIds).map(userId => {
        const profile = profilesMap.get(userId);
        const userRolesList = userRoles?.filter(role => role.user_id === userId)
          .map(role => role.role) || [];

        // Check if profile exists using the profileIds set
        const hasProfile = profileIds.has(userId);

        return {
          id: userId,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
          created_at: profile?.created_at || new Date().toISOString(),
          roles: userRolesList,
          has_profile: hasProfile
        };
      });

      // Sort by roles (users with roles first) then by creation date
      usersWithRoles.sort((a, b) => {
        if (a.roles.length > 0 && b.roles.length === 0) return -1;
        if (a.roles.length === 0 && b.roles.length > 0) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setUsers(usersWithRoles);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const createMissingProfile = async (userId: string) => {
    try {
      // For users without profiles, we can't create them directly due to RLS
      // Instead, we'll show instructions for the user to sign in themselves
      toast({
        title: "Profile Creation Limitation",
        description: "Due to security policies, profiles must be created when users first sign in. Ask the user to sign in to automatically create their profile.",
        variant: "default",
      });
    } catch (err: any) {
      console.error('Error with profile creation:', err);
      toast({
        title: "Information",
        description: "Profiles are automatically created when users sign in for the first time.",
        variant: "default",
      });
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: userId, 
          role: role as 'admin' | 'editor' | 'user'
        });

      if (error) {
        if (error.message.includes('duplicate key')) {
          toast({
            title: "Role Already Assigned",
            description: "This user already has this role.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Role Assigned",
        description: `Successfully assigned ${role} role to user.`,
      });
      
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      console.error('Error assigning role:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to assign role',
        variant: "destructive",
      });
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as 'admin' | 'editor' | 'user');

      if (error) throw error;

      toast({
        title: "Role Removed",
        description: `Successfully removed ${role} role from user.`,
      });
      
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      console.error('Error removing role:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to remove role',
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive' as const;
      case 'editor':
        return 'default' as const;
      default:
        return 'secondary' as const;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'editor':
        return <UserPlus className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage user accounts and their permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">
                        {user.full_name || (user.has_profile ? 'No name set' : 'Unknown User')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.id.substring(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>{user.email || 'No email'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length === 0 ? (
                          <Badge variant="outline">No roles</Badge>
                        ) : (
                          user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={getRoleBadgeVariant(role)}
                              className="flex items-center gap-1"
                            >
                              {getRoleIcon(role)}
                              {role}
                              <button
                                onClick={() => removeRole(user.id, role)}
                                className="ml-1 hover:bg-black/20 rounded-sm p-0.5"
                                title={`Remove ${role} role`}
                              >
                                <Trash2 className="h-2 w-2" />
                              </button>
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.has_profile ? (
                        <Badge variant="default" className="flex items-center gap-1 w-fit">
                          <UserCheck className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          Pending Sign-in
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!user.has_profile ? (
                          <Button
                            onClick={() => createMissingProfile(user.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <UserPlus className="h-3 w-3" />
                            Info
                          </Button>
                        ) : (
                          <Select
                            onValueChange={(role) => assignRole(user.id, role)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Add role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {users.length} total users
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
