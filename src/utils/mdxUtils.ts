
import React from 'react';
import { jsx as _jsx } from "react/jsx-runtime";

export interface MDXProps {
  components?: Record<string, React.ComponentType<any>>;
}

export interface MDXContentProps {
  components?: Record<string, React.ComponentType<any>>;
  wrapper?: React.ComponentType<any>;
}

export function createMdxContent(props: MDXProps) {
  const _components = {
    div: "div" as const,
    ...props.components
  };
  return _jsx(_components.div, {});
}

export function createMDXContent(props: MDXContentProps = {}) {
  const { wrapper: MDXLayout } = props.components || {};
  return MDXLayout ? _jsx(MDXLayout, {
    ...props,
    children: _jsx(createMdxContent, {
      ...props
    })
  }) : createMdxContent(props);
}
