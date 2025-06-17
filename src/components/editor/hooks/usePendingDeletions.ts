
import { useState } from "react";
import { NavigationItem } from "@/services/navigationService";

export interface PendingDeletion {
  sectionId: string;
  itemId: string;
  item: NavigationItem;
}

export function usePendingDeletions() {
  const [pendingDeletions, setPendingDeletions] = useState<PendingDeletion[]>([]);

  const addPendingDeletion = (sectionId: string, itemId: string, item: NavigationItem) => {
    setPendingDeletions(prev => {
      // Check if already exists
      const exists = prev.some(d => d.sectionId === sectionId && d.itemId === itemId);
      if (exists) return prev;
      
      return [...prev, { sectionId, itemId, item }];
    });
  };

  const removePendingDeletion = (sectionId: string, itemId: string) => {
    setPendingDeletions(prev => 
      prev.filter(d => !(d.sectionId === sectionId && d.itemId === itemId))
    );
  };

  const clearPendingDeletions = () => {
    setPendingDeletions([]);
  };

  const isPendingDeletion = (sectionId: string, itemId: string) => {
    return pendingDeletions.some(d => d.sectionId === sectionId && d.itemId === itemId);
  };

  return {
    pendingDeletions,
    addPendingDeletion,
    removePendingDeletion,
    clearPendingDeletions,
    isPendingDeletion
  };
}
