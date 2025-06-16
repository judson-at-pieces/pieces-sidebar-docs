
import { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import DocsLayout from '@/components/DocsLayout';

export default function Index() {
  const location = useLocation();

  // If we're on the root path, redirect to a default docs page
  if (location.pathname === '/') {
    return <Navigate to="/core-dependencies" replace />;
  }

  // If we're on a docs path, render the docs layout
  if (location.pathname.startsWith('/docs/')) {
    return <DocsLayout />;
  }

  // Default fallback - render docs layout
  return <DocsLayout />;
}
