
import React, { useEffect } from 'react';
import { getSecurityHeaders } from '@/utils/contentSecurityPolicy';

interface SecurityProviderProps {
  children: React.ReactNode;
}

/**
 * Security provider that applies security headers and policies
 */
export function SecurityProvider({ children }: SecurityProviderProps) {
  useEffect(() => {
    // Apply security headers via meta tags for client-side security
    const securityHeaders = getSecurityHeaders();
    
    // Add CSP meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = securityHeaders['Content-Security-Policy'];
    document.head.appendChild(cspMeta);

    // Add other security meta tags
    const xFrameOptions = document.createElement('meta');
    xFrameOptions.httpEquiv = 'X-Frame-Options';
    xFrameOptions.content = securityHeaders['X-Frame-Options'];
    document.head.appendChild(xFrameOptions);

    const xContentTypeOptions = document.createElement('meta');
    xContentTypeOptions.httpEquiv = 'X-Content-Type-Options';
    xContentTypeOptions.content = securityHeaders['X-Content-Type-Options'];
    document.head.appendChild(xContentTypeOptions);

    // Cleanup function
    return () => {
      document.head.removeChild(cspMeta);
      document.head.removeChild(xFrameOptions);
      document.head.removeChild(xContentTypeOptions);
    };
  }, []);

  return <>{children}</>;
}
