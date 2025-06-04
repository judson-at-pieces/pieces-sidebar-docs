
import React from 'react';

export interface MDXProps {
  components?: Record<string, React.ComponentType<any> | React.FC<any> | string>;
  wrapper?: React.ComponentType<any>;
  [key: string]: any;
}

export interface MDXContentProps extends MDXProps {
  children?: React.ReactNode;
}
