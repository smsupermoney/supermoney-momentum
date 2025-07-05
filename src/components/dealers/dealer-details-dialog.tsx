
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
import type { Dealer, OnboardingStatus } from '@/lib/types';


interface DealerDetailsDialogProps {
  dealer: Dealer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealerDetailsDialog({ dealer, open, onOpenChange }: DealerDetailsDialogProps) {
  const { updateDealer, anchors } = useApp();
  const { toast } = useToast();

  const anchorName = dealer.anchorId ? anchors.find(a => a.id === dealer.anchorId)?.name : 'N/A';

  const handleStatusChange = (newStatus: OnboardingStatus) => {
    updateDealer({ ...dealer, onboardingStatus: newStatus });
    toast({
      title: 'Dealer Status Updated',
      description: `${dealer.name}'s status is now ${newStatus}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dealer.name}</DialogTitle>
          <DialogDescription>
            Update the onboarding status and view details for this dealer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Contact Number</p><p>{dealer.contactNumber}</p></div>
                <div><p className="text-muted-foreground">Location</p><p>{dealer.location || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">GSTIN</p><p>{dealer.gstin || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">Associated Anchor</p><p>{anchorName}</p></div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="onboarding-status">Onboarding Status</Label>
                <Select onValueChange={(v) => handleStatusChange(v as OnboardingStatus)} defaultValue={dealer.onboardingStatus}>
                    <SelectTrigger id="onboarding-status">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Invited">Invited</SelectItem>
                        <SelectItem value="KYC Pending">KYC Pending</SelectItem>
                        <SelectItem value="Not reachable">Not reachable</SelectItem>
                        <SelectItem value="Agreement Pending">Agreement Pending</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Not Interested">Not Interested</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
