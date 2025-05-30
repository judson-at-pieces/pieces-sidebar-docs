
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import { accessCodeRateLimiter, auditLog, getErrorMessage, sanitizeInput } from '@/utils/security';

interface AccessCodeFormProps {
  onSuccess: () => void;
}

export function AccessCodeForm({ onSuccess }: AccessCodeFormProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const sanitizedCode = sanitizeInput(code);
    const identifier = user?.id || 'anonymous';

    // Rate limiting check
    if (accessCodeRateLimiter.isRateLimited(identifier)) {
      setError('Too many attempts. Please try again later.');
      setLoading(false);
      return;
    }

    try {
      logger.debug('Attempting to use access code', { 
        codeLength: sanitizedCode.length,
        userAuthenticated: !!user 
      });

      // Use the Supabase client to call the edge function
      const { data, error } = await supabase.functions.invoke('use-admin-access-code-fix', {
        body: { access_code: sanitizedCode }
      });

      if (error) {
        logger.error('Edge function error', { error: error.message });
        auditLog.accessCodeUsed(false, user?.id);
        setError(getErrorMessage(error, 'access_code'));
        return;
      }

      if (data.success) {
        auditLog.accessCodeUsed(true, user?.id);
        
        // Store the validated code temporarily so we can use it after sign-in
        if (!user) {
          sessionStorage.setItem('validated_access_code', sanitizedCode);
        }
        
        // If user is already signed in, they now have editor access
        if (user) {
          toast({
            title: "Editor Access Granted",
            description: "You now have editor permissions. Refreshing the page...",
          });
          
          // Small delay to let the toast show before refresh
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          // User is not signed in, proceed to sign up flow
          toast({
            title: "Access Code Validated",
            description: "You can now sign up with GitHub to complete your account setup.",
          });
          onSuccess();
        }
        
        // Reset rate limiter on success
        accessCodeRateLimiter.reset(identifier);
      } else {
        auditLog.accessCodeUsed(false, user?.id);
        setError(getErrorMessage(null, 'access_code'));
      }
    } catch (error: any) {
      logger.error('Access code form error', { error: error.message });
      setError(getErrorMessage(error, 'access_code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Enter Access Code</CardTitle>
        <CardDescription>
          {user 
            ? 'Enter an access code to gain editor permissions for your existing account.'
            : 'Please enter the access code provided by an administrator to gain editing access.'
          }
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
