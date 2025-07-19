

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
import type { Vendor, SpokeStatus, LeadType } from '@/lib/types';
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
import { spokeStatuses } from '@/lib/types';


const leadTypes: LeadType[] = ['Fresh', 'Renewal', 'Adhoc', 'Enhancement', 'Cross sell', 'Revive'];

export default function VendorsPage() {
  const { vendors, anchors, users, currentUser, updateVendor, visibleUsers, deleteVendor } = useApp();
  const { t } = useLanguage();
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ recipientEmail: string, entity: { id: string; name: string; type: 'vendor' } } | null>(null);
  const { toast } = useToast();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all');
  const [anchorFilter, setAnchorFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');

  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const canShowAssignedToFilter = currentUser && ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'].includes(currentUser.role);
  const canBulkDelete = currentUser && ['Admin', 'Business Development'].includes(currentUser.role);

  
  const filteredVendors = vendors.filter(s => {
    if (s.status === 'Active') return false;
    
    // Filter based on roles
    if (currentUser.role !== 'Admin' && currentUser.role !== 'Business Development') {
      const assignedUser = s.assignedTo ? users.find(u => u.uid === s.assignedTo) : null;
      if (!assignedUser) {
        // If unassigned, only show to managers (who can assign)
        if (!['Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser.role)) {
          return false;
        }
      } else {
        // If assigned, show to the assigned user OR their manager
        const isAssignedToMe = assignedUser.uid === currentUser.uid;
        const isMyReport = assignedUser.managerId === currentUser.uid;

        if (!isAssignedToMe && !isMyReport) {
          return false;
        }
      }
    }

    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (leadTypeFilter !== 'all' && s.leadType !== leadTypeFilter) return false;
    if (anchorFilter !== 'all' && s.anchorId !== anchorFilter) return false;
    if (assignedToFilter !== 'all' && s.assignedTo !== assignedToFilter) return false;

    return true;
  });

  const numSelected = Object.values(selectedRows).filter(Boolean).length;

  const handleSelectAll = (checked: boolean) => {
    const newSelectedRows: Record<string, boolean> = {};
    if (checked) {
      filteredVendors.forEach(v => {
        newSelectedRows[v.id] = true;
      });
    }
    setSelectedRows(newSelectedRows);
  };

  const handleRowSelect = (vendorId: string, checked: boolean) => {
    setSelectedRows(prev => ({
      ...prev,
      [vendorId]: checked,
    }));
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
        case 'Approved PF Collected':
        case 'Limit Live':
            return 'default';
        case 'Rejected':
        case 'Not Interested':
        case 'Closed':
            return 'destructive';
        default:
            return 'secondary';
    }
  };

  const handleStartOnboarding = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    
    updateVendor({ ...vendor, status: 'Onboarding' });

    toast({
        title: 'Onboarding Started',
        description: `${vendor.name} has been moved to the onboarding flow.`,
    });
  };

  const getTatDays = (createdAt: any, tat?: number): string => {
    if (tat !== undefined) {
      return `${tat} days`;
    }
    if (!createdAt) {
      return 'N/A';
    }
    
    const jsDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    
    if (isNaN(jsDate.getTime())) {
      return 'N/A';
    }
    
    const days = differenceInDays(new Date(), jsDate);
    return `${days} days`;
  };

  const handleRowClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  }


  return (
    <>
      <PageHeader title={t('vendors.title')} description={t('vendors.description')}>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t('vendors.bulkUpload')}
            </Button>
            <Button onClick={() => setIsNewLeadOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('vendors.newLead')}
            </Button>
        </div>
      </PageHeader>
      
      <NewLeadDialog type="Vendor" open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen} />
      <BulkUploadDialog type="Vendor" open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen} />
      {selectedVendor && (
        <VendorDetailsDialog
            vendor={selectedVendor}
            open={!!selectedVendor}
            onOpenChange={(open) => { if(!open) setSelectedVendor(null); }}
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
                      This action cannot be undone. This will permanently delete {numSelected} vendor lead(s).
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
                    checked={numSelected === filteredVendors.length && filteredVendors.length > 0}
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
            {filteredVendors.length > 0 ? filteredVendors.map(vendor => (
              <TableRow key={vendor.id} data-state={selectedRows[vendor.id] && "selected"} onClick={() => handleRowClick(vendor)} className="cursor-pointer">
                 {canBulkDelete && (
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedRows[vendor.id] || false}
                      onCheckedChange={(checked) => handleRowSelect(vendor.id, checked as boolean)}
                      aria-label="Select row"
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium hover:text-primary">
                  <div>{vendor.name}</div>
                  {vendor.nextBestAction && (
                      <Badge variant="secondary" className="mt-1.5 justify-start py-1 px-2 text-left h-auto font-normal">
                          <Sparkles className="mr-1.5 h-3 w-3 text-primary shrink-0" />
                          <span className="text-xs">{vendor.nextBestAction.recommendedAction}</span>
                      </Badge>
                  )}
                </TableCell>
                <TableCell>{vendor.contacts?.[0]?.phone || 'N/A'}</TableCell>
                <TableCell>{vendor.dealValue ? vendor.dealValue.toFixed(2) : 'N/A'}</TableCell>
                <TableCell>{vendor.state || 'N/A'}</TableCell>
                <TableCell>{vendor.leadType || 'Fresh'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(vendor.status)}>{vendor.status}</Badge>
                </TableCell>
                <TableCell>{getAnchorName(vendor.anchorId)}</TableCell>
                <TableCell>{getAssignedToName(vendor.assignedTo)}</TableCell>
                <TableCell>{getTatDays(vendor.createdAt, vendor.tat)}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" asChild onClick={(e) => handleStartOnboarding(e, vendor)} className="ml-2">
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
                  {t('vendors.noVendors')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
          {filteredVendors.length > 0 ? filteredVendors.map(vendor => (
              <Card key={vendor.id} className="relative">
                  {canBulkDelete && (
                      <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                              className="h-5 w-5"
                              checked={selectedRows[vendor.id] || false}
                              onCheckedChange={(checked) => handleRowSelect(vendor.id, checked as boolean)}
                              aria-label="Select row"
                            />
                      </div>
                  )}
                  <div onClick={() => handleRowClick(vendor)} className="cursor-pointer">
                    <CardHeader>
                        <CardTitle className="hover:text-primary pr-8">{vendor.name}</CardTitle>
                        <CardDescription>{getAnchorName(vendor.anchorId)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {vendor.nextBestAction && (
                        <div className="mb-2">
                          <Badge variant="secondary" className="w-full justify-start py-1.5 px-2 text-left h-auto">
                            <Sparkles className="mr-2 h-4 w-4 text-primary shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-semibold text-xs text-primary">{t('common.nextBestAction')}</span>
                                <span className="text-sm">{vendor.nextBestAction.recommendedAction}</span>
                            </div>
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                          <Badge variant={getStatusVariant(vendor.status)}>{vendor.status}</Badge>
                          <Badge variant="outline">{vendor.leadType || 'Fresh'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground pt-2">{vendor.contacts?.[0]?.phone || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">Deal Value: {vendor.dealValue ? `${vendor.dealValue.toFixed(2)} Cr` : 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{getAssignedToName(vendor.assignedTo)}</p>
                        <p className="text-xs text-muted-foreground">TAT: {getTatDays(vendor.createdAt, vendor.tat)}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" asChild onClick={(e) => handleStartOnboarding(e, vendor)}>
                              <Link href="https://supermoney.in/onboarding" target="_blank">
                                  Onboarding
                              </Link>
                          </Button>
                    </CardFooter>
                  </div>
              </Card>
          )) : (
              <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
                  {t('vendors.noVendors')}
              </div>
          )}
      </div>
    </>
  );
}

    