
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { NewLeadDialog } from '@/components/leads/new-lead-dialog';
import { BulkUploadDialog } from '@/components/leads/bulk-upload-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Upload, Sparkles, Trash2, Search, Flame, Users, UserX } from 'lucide-react';
import type { Vendor, SpokeStatus, UserRole } from '@/lib/types';
import { VendorDetailsDialog } from '@/components/suppliers/supplier-details-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposeEmailDialog } from '@/components/email/compose-email-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { differenceInDays } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
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
import { spokeStatuses, leadTypes, products } from '@/lib/types';
import { regions } from '@/lib/validation';
import { Input } from '@/components/ui/input';
import { LeadsSummary } from '@/components/leads/leads-summary';
import { MultiSelect } from '@/components/ui/multi-select';

export default function VendorsPage() {
  const { vendors, anchors, users, currentUser, updateVendor, visibleUsers, deleteVendor, reassignSelectedLeads, lenders } = useApp();
  const { t } = useLanguage();
  const { toast } = useToast();

  // Dialog states
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ recipientEmail: string, entity: { id: string; name: string; type: 'vendor' } } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isReassignConfirmOpen, setIsReassignConfirmOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');
  const [anchorFilter, setAnchorFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [lenderFilter, setLenderFilter] = useState('all');

  // Selection & Bulk Action states
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [reassignToUserId, setReassignToUserId] = useState<string>('');

  const canShowAssignedToFilter = useMemo(() => currentUser && ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU'].includes(currentUser.role), [currentUser]);
  const canBulkAction = useMemo(() => currentUser && ['Admin', 'Business Development', 'BIU', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser.role), [currentUser]);

  const managerialRoles: UserRole[] = ['Admin', 'Business Development', 'BIU', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];

  const { visibleVendors, exUserVendors } = useMemo(() => {
    if (!currentUser) return { visibleVendors: [], exUserVendors: [] };

    const exUserIds = users.filter(u => u.status === 'Ex-User').map(u => u.uid);
    const exVendors = vendors.filter(v => v.assignedTo && exUserIds.includes(v.assignedTo));

    if (managerialRoles.includes(currentUser.role)) {
      const activeVendors = vendors.filter(v => !v.assignedTo || !exUserIds.includes(v.assignedTo));
      return { visibleVendors: activeVendors, exUserVendors: exVendors };
    }

    const currentVisibleVendors = vendors.filter(v => 
      (v.assignedTo && visibleUsers.some(visUser => visUser.uid === v.assignedTo)) &&
      (!v.assignedTo || !exUserIds.includes(v.assignedTo))
    );
    return { visibleVendors: currentVisibleVendors, exUserVendors: [] };
  }, [vendors, currentUser, visibleUsers, users]);


  const filteredVendors = useMemo(() => visibleVendors.filter(s => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(s.status)) return false;
    if (leadTypeFilter !== 'all' && s.leadType !== leadTypeFilter) return false;
    if (anchorFilter !== 'all' && s.anchorId !== anchorFilter) return false;
    if (assignedToFilter !== 'all' && s.assignedTo !== assignedToFilter) return false;
    if (productFilter !== 'all' && s.product !== productFilter) return false;
    if (zoneFilter !== 'all' && s.zone !== zoneFilter) return false;
    if (lenderFilter !== 'all' && s.lenderId !== lenderFilter) return false;
    return true;
  }), [visibleVendors, searchQuery, statusFilter, leadTypeFilter, anchorFilter, assignedToFilter, productFilter, zoneFilter, lenderFilter]);

  const numSelected = Object.values(selectedRows).filter(Boolean).length;

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? Object.fromEntries(filteredVendors.map(v => [v.id, true])) : {});
  };

  const handleRowSelect = (vendorId: string, checked: boolean) => {
    setSelectedRows(prev => ({ ...prev, [vendorId]: checked }));
  };

  const handleDeleteSelected = () => {
    const idsToDelete = Object.keys(selectedRows).filter(id => selectedRows[id]);
    idsToDelete.forEach(id => deleteVendor(id));
    toast({
        title: `${idsToDelete.length} Vendor(s) Deleted`,
        description: 'The selected vendors have been removed from the system.',
    });
    setSelectedRows({});
    setIsDeleteConfirmOpen(false);
  };

  const handleReassignSelected = () => {
    const idsToReassign = Object.keys(selectedRows).filter(id => selectedRows[id]);
    reassignSelectedLeads(idsToReassign, 'vendor', reassignToUserId);
    toast({
        title: `${idsToReassign.length} Vendor(s) Reassigned`,
        description: `The selected vendors have been reassigned.`,
    });
    setSelectedRows({});
    setReassignToUserId('');
    setIsReassignConfirmOpen(false);
  }

  const getAnchorName = (anchorId: string | null) => anchors.find(a => a.id === anchorId)?.name || 'N/A';
  const getAssignedToName = (userId: string | null) => users.find(u => u.uid === userId)?.name || 'Unassigned';

  const getStatusVariant = (status: SpokeStatus): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
        case 'Active': case 'Disbursed': case 'Approved': case 'Limit Live':
            return 'default';
        case 'Rejected': case 'Not Interested': case 'Run-off':
            return 'destructive';
        default:
            return 'secondary';
    }
  };

  const handleStartOnboarding = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    updateVendor({ ...vendor, status: 'Login done' });
    toast({ title: 'Onboarding Started', description: `${vendor.name} has been moved to the onboarding flow.` });
  };

  const getTatDays = (createdAt: any, tat?: number): string => {
    if (tat !== undefined) return `${tat} days`;
    if (!createdAt) return 'N/A';
    const jsDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    if (isNaN(jsDate.getTime())) return 'N/A';
    return `${differenceInDays(new Date(), jsDate)} days`;
  };

  const activeUsers = useMemo(() => {
    return visibleUsers.filter(u => u.status !== 'Ex-User' && ['Area Sales Manager', 'Internal Sales', 'ETB Executive', 'Telecaller'].includes(u.role))
  }, [visibleUsers]);
  
  const statusOptions = spokeStatuses.map(s => ({ value: s, label: s }));

  return (
    <>
      <PageHeader title={t('vendors.title')} description={t('vendors.description')}>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}><Upload className="mr-2 h-4 w-4" />{t('vendors.bulkUpload')}</Button>
            <Button onClick={() => setIsNewLeadOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />{t('vendors.newLead')}</Button>
        </div>
      </PageHeader>
      
      <div className="mb-6"><LeadsSummary leads={visibleVendors} type="Vendor" /></div>

      <NewLeadDialog type="Vendor" open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen} />
      <BulkUploadDialog type="Vendor" open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen} />
      {selectedVendor && <VendorDetailsDialog vendor={selectedVendor} open={!!selectedVendor} onOpenChange={(open) => !open && setSelectedVendor(null)} />}
      {emailConfig && <ComposeEmailDialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen} recipientEmail={emailConfig.recipientEmail} entity={emailConfig.entity} />}
      
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {numSelected} vendor lead(s).</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isReassignConfirmOpen} onOpenChange={setIsReassignConfirmOpen}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Reassign {numSelected} Lead(s)</AlertDialogTitle><AlertDialogDescription>Select a user to reassign the selected leads to.</AlertDialogDescription></AlertDialogHeader>
              <div className="py-4">
                  <Select value={reassignToUserId} onValueChange={setReassignToUserId}>
                    <SelectTrigger><SelectValue placeholder="Select user to assign to..." /></SelectTrigger>
                    <SelectContent>{activeUsers.map(u => <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>)}</SelectContent>
                  </Select>
              </div>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleReassignSelected} disabled={!reassignToUserId}>Reassign Leads</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4 pb-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by vendor name..." className="w-full pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full justify-start">
                 <MultiSelect
                    options={statusOptions}
                    selected={statusFilter}
                    onChange={setStatusFilter}
                    className="w-full sm:w-auto sm:min-w-[150px]"
                    placeholder="Status"
                 />
                 <Select value={leadTypeFilter} onValueChange={setLeadTypeFilter}><SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Lead Types" /></SelectTrigger><SelectContent><SelectItem value="all">Lead Types</SelectItem>{leadTypes.map(lt => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}</SelectContent></Select>
                 <Select value={anchorFilter} onValueChange={setAnchorFilter}><SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Anchors" /></SelectTrigger><SelectContent><SelectItem value="all">Anchors</SelectItem>{anchors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
                 <Select value={productFilter} onValueChange={setProductFilter}><SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Products" /></SelectTrigger><SelectContent><SelectItem value="all">Products</SelectItem>{products.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                 <Select value={zoneFilter} onValueChange={setZoneFilter}><SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Zones" /></SelectTrigger><SelectContent><SelectItem value="all">Zones</SelectItem>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                 <Select value={lenderFilter} onValueChange={setLenderFilter}><SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Lenders" /></SelectTrigger><SelectContent><SelectItem value="all">All Lenders</SelectItem>{lenders.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
                 {canShowAssignedToFilter && <Select value={assignedToFilter} onValueChange={setAssignedToFilter}><SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]"><SelectValue placeholder="Users" /></SelectTrigger><SelectContent><SelectItem value="all">Users</SelectItem>{visibleUsers.map(u => <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>)}</SelectContent></Select>}
            </div>
            <div className="w-full sm:w-auto flex justify-end gap-2">
              {canBulkAction && numSelected > 0 && (<><Button variant="outline" size="sm" onClick={() => setIsReassignConfirmOpen(true)}><Users className="mr-2 h-4 w-4"/>Reassign ({numSelected})</Button><Button variant="destructive" size="sm" onClick={() => setIsDeleteConfirmOpen(true)}><Trash2 className="mr-2 h-4 w-4"/>Delete ({numSelected})</Button></>)}
            </div>
        </div>
      </div>

      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {canBulkAction && <TableHead padding="checkbox"><Checkbox checked={numSelected > 0 && numSelected === filteredVendors.length} onCheckedChange={(checked) => handleSelectAll(checked as boolean)} aria-label="Select all" /></TableHead>}
              <TableHead>{t('dealers.table.name')}</TableHead>
              <TableHead>Phone</TableHead><TableHead>Deal Value (Cr)</TableHead><TableHead>State</TableHead>
              <TableHead>{t('dealers.table.leadType')}</TableHead><TableHead>{t('dealers.table.status')}</TableHead>
              <TableHead>{t('dealers.table.anchor')}</TableHead><TableHead>{t('dealers.table.assignedTo')}</TableHead>
              <TableHead>TAT</TableHead><TableHead className="text-right">{t('dealers.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.map(vendor => (
              <TableRow key={vendor.id} data-state={selectedRows[vendor.id] && "selected"}>
                 {canBulkAction && <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedRows[vendor.id] || false} onCheckedChange={(checked) => handleRowSelect(vendor.id, checked as boolean)} aria-label="Select row" /></TableCell>}
                <TableCell className="font-medium hover:text-primary cursor-pointer" onClick={() => setSelectedVendor(vendor)}>
                  <div className="flex items-center gap-2">{vendor.priority === 'High' && <Flame className="h-4 w-4 text-destructive" />}<span>{vendor.name}</span></div>
                  {vendor.nextBestAction && <Badge variant="secondary" className="mt-1.5 justify-start py-1 px-2 text-left h-auto font-normal"><Sparkles className="mr-1.5 h-3 w-3 text-primary shrink-0" /><span className="text-xs">{vendor.nextBestAction.recommendedAction}</span></Badge>}
                </TableCell>
                <TableCell onClick={() => setSelectedVendor(vendor)}>{(vendor.contactNumbers && vendor.contactNumbers[0]?.value) || 'N/A'}</TableCell>
                <TableCell onClick={() => setSelectedVendor(vendor)}>{vendor.dealValue ? vendor.dealValue.toFixed(2) : 'N/A'}</TableCell>
                <TableCell onClick={() => setSelectedVendor(vendor)}>{vendor.state || 'N/A'}</TableCell>
                <TableCell onClick={() => setSelectedVendor(vendor)}>{vendor.leadType || 'Fresh'}</TableCell>
                <TableCell onClick={() => setSelectedVendor(vendor)}><Badge variant={getStatusVariant(vendor.status)}>{vendor.status}</Badge></TableCell>
                <TableCell onClick={() => setSelectedVendor(vendor)}>{getAnchorName(vendor.anchorId)}</TableCell>
                <TableCell onClick={() => setSelectedVendor(vendor)}>{getAssignedToName(vendor.assignedTo)}</TableCell>
                <TableCell onClick={() => setSelectedVendor(vendor)}>{getTatDays(vendor.createdAt, vendor.tat)}</TableCell>
                <TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Button size="sm" asChild onClick={(e) => e.stopPropagation()}><Link href="https://supermoney.in/onboarding" target="_blank">Onboarding</Link></Button></div></TableCell>
              </TableRow>
            ))}
            {filteredVendors.length === 0 && <TableRow><TableCell colSpan={canBulkAction ? 11 : 10} className="h-24 text-center">{t('vendors.noVendors')}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 md:hidden">
          {filteredVendors.map(vendor => (
              <Card key={vendor.id} className="relative">
                  {canBulkAction && <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}><Checkbox className="h-5 w-5" checked={selectedRows[vendor.id] || false} onCheckedChange={(checked) => handleRowSelect(vendor.id, checked as boolean)} aria-label="Select row" /></div>}
                  <div onClick={() => setSelectedVendor(vendor)} className="cursor-pointer">
                    <CardHeader><CardTitle className="hover:text-primary pr-8 flex items-center gap-2">{vendor.priority === 'High' && <Flame className="h-5 w-5 text-destructive" />}{vendor.name}</CardTitle><CardDescription>{getAnchorName(vendor.anchorId)}</CardDescription></CardHeader>
                    <CardContent className="space-y-2">
                      {vendor.nextBestAction && <div className="mb-2"><Badge variant="secondary" className="w-full justify-start py-1.5 px-2 text-left h-auto"><Sparkles className="mr-2 h-4 w-4 text-primary shrink-0" /><div className="flex flex-col"><span className="font-semibold text-xs text-primary">{t('common.nextBestAction')}</span><span className="text-sm">{vendor.nextBestAction.recommendedAction}</span></div></Badge></div>}
                      <div className="flex items-center gap-2"><Badge variant={getStatusVariant(vendor.status)}>{vendor.status}</Badge><Badge variant="outline">{vendor.leadType || 'Fresh'}</Badge></div>
                        <p className="text-sm text-muted-foreground pt-2">{(vendor.contactNumbers && vendor.contactNumbers[0]?.value) || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">Deal Value: {vendor.dealValue ? `${vendor.dealValue.toFixed(2)} Cr` : 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{getAssignedToName(vendor.assignedTo)}</p>
                        <p className="text-xs text-muted-foreground">TAT: {getTatDays(vendor.createdAt, vendor.tat)}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}><Button size="sm" asChild><Link href="https://supermoney.in/onboarding" target="_blank">Onboarding</Link></Button></CardFooter>
                  </div>
              </Card>
          ))}
          {filteredVendors.length === 0 && <div className="h-24 flex items-center justify-center text-center text-muted-foreground">{t('vendors.noVendors')}</div>}
      </div>

       {exUserVendors.length > 0 && (
        <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
                <UserX className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-xl font-semibold">Leads Assigned to Ex-Users</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">These leads need to be reassigned to an active team member.</p>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendor Name</TableHead>
                            <TableHead>Previously Assigned To</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {exUserVendors.map(vendor => (
                            <TableRow key={vendor.id}>
                                <TableCell className="font-medium">{vendor.name}</TableCell>
                                <TableCell>{getAssignedToName(vendor.assignedTo)}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(vendor.status)}>{vendor.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedVendor(vendor)}>Reassign</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
      )}
    </>
  );
}
