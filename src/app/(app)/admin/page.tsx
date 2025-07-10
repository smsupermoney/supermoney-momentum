
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
import { PlusCircle, Trash2 } from 'lucide-react';
import type { User, Anchor, Dealer, Vendor, UserRole } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
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
import { PendingAnchorsTable } from '@/components/admin/pending-anchors-table';
import { ArchivedAnchorsTable } from '@/components/admin/archived-anchors-table';
import { Separator } from '@/components/ui/separator';


// Define a union type for the different kinds of leads
type LeadType = 'Dealer' | 'Vendor';

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
    <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold">{title}</h3>
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
    </div>
  );
}

export default function AdminPage() {
  const { dealers, vendors, users, updateDealer, updateVendor, currentUser, visibleUsers, deleteUser } = useApp();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const assignableUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') {
      // Admins can assign to any non-admin, non-specialist user.
      return users.filter(u => u.role !== 'Admin' && u.role !== 'Business Development');
    }
    if(currentUser.role === 'Business Development') {
      return users.filter(u => ['Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(u.role));
    }
    // Managers can assign to their direct or indirect subordinates.
    // 'visibleUsers' includes the manager themselves, so filter them out.
    return visibleUsers.filter(u => u.uid !== currentUser.uid);
  }, [currentUser, users, visibleUsers]);

  const unassignedDealers = dealers.filter((d) => d.assignedTo === null || d.status === 'Unassigned Lead');
  const unassignedVendors = vendors.filter((s) => s.assignedTo === null || s.status === 'Unassigned Lead');

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

    if (leadType === 'Dealer') {
      const dealer = dealers.find((d) => d.id === leadId);
      if (dealer) updateDealer({ ...dealer, assignedTo: assignedToId, status: 'Invited' });
    } else if (leadType === 'Vendor') {
      const vendor = vendors.find((s) => s.id === leadId);
      if (vendor) updateVendor({ ...vendor, assignedTo: assignedToId, status: 'Invited' });
    }

    toast({ title: 'Lead Assigned', description: `Lead assigned to ${user?.name}.` });
    setAssignments((prev) => {
      const newAssignments = { ...prev };
      delete newAssignments[leadId];
      return newAssignments;
    });
  };

  const handleDeleteUser = () => {
    if (userToDelete) {
        deleteUser(userToDelete.uid);
        setUserToDelete(null);
    }
  };

  const managerialRoles: UserRole[] = ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];
  const canViewAdminPanel = currentUser && (managerialRoles.includes(currentUser.role) || currentUser.role === 'Business Development');
  const isTrueAdmin = currentUser && currentUser.role === 'Admin';


  if (!canViewAdminPanel) {
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
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user account for {userToDelete?.name} and remove them from the system.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
                    Delete User
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6 mt-6">
        {/* Section for all managers */}
        <PendingAnchorsTable />

        <Card>
           <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>{t('admin.userManagement')}</CardTitle>
                        <CardDescription>{t('admin.userManagementDescription')}</CardDescription>
                    </div>
                    {isTrueAdmin && (
                        <Button onClick={() => setIsNewUserDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('admin.addNewUser')}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {/* Section for Admins only */}
                {isTrueAdmin && (
                  <>
                    <ArchivedAnchorsTable />
                    <Separator className="my-6" />
                    {/* Desktop User Table */}
                    <div className="hidden rounded-lg border md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('admin.table.name')}</TableHead>
                            <TableHead>{t('admin.table.email')}</TableHead>
                            <TableHead>{t('admin.table.role')}</TableHead>
                            <TableHead>{t('admin.table.manager')}</TableHead>
                            <TableHead>{t('admin.table.region')}</TableHead>
                            <TableHead className="text-right">{t('admin.table.action')}</TableHead>
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
                              <TableCell className="text-right">
                                {user.uid !== currentUser.uid && (
                                  <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile User Cards */}
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
                            {user.uid !== currentUser.uid && (
                              <div className="pt-2">
                                <Button variant="outline" size="sm" className="w-full" onClick={() => setUserToDelete(user)}>
                                  <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete User
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
                
                {/* Section for Lead Assignment - visible to all managers */}
                <div className={cn(isTrueAdmin && "mt-6")}>
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
            </CardContent>
        </Card>
      </div>
    </>
  );
}
