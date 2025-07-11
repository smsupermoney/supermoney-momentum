'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { NewLeadDialog } from '@/components/leads/new-lead-dialog';
import { BulkUploadDialog } from '@/components/leads/bulk-upload-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Upload, Sparkles, Trash2 } from 'lucide-react';
import type { Dealer, SpokeStatus, LeadType } from '@/lib/types';
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

const spokeStatuses: SpokeStatus[] = ['Unassigned Lead', 'New', 'Onboarding', 'Partial Docs', 'Follow Up', 'Already Onboarded', 'Disbursed', 'Not reachable', 'Rejected', 'Not Interested'];
const leadTypes: LeadType[] = ['Fresh', 'Renewal', 'Adhoc', 'Enhancement', 'Cross sell', 'Revive'];

export default function DealersPage() {
  const { dealers, anchors, users, currentUser, updateDealer, visibleUsers, deleteDealer } = useApp();
  const { t } = useLanguage();
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ recipientEmail: string, entity: { id: string; name: string; type: 'dealer' } } | null>(null);
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState('all');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');
  const [anchorFilter, setAnchorFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');

  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const canShowAssignedToFilter = currentUser && ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'].includes(currentUser.role);
  const canBulkDelete = currentUser && ['Admin', 'Business Development'].includes(currentUser.role);

  const filteredDealers = dealers.filter(d => {
    if (d.status === 'Active') return false;

    if (currentUser.role !== 'Admin' && currentUser.role !== 'Business Development') {
      const assignedUser = d.assignedTo ? users.find(u => u.uid === d.assignedTo) : null;
      if (!assignedUser) {
        if (!['Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser.role)) {
          return false;
        }
      } else {
        const isAssignedToMe = assignedUser.uid === currentUser.uid;
        const isMyReport = assignedUser.managerId === currentUser.uid;
        if (!isAssignedToMe && !isMyReport) {
          return false;
        }
      }
    }

    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (leadTypeFilter !== 'all' && d.leadType !== leadTypeFilter) return false;
    if (anchorFilter !== 'all' && d.anchorId !== anchorFilter) return false;
    if (assignedToFilter !== 'all' && d.assignedTo !== assignedToFilter) return false;
    
    return true;
  });

  const numSelected = Object.values(selectedRows).filter(Boolean).length;

  const handleSelectAll = (checked: boolean) => {
    const newSelectedRows: Record<string, boolean> = {};
    if (checked) {
      filteredDealers.forEach(d => {
        newSelectedRows[d.id] = true;
      });
    }
    setSelectedRows(newSelectedRows);
  };

  const handleRowSelect = (dealerId: string, checked: boolean) => {
    setSelectedRows(prev => ({
      ...prev,
      [dealerId]: checked,
    }));
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

  const getAnchorName = (anchorId: string | null) => {
    if (!anchorId) return 'N/A';
    return anchors.find(a => a.id === anchorId)?.name || 'Unknown';
  };

  const getAssignedToName = (userId: string | null) => {
    if (!userId) return 'Unassigned';
    return users.find(u => u.uid === userId)?.name || 'Unknown';
  };
  
  const getStatusVariant = (status: SpokeStatus): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
        case 'Active':
        case 'Already Onboarded':
        case 'Disbursed':
            return 'default';
        case 'Rejected':
        case 'Not Interested':
            return 'destructive';
        case 'Unassigned Lead':
        case 'New':
            return 'outline';
        case 'Onboarding':
        case 'Partial Docs':
        case 'Follow Up':
        case 'Not reachable':
            return 'secondary';
        default:
            return 'outline';
    }
  };

  const handleStartOnboarding = (e: React.MouseEvent, dealer: Dealer) => {
    e.stopPropagation();
    updateDealer({ ...dealer, status: 'Onboarding' });
    toast({
        title: 'Onboarding Started',
        description: `${dealer.name} has been moved to the onboarding flow.`,
    });
  };

  // --- FIX STARTS HERE ---
  // A safe helper function to calculate Turn-Around Time (TAT)
  const getTatDays = (createdAt: any): string => {
    if (!createdAt) {
      return 'N/A';
    }
    
    // Handle both Firebase Timestamps and standard date strings/objects
    const jsDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    
    // Check if the conversion resulted in a valid date
    if (isNaN(jsDate.getTime())) {
      return 'N/A';
    }
    
    const days = differenceInDays(new Date(), jsDate);
    return `${days} days`;
  };
  // --- FIX ENDS HERE ---

  return (
    <>
      <PageHeader title={t('dealers.title')} description={t('dealers.description')}>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t('dealers.bulkUpload')}
            </Button>
            <Button onClick={() => setIsNewLeadOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('dealers.newLead')}
            </Button>
        </div>
      </PageHeader>
      
      <NewLeadDialog type="Dealer" open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen} />
      <BulkUploadDialog type="Dealer" open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen} />
      {selectedDealer && (
        <DealerDetailsDialog
            dealer={selectedDealer}
            open={!!selectedDealer}
            onOpenChange={(open) => { if(!open) setSelectedDealer(null); }}
        />
      )}
      {emailConfig && (
        <ComposeEmailDialog 
            open={isEmailDialogOpen} 
            onOpenChange={setIsEmailDialogOpen}
            recipientEmail={emailConfig.recipientEmail}
            entity={emailConfig.entity}
        />
      )}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete {numSelected} dealer lead(s).
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90">
                      Delete
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>


      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
          <div className="w-full">
            {canBulkDelete && numSelected > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setIsDeleteConfirmOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4"/>
                Delete ({numSelected}) Selected
              </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full justify-end">
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {spokeStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
               </Select>
               <Select value={leadTypeFilter} onValueChange={setLeadTypeFilter}>
                  <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]"><SelectValue placeholder="Filter by Lead Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lead Types</SelectItem>
                     {leadTypes.map(lt => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}
                  </SelectContent>
               </Select>
               <Select value={anchorFilter} onValueChange={setAnchorFilter}>
                  <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]"><SelectValue placeholder="Filter by Anchor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Anchors</SelectItem>
                    {anchors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
               </Select>
               {canShowAssignedToFilter && (
                <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                    <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]"><SelectValue placeholder="Filter by User" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {visibleUsers.map(u => <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>)}
                    </SelectContent>
                </Select>
               )}
          </div>
      </div>


      {/* Desktop Table View */}
      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {canBulkDelete && (
                <TableHead padding="checkbox">
                  <Checkbox
                    checked={numSelected === filteredDealers.length && filteredDealers.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              <TableHead>{t('dealers.table.name')}</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Deal Value (Cr)</TableHead>
              <TableHead>State</TableHead>
              <TableHead>{t('dealers.table.leadType')}</TableHead>
              <TableHead>{t('dealers.table.status')}</TableHead>
              <TableHead>{t('dealers.table.anchor')}</TableHead>
              <TableHead>{t('dealers.table.assignedTo')}</TableHead>
              <TableHead>TAT</TableHead>
              <TableHead className="text-right">{t('dealers.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDealers.length > 0 ? filteredDealers.map(dealer => (
              <TableRow key={dealer.id} data-state={selectedRows[dealer.id] && "selected"} onClick={() => setSelectedDealer(dealer)} className="cursor-pointer">
                {canBulkDelete && (
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedRows[dealer.id] || false}
                      onCheckedChange={(checked) => handleRowSelect(dealer.id, checked as boolean)}
                      aria-label="Select row"
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium hover:text-primary">
                  <div>{dealer.name}</div>
                  {dealer.nextBestAction && (
                      <Badge variant="secondary" className="mt-1.5 justify-start py-1 px-2 text-left h-auto font-normal">
                          <Sparkles className="mr-1.5 h-3 w-3 text-primary shrink-0" />
                          <span className="text-xs">{dealer.nextBestAction.recommendedAction}</span>
                      </Badge>
                  )}
                </TableCell>
                <TableCell>{dealer.contacts?.[0]?.phone || 'N/A'}</TableCell>
                <TableCell>{dealer.dealValue ? dealer.dealValue.toFixed(2) : 'N/A'}</TableCell>
                <TableCell>{dealer.state || 'N/A'}</TableCell>
                <TableCell>{dealer.leadType || 'Fresh'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(dealer.status)}>{dealer.status}</Badge>
                </TableCell>
                <TableCell>{getAnchorName(dealer.anchorId)}</TableCell>
                <TableCell>{getAssignedToName(dealer.assignedTo)}</TableCell>
                {/* --- APPLYING FIX AT LINE 344 --- */}
                <TableCell>{getTatDays(dealer.createdAt)}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" asChild onClick={(e) => handleStartOnboarding(e, dealer)}>
                        <Link href="https://supermoney.in/onboarding" target="_blank">
                            Onboarding
                        </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={canBulkDelete ? 11 : 10} className="h-24 text-center">
                  {t('dealers.noDealers')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
          {filteredDealers.length > 0 ? filteredDealers.map(dealer => (
              <Card key={dealer.id} className="relative">
                  {canBulkDelete && (
                      <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                              className="h-5 w-5"
                              checked={selectedRows[dealer.id] || false}
                              onCheckedChange={(checked) => handleRowSelect(dealer.id, checked as boolean)}
                              aria-label="Select row"
                            />
                      </div>
                  )}
                  <div onClick={() => setSelectedDealer(dealer)} className="cursor-pointer">
                      <CardHeader>
                          <CardTitle className="hover:text-primary pr-8">{dealer.name}</CardTitle>
                          <CardDescription>{getAnchorName(dealer.anchorId)}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                          {dealer.nextBestAction && (
                            <div className="mb-2">
                              <Badge variant="secondary" className="w-full justify-start py-1.5 px-2 text-left h-auto">
                                <Sparkles className="mr-2 h-4 w-4 text-primary shrink-0" />
                                <div className="flex flex-col">
                                    <span className="font-semibold text-xs text-primary">{t('common.nextBestAction')}</span>
                                    <span className="text-sm">{dealer.nextBestAction.recommendedAction}</span>
                                </div>
                              </Badge>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusVariant(dealer.status)}>{dealer.status}</Badge>
                            <Badge variant="outline">{dealer.leadType || 'Fresh'}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground pt-2">{dealer.contacts?.[0]?.phone || 'N/A'}</p>
                           <p className="text-sm text-muted-foreground">Deal Value: {dealer.dealValue ? `${dealer.dealValue.toFixed(2)} Cr` : 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{getAssignedToName(dealer.assignedTo)}</p>
                          {/* --- APPLYING FIX IN MOBILE VIEW --- */}
                          <p className="text-xs text-muted-foreground">TAT: {getTatDays(dealer.createdAt)}</p>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" asChild onClick={(e) => handleStartOnboarding(e, dealer)}>
                                <Link href="https://supermoney.in/onboarding" target="_blank">
                                    Onboarding
                                </Link>
                            </Button>
                      </CardFooter>
                  </div>
              </Card>
          )) : (
              <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
                  {t('dealers.noDealers')}
              </div>
          )}
      </div>
    </>
  );
}