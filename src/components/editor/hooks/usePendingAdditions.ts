
import { useState } from "react";
import { FileNode } from "@/utils/fileSystem";

export interface PendingAddition {
  node: FileNode;
  type: 'file' | 'folder';
}

export function usePendingAdditions() {
  const [pendingAdditions, setPendingAdditions] = useState<PendingAddition[]>([]);

  const addPendingAddition = (node: FileNode) => {
    setPendingAdditions(prev => {
      // Check if already exists
      const exists = prev.some(p => p.node.path === node.path);
      if (exists) return prev;
      
      return [...prev, { node, type: node.type }];
    });
  };

  const removePendingAddition = (nodePath: string) => {
    setPendingAdditions(prev => 
      prev.filter(p => p.node.path !== nodePath)
    );
  };

  const clearPendingAdditions = () => {
    setPendingAdditions([]);
  };

  const isPendingAddition = (nodePath: string) => {
    return pendingAdditions.some(p => p.node.path === nodePath);
  };

  return {
    pendingAdditions,
    addPendingAddition,
    removePendingAddition,
    clearPendingAdditions,
    isPendingAddition
  };
}
