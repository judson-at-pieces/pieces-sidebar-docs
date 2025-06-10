import React, { useState } from 'react';
import { GitBranch, Plus, Trash2, Check, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBranchManager } from '@/hooks/useBranchManager';
import { setBranchCookie } from '@/utils/branchCookies';

export function NewBranchSelector() {
  const {
    branches,
    currentBranch,
    loading,
    createBranch,
    switchBranch,
    deleteBranch,
  } = useBranchManager();

  // 🚨 ULTRA INTENSIVE DROPDOWN DEBUGGING
  console.group('🚨🚨🚨 NEW BRANCH SELECTOR RENDER');
  console.log('📊 HOOK DATA:', {
    currentBranch: JSON.stringify(currentBranch),
    currentBranchType: typeof currentBranch,
    currentBranchLength: currentBranch?.length,
    currentBranchCharCodes: currentBranch ? Array.from(currentBranch).map(c => `${c}(${c.charCodeAt(0)})`) : 'null',
    branchesCount: branches.length,
    branchesArray: branches.map(b => ({
      name: JSON.stringify(b.name),
      nameCharCodes: Array.from(b.name).map(c => `${c}(${c.charCodeAt(0)})`),
      isDefault: b.isDefault
    })),
    loading
  });
  console.groupEnd();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [branchToDelete, setBranchToDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    
    setCreating(true);
    try {
      await createBranch(newBranchName.trim());
      setNewBranchName('');
      setShowCreateDialog(false);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (branchToDelete) {
      await deleteBranch(branchToDelete);
      setBranchToDelete(null);
    }
  };

  const currentBranchData = branches.find(b => b.name === currentBranch);

  // 🚨 CURRENT BRANCH FINDING DEBUGGING
  console.group('🚨🚨🚨 CURRENT BRANCH FINDING');
  console.log('📊 SEARCH DETAILS:', {
    searchingFor: JSON.stringify(currentBranch),
    foundBranch: currentBranchData ? JSON.stringify(currentBranchData.name) : 'NOT FOUND',
    comparison: branches.map(b => ({
      branchName: JSON.stringify(b.name),
      matches: b.name === currentBranch,
      exactComparison: `"${b.name}" === "${currentBranch}"`,
      charComparison: `[${Array.from(b.name).map(c => c.charCodeAt(0)).join(',')}] vs [${currentBranch ? Array.from(currentBranch).map(c => c.charCodeAt(0)).join(',') : 'null'}]`
    }))
  });
  console.groupEnd();

  // Sort branches with default branch first, then alphabetically
  const sortedBranches = [...branches].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });

  // Get deletable branches (non-default, not current)
  const deletableBranches = branches.filter(branch => 
    !branch.isDefault && branch.name !== currentBranch
  );

  const handleSwitchBranch = async (branchName: string) => {
    console.group('🚨🚨🚨 BRANCH CLICK HANDLER CALLED');
    console.log('📊 CLICK EVENT DETAILS:', {
      clickedBranch: JSON.stringify(branchName),
      currentBranch: JSON.stringify(currentBranch),
      fromCharCodes: currentBranch ? Array.from(currentBranch).map(c => `${c}(${c.charCodeAt(0)})`) : 'null',
      toCharCodes: Array.from(branchName).map(c => `${c}(${c.charCodeAt(0)})`),
      isSameBranch: branchName === currentBranch,
      timestamp: new Date().toISOString()
    });
    
    if (branchName === currentBranch) {
      console.log('🚨 CLICK HANDLER: Same branch, exiting early');
      console.groupEnd();
      return;
    }
    
    console.log('🚨 CLICK HANDLER: About to call switchBranch and set cookie...');
    
    // Set cookie immediately for faster UI updates
    setBranchCookie(branchName);
    
    await switchBranch(branchName);
    console.groupEnd();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-2 ${currentBranch ? 'bg-blue-500 text-white border-blue-600' : ''}`} 
            disabled={loading}
          >
            <GitBranch className="h-4 w-4" />
            {currentBranch || 'Loading...'}
            {currentBranchData?.isDefault && (
              <Badge variant="secondary" className="text-xs ml-1">
                default
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            Switch Branch (Current: {currentBranch})
          </div>
          <DropdownMenuSeparator />
          
          {sortedBranches.map((branch) => {
            const isCurrentBranch = branch.name === currentBranch;
            
            // 🚨 PER-BRANCH DEBUGGING
            console.log('🚨🚨🚨 BRANCH ITEM RENDER:', {
              branchName: JSON.stringify(branch.name),
              currentBranch: JSON.stringify(currentBranch),
              isCurrentBranch,
              exactMatch: `"${branch.name}" === "${currentBranch}"`,
              branchCharCodes: Array.from(branch.name).map(c => `${c}(${c.charCodeAt(0)})`),
              currentCharCodes: currentBranch ? Array.from(currentBranch).map(c => `${c}(${c.charCodeAt(0)})`) : 'null'
            });
            
            return (
              <DropdownMenuItem
                key={branch.name}
                onClick={() => {
                  console.log('🚨🚨🚨 DROPDOWN MENU ITEM ONCLICK FIRED:', {
                    branchName: JSON.stringify(branch.name),
                    timestamp: new Date().toISOString()
                  });
                  handleSwitchBranch(branch.name);
                }}
                className={`flex items-center justify-between ${
                  isCurrentBranch ? 'bg-blue-100 text-blue-900' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span>{branch.name}</span>
                  {branch.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      default
                    </Badge>
                  )}
                </div>
                {isCurrentBranch && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create new branch
          </DropdownMenuItem>
          
          {deletableBranches.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete branch
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {deletableBranches.map((branch) => (
                    <DropdownMenuItem
                      key={`delete-${branch.name}`}
                      onClick={() => setBranchToDelete(branch.name)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {branch.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="branch-name">Branch Name</Label>
              <Input
                id="branch-name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="feature/my-new-feature"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !creating) {
                    handleCreateBranch();
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Branch will be created from: <code className="bg-muted px-1 py-0.5 rounded">{currentBranch}</code>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim() || creating}
              >
                {creating ? 'Creating...' : 'Create Branch'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!branchToDelete} onOpenChange={() => setBranchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the branch "{branchToDelete}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBranch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
