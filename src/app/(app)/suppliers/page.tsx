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
import { PlusCircle, Upload, Mail, Sparkles } from 'lucide-react';
import type { Vendor, OnboardingStatus } from '@/lib/types';
import { VendorDetailsDialog } from '@/components/suppliers/supplier-details-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposeEmailDialog } from '@/components/email/compose-email-dialog';
import { useToast } from '@/hooks/use-toast';


export default function VendorsPage() {
  const { vendors, anchors, users, currentUser, updateVendor, visibleUserIds } = useApp();
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ recipientEmail: string, entity: { id: string; name: string; type: 'vendor' } } | null>(null);
  const { toast } = useToast();

  const userVendors = vendors.filter(s => {
    if (currentUser.role === 'Onboarding Specialist') return true;
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

  const getStatusVariant = (status: OnboardingStatus): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
        case 'Active':
            return 'default';
        case 'Rejected':
        case 'Not Interested':
        case 'Inactive':
            return 'destructive';
        case 'Unassigned Lead':
            return 'outline';
        case 'Invited':
        case 'KYC Pending':
        case 'Not reachable':
        case 'Agreement Pending':
            return 'secondary';
        default:
            return 'outline';
    }
  };

  const handleEmailClick = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    if (!vendor.email) return;

    setEmailConfig({
        recipientEmail: vendor.email,
        entity: { id: vendor.id, name: vendor.name, type: 'vendor' }
    });
    setIsEmailDialogOpen(true);
  }

  const handleStartOnboarding = (e: React.MouseEvent, vendor: Vendor) => {
    e.stopPropagation();
    
    updateVendor({ ...vendor, onboardingStatus: 'Invited' });

    toast({
        title: 'Onboarding Initiated',
        description: `The onboarding process for ${vendor.name} has started.`,
    });

    setTimeout(() => {
        const currentVendor = vendors.find(v => v.id === vendor.id);
        if (currentVendor) {
            updateVendor({ ...currentVendor, onboardingStatus: 'KYC Pending' });
            toast({
                title: 'Status Updated via Webhook',
                description: `${vendor.name}'s status is now 'KYC Pending'.`,
            });
        }
    }, 3000);
  };


  return (
    <>
      <PageHeader title="Vendors" description="Manage all vendor relationships.">
        <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
        <Button onClick={() => setIsNewLeadOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Vendor Lead
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
              <TableHead>Name</TableHead>
              <TableHead className="hidden lg:table-cell">Contact</TableHead>
              <TableHead>Onboarding Status</TableHead>
              <TableHead>Lead Type</TableHead>
              <TableHead>Associated Anchor</TableHead>
              <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell className="hidden lg:table-cell">
                    <div>{vendor.contactNumber}</div>
                    <div className="text-xs text-muted-foreground">{vendor.email || 'No email'}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(vendor.onboardingStatus)}>{vendor.onboardingStatus}</Badge>
                </TableCell>
                <TableCell>{vendor.leadType || 'New'}</TableCell>
                <TableCell>{getAnchorName(vendor.anchorId)}</TableCell>
                <TableCell className="hidden lg:table-cell">{getAssignedToName(vendor.assignedTo)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" disabled={!vendor.email} onClick={(e) => handleEmailClick(e, vendor)}>
                        <Mail className="h-4 w-4"/>
                    </Button>
                    <Button size="sm" asChild onClick={(e) => handleStartOnboarding(e, vendor)} className="ml-2">
                        <Link href="https://supermoney.in/onboarding" target="_blank">
                            Start Onboarding
                        </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No vendors found.
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
                              <span className="font-semibold text-xs text-primary">Next Best Action</span>
                              <span className="text-sm">{vendor.nextBestAction.recommendedAction}</span>
                          </div>
                        </Badge>
                      </div>
                    )}
                     <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(vendor.onboardingStatus)}>{vendor.onboardingStatus}</Badge>
                        <Badge variant="outline">{vendor.leadType || 'New'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground pt-2">{vendor.contactNumber}</p>
                      <p className="text-sm text-muted-foreground">{vendor.email || 'No email'}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" disabled={!vendor.email} onClick={(e) => handleEmailClick(e, vendor)}>
                           <Mail className="h-4 w-4"/>
                       </Button>
                       <Button size="sm" asChild onClick={(e) => handleStartOnboarding(e, vendor)}>
                            <Link href="https://supermoney.in/onboarding" target="_blank">
                                Start Onboarding
                            </Link>
                        </Button>
                  </CardFooter>
              </Card>
          )) : (
              <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
                  No vendors found.
              </div>
          )}
      </div>
    </>
  );
}
