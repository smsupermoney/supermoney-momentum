

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
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import { PlusCircle, Trash2, ArrowRight, Pencil } from 'lucide-react';
import type { User, Anchor, Dealer, Vendor, UserRole, Lender } from '@/lib/types';
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
import { ArchivedAnchorsTable } from '@/components/admin/archived-anchors-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


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
  allAnchors: Anchor[];
  userAssignments: Record<string, string>;
  anchorAssignments: Record<string, string>;
  onUserAssignmentChange: (leadId: string, userId: string) => void;
  onAnchorAssignmentChange: (leadId: string, anchorId: string) => void;
  onAssign: (leadId: string) => void;
}

function LeadTable({
  title,
  leads,
  assignableUsers,
  allAnchors,
  userAssignments,
  anchorAssignments,
  onUserAssignmentChange,
  onAnchorAssignmentChange,
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
                <TableHead>Assign Anchor</TableHead>
                <TableHead>{t('admin.table.assignTo')}</TableHead>
                <TableHead className="text-right">{t('admin.table.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                   <TableCell>
                    <Select onValueChange={(value) => onAnchorAssignmentChange(lead.id, value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select anchor" />
                      </SelectTrigger>
                      <SelectContent>
                        {allAnchors.map((anchor) => (
                          <SelectItem key={anchor.id} value={anchor.id}>
                            {anchor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select onValueChange={(value) => onUserAssignmentChange(lead.id, value)}>
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
                    <Button size="sm" onClick={() => onAssign(lead.id)} disabled={!userAssignments[lead.id] || !anchorAssignments[lead.id]}>
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
                <CardDescription>{lead.contactNumber || 'N/A'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                 <Select onValueChange={(value) => onAnchorAssignmentChange(lead.id, value)}>
                    <SelectTrigger><SelectValue placeholder="Assign Anchor" /></SelectTrigger>
                    <SelectContent>
                        {allAnchors.map((anchor) => (
                            <SelectItem key={anchor.id} value={anchor.id}>{anchor.name}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                <Select onValueChange={(value) => onUserAssignmentChange(lead.id, value)}>
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
                <Button size="sm" onClick={() => onAssign(lead.id)} disabled={!userAssignments[lead.id] || !anchorAssignments[lead.id]} className="w-full">
                  {t('admin.assign')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
}

function LenderManagement() {
    const { lenders, addLender, deleteLender } = useApp();
    const [newLenderName, setNewLenderName] = useState('');

    const handleAddLender = () => {
        if (newLenderName.trim()) {
            addLender({ name: newLenderName.trim() });
            setNewLenderName('');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Lender Management</CardTitle>
                <CardDescription>Add or remove lenders available for lead assignment.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-4">
                    <Input 
                        placeholder="New lender name" 
                        value={newLenderName} 
                        onChange={(e) => setNewLenderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddLender()}
                    />
                    <Button onClick={handleAddLender}>Add Lender</Button>
                </div>
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Lender Name</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lenders.map((lender) => (
                                <TableRow key={lender.id}>
                                    <TableCell>{lender.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => deleteLender(lender.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AdminPage() {
  const { dealers, vendors, users, updateDealer, updateVendor, currentUser, visibleUsers, deleteUser, anchors, updateAnchor } = useApp();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userAssignments, setUserAssignments] = useState<Record<string, string>>({});
  const [anchorAssignments, setAnchorAssignments] = useState<Record<string, string>>({});
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const assignableUsers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') {
      // Admins can assign to any non-admin, non-specialist user.
      return users.filter(u => u.role !== 'Admin' && u.role !== 'Business Development' && u.role !== 'BIU');
    }
    if(currentUser.role === 'Business Development' || currentUser.role === 'BIU') {
      return users.filter(u => ['Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(u.role));
    }
    // Managers can assign to their direct or indirect subordinates.
    // 'visibleUsers' includes the manager themselves, so filter them out.
    return visibleUsers.filter(u => u.uid !== currentUser.uid);
  }, [currentUser, users, visibleUsers]);

  const unassignedDealers = dealers.filter((d) => d.assignedTo === null || d.status === 'Unassigned Lead');
  const unassignedVendors = vendors.filter((s) => s.assignedTo === null || s.status === 'Unassigned Lead');
  const allActiveAnchors = useMemo(() => anchors.filter(a => a.status === 'Active'), [anchors]);


  const handleUserAssignmentChange = (leadId: string, userId: string) => {
    setUserAssignments((prev) => ({ ...prev, [leadId]: userId }));
  };

  const handleAnchorAssignmentChange = (leadId: string, anchorId: string) => {
    setAnchorAssignments((prev) => ({ ...prev, [leadId]: anchorId }));
  };

  const handleAssign = (leadId: string, leadType: LeadType) => {
    const assignedToId = userAssignments[leadId];
    const anchorId = anchorAssignments[leadId];
    if (!assignedToId || !anchorId) {
      toast({ variant: 'destructive', title: 'Selection Missing', description: 'Please select both an anchor and a user to assign.' });
      return;
    }

    const user = users.find((u) => u.uid === assignedToId);
    const anchor = anchors.find((a) => a.id === anchorId);

    if (leadType === 'Dealer') {
      const dealer = dealers.find((d) => d.id === leadId);
      if (dealer) updateDealer({ ...dealer, assignedTo: assignedToId, status: 'New', anchorId: anchorId });
    } else if (leadType === 'Vendor') {
      const vendor = vendors.find((s) => s.id === leadId);
      if (vendor) updateVendor({ ...vendor, assignedTo: assignedToId, status: 'New', anchorId: anchorId });
    }

    toast({ title: 'Lead Assigned', description: `Lead assigned to ${user?.name} for anchor ${anchor?.name}.` });
    setUserAssignments((prev) => {
      const newAssignments = { ...prev };
      delete newAssignments[leadId];
      return newAssignments;
    });
    setAnchorAssignments((prev) => {
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

  const managerialRoles: UserRole[] = ['Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];
  const canViewAdminPanel = currentUser && (currentUser.role === 'Admin' || managerialRoles.includes(currentUser.role) || currentUser.role === 'Business Development' || currentUser.role === 'BIU' || currentUser.role === 'ETB Manager');
  const canManageLenders = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Business Development' || currentUser.role === 'BIU');
  const canManageUsers = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Business Development' || currentUser.role === 'BIU' || currentUser.role === 'ETB Manager');


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
      {userToEdit && (
        <EditUserDialog 
          user={userToEdit}
          open={!!userToEdit} 
          onOpenChange={() => setUserToEdit(null)} 
        />
      )}
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
        
        {/* Section for Lead Assignment - visible to all managers */}
        <Card>
            <CardHeader>
                <CardTitle>Lead Assignment</CardTitle>
                <CardDescription>Assign new Dealer and Vendor leads to sales team members.</CardDescription>
            </CardHeader>
            <CardContent>
                <LeadTable
                  title={t('admin.unassignedDealers')}
                  leads={unassignedDealers}
                  assignableUsers={assignableUsers}
                  allAnchors={allActiveAnchors}
                  userAssignments={userAssignments}
                  anchorAssignments={anchorAssignments}
                  onAssign={(id) => handleAssign(id, 'Dealer')}
                  onUserAssignmentChange={handleUserAssignmentChange}
                  onAnchorAssignmentChange={handleAnchorAssignmentChange}
                />
                <LeadTable
                  title={t('admin.unassignedVendors')}
                  leads={unassignedVendors}
                  assignableUsers={assignableUsers}
                  allAnchors={allActiveAnchors}
                  userAssignments={userAssignments}
                  anchorAssignments={anchorAssignments}
                  onAssign={(id) => handleAssign(id, 'Vendor')}
                  onUserAssignmentChange={handleUserAssignmentChange}
                  onAnchorAssignmentChange={handleAnchorAssignmentChange}
                />
            </CardContent>
        </Card>
        
        {canManageLenders && <LenderManagement />}

        {/* Section for Admins & BD */}
        {canManageUsers && (
          <>
            <ArchivedAnchorsTable />
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
                              <TableCell className="text-right space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => setUserToEdit(user)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                {user.uid !== currentUser?.uid && (
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
                            <div className="pt-2 flex gap-2">
                                <Button variant="outline" size="sm" className="w-full" onClick={() => setUserToEdit(user)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Edit User
                                </Button>
                                {user.uid !== currentUser?.uid && (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setUserToDelete(user)}>
                                    <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete User
                                    </Button>
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
