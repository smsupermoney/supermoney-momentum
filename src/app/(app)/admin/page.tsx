
'use client';

import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { NewUserDialog } from '@/components/admin/new-user-dialog';
import { PlusCircle } from 'lucide-react';
import type { User } from '@/lib/types';

type LeadType = 'Anchor' | 'Dealer' | 'Vendor';

function LeadTable({ 
  title, 
  leads, 
  onAssign, 
  salesUsers, 
  assignments, 
  setAssignments 
}: { 
  title: string, 
  leads: any[], 
  onAssign: (id: string) => void,
  salesUsers: User[],
  assignments: Record<string, string>,
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  if (leads.length === 0) return null;
  
  return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact / Industry</TableHead>
                  <TableHead>Assign To</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{(lead as any).contactNumber || (lead as any).industry}</TableCell>
                    <TableCell>
                      <Select onValueChange={(value) => setAssignments(prev => ({ ...prev, [lead.id]: value }))}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select sales user" />
                        </SelectTrigger>
                        <SelectContent>
                          {salesUsers.map(user => (
                            <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => onAssign(lead.id)} disabled={!assignments[lead.id]}>Assign</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {leads.map(lead => (
              <Card key={lead.id} className="p-0">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">{lead.name}</CardTitle>
                  <CardDescription>{(lead as any).contactNumber || (lead as any).industry}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <Select onValueChange={(value) => setAssignments(prev => ({ ...prev, [lead.id]: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales user" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesUsers.map(user => (
                        <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => onAssign(lead.id)} disabled={!assignments[lead.id]} className="w-full">Assign</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
  );
}

export default function AdminPage() {
  const { anchors, dealers, vendors, users, updateAnchor, updateDealer, updateVendor, currentUser } = useApp();
  const { toast } = useToast();
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);

  const salesUsers = users.filter(u => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin' || currentUser.role === 'Onboarding Specialist') {
        return u.role === 'Sales' || u.role === 'Zonal Sales Manager';
    }
    if (currentUser.role === 'Zonal Sales Manager') {
        return u.role === 'Sales' && u.managerId === currentUser.uid;
    }
    return false;
  });

  const unassignedAnchors = anchors.filter(a => a.assignedTo === null || a.status === 'Unassigned Lead');
  const unassignedDealers = dealers.filter(d => d.assignedTo === null || d.onboardingStatus === 'Unassigned Lead');
  const unassignedVendors = vendors.filter(s => s.assignedTo === null || s.onboardingStatus === 'Unassigned Lead');

  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const handleAssign = (leadId: string, leadType: LeadType) => {
    const assignedToId = assignments[leadId];
    if (!assignedToId) {
        toast({ variant: 'destructive', title: 'No user selected' });
        return;
    }
    
    const user = users.find(u => u.uid === assignedToId);

    if (leadType === 'Anchor') {
        const anchor = anchors.find(a => a.id === leadId);
        if(anchor) updateAnchor({...anchor, assignedTo: assignedToId, status: 'Lead' });
    } else if (leadType === 'Dealer') {
        const dealer = dealers.find(d => d.id === leadId);
        if(dealer) updateDealer({...dealer, assignedTo: assignedToId, onboardingStatus: 'Invited'});
    } else if (leadType === 'Vendor') {
        const vendor = vendors.find(s => s.id === leadId);
        if(vendor) updateVendor({...vendor, assignedTo: assignedToId, onboardingStatus: 'Invited'});
    }
    
    toast({ title: 'Lead Assigned', description: `Lead assigned to ${user?.name}.` });
  };
  
  if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Zonal Sales Manager' && currentUser.role !== 'Onboarding Specialist')) {
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
    );
  }

  const getManagerName = (managerId?: string | null) => {
    if (!managerId) return 'N/A';
    return users.find(u => u.uid === managerId)?.name || 'Unknown';
  };

  return (
    <>
      <PageHeader title="Admin Panel" description="Manage unassigned leads and system users." />
      <NewUserDialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen} />
      <div className="grid gap-4 mt-6">
        {currentUser.role === 'Admin' && (
          <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Add new users and manage existing ones.</CardDescription>
                    </div>
                    <Button onClick={() => setIsNewUserDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New User
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className="hidden rounded-lg border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Manager</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{getManagerName(user.managerId)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile Cards */}
               <div className="space-y-4 md:hidden">
                    {users.map(user => (
                         <Card key={user.uid} className="p-0">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base">{user.name}</CardTitle>
                                <CardDescription>{user.email}</CardDescription>
                            </Header>
                            <CardContent className="p-4 pt-0 space-y-1">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Role:</span>
                                    <span className="font-medium">{user.role}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Manager:</span>
                                    <span className="font-medium">{getManagerName(user.managerId)}</span>
                                </div>
                            </CardContent>
                         </Card>
                    ))}
                </div>
            </CardContent>
          </Card>
        )}
        <LeadTable 
            title="Unassigned Anchors" 
            leads={unassignedAnchors} 
            onAssign={(id) => handleAssign(id, 'Anchor')}
            salesUsers={salesUsers}
            assignments={assignments}
            setAssignments={setAssignments}
        />
        <LeadTable 
            title="Unassigned Dealers" 
            leads={unassignedDealers} 
            onAssign={(id) => handleAssign(id, 'Dealer')}
            salesUsers={salesUsers}
            assignments={assignments}
            setAssignments={setAssignments}
        />
        <LeadTable 
            title="Unassigned Vendors" 
            leads={unassignedVendors} 
            onAssign={(id) => handleAssign(id, 'Vendor')}
            salesUsers={salesUsers}
            assignments={assignments}
            setAssignments={setAssignments}
        />
      </div>
    </>
  );
}
