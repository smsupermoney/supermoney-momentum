
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { NewLeadDialog } from '@/components/leads/new-lead-dialog';
import { BulkUploadDialog } from '@/components/leads/bulk-upload-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Upload, Sparkles, Trash2, Search, Flame, Users, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Dealer, SpokeStatus, UserRole } from '@/lib/types';
import { DealerDetailsDialog } from '@/components/dealers/dealer-details-dialog';
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
import { Separator } from '@/components/ui/separator';
import { MultiSelect } from '@/components/ui/multi-select';
import { useSearchParams } from 'next/navigation';

const PAGE_SIZE = 25;

export default function DealersPage() {
  const { dealers, anchors, users, currentUser, updateDealer, visibleUsers, deleteDealer, reassignSelectedLeads, lenders } = useApp();
  const { t } = useLanguage();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Dialog states
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ recipientEmail: string, entity: { id: string; name: string; type: 'dealer' } } | null>(null);
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Selection & Bulk Action states
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [reassignToUserId, setReassignToUserId] = useState<string>('');
  
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const assignedToParam = searchParams.get('assignedTo');
    if (statusParam) {
      setStatusFilter([statusParam]);
    }
    if (assignedToParam) {
      setAssignedToFilter(assignedToParam);
    }
  }, [searchParams]);

  const canShowAssignedToFilter = useMemo(() => currentUser && ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU'].includes(currentUser.role), [currentUser]);
  const canBulkAction = useMemo(() => currentUser && ['Admin', 'Business Development', 'BIU', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser.role), [currentUser]);
  
  const managerialRoles: UserRole[] = ['Admin', 'Business Development', 'BIU', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];

  const { visibleDealers, exUserDealers } = useMemo(() => {
    if (!currentUser) return { visibleDealers: [], exUserDealers: [] };
    
    const exUserIds = users.filter(u => u.status === 'Ex-User').map(u => u.uid);
    const exDealers = dealers.filter(d => d.assignedTo && exUserIds.includes(d.assignedTo));

    if (managerialRoles.includes(currentUser.role)) {
      const activeDealers = dealers.filter(d => !d.assignedTo || !exUserIds.includes(d.assignedTo));
      return { visibleDealers: activeDealers, exUserDealers: exDealers };
    }

    // For non-managerial roles (e.g., Area Sales Manager), show only their assigned leads.
    const myVisibleUserIds = visibleUsers.map(u => u.uid);
    const currentVisibleDealers = dealers.filter(d => 
      (d.assignedTo && myVisibleUserIds.includes(d.assignedTo)) &&
      (!d.assignedTo || !exUserIds.includes(d.assignedTo))
    );
    return { visibleDealers: currentVisibleDealers, exUserDealers: [] }; // Non-managers don't see ex-user leads
  }, [dealers, currentUser, visibleUsers, users]);


  const filteredDealers = useMemo(() => visibleDealers.filter(d => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const searchMatch = !searchQuery || d.name.toLowerCase().includes(lowerCaseQuery) || (d.gstin && d.gstin.toLowerCase().includes(lowerCaseQuery));
    if (!searchMatch) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(d.status)) return false;
    if (leadTypeFilter !== 'all' && d.leadType !== leadTypeFilter) return false;
    if (anchorFilter !== 'all' && d.anchorId !== anchorFilter) return false;
    if (assignedToFilter !== 'all') {
      if (assignedToFilter === 'unassigned') {
        if (d.assignedTo) return false;
      } else {
        if (d.assignedTo !== assignedToFilter) return false;
      }
    }
    if (productFilter !== 'all' && d.product !== productFilter) return false;
    if (zoneFilter !== 'all' && d.zone !== zoneFilter) return false;
    if (lenderFilter !== 'all' && d.lenderId !== lenderFilter) return false;
    return true;
  }), [visibleDealers, searchQuery, statusFilter, leadTypeFilter, anchorFilter, assignedToFilter, productFilter, zoneFilter, lenderFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, leadTypeFilter, anchorFilter, assignedToFilter, productFilter, zoneFilter, lenderFilter]);

  const paginatedDealers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredDealers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredDealers, currentPage]);

  const totalPages = Math.ceil(filteredDealers.length / PAGE_SIZE);

  const numSelected = Object.values(selectedRows).filter(Boolean).length;

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? Object.fromEntries(filteredDealers.map(d => [d.id, true])) : {});
  };

  const handleRowSelect = (dealerId: string, checked: boolean) => {
    setSelectedRows(prev => ({ ...prev, [dealerId]: checked }));
  };

  const handleDeleteSelected = () => {
    const idsToDelete = Object.keys(selectedRows).filter(id => selectedRows[id]);
    idsToDelete.forEach(id => deleteDealer(id));
    toast({
        title: `${idsToDelete.length} Dealer(s) Deleted`,
        description: 'The selected dealers have been removed from the system.',
    });
    setSelectedRows({});
    setIsDeleteConfirmOpen(false);
  };

  const handleReassignSelected = () => {
    const idsToReassign = Object.keys(selectedRows).filter(id => selectedRows[id]);
    reassignSelectedLeads(idsToReassign, 'dealer', reassignToUserId);
    toast({
        title: `${idsToReassign.length} Dealer(s) Reassigned`,
        description: `The selected dealers have been reassigned.`,
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

  const handleStartOnboarding = (e: React.MouseEvent, dealer: Dealer) => {
    e.stopPropagation();
    updateDealer({ ...dealer, status: 'Login done' });
    toast({ title: 'Onboarding Started', description: `${dealer.name} has been moved to the onboarding flow.` });
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
      <PageHeader title={t('dealers.title')} description={t('dealers.description')}>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}><Upload className="mr-2 h-4 w-4" />{t('dealers.bulkUpload')}</Button>
            <Button onClick={() => setIsNewLeadOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />{t('dealers.newLead')}</Button>
        </div>
      </PageHeader>
      
      <div className="mb-6"><LeadsSummary leads={visibleDealers} type="Dealer" /></div>

      <NewLeadDialog type="Dealer" open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen} />
      <BulkUploadDialog type="Dealer" open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen} />
      {selectedDealer && <DealerDetailsDialog dealer={selectedDealer} open={!!selectedDealer} onOpenChange={(open) => !open && setSelectedDealer(null)} />}
      {emailConfig && <ComposeEmailDialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen} recipientEmail={emailConfig.recipientEmail} entity={emailConfig.entity} />}
      
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {numSelected} dealer lead(s).</AlertDialogDescription></AlertDialogHeader>
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by dealer name or GSTIN..." className="w-full pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
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
                 <Select value={anchorFilter} onValueChange={setAnchorFilter}><SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Anchors" /></SelectTrigger><SelectContent><SelectItem value="all">Anchors</SelectItem>{anchors.filter(a => a.status !== 'Archived').map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
                 <Select value={productFilter} onValueChange={setProductFilter}><SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Products" /></SelectTrigger><SelectContent><SelectItem value="all">Products</SelectItem>{products.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                 <Select value={zoneFilter} onValueChange={setZoneFilter}><SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Zones" /></SelectTrigger><SelectContent><SelectItem value="all">Zones</SelectItem>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                 <Select value={lenderFilter} onValueChange={setLenderFilter}><SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Lenders" /></SelectTrigger><SelectContent><SelectItem value="all">All Lenders</SelectItem>{lenders.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
                 {canShowAssignedToFilter && <Select value={assignedToFilter} onValueChange={setAssignedToFilter}><SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]"><SelectValue placeholder="Users" /></SelectTrigger><SelectContent><SelectItem value="all">All Users</SelectItem><SelectItem value="unassigned">Unassigned</SelectItem>{visibleUsers.map(u => <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>)}</SelectContent></Select>}
            </div>
            <div className="w-full sm:w-auto flex justify-end gap-2">
              {canBulkAction && numSelected > 0 && (
                <>
                <Button variant="outline" size="sm" onClick={() => setIsReassignConfirmOpen(true)}><Users className="mr-2 h-4 w-4"/>Reassign ({numSelected})</Button>
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteConfirmOpen(true)}><Trash2 className="mr-2 h-4 w-4"/>Delete ({numSelected})</Button>
                </>
              )}
            </div>
        </div>
      </div>

      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {canBulkAction && <TableHead padding="checkbox"><Checkbox checked={numSelected > 0 && numSelected === filteredDealers.length} onCheckedChange={(checked) => handleSelectAll(checked as boolean)} aria-label="Select all" /></TableHead>}
              <TableHead>{t('dealers.table.name')}</TableHead>
              <TableHead>Phone</TableHead><TableHead>Deal Value (Cr)</TableHead><TableHead>State</TableHead>
              <TableHead>{t('dealers.table.leadType')}</TableHead><TableHead>{t('dealers.table.status')}</TableHead>
              <TableHead>{t('dealers.table.anchor')}</TableHead><TableHead>{t('dealers.table.assignedTo')}</TableHead>
              <TableHead>TAT</TableHead><TableHead className="text-right">{t('dealers.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDealers.map(dealer => (
              <TableRow key={dealer.id} data-state={selectedRows[dealer.id] && "selected"}>
                {canBulkAction && <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedRows[dealer.id] || false} onCheckedChange={(checked) => handleRowSelect(dealer.id, checked as boolean)} aria-label="Select row" /></TableCell>}
                <TableCell className="font-medium hover:text-primary cursor-pointer" onClick={() => setSelectedDealer(dealer)}>
                  <div className="flex items-center gap-2">{dealer.priority === 'High' && <Flame className="h-4 w-4 text-destructive" />}<span>{dealer.name}</span></div>
                  {dealer.nextBestAction && <Badge variant="secondary" className="mt-1.5 justify-start py-1 px-2 text-left h-auto font-normal"><Sparkles className="mr-1.5 h-3 w-3 text-primary shrink-0" /><span className="text-xs">{dealer.nextBestAction.recommendedAction}</span></Badge>}
                </TableCell>
                <TableCell onClick={() => setSelectedDealer(dealer)}>{(dealer.contactNumbers && dealer.contactNumbers[0]?.value) || 'N/A'}</TableCell>
                <TableCell onClick={() => setSelectedDealer(dealer)}>{dealer.dealValue ? dealer.dealValue.toFixed(2) : 'N/A'}</TableCell>
                <TableCell onClick={() => setSelectedDealer(dealer)}>{dealer.state || 'N/A'}</TableCell>
                <TableCell onClick={() => setSelectedDealer(dealer)}>{dealer.leadType || 'Fresh'}</TableCell>
                <TableCell onClick={() => setSelectedDealer(dealer)}><Badge variant={getStatusVariant(dealer.status)}>{dealer.status}</Badge></TableCell>
                <TableCell onClick={() => setSelectedDealer(dealer)}>{getAnchorName(dealer.anchorId)}</TableCell>
                <TableCell onClick={() => setSelectedDealer(dealer)}>{getAssignedToName(dealer.assignedTo)}</TableCell>
                <TableCell onClick={() => setSelectedDealer(dealer)}>{getTatDays(dealer.createdAt, dealer.tat)}</TableCell>
                <TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Button size="sm" asChild onClick={(e) => e.stopPropagation()}><Link href="https://supermoney.in/onboarding" target="_blank">Onboarding</Link></Button></div></TableCell>
              </TableRow>
            ))}
            {filteredDealers.length === 0 && <TableRow><TableCell colSpan={canBulkAction ? 11 : 10} className="h-24 text-center">{t('dealers.noDealers')}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      
      <div className="grid gap-4 md:hidden">
          {paginatedDealers.map(dealer => (
              <Card key={dealer.id} className="relative">
                  {canBulkAction && <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}><Checkbox className="h-5 w-5" checked={selectedRows[dealer.id] || false} onCheckedChange={(checked) => handleRowSelect(dealer.id, checked as boolean)} aria-label="Select row"/></div>}
                  <div onClick={() => setSelectedDealer(dealer)} className="cursor-pointer">
                      <CardHeader><CardTitle className="hover:text-primary pr-8 flex items-center gap-2">{dealer.priority === 'High' && <Flame className="h-5 w-5 text-destructive" />}{dealer.name}</CardTitle><CardDescription>{getAnchorName(dealer.anchorId)}</CardDescription></CardHeader>
                      <CardContent className="space-y-2">
                          {dealer.nextBestAction && <div className="mb-2"><Badge variant="secondary" className="w-full justify-start py-1.5 px-2 text-left h-auto"><Sparkles className="mr-2 h-4 w-4 text-primary shrink-0" /><div className="flex flex-col"><span className="font-semibold text-xs text-primary">{t('common.nextBestAction')}</span><span className="text-sm">{dealer.nextBestAction.recommendedAction}</span></div></Badge></div>}
                          <div className="flex items-center gap-2"><Badge variant={getStatusVariant(dealer.status)}>{dealer.status}</Badge><Badge variant="outline">{dealer.leadType || 'Fresh'}</Badge></div>
                          <p className="text-sm text-muted-foreground pt-2">{(dealer.contactNumbers && dealer.contactNumbers[0]?.value) || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">Deal Value: {dealer.dealValue ? `${dealer.dealValue.toFixed(2)} Cr` : 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{getAssignedToName(dealer.assignedTo)}</p>
                          <p className="text-xs text-muted-foreground">TAT: {getTatDays(dealer.createdAt, dealer.tat)}</p>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}><Button size="sm" asChild><Link href="https://supermoney.in/onboarding" target="_blank">Onboarding</Link></Button></CardFooter>
                  </div>
              </Card>
          ))}
          {filteredDealers.length === 0 && <div className="h-24 flex items-center justify-center text-center text-muted-foreground">{t('dealers.noDealers')}</div>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {exUserDealers.length > 0 && (
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
                            <TableHead>Dealer Name</TableHead>
                            <TableHead>Previously Assigned To</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {exUserDealers.map(dealer => (
                            <TableRow key={dealer.id}>
                                <TableCell className="font-medium">{dealer.name}</TableCell>
                                <TableCell>{getAssignedToName(dealer.assignedTo)}</TableCell>
                                <TableCell><Badge variant={getStatusVariant(dealer.status)}>{dealer.status}</Badge></TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedDealer(dealer)}>Reassign</Button>
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
