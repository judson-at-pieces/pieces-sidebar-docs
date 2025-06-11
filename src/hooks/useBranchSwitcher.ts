
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
        console.log('🔄 Starting branch switch:', fromBranch, '->', toBranch);
      }

      // Step 1: FORCE save current content to OLD branch if we have content and a lock
      if (selectedFile && currentContent && lockManager.isFileLockedByMe(selectedFile)) {
        if (DEBUG_BRANCH_SWITCH) {
          console.log('💾 Force saving current content to OLD branch:', fromBranch);
        }
        
        // Use immediate save with explicit branch
        const saveSuccess = await contentManager.saveContentToBranch(
          selectedFile, 
          currentContent, 
          fromBranch
        );
        
        if (!saveSuccess) {
          console.error('❌ Failed to save content before branch switch');
          // Continue anyway, but warn user
        }
        
        // Also save to branch store for immediate isolation
        branchContentStore.captureCurrentContent(fromBranch, selectedFile, currentContent);
        
        // Wait a moment for the save to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 2: Release ALL locks to prevent conflicts
      if (lockManager.myCurrentLock) {
        if (DEBUG_BRANCH_SWITCH) {
          console.log('🔓 Releasing all locks');
        }
        await lockManager.releaseAllMyLocks();
        // Wait for lock release to propagate
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Step 3: Force refresh content manager for new branch
      if (DEBUG_BRANCH_SWITCH) {
        console.log('🔄 Refreshing content for new branch:', toBranch);
      }
      await contentManager.refreshContentForBranch(toBranch);

      // Step 4: Force refresh lock manager to clear any stale lock state
      if (DEBUG_BRANCH_SWITCH) {
        console.log('🔓 Refreshing lock state for new branch');
      }
      await lockManager.refreshLocks();

      // Step 5: Try to acquire lock for the selected file in new branch (with retry)
      if (selectedFile) {
        if (DEBUG_BRANCH_SWITCH) {
          console.log('🔒 Attempting to acquire lock for file in new branch:', selectedFile);
        }
        
        let lockAcquired = false;
        let retries = 3;
        
        while (!lockAcquired && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 200));
          lockAcquired = await lockManager.acquireLock(selectedFile);
          
          if (!lockAcquired) {
            if (DEBUG_BRANCH_SWITCH) {
              console.log(`🔒 Lock acquisition failed, retrying... (${retries} attempts left)`);
            }
            retries--;
          }
        }
        
        if (!lockAcquired) {
          console.warn('⚠️ Could not acquire lock after branch switch, but continuing...');
        }
      }

      if (DEBUG_BRANCH_SWITCH) {
        console.log('✅ Branch switch completed successfully');
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
