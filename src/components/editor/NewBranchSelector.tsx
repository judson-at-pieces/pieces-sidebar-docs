
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

export function NewBranchSelector() {
  const {
    branches,
    currentBranch,
    loading,
    createBranch,
    switchBranch,
    deleteBranch,
  } = useBranchManager();

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
            🔍 DEBUG: {currentBranch || 'Loading...'}
            {currentBranchData?.isDefault && (
              <Badge variant="secondary" className="text-xs ml-1">
                default
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            Switch Branch (Total: {branches.length})
          </div>
          <DropdownMenuSeparator />
          
          {sortedBranches.map((branch) => (
            <DropdownMenuItem
              key={branch.name}
              onClick={() => switchBranch(branch.name)}
              className={`flex items-center justify-between ${
                branch.name === currentBranch ? 'bg-blue-100 text-blue-900' : ''
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
              {branch.name === currentBranch && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          
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
