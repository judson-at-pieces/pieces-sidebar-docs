
import { useState, useCallback } from 'react';
import { useLockManager } from './useLockManager';
import { useContentManager } from './useContentManager';
import { useBranchContentStore } from './useBranchContentStore';

const DEBUG_BRANCH_SWITCH = true;

export function useBranchSwitcher() {
  const [isSwitching, setIsSwitching] = useState(false);
  const lockManager = useLockManager();
  const contentManager = useContentManager(lockManager);
  const branchContentStore = useBranchContentStore();

  const switchBranch = useCallback(async (
    fromBranch: string,
    toBranch: string,
    selectedFile: string | undefined,
    currentContent: string
  ): Promise<boolean> => {
    if (isSwitching || fromBranch === toBranch) return false;
    
    setIsSwitching(true);
    
    try {
      if (DEBUG_BRANCH_SWITCH) {
        console.log('🔄 Starting optimized branch switch:', fromBranch, '->', toBranch);
      }

      // Step 1: Save current content to branch store (immediate, no DB call)
      if (selectedFile && currentContent) {
        branchContentStore.captureCurrentContent(fromBranch, selectedFile, currentContent);
        
        // Only save to DB if we have a lock (fire and forget)
        if (lockManager.isFileLockedByMe(selectedFile)) {
          contentManager.saveContentToBranch(selectedFile, currentContent, fromBranch)
            .catch(error => console.warn('Background save failed:', error));
        }
      }

      // Step 2: Release locks (don't wait for DB response)
      if (lockManager.myCurrentLock) {
        if (DEBUG_BRANCH_SWITCH) {
          console.log('🔓 Releasing locks');
        }
        lockManager.releaseAllMyLocks(); // Fire and forget
      }

      // Step 3: Brief pause to allow state to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      if (DEBUG_BRANCH_SWITCH) {
        console.log('✅ Optimized branch switch completed');
      }

      return true;
    } catch (error) {
      console.error('❌ Error during branch switch:', error);
      return false;
    } finally {
      setIsSwitching(false);
    }
  }, [isSwitching, lockManager, contentManager, branchContentStore]);

  return {
    switchBranch,
    isSwitching
  };
}
