
import { useState } from "react";
import { NavigationItem } from "@/services/navigationService";

export interface PendingDeletion {
  sectionId: string;
  itemIndex: number;
  item: NavigationItem;
}

export function usePendingDeletions() {
  const [pendingDeletions, setPendingDeletions] = useState<PendingDeletion[]>([]);

  const addPendingDeletion = (sectionId: string, itemIndex: number, item: NavigationItem) => {
    setPendingDeletions(prev => {
      // Check if already exists
      const exists = prev.some(d => d.sectionId === sectionId && d.itemIndex === itemIndex);
      if (exists) return prev;
      
      return [...prev, { sectionId, itemIndex, item }];
    });
  };

  const removePendingDeletion = (sectionId: string, itemIndex: number) => {
    setPendingDeletions(prev => 
      prev.filter(d => !(d.sectionId === sectionId && d.itemIndex === itemIndex))
    );
  };

  const clearPendingDeletions = () => {
    setPendingDeletions([]);
  };

  const isPendingDeletion = (sectionId: string, itemIndex: number) => {
    return pendingDeletions.some(d => d.sectionId === sectionId && d.itemIndex === itemIndex);
  };

  return {
    pendingDeletions,
    addPendingDeletion,
    removePendingDeletion,
    clearPendingDeletions,
    isPendingDeletion
  };
}
