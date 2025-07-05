'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { NewLeadDialog } from '@/components/leads/new-lead-dialog';
import { BulkUploadDialog } from '@/components/leads/bulk-upload-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Upload } from 'lucide-react';
import type { Dealer, OnboardingStatus } from '@/lib/types';
import { DealerDetailsDialog } from '@/components/dealers/dealer-details-dialog';

export default function DealersPage() {
  const { dealers, anchors, users, currentUser } = useApp();
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  if (currentUser.role === 'Onboarding Specialist') {
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
    );
  }

  const userDealers = dealers.filter(d => {
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'Zonal Sales Manager') {
        const teamMemberIds = users.filter(u => u.managerId === currentUser.uid).map(u => u.uid);
        teamMemberIds.push(currentUser.uid);
        return teamMemberIds.includes(d.assignedTo || '');
    }
    return d.assignedTo === currentUser.uid;
  });

  const getAnchorName = (anchorId: string | null) => {
    if (!anchorId) return 'N/A';
    return anchors.find(a => a.id === anchorId)?.name || 'Unknown';
  };

  const getAssignedToName = (userId: string | null) => {
    if (!userId) return 'Unassigned';
    return users.find(u => u.uid === userId)?.name || 'Unknown';
  };
  
  const getStatusVariant = (status: OnboardingStatus): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
        case 'Active':
            return 'default';
        case 'Rejected':
        case 'Not Interested':
        case 'Inactive':
            return 'destructive';
        case 'Unassigned Lead':
            return 'outline';
        case 'Invited':
        case 'KYC Pending':
        case 'Not reachable':
        case 'Agreement Pending':
            return 'secondary';
        default:
            return 'outline';
    }
  };


  return (
    <>
      <PageHeader title="Dealers" description="Manage all dealer relationships.">
        <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
        <Button onClick={() => setIsNewLeadOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Dealer Lead
        </Button>
      </PageHeader>
      
      <NewLeadDialog type="Dealer" open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen} />
      <BulkUploadDialog type="Dealer" open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen} />
      {selectedDealer && (
        <DealerDetailsDialog
            dealer={selectedDealer}
            open={!!selectedDealer}
            onOpenChange={(open) => { if(!open) setSelectedDealer(null); }}
        />
      )}


      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact Number</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Onboarding Status</TableHead>
              <TableHead>Associated Anchor</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userDealers.length > 0 ? userDealers.map(dealer => (
              <TableRow key={dealer.id} onClick={() => setSelectedDealer(dealer)} className="cursor-pointer">
                <TableCell className="font-medium">{dealer.name}</TableCell>
                <TableCell>{dealer.contactNumber}</TableCell>
                <TableCell>{dealer.location || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(dealer.onboardingStatus)}>{dealer.onboardingStatus}</Badge>
                </TableCell>
                <TableCell>{getAnchorName(dealer.anchorId)}</TableCell>
                <TableCell>{getAssignedToName(dealer.assignedTo)}</TableCell>
                <TableCell className="text-right">
                    <Button size="sm" asChild onClick={(e) => e.stopPropagation()}>
                        <Link href="https://supermoney.in/onboarding" target="_blank">
                            Start Onboarding
                        </Link>
                    </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No dealers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
