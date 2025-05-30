
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function AdminPortal() {
  const { hasRole } = useAuth();
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!hasRole('admin')) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Access denied: Admin role required</AlertDescription>
      </Alert>
    );
  }

  const generateCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.rpc('generate_admin_access_code');
      
      if (error) {
        throw error;
      }
      
      setGeneratedCode(data);
    } catch (error: any) {
      setError(error.message || 'Failed to generate access code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Admin Portal</CardTitle>
        <CardDescription>
          Generate access codes for new editors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={generateCode} 
          disabled={loading}
          className="w-full"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating...' : 'Generate New Access Code'}
        </Button>
        
        {generatedCode && (
          <div className="space-y-2">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-mono tracking-widest">{generatedCode}</div>
              <div className="text-sm text-muted-foreground mt-2">
                Expires in 24 hours
              </div>
            </div>
            <Button 
              onClick={copyToClipboard}
              variant="outline"
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
