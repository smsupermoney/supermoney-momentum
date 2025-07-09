
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
import { PlusCircle, Upload, Sparkles } from 'lucide-react';
import type { Vendor, SpokeStatus } from '@/lib/types';
import { VendorDetailsDialog } from '@/components/suppliers/supplier-details-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposeEmailDialog } from '@/components/email/compose-email-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';


export default function VendorsPage() {
  const { vendors, anchors, users, currentUser, updateVendor, visibleUserIds } = useApp();
  const { t } = useLanguage();
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ recipientEmail: string, entity: { id: string; name: string; type: 'vendor' } } | null>(null);
  const { toast } = useToast();

  const userVendors = vendors.filter(s => {
    if (s.status === 'Active') return false;
    // Business Development role sees all non-active vendors
    if (currentUser.role === 'Business Development') return true;
    // Other roles see vendors assigned to their visible tree
    return visibleUserIds.includes(s.assignedTo || '');
  });


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
            return 'default';
        case 'Rejected':
        case 'Not Interested':
        case 'Inactive':
            return 'destructive';
        case 'Unassigned Lead':
            return 'outline';
        case 'Onboarding':
        case 'Invited':
        case 'KYC Pending':
        case 'Not reachable':
        case 'Agreement Pending':
            return 'secondary';
        default:
            return 'outline';
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


  return (
    <>
      <PageHeader title={t('vendors.title')} description={t('vendors.description')}>
        <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          {t('vendors.bulkUpload')}
        </Button>
        <Button onClick={() => setIsNewLeadOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('vendors.newLead')}
        </Button>
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


      {/* Desktop Table View */}
      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('dealers.table.name')}</TableHead>
              <TableHead>{t('dealers.table.status')}</TableHead>
              <TableHead>{t('dealers.table.leadType')}</TableHead>
              <TableHead>{t('dealers.table.anchor')}</TableHead>
              <TableHead>{t('dealers.table.assignedTo')}</TableHead>
              <TableHead className="text-right">{t('dealers.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userVendors.length > 0 ? userVendors.map(vendor => (
              <TableRow key={vendor.id} onClick={() => setSelectedVendor(vendor)} className="cursor-pointer">
                <TableCell className="font-medium">
                  <div>{vendor.name}</div>
                  {vendor.nextBestAction && (
                      <Badge variant="secondary" className="mt-1.5 justify-start py-1 px-2 text-left h-auto font-normal">
                          <Sparkles className="mr-1.5 h-3 w-3 text-primary shrink-0" />
                          <span className="text-xs">{vendor.nextBestAction.recommendedAction}</span>
                      </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(vendor.status)}>{vendor.status}</Badge>
                </TableCell>
                <TableCell>{vendor.leadType || 'New'}</TableCell>
                <TableCell>{getAnchorName(vendor.anchorId)}</TableCell>
                <TableCell>{getAssignedToName(vendor.assignedTo)}</TableCell>
                <TableCell className="text-right">
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
                <TableCell colSpan={6} className="h-24 text-center">
                  {t('vendors.noVendors')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
          {userVendors.length > 0 ? userVendors.map(vendor => (
              <Card key={vendor.id} onClick={() => setSelectedVendor(vendor)} className="cursor-pointer">
                  <CardHeader>
                      <CardTitle>{vendor.name}</CardTitle>
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
                        <Badge variant="outline">{vendor.leadType || 'New'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground pt-2">{vendor.contactNumber}</p>
                      <p className="text-sm text-muted-foreground">{getAssignedToName(vendor.assignedTo)}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                       <Button size="sm" asChild onClick={(e) => handleStartOnboarding(e, vendor)}>
                            <Link href="https://supermoney.in/onboarding" target="_blank">
                                Onboarding
                            </Link>
                        </Button>
                  </CardFooter>
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
