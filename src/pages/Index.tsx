
import { Navigate, useLocation } from 'react-router-dom';
import DocsLayout from '@/components/DocsLayout';

export default function Index() {
  const location = useLocation();

  // If we're on the root path, redirect to the core-dependencies page
  if (location.pathname === '/') {
    return <Navigate to="/core-dependencies" replace />;
  }

  // For any other path, render the docs layout which will handle content loading
  return <DocsLayout />;
}
