
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
import type { Dealer, OnboardingStatus } from '@/lib/types';
import { DealerDetailsDialog } from '@/components/dealers/dealer-details-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposeEmailDialog } from '@/components/email/compose-email-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

export default function DealersPage() {
  const { dealers, anchors, users, currentUser, updateDealer, visibleUserIds } = useApp();
  const { t } = useLanguage();
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ recipientEmail: string, entity: { id: string; name: string; type: 'dealer' } } | null>(null);
  const { toast } = useToast();

  const userDealers = dealers.filter(d => {
    if (d.onboardingStatus === 'Onboarding') return false;
    if (currentUser.role === 'Business Development') return true;
    return visibleUserIds.includes(d.assignedTo || '');
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

  const handleEmailClick = (e: React.MouseEvent, dealer: Dealer) => {
    e.stopPropagation();
    if (!dealer.email) return;

    setEmailConfig({
        recipientEmail: dealer.email,
        entity: { id: dealer.id, name: dealer.name, type: 'dealer' }
    });
    setIsEmailDialogOpen(true);
  }

  const handleStartOnboarding = (e: React.MouseEvent, dealer: Dealer) => {
    e.stopPropagation();
    
    updateDealer({ ...dealer, onboardingStatus: 'Onboarding' });

    toast({
        title: 'Onboarding Started',
        description: `${dealer.name} has been moved to the onboarding flow.`,
    });
  };


  return (
    <>
      <PageHeader title={t('dealers.title')} description={t('dealers.description')}>
        <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          {t('dealers.bulkUpload')}
        </Button>
        <Button onClick={() => setIsNewLeadOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('dealers.newLead')}
        </Button>
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


      {/* Desktop Table View */}
      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('dealers.table.name')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('dealers.table.contact')}</TableHead>
              <TableHead>{t('dealers.table.status')}</TableHead>
              <TableHead>{t('dealers.table.leadType')}</TableHead>
              <TableHead>{t('dealers.table.anchor')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('dealers.table.assignedTo')}</TableHead>
              <TableHead className="text-right">{t('dealers.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userDealers.length > 0 ? userDealers.map(dealer => (
              <TableRow key={dealer.id} onClick={() => setSelectedDealer(dealer)} className="cursor-pointer">
                <TableCell className="font-medium">
                  <div>{dealer.name}</div>
                  {dealer.nextBestAction && (
                      <Badge variant="secondary" className="mt-1.5 justify-start py-1 px-2 text-left h-auto font-normal">
                          <Sparkles className="mr-1.5 h-3 w-3 text-primary shrink-0" />
                          <span className="text-xs">{dealer.nextBestAction.recommendedAction}</span>
                      </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                    <div>{dealer.contactNumber}</div>
                    <div className="text-xs text-muted-foreground">{dealer.email || 'No email'}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(dealer.onboardingStatus)}>{dealer.onboardingStatus}</Badge>
                </TableCell>
                <TableCell>{dealer.leadType || 'New'}</TableCell>
                <TableCell>{getAnchorName(dealer.anchorId)}</TableCell>
                <TableCell className="hidden lg:table-cell">{getAssignedToName(dealer.assignedTo)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" disabled={!dealer.email} onClick={(e) => handleEmailClick(e, dealer)}>
                        <Mail className="h-4 w-4"/>
                    </Button>
                    <Button size="sm" asChild onClick={(e) => handleStartOnboarding(e, dealer)}>
                        <Link href="https://supermoney.in/onboarding" target="_blank">
                            {t('dealers.startOnboarding')}
                        </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t('dealers.noDealers')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
          {userDealers.length > 0 ? userDealers.map(dealer => (
              <Card key={dealer.id} onClick={() => setSelectedDealer(dealer)} className="cursor-pointer">
                  <CardHeader>
                      <CardTitle>{dealer.name}</CardTitle>
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
                        <Badge variant={getStatusVariant(dealer.onboardingStatus)}>{dealer.onboardingStatus}</Badge>
                        <Badge variant="outline">{dealer.leadType || 'New'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground pt-2">{dealer.contactNumber}</p>
                      <p className="text-sm text-muted-foreground">{dealer.email || 'No email'}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" disabled={!dealer.email} onClick={(e) => handleEmailClick(e, dealer)}>
                           <Mail className="h-4 w-4"/>
                       </Button>
                       <Button size="sm" asChild onClick={(e) => handleStartOnboarding(e, dealer)}>
                            <Link href="https://supermoney.in/onboarding" target="_blank">
                                {t('dealers.startOnboarding')}
                            </Link>
                        </Button>
                  </CardFooter>
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
