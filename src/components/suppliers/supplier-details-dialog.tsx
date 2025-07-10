

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
import type { Vendor, SpokeStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';

interface VendorDetailsDialogProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailItem({ label, value }: { label: string, value?: string | number | null }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p>{value}</p>
        </div>
    )
}

export function VendorDetailsDialog({ vendor, open, onOpenChange }: VendorDetailsDialogProps) {
  const { updateVendor, anchors, currentUser, deleteVendor, lenders } = useApp();
  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const anchorName = vendor.anchorId ? anchors.find(a => a.id === vendor.anchorId)?.name : 'N/A';
  const lenderName = vendor.lenderId ? lenders.find(l => l.id === vendor.lenderId)?.name : 'N/A';

  const handleStatusChange = (newStatus: SpokeStatus) => {
    updateVendor({ ...vendor, status: newStatus });
    toast({
      title: 'Vendor Status Updated',
      description: `${vendor.name}'s status is now ${newStatus}.`,
    });
  };

  const handleDelete = () => {
    deleteVendor(vendor.id);
    onOpenChange(false);
  };

  const canDelete = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Business Development');

  return (
    <>
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
            <DialogTitle>{vendor.name}</DialogTitle>
            <DialogDescription>
                Update the status and view details for this vendor.
            </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
                
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select onValueChange={(v) => handleStatusChange(v as SpokeStatus)} defaultValue={vendor.status}>
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

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <DetailItem label="Lead ID" value={vendor.leadId} />
                    <DetailItem label="Lead Date" value={vendor.leadDate ? format(new Date(vendor.leadDate), 'PPP') : 'N/A'} />
                    <DetailItem label="Lead Type" value={vendor.leadType} />
                    <DetailItem label="Lead Source" value={vendor.leadSource} />
                    <DetailItem label="Deal Value (INR Cr)" value={vendor.dealValue} />
                    <DetailItem label="Anchor" value={anchorName} />
                    <DetailItem label="Product Interest" value={vendor.product} />
                    <DetailItem label="Lender" value={lenderName} />
                    <DetailItem label="GSTIN" value={vendor.gstin} />
                    <DetailItem label="City" value={vendor.city} />
                    <DetailItem label="State" value={vendor.state} />
                    <DetailItem label="Zone" value={vendor.zone} />
                </div>

                {vendor.remarks && (
                    <DetailItem label="Remarks" value={vendor.remarks} />
                )}

                {(vendor.contacts || []).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Contacts</h4>
                    {(vendor.contacts || []).map((contact, index) => (
                      <div key={contact.id || index}>
                         {index > 0 && <Separator className="my-3" />}
                         <div className="flex items-start gap-3">
                            <User className="h-4 w-4 mt-1 text-muted-foreground" />
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm flex-1">
                                <DetailItem label="Name" value={contact.name} />
                                <DetailItem label="Designation" value={contact.designation} />
                                <DetailItem label="Email" value={contact.email} />
                                <DetailItem label="Phone" value={contact.phone} />
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
                
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
            <DialogFooter className="justify-between sm:justify-between pt-4">
                 <div>
                  {canDelete && (
                      <Button variant="destructive" size="sm" onClick={() => setIsDeleteAlertOpen(true)}>
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
                        This action cannot be undone. This will permanently delete the lead for {vendor.name}.
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

