
import { useState, useRef, useCallback } from 'react';

export type EditorState = 
  | 'IDLE' 
  | 'SAVING' 
  | 'SWITCHING_BRANCH' 
  | 'LOADING_CONTENT' 
  | 'LOADING_FILE';

export interface EditorOperation {
  id: string;
  type: 'save' | 'switch_branch' | 'load_file';
  payload: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

const DEBUG_STATE = true;
const MAX_OPERATION_TIMEOUT = 15000; // 15 seconds max per operation

export function useEditorStateMachine() {
  const [state, setState] = useState<EditorState>('IDLE');
  const operationQueue = useRef<EditorOperation[]>([]);
  const processingOperation = useRef<boolean>(false);
  const operationIdCounter = useRef(0);
  const currentOperationTimeout = useRef<NodeJS.Timeout>();

  const log = useCallback((message: string, data?: any) => {
    if (DEBUG_STATE) {
      console.log(`🎛️ [StateMachine] ${message}`, data || '');
    }
  }, []);

  const forceReset = useCallback(() => {
    log('🚨 Force resetting state machine to IDLE');
    setState('IDLE');
    processingOperation.current = false;
    
    // Clear timeout
    if (currentOperationTimeout.current) {
      clearTimeout(currentOperationTimeout.current);
      currentOperationTimeout.current = undefined;
    }
    
    // Reject all pending operations
    operationQueue.current.forEach(op => {
      op.reject(new Error('Operation cancelled due to force reset'));
    });
    operationQueue.current = [];
  }, [log]);

  const canTransitionTo = useCallback((newState: EditorState): boolean => {
    const validTransitions: Record<EditorState, EditorState[]> = {
      'IDLE': ['SAVING', 'SWITCHING_BRANCH', 'LOADING_FILE'],
      'SAVING': ['IDLE'],
      'SWITCHING_BRANCH': ['LOADING_CONTENT'],
      'LOADING_CONTENT': ['IDLE'],
      'LOADING_FILE': ['IDLE']
    };

    const isValid = validTransitions[state].includes(newState);
    if (!isValid) {
      log(`❌ Invalid transition: ${state} → ${newState}`);
    }
    return isValid;
  }, [state, log]);

  const transitionTo = useCallback((newState: EditorState) => {
    if (canTransitionTo(newState)) {
      log(`🔄 State transition: ${state} → ${newState}`);
      setState(newState);
    }
  }, [state, canTransitionTo, log]);

  const queueOperation = useCallback((
    type: EditorOperation['type'], 
    payload: any
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const operation: EditorOperation = {
        id: `op_${++operationIdCounter.current}`,
        type,
        payload,
        resolve,
        reject
      };

      operationQueue.current.push(operation);
      log(`➕ Queued operation: ${operation.type} (${operation.id})`);
      
      processNextOperation();
    });
  }, []);

  const processNextOperation = useCallback(async () => {
    if (processingOperation.current || operationQueue.current.length === 0 || state !== 'IDLE') {
      return;
    }

    processingOperation.current = true;
    const operation = operationQueue.current.shift()!;
    
    log(`🔧 Processing operation: ${operation.type} (${operation.id})`);

    // Set timeout for operation
    currentOperationTimeout.current = setTimeout(() => {
      log(`⏰ Operation timeout: ${operation.type} (${operation.id})`);
      operation.reject(new Error(`Operation ${operation.type} timed out after ${MAX_OPERATION_TIMEOUT}ms`));
      forceReset();
    }, MAX_OPERATION_TIMEOUT);

    try {
      let result;
      
      switch (operation.type) {
        case 'save':
          transitionTo('SAVING');
          result = await operation.payload.saveFunction();
          transitionTo('IDLE');
          break;
          
        case 'switch_branch':
          transitionTo('SWITCHING_BRANCH');
          result = await operation.payload.switchFunction();
          transitionTo('LOADING_CONTENT');
          result = await operation.payload.loadFunction();
          transitionTo('IDLE');
          break;
          
        case 'load_file':
          transitionTo('LOADING_FILE');
          result = await operation.payload.loadFunction();
          transitionTo('IDLE');
          break;
      }
      
      // Clear timeout on success
      if (currentOperationTimeout.current) {
        clearTimeout(currentOperationTimeout.current);
        currentOperationTimeout.current = undefined;
      }
      
      operation.resolve(result);
      log(`✅ Completed operation: ${operation.type} (${operation.id})`);
      
    } catch (error) {
      log(`❌ Failed operation: ${operation.type} (${operation.id})`, error);
      
      // Clear timeout on error
      if (currentOperationTimeout.current) {
        clearTimeout(currentOperationTimeout.current);
        currentOperationTimeout.current = undefined;
      }
      
      operation.reject(error);
      setState('IDLE'); // Reset to idle on error
    } finally {
      processingOperation.current = false;
      
      // Process next operation if any
      setTimeout(processNextOperation, 100);
    }
  }, [state, transitionTo, log, forceReset]);

  const isBlocked = useCallback(() => {
    return state !== 'IDLE';
  }, [state]);

  const clearQueue = useCallback(() => {
    log(`🗑️ Clearing operation queue (${operationQueue.current.length} operations)`);
    operationQueue.current.forEach(op => op.reject(new Error('Operation cancelled')));
    operationQueue.current = [];
  }, [log]);

  return {
    state,
    isBlocked,
    queueOperation,
    clearQueue,
    forceReset
  };
}
