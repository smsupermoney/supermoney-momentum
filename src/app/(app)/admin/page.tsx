'use client';

import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

type LeadType = 'Anchor' | 'Dealer' | 'Supplier';

export default function AdminPage() {
  const { anchors, dealers, suppliers, users, updateAnchor, updateDealer, updateSupplier, currentUser } = useApp();
  const { toast } = useToast();

  const salesUsers = users.filter(u => {
    if (currentUser.role === 'Admin') {
        return u.role === 'Sales' || u.role === 'Zonal Sales Manager';
    }
    if (currentUser.role === 'Zonal Sales Manager') {
        return u.role === 'Sales' && u.managerId === currentUser.uid;
    }
    return false;
  });

  const unassignedAnchors = anchors.filter(a => a.assignedTo === null || a.status === 'Unassigned Lead');
  const unassignedDealers = dealers.filter(d => d.assignedTo === null || d.onboardingStatus === 'Unassigned Lead');
  const unassignedSuppliers = suppliers.filter(s => s.assignedTo === null || s.onboardingStatus === 'Unassigned Lead');

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
    } else {
        const supplier = suppliers.find(s => s.id === leadId);
        if(supplier) updateSupplier({...supplier, assignedTo: assignedToId, onboardingStatus: 'Invited'});
    }
    
    toast({ title: 'Lead Assigned', description: `Lead assigned to ${user?.name}.` });
  };
  
  if (currentUser.role !== 'Admin' && currentUser.role !== 'Zonal Sales Manager') {
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
    )
  }

  return (
    <>
      <PageHeader title="Admin Panel" description="Assign unassigned leads to sales representatives." />
      <div className="grid gap-8">
        <LeadTable title="Unassigned Anchors" leads={unassignedAnchors} onAssign={(id) => handleAssign(id, 'Anchor')} />
        <LeadTable title="Unassigned Dealers" leads={unassignedDealers} onAssign={(id) => handleAssign(id, 'Dealer')} />
        <LeadTable title="Unassigned Suppliers" leads={unassignedSuppliers} onAssign={(id) => handleAssign(id, 'Supplier')} />
      </div>
    </>
  );

  function LeadTable({ title, leads, onAssign }: { title: string, leads: any[], onAssign: (id: string) => void }) {
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
                  {leads.length > 0 ? leads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.contactNumber || lead.industry}</TableCell>
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
                  )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">No unassigned leads.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Cards */}
            <div className="space-y-4 md:hidden">
              {leads.length > 0 ? leads.map(lead => (
                <Card key={lead.id} className="p-4">
                  <div className="space-y-3">
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.contactNumber || lead.industry}</p>
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
                  </div>
                </Card>
              )) : (
                <div className="h-24 text-center flex items-center justify-center text-muted-foreground">No unassigned leads.</div>
              )}
            </div>
          </CardContent>
        </Card>
    )
  }
}
