
import React from 'react';

interface SecurityProviderProps {
  children: React.ReactNode;
}

export function SecurityProvider({ children }: SecurityProviderProps) {
  // Remove the problematic useEffect that's causing the dispatcher error
  // This component should just pass through children without any side effects
  return <>{children}</>;
}
