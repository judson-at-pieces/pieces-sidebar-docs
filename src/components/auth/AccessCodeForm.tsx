
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface AccessCodeFormProps {
  onSuccess: () => void;
}

export function AccessCodeForm({ onSuccess }: AccessCodeFormProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.rpc('use_admin_access_code', {
        access_code: code
      });

      if (error) {
        throw error;
      }

      if (data) {
        onSuccess();
      } else {
        setError('Invalid or expired access code');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to validate access code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Enter Access Code</CardTitle>
        <CardDescription>
          Please enter the access code provided by an administrator to gain editing access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter access code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="text-center text-lg tracking-widest"
              required
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button type="submit" className="w-full" disabled={loading || !code}>
            {loading ? 'Validating...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
