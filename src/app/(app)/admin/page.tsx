'use client';

import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { NewUserDialog } from '@/components/admin/new-user-dialog';
import { PlusCircle } from 'lucide-react';
import type { User, Anchor, Dealer, Vendor, UserRole } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';

// Define a union type for the different kinds of leads
type LeadType = 'Anchor' | 'Dealer' | 'Vendor';

// A specific type for what the LeadTable component needs to display.
// This ensures type safety and avoids using `any`.
type DisplayLead = (Partial<Anchor> & Partial<Dealer> & Partial<Vendor>) & {
  id: string;
  name: string;
};

// --- Component defined at the top level with a clean interface ---
interface LeadTableProps {
  title: string;
  leads: DisplayLead[];
  assignableUsers: User[];
  assignments: Record<string, string>;
  onAssignmentChange: (leadId: string, userId: string) => void;
  onAssign: (leadId: string) => void;
}

function LeadTable({
  title,
  leads,
  assignableUsers,
  assignments,
  onAssignmentChange,
  onAssign,
}: LeadTableProps) {
  const { t } = useLanguage();
  if (leads.length === 0) {
    return null;
  }

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
                <TableHead>{t('admin.table.name')}</TableHead>
                <TableHead>{t('admin.table.contactIndustry')}</TableHead>
                <TableHead>{t('admin.table.assignTo')}</TableHead>
                <TableHead className="text-right">{t('admin.table.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.contactNumber || lead.industry || 'N/A'}</TableCell>
                  <TableCell>
                    <Select onValueChange={(value) => onAssignmentChange(lead.id, value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('admin.selectUser')} />
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
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => onAssign(lead.id)} disabled={!assignments[lead.id]}>
                      {t('admin.assign')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Mobile Cards */}
        <div className="space-y-4 md:hidden">
          {leads.map((lead) => (
            <Card key={lead.id} className="p-0">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{lead.name}</CardTitle>
                <CardDescription>{lead.contactNumber || lead.industry || 'N/A'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <Select onValueChange={(value) => onAssignmentChange(lead.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.selectUser')} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableUsers.map((user) => (
                      <SelectItem key={user.uid} value={user.uid}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => onAssign(lead.id)} disabled={!assignments[lead.id]} className="w-full">
                  {t('admin.assign')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { anchors, dealers, vendors, users, updateAnchor, updateDealer, updateVendor, currentUser, visibleUsers } = useApp();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const assignableUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') {
      // Admins can assign to any non-admin, non-specialist user.
      return users.filter(u => u.role !== 'Admin' && u.role !== 'Onboarding Specialist');
    }
    if(currentUser.role === 'Onboarding Specialist') {
      return users.filter(u => ['Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(u.role));
    }
    // Managers can assign to their direct or indirect subordinates.
    // 'visibleUsers' includes the manager themselves, so filter them out.
    return visibleUsers.filter(u => u.uid !== currentUser.uid);
  }, [currentUser, users, visibleUsers]);

  const unassignedAnchors = anchors.filter((a) => a.assignedTo === null || a.status === 'Unassigned Lead');
  const unassignedDealers = dealers.filter((d) => d.assignedTo === null || d.onboardingStatus === 'Unassigned Lead');
  const unassignedVendors = vendors.filter((s) => s.assignedTo === null || s.onboardingStatus === 'Unassigned Lead');

  const handleAssignmentChange = (leadId: string, userId: string) => {
    setAssignments((prev) => ({ ...prev, [leadId]: userId }));
  };

  const handleAssign = (leadId: string, leadType: LeadType) => {
    const assignedToId = assignments[leadId];
    if (!assignedToId) {
      toast({ variant: 'destructive', title: 'No user selected' });
      return;
    }

    const user = users.find((u) => u.uid === assignedToId);

    if (leadType === 'Anchor') {
      const anchor = anchors.find((a) => a.id === leadId);
      if (anchor) updateAnchor({ ...anchor, assignedTo: assignedToId, status: 'Lead' });
    } else if (leadType === 'Dealer') {
      const dealer = dealers.find((d) => d.id === leadId);
      if (dealer) updateDealer({ ...dealer, assignedTo: assignedToId, onboardingStatus: 'Invited' });
    } else if (leadType === 'Vendor') {
      const vendor = vendors.find((s) => s.id === leadId);
      if (vendor) updateVendor({ ...vendor, assignedTo: assignedToId, onboardingStatus: 'Invited' });
    }

    toast({ title: 'Lead Assigned', description: `Lead assigned to ${user?.name}.` });
    setAssignments((prev) => {
      const newAssignments = { ...prev };
      delete newAssignments[leadId];
      return newAssignments;
    });
  };

  const managerialRoles: UserRole[] = ['Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];
  if (!currentUser || (currentUser.role !== 'Admin' && !managerialRoles.includes(currentUser.role) && currentUser.role !== 'Onboarding Specialist')) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const getManagerName = (managerId?: string | null) => {
    if (!managerId) return 'N/A';
    return users.find((u) => u.uid === managerId)?.name || 'Unknown';
  };

  return (
    <>
      <PageHeader title={t('admin.title')} description={t('admin.description')} />
      <NewUserDialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen} />
      <div className="grid gap-4 mt-6">
        {currentUser.role === 'Admin' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{t('admin.userManagement')}</CardTitle>
                  <CardDescription>{t('admin.userManagementDescription')}</CardDescription>
                </div>
                <Button onClick={() => setIsNewUserDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('admin.addNewUser')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Desktop Table */}
              <div className="hidden rounded-lg border md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.table.name')}</TableHead>
                      <TableHead>{t('admin.table.email')}</TableHead>
                      <TableHead>{t('admin.table.role')}</TableHead>
                      <TableHead>{t('admin.table.manager')}</TableHead>
                      <TableHead>{t('admin.table.region')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{getManagerName(user.managerId)}</TableCell>
                        <TableCell>{user.region || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile Cards */}
              <div className="space-y-4 md:hidden">
                {users.map((user) => (
                  <Card key={user.uid} className="p-0">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">{user.name}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1 p-4 pt-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('admin.table.role')}:</span>
                        <span className="font-medium">{user.role}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('admin.table.manager')}:</span>
                        <span className="font-medium">{getManagerName(user.managerId)}</span>
                      </div>
                       <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('admin.table.region')}:</span>
                        <span className="font-medium">{user.region || 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <LeadTable
          title={t('admin.unassignedAnchors')}
          leads={unassignedAnchors}
          assignableUsers={assignableUsers}
          assignments={assignments}
          onAssign={(id) => handleAssign(id, 'Anchor')}
          onAssignmentChange={handleAssignmentChange}
        />
        <LeadTable
          title={t('admin.unassignedDealers')}
          leads={unassignedDealers}
          assignableUsers={assignableUsers}
          assignments={assignments}
          onAssign={(id) => handleAssign(id, 'Dealer')}
          onAssignmentChange={handleAssignmentChange}
        />
        <LeadTable
          title={t('admin.unassignedVendors')}
          leads={unassignedVendors}
          assignableUsers={assignableUsers}
          assignments={assignments}
          onAssign={(id) => handleAssign(id, 'Vendor')}
          onAssignmentChange={handleAssignmentChange}
        />
      </div>
    </>
  );
}
