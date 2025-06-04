
import { useMemo } from 'react';
import { createDynamicComponentMap } from '@/components/markdown/DynamicComponentMap';

export const useDynamicComponents = () => {
  const componentMap = useMemo(() => {
    console.log('🔧 Creating dynamic component map');
    return createDynamicComponentMap();
  }, []);

  return componentMap;
};
