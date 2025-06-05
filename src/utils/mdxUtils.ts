
import React from 'react';

export interface MDXProps {
  components?: Record<string, React.ComponentType<any>>;
  children?: React.ReactNode;
  [key: string]: any;
}

export interface MDXComponent extends React.ComponentType<MDXProps> {
  frontmatter?: Record<string, any>;
  displayName?: string;
}
