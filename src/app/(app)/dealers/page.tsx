'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { NewLeadDialog } from '@/components/leads/new-lead-dialog';
import { BulkUploadDialog } from '@/components/leads/bulk-upload-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Upload } from 'lucide-react';

export default function DealersPage() {
  const { dealers, anchors, users, currentUser } = useApp();
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  const userDealers = dealers.filter(d => 
    currentUser.role === 'Admin' || d.assignedTo === currentUser.uid
  );

  const getAnchorName = (anchorId: string | null) => {
    if (!anchorId) return 'N/A';
    return anchors.find(a => a.id === anchorId)?.name || 'Unknown';
  };

  const getAssignedToName = (userId: string | null) => {
    if (!userId) return 'Unassigned';
    return users.find(u => u.uid === userId)?.name || 'Unknown';
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {userDealers.length > 0 ? userDealers.map(dealer => (
              <TableRow key={dealer.id}>
                <TableCell className="font-medium">{dealer.name}</TableCell>
                <TableCell>{dealer.contactNumber}</TableCell>
                <TableCell>{dealer.location || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={dealer.onboardingStatus === 'Active' ? 'default' : 'secondary'}>{dealer.onboardingStatus}</Badge>
                </TableCell>
                <TableCell>{getAnchorName(dealer.anchorId)}</TableCell>
                <TableCell>{getAssignedToName(dealer.assignedTo)}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
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
