
import React from 'react';

export interface MDXProps {
  components?: Record<string, React.ComponentType<any>>;
  [key: string]: any; // Allow any additional props
}

export interface MDXComponent extends React.ComponentType<MDXProps> {
  frontmatter?: Record<string, any>;
  displayName?: string;
}
