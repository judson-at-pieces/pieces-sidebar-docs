
import React from 'react';

export interface MDXProps {
  components?: Record<string, React.ComponentType<any> | React.FC<any> | string>;
  [key: string]: any;
}

export interface MDXContentProps {
  components?: Record<string, React.ComponentType<any> | React.FC<any> | string>;
  [key: string]: any;
}
