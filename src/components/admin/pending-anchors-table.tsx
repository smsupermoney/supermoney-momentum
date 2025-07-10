
'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Anchor, UserRole } from '@/lib/types';
import { format } from 'date-fns';

export function PendingAnchorsTable() {
  const { anchors, users, updateAnchor, currentUser } = useApp();
  const { toast } = useToast();
  
  const managerialRoles: UserRole[] = ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];
  const canViewTable = currentUser && managerialRoles.includes(currentUser.role);

  if (!canViewTable) {
    return null;
  }

  const pendingAnchors = anchors.filter(a => a.status === 'Pending Approval');

  if (pendingAnchors.length === 0) {
    return null;
  }
  
  const getUserName = (uid: string | undefined) => {
    if (!uid) return 'Unknown';
    return users.find(u => u.uid === uid)?.name || 'Unknown';
  }

  const handleApprove = (anchor: Anchor) => {
    updateAnchor({ ...anchor, status: 'Unassigned Lead' });
    toast({ title: 'Anchor Approved', description: `${anchor.name} is now ready for assignment.` });
  };

  const handleReject = (anchor: Anchor) => {
    updateAnchor({ ...anchor, status: 'Rejected' });
    toast({ variant: 'destructive', title: 'Anchor Rejected', description: `${anchor.name} has been rejected.` });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anchors Pending Approval</CardTitle>
        <CardDescription>Review and approve or reject new anchors created by the Business Development team.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingAnchors.map((anchor) => (
                <TableRow key={anchor.id}>
                  <TableCell className="font-medium">{anchor.name}</TableCell>
                  <TableCell>{anchor.industry}</TableCell>
                  <TableCell>{getUserName(anchor.createdBy)}</TableCell>
                  <TableCell>{format(new Date(anchor.createdAt), 'PP')}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleReject(anchor)}>Reject</Button>
                    <Button size="sm" onClick={() => handleApprove(anchor)}>Approve</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
