
import React, { useEffect } from 'react';
import { getSecurityHeaders } from '@/utils/contentSecurityPolicy';

interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  useEffect(() => {
    // Apply security headers through meta tags for client-side security
    const securityHeaders = getSecurityHeaders();
    
    // Add CSP meta tag
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = securityHeaders['Content-Security-Policy'];
    document.head.appendChild(cspMeta);
    
    // Add other security meta tags
    const xFrameOptions = document.createElement('meta');
    xFrameOptions.httpEquiv = 'X-Frame-Options';
    xFrameOptions.content = 'DENY';
    document.head.appendChild(xFrameOptions);
    
    const xContentTypeOptions = document.createElement('meta');
    xContentTypeOptions.httpEquiv = 'X-Content-Type-Options';
    xContentTypeOptions.content = 'nosniff';
    document.head.appendChild(xContentTypeOptions);
    
    return () => {
      // Cleanup on unmount
      const metaTags = document.querySelectorAll('meta[http-equiv]');
      metaTags.forEach(tag => {
        if (tag.getAttribute('http-equiv')?.startsWith('Content-Security-Policy') ||
            tag.getAttribute('http-equiv')?.startsWith('X-Frame-Options') ||
            tag.getAttribute('http-equiv')?.startsWith('X-Content-Type-Options')) {
          tag.remove();
        }
      });
    };
  }, []);

  return <>{children}</>;
};
