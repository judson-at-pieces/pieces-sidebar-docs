
import { useState } from 'react';

export interface SettingsPanelState {
  isOpen: boolean;
  itemId: string | null;
  itemType: 'file' | 'folder' | null;
  itemPath: string | null;
  currentPrivacy: 'PUBLIC' | 'PRIVATE';
}

export function useSettingsPanel() {
  const [panelState, setPanelState] = useState<SettingsPanelState>({
    isOpen: false,
    itemId: null,
    itemType: null,
    itemPath: null,
    currentPrivacy: 'PUBLIC'
  });

  const openPanel = (itemId: string, itemType: 'file' | 'folder', itemPath: string, currentPrivacy: 'PUBLIC' | 'PRIVATE' = 'PUBLIC') => {
    setPanelState({
      isOpen: true,
      itemId,
      itemType,
      itemPath,
      currentPrivacy
    });
  };

  const closePanel = () => {
    setPanelState({
      isOpen: false,
      itemId: null,
      itemType: null,
      itemPath: null,
      currentPrivacy: 'PUBLIC'
    });
  };

  return {
    panelState,
    openPanel,
    closePanel
  };
}
