

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
import { PlusCircle, Trash2, ArrowRight, Pencil, UserX, Search, LayoutDashboard } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { CustomDashboardCreator } from '@/components/admin/custom-dashboard-creator';


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
                                <TableHead className="text-right w-[100px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lenders.map((lender) => (
                                <TableRow key={lender.id}>
                                    <TableCell className="py-2 px-4">{lender.name}</TableCell>
                                    <TableCell className="text-right py-2 px-4">
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
  const { dealers, vendors, users, updateUser, updateDealer, updateVendor, currentUser, visibleUsers, deleteUser, anchors, updateAnchor } = useApp();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userAssignments, setUserAssignments] = useState<Record<string, string>>({});
  const [anchorAssignments, setAnchorAssignments] = useState<Record<string, string>>({});
  const [userToConfirm, setUserToConfirm] = useState<User | null>(null);
  const [confirmationType, setConfirmationType] = useState<'delete' | 'archive' | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const assignableUsers = useMemo(() => {
    if (!currentUser) return [];
    
    // Admins and BD can assign to any active non-admin, non-specialist user.
    const eligibleRoles: UserRole[] = ['Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'ETB Executive', 'ETB Manager', 'Telecaller', 'Internal Sales'];
    if (currentUser.role === 'Admin' || currentUser.role === 'Business Development' || currentUser.role === 'BIU') {
      return users.filter(u => eligibleRoles.includes(u.role) && u.status !== 'Ex-User');
    }
    
    // Managers can assign to their direct or indirect active subordinates.
    return visibleUsers.filter(u => u.uid !== currentUser.uid && u.status !== 'Ex-User');
  }, [currentUser, users, visibleUsers]);

  const unassignedDealers = dealers.filter((d) => d.assignedTo === null || d.status === 'Unassigned Lead');
  const unassignedVendors = vendors.filter((s) => s.assignedTo === null || s.status === 'Unassigned Lead');
  const allActiveAnchors = useMemo(() => anchors.filter(a => a.status === 'Active'), [anchors]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase())
    );
  }, [users, userSearchQuery]);


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

  const handleConfirmation = () => {
    if (userToConfirm && confirmationType === 'delete') {
        deleteUser(userToConfirm.uid);
    }
    if (userToConfirm && confirmationType === 'archive') {
        updateUser({ ...userToConfirm, status: 'Ex-User' });
        toast({ title: 'User Marked as Ex-User', description: `${userToConfirm.name} is now marked as an ex-user.` });
    }
    setUserToConfirm(null);
    setConfirmationType(null);
  };
  
  const getConfirmationDialogContent = () => {
      if (!userToConfirm) return { title: '', description: '', actionText: ''};
      if (confirmationType === 'delete') {
          return {
              title: 'Are you absolutely sure?',
              description: `This action cannot be undone. This will permanently delete the user account for ${userToConfirm.name} and remove them from the system.`,
              actionText: 'Delete User'
          };
      }
      if (confirmationType === 'archive') {
          return {
              title: 'Mark as Ex-User?',
              description: `This will mark ${userToConfirm.name} as an ex-user. Their assigned leads will be moved to a separate section for reassignment. This action can be reversed.`,
              actionText: 'Mark as Ex-User'
          }
      }
      return { title: '', description: '', actionText: ''};
  }

  const managerialRoles: UserRole[] = ['Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];
  const canViewAdminPanel = currentUser && (currentUser.role === 'Admin' || managerialRoles.includes(currentUser.role) || currentUser.role === 'Business Development' || currentUser.role === 'BIU' || currentUser.role === 'ETB Manager');
  const canManageLenders = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Business Development' || currentUser.role === 'BIU');
  const canManageUsers = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Business Development' || currentUser.role === 'BIU' || currentUser.role === 'ETB Manager');
  const canConfigureDashboards = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'BIU');
  const canMarkAsExUser = currentUser && ['Admin', 'Business Development', 'BIU'].includes(currentUser.role);


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
  
  const { title: dialogTitle, description: dialogDescription, actionText: dialogActionText } = getConfirmationDialogContent();

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
      <AlertDialog open={!!userToConfirm} onOpenChange={() => setUserToConfirm(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
                <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmation} className={confirmationType === 'delete' ? "bg-destructive hover:bg-destructive/90" : ""}>
                    {dialogActionText}
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
        
        {canConfigureDashboards && <CustomDashboardCreator />}
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
                    <div className="mb-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by user name..."
                            className="w-full max-w-sm pl-9"
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Desktop User Table */}
                    <div className="hidden rounded-lg border md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('admin.table.name')}</TableHead>
                            <TableHead>{t('admin.table.email')}</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>{t('admin.table.role')}</TableHead>
                            <TableHead>{t('admin.table.manager')}</TableHead>
                            <TableHead>{t('admin.table.region')}</TableHead>
                            <TableHead className="text-right w-[120px]">{t('admin.table.action')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.uid} className={user.status === 'Ex-User' ? 'bg-muted/50' : ''}>
                              <TableCell className="font-medium py-2 px-4">{user.name}</TableCell>
                              <TableCell className="py-2 px-4">{user.email}</TableCell>
                              <TableCell className="py-2 px-4">
                                <Badge variant={user.status === 'Ex-User' ? 'destructive' : 'secondary'}>
                                  {user.status || 'Active'}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 px-4">{user.role}</TableCell>
                              <TableCell className="py-2 px-4">{getManagerName(user.managerId)}</TableCell>
                              <TableCell className="py-2 px-4">{user.region || 'N/A'}</TableCell>
                              <TableCell className="text-right space-x-1 py-2 px-4">
                                <Button variant="ghost" size="icon" onClick={() => setUserToEdit(user)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                {canMarkAsExUser && user.status !== 'Ex-User' && (
                                    <Button variant="ghost" size="icon" onClick={() => {setUserToConfirm(user); setConfirmationType('archive');}}>
                                        <UserX className="h-4 w-4 text-amber-600" />
                                    </Button>
                                )}
                                {user.uid !== currentUser?.uid && (
                                  <Button variant="ghost" size="icon" onClick={() => {setUserToConfirm(user); setConfirmationType('delete');}}>
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
                      {filteredUsers.map((user) => (
                        <Card key={user.uid} className={`p-0 ${user.status === 'Ex-User' ? 'bg-muted/50' : ''}`}>
                          <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">{user.name}</CardTitle>
                                    <CardDescription>{user.email}</CardDescription>
                                </div>
                                <Badge variant={user.status === 'Ex-User' ? 'destructive' : 'secondary'}>{user.status || 'Active'}</Badge>
                            </div>
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
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                </Button>
                                {canMarkAsExUser && user.status !== 'Ex-User' && (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => {setUserToConfirm(user); setConfirmationType('archive');}}>
                                        <UserX className="mr-2 h-4 w-4 text-amber-600" /> Mark as Ex-User
                                    </Button>
                                )}
                                {user.uid !== currentUser?.uid && (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => {setUserToConfirm(user); setConfirmationType('delete');}}>
                                    <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete
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
