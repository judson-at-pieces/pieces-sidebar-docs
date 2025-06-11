
// Atomic lock coordination system with cookie persistence
const LOCK_COOKIE_KEY = 'editor_current_lock';
const LOCK_OPERATION_KEY = 'editor_lock_operation';

export interface LockInfo {
  filePath: string;
  branchName: string;
  userId: string;
  acquiredAt: number;
}

export interface LockOperation {
  type: 'acquiring' | 'releasing' | 'switching';
  fromFile?: string;
  toFile?: string;
  timestamp: number;
}

// Cookie helpers for lock persistence
export const getCurrentLockFromCookie = (): LockInfo | null => {
  try {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${LOCK_COOKIE_KEY}=`))
      ?.split('=')[1];
    
    if (cookie) {
      return JSON.parse(decodeURIComponent(cookie));
    }
  } catch (error) {
    console.warn('Failed to read lock cookie:', error);
  }
  return null;
};

export const setCurrentLockCookie = (lockInfo: LockInfo | null) => {
  try {
    if (lockInfo) {
      const serialized = encodeURIComponent(JSON.stringify(lockInfo));
      document.cookie = `${LOCK_COOKIE_KEY}=${serialized}; path=/; max-age=7200`; // 2 hours
      console.log('🍪 LOCK COOKIE SET:', lockInfo);
    } else {
      document.cookie = `${LOCK_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      console.log('🍪 LOCK COOKIE CLEARED');
    }
  } catch (error) {
    console.warn('Failed to set lock cookie:', error);
  }
};

export const getLockOperation = (): LockOperation | null => {
  try {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${LOCK_OPERATION_KEY}=`))
      ?.split('=')[1];
    
    if (cookie) {
      return JSON.parse(decodeURIComponent(cookie));
    }
  } catch (error) {
    console.warn('Failed to read lock operation cookie:', error);
  }
  return null;
};

export const setLockOperation = (operation: LockOperation | null) => {
  try {
    if (operation) {
      const serialized = encodeURIComponent(JSON.stringify(operation));
      document.cookie = `${LOCK_OPERATION_KEY}=${serialized}; path=/; max-age=300`; // 5 minutes
    } else {
      document.cookie = `${LOCK_OPERATION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  } catch (error) {
    console.warn('Failed to set lock operation cookie:', error);
  }
};

// Sequential operation queue to prevent race conditions
class LockOperationQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.process();
    });
  }

  private async process() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Lock operation failed:', error);
        }
      }
    }
    
    this.isProcessing = false;
  }
}

export const lockQueue = new LockOperationQueue();
