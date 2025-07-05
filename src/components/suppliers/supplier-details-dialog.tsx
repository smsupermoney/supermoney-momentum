
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
import type { Vendor, OnboardingStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface VendorDetailsDialogProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorDetailsDialog({ vendor, open, onOpenChange }: VendorDetailsDialogProps) {
  const { updateVendor, anchors } = useApp();
  const { toast } = useToast();

  const anchorName = vendor.anchorId ? anchors.find(a => a.id === vendor.anchorId)?.name : 'N/A';

  const handleStatusChange = (newStatus: OnboardingStatus) => {
    updateVendor({ ...vendor, onboardingStatus: newStatus });
    toast({
      title: 'Vendor Status Updated',
      description: `${vendor.name}'s status is now ${newStatus}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{vendor.name}</DialogTitle>
          <DialogDescription>
            Update the onboarding status and view details for this vendor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Contact Number</p><p>{vendor.contactNumber}</p></div>
                <div><p className="text-muted-foreground">Email</p><p>{vendor.email || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">Location</p><p>{vendor.location || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">GSTIN</p><p>{vendor.gstin || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">Associated Anchor</p><p>{anchorName}</p></div>
                <div><p className="text-muted-foreground">Product Interest</p><p>{vendor.product || 'N/A'}</p></div>
                <div><p className="text-muted-foreground">Lead Type</p><p>{vendor.leadType || 'New Lead'}</p></div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="onboarding-status">Onboarding Status</Label>
                <Select onValueChange={(v) => handleStatusChange(v as OnboardingStatus)} defaultValue={vendor.onboardingStatus}>
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
            {vendor.leadScore && (
                <Card className="bg-secondary">
                    <CardHeader className="p-4">
                        <CardTitle className="text-base">AI Scoring Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-bold text-primary">{vendor.leadScore}</span>
                            <span className="text-sm text-muted-foreground">/ 100</span>
                        </div>
                        <p className="text-xs text-secondary-foreground italic">"{vendor.leadScoreReason}"</p>
                    </CardContent>
                </Card>
            )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
