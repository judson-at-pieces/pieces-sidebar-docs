
import React from 'react';

export interface MDXProps {
  components?: Record<string, React.ComponentType<any>>;
}

export interface MDXComponent {
  (props: MDXProps): JSX.Element;
  frontmatter?: Record<string, any>;
  displayName?: string;
}
