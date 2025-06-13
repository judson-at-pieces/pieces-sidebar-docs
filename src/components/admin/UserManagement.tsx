
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
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Shield, User, RefreshCw, UserCheck, Info, Search, Filter, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  roles: string[];
  has_profile: boolean;
}

interface ProfileData {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

type FilterOption = 'all' | 'with_roles' | 'without_roles' | 'active' | 'pending';

export function UserManagement() {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [assigningRole, setAssigningRole] = useState<string | null>(null);
  const [removingRole, setRemovingRole] = useState<string | null>(null);

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

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterOption]);

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(search) ||
        user.full_name?.toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    switch (filterOption) {
      case 'with_roles':
        filtered = filtered.filter(user => user.roles.length > 0);
        break;
      case 'without_roles':
        filtered = filtered.filter(user => user.roles.length === 0);
        break;
      case 'active':
        filtered = filtered.filter(user => user.has_profile);
        break;
      case 'pending':
        filtered = filtered.filter(user => !user.has_profile);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredUsers(filtered);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching user roles and profiles...');

      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Create a map of profiles by ID for quick lookup
      const profilesMap = new Map((profiles as ProfileData[])?.map(p => [p.id, p]) || []);

      // Get unique user IDs from roles and profiles
      const roleUserIds = new Set(userRoles?.map(role => role.user_id) || []);
      const profileUserIds = new Set((profiles as ProfileData[])?.map(p => p.id) || []);
      const allUserIds = new Set([...roleUserIds, ...profileUserIds]);

      // Build user list with profile and role information
      const usersWithRoles: UserProfile[] = Array.from(allUserIds).map((userId: unknown) => {
        const userIdString = String(userId);
        const profile = profilesMap.get(userIdString);
        const userRolesList = userRoles?.filter(role => role.user_id === userIdString)
          .map(role => role.role) || [];

        return {
          id: userIdString,
          email: profile?.email || null,
          full_name: profile?.full_name || null,
          created_at: profile?.created_at || new Date().toISOString(),
          roles: userRolesList,
          has_profile: !!profile
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
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    const roleKey = `${userId}-${role}`;
    setAssigningRole(roleKey);
    
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
      
      await fetchUsers();
    } catch (err: any) {
      console.error('Error assigning role:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to assign role',
        variant: "destructive",
      });
    } finally {
      setAssigningRole(null);
    }
  };

  const removeRole = async (userId: string, role: string) => {
    const roleKey = `${userId}-${role}`;
    setRemovingRole(roleKey);
    
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
      
      await fetchUsers();
    } catch (err: any) {
      console.error('Error removing role:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to remove role',
        variant: "destructive",
      });
    } finally {
      setRemovingRole(null);
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
        return <User className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterOption('all');
  };

  const getFilterLabel = (option: FilterOption) => {
    switch (option) {
      case 'with_roles': return 'With Roles';
      case 'without_roles': return 'No Roles';
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      default: return 'All Users';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Loading users...</span>
          </div>
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

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by email, name, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterOption} onValueChange={(value: FilterOption) => setFilterOption(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="with_roles">With Roles</SelectItem>
                <SelectItem value="without_roles">No Roles</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            {(searchTerm || filterOption !== 'all') && (
              <Button onClick={clearFilters} variant="outline" size="sm">
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
            {filterOption !== 'all' && (
              <span className="ml-2">
                • Filtered by: {getFilterLabel(filterOption)}
              </span>
            )}
          </div>
        </div>

        <Separator className="mb-4" />

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
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {searchTerm || filterOption !== 'all' 
                      ? 'No users match your search criteria' 
                      : 'No users found'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium">
                        {user.full_name || (user.has_profile ? 'No name set' : 'Profile Pending')}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {user.id.substring(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {user.email || 'No email'}
                      </div>
                    </TableCell>
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
                                disabled={removingRole === `${user.id}-${role}`}
                                className="ml-1 hover:bg-black/20 rounded-sm p-0.5 disabled:opacity-50"
                                title={`Remove ${role} role`}
                              >
                                {removingRole === `${user.id}-${role}` ? (
                                  <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="h-2 w-2" />
                                )}
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
                          <Info className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(role) => assignRole(user.id, role)}
                        disabled={assigningRole?.startsWith(user.id)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder={
                            assigningRole?.startsWith(user.id) ? "Adding..." : "Add role"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <div className="font-semibold text-lg">{users.length}</div>
            <div className="text-muted-foreground">Total Users</div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <div className="font-semibold text-lg">
              {users.filter(u => u.has_profile).length}
            </div>
            <div className="text-muted-foreground">Active</div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <div className="font-semibold text-lg">
              {users.filter(u => u.roles.length > 0).length}
            </div>
            <div className="text-muted-foreground">With Roles</div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <div className="font-semibold text-lg">
              {users.filter(u => u.roles.includes('admin')).length}
            </div>
            <div className="text-muted-foreground">Admins</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
