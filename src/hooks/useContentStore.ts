import { useState, useCallback, useRef } from 'react';

interface BranchContent {
  [filePath: string]: string;
}

interface ContentSnapshot {
  branchName: string;
  filePath: string;
  content: string;
  timestamp: number;
}

const DEBUG_STORE = true;

export function useContentStore() {
  // Separate content storage per branch
  const [branchContentStore, setBranchContentStore] = useState<Record<string, BranchContent>>({});
  const snapshotHistory = useRef<ContentSnapshot[]>([]);

  const log = useCallback((message: string, data?: any) => {
    if (DEBUG_STORE) {
      console.log(`📦 [ContentStore] ${message}`, data || '');
    }
  }, []);

  const getContent = useCallback((branchName: string, filePath: string): string | null => {
    const content = branchContentStore[branchName]?.[filePath] || null;
    log(`📖 Get content: ${branchName}/${filePath}`, { found: !!content, length: content?.length });
    return content;
  }, [branchContentStore, log]);

  const setContent = useCallback((branchName: string, filePath: string, content: string) => {
    log(`📝 Set content: ${branchName}/${filePath}`, { length: content.length });
    
    // Create snapshot before changing
    if (branchContentStore[branchName]?.[filePath]) {
      snapshotHistory.current.push({
        branchName,
        filePath,
        content: branchContentStore[branchName][filePath],
        timestamp: Date.now()
      });
      
      // Keep only last 10 snapshots per file
      snapshotHistory.current = snapshotHistory.current
        .filter(s => s.branchName === branchName && s.filePath === filePath)
        .slice(-10)
        .concat(
          snapshotHistory.current.filter(s => !(s.branchName === branchName && s.filePath === filePath))
        );
    }
    
    setBranchContentStore(prev => ({
      ...prev,
      [branchName]: {
        ...prev[branchName],
        [filePath]: content
      }
    }));
  }, [branchContentStore, log]);

  const captureSnapshot = useCallback((branchName: string, filePath: string, content: string): string => {
    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    snapshotHistory.current.push({
      branchName,
      filePath,
      content,
      timestamp: Date.now()
    });
    
    log(`📸 Captured snapshot: ${snapshotId}`, { branchName, filePath, length: content.length });
    return snapshotId;
  }, [log]);

  const clearBranchContent = useCallback((branchName: string) => {
    log(`🗑️ Clear branch content: ${branchName}`);
    setBranchContentStore(prev => {
      const newStore = { ...prev };
      delete newStore[branchName];
      return newStore;
    });
  }, [log]);

  const getAllContentForBranch = useCallback((branchName: string): BranchContent => {
    return branchContentStore[branchName] || {};
  }, [branchContentStore]);

  const hasUnsavedChanges = useCallback((branchName: string, filePath: string, currentContent: string): boolean => {
    const storedContent = getContent(branchName, filePath);
    return storedContent !== null && storedContent !== currentContent;
  }, [getContent]);

  return {
    getContent,
    setContent,
    captureSnapshot,
    clearBranchContent,
    getAllContentForBranch,
    hasUnsavedChanges
  };
}
