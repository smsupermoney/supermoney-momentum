
'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Anchor, User, UserRole } from '@/lib/types';
import { format } from 'date-fns';

interface UnassignedAnchorsTableProps {
  assignments: Record<string, string>;
  onAssignmentChange: (leadId: string, userId: string) => void;
  onAssign: (leadId: string) => void;
  assignableUsers: User[];
}

export function UnassignedAnchorsTable({
  assignments,
  onAssignmentChange,
  onAssign,
  assignableUsers
}: UnassignedAnchorsTableProps) {
  const { anchors, users, currentUser } = useApp();
  
  const managerialRoles: UserRole[] = ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];
  const canViewTable = currentUser && managerialRoles.includes(currentUser.role);

  if (!canViewTable) {
    return null;
  }

  const unassignedAnchors = anchors.filter(a => a.status === 'Unassigned Lead');

  if (unassignedAnchors.length === 0) {
    return null;
  }
  
  const getUserName = (uid: string | undefined) => {
    if (!uid) return 'Unknown';
    return users.find(u => u.uid === uid)?.name || 'Unknown';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unassigned Anchors</CardTitle>
        <CardDescription>Assign new anchor leads to the appropriate sales team member.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Assign To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unassignedAnchors.map((anchor) => (
                <TableRow key={anchor.id}>
                  <TableCell className="font-medium">{anchor.name}</TableCell>
                  <TableCell>{anchor.industry}</TableCell>
                  <TableCell>{getUserName(anchor.createdBy)}</TableCell>
                  <TableCell>
                     <Select onValueChange={(value) => onAssignmentChange(anchor.id, value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableUsers.map((user) => (
                          <SelectItem key={user.uid} value={user.uid}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" onClick={() => onAssign(anchor.id)} disabled={!assignments[anchor.id]}>
                      Assign
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Mobile Cards */}
        <div className="space-y-4 md:hidden">
           {unassignedAnchors.map((anchor) => (
            <Card key={anchor.id} className="p-0">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{anchor.name}</CardTitle>
                <CardDescription>
                  {anchor.industry} &bull; Created by: {getUserName(anchor.createdBy)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <Select onValueChange={(value) => onAssignmentChange(anchor.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableUsers.map((user) => (
                      <SelectItem key={user.uid} value={user.uid}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => onAssign(anchor.id)} disabled={!assignments[anchor.id]} className="w-full">
                  Assign
                </Button>
              </CardContent>
            </Card>
           ))}
        </div>
      </CardContent>
    </Card>
  );
}
