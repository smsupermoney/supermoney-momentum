

'use client';

import { useApp } from '@/contexts/app-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Dealer, SpokeStatus } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';
import { useState } from 'react';


interface DealerDetailsDialogProps {
  dealer: Dealer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealerDetailsDialog({ dealer, open, onOpenChange }: DealerDetailsDialogProps) {
  const { updateDealer, anchors, currentUser, deleteDealer } = useApp();
  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const anchorName = dealer.anchorId ? anchors.find(a => a.id === dealer.anchorId)?.name : 'N/A';

  const handleStatusChange = (newStatus: SpokeStatus) => {
    updateDealer({ ...dealer, status: newStatus });
    toast({
      title: 'Dealer Status Updated',
      description: `${dealer.name}'s status is now ${newStatus}.`,
    });
  };

  const handleDelete = () => {
    deleteDealer(dealer.id);
    onOpenChange(false); // close the details dialog
  };

  const canDelete = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Business Development');

  return (
    <>
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
            <DialogTitle>{dealer.name}</DialogTitle>
            <DialogDescription>
                Update the status and view details for this dealer.
            </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted-foreground">Lead ID</p><p>{dealer.leadId || 'N/A'}</p></div>
                    <div><p className="text-muted-foreground">Contact Number</p><p>{dealer.contacts?.[0]?.phone || 'N/A'}</p></div>
                    <div><p className="text-muted-foreground">Email</p><p>{dealer.contacts?.[0]?.email || 'N/A'}</p></div>
                    <div><p className="text-muted-foreground">City</p><p>{dealer.city || 'N/A'}</p></div>
                     <div><p className="text-muted-foreground">State</p><p>{dealer.state || 'N/A'}</p></div>
                    <div><p className="text-muted-foreground">GSTIN</p><p>{dealer.gstin || 'N/A'}</p></div>
                    <div><p className="text-muted-foreground">Anchor</p><p>{anchorName}</p></div>
                    <div><p className="text-muted-foreground">Product Interest</p><p>{dealer.product || 'N/A'}</p></div>
                    <div><p className="text-muted-foreground">Lead Type</p><p>{dealer.leadType || 'Fresh'}</p></div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(v) => handleStatusChange(v as SpokeStatus)} defaultValue={dealer.status}>
                        <SelectTrigger id="status">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Onboarding">Onboarding</SelectItem>
                            <SelectItem value="Partial Docs">Partial Docs</SelectItem>
                            <SelectItem value="Follow Up">Follow Up</SelectItem>
                            <SelectItem value="Already Onboarded">Already Onboarded</SelectItem>
                            <SelectItem value="Disbursed">Disbursed</SelectItem>
                            <SelectItem value="Not reachable">Not reachable</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                            <SelectItem value="Not Interested">Not Interested</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {dealer.leadScore && (
                    <Card className="bg-secondary">
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">AI Scoring Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-2xl font-bold text-primary">{dealer.leadScore}</span>
                                <span className="text-sm text-muted-foreground">/ 100</span>
                            </div>
                            <p className="text-xs text-secondary-foreground italic">"{dealer.leadScoreReason}"</p>
                        </CardContent>
                    </Card>
                )}
            </div>
            <DialogFooter className="justify-between">
                <div>
                  {canDelete && (
                      <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                      </Button>
                  )}
                </div>
                <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the lead for {dealer.name}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        Delete Lead
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
