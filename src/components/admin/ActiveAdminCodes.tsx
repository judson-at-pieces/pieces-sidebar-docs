
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface AdminAccessCode {
  id: string;
  code: string;
  created_at: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
  is_active: boolean;
}

export function ActiveAdminCodes() {
  const { hasRole } = useAuth();
  const [codes, setCodes] = useState<AdminAccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!hasRole('admin')) {
    return null;
  }

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('admin_access_codes')
        .select('*')
        .eq('is_active', true)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCodes(data || []);
    } catch (err: any) {
      console.error('Error fetching admin codes:', err);
      setError(err.message || 'Failed to fetch admin codes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code Copied",
        description: "Access code copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const deactivateCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('admin_access_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      if (error) throw error;

      toast({
        title: "Code Deactivated",
        description: "Access code has been deactivated",
      });

      fetchCodes(); // Refresh the list
    } catch (err: any) {
      console.error('Error deactivating code:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to deactivate code',
        variant: "destructive",
      });
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Active Access Codes</h4>
        </div>
        <div>Loading codes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Active Access Codes</h4>
        <Button onClick={fetchCodes} variant="outline" size="sm">
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {codes.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg">
          No active access codes
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    <code className="text-lg font-mono tracking-wider">
                      {code.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{getTimeRemaining(code.expires_at)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(code.expires_at).toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => copyToClipboard(code.code)}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => deactivateCode(code.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
