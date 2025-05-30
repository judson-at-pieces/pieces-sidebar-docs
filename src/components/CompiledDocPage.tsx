
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DynamicDocPage } from './DynamicDocPage';

export function CompiledDocPage() {
  const { '*': path } = useParams();

  useEffect(() => {
    // Always log that we're using the fallback to avoid compiled content issues
    console.log('CompiledDocPage: Always using DynamicDocPage fallback for:', path);
  }, [path]);

  // Always use DynamicDocPage to avoid TSX parsing issues
  return <DynamicDocPage />;
}
