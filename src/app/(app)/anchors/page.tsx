
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewAnchorDialog } from '@/components/anchors/new-anchor-dialog';
import type { Anchor, Contact, LeadStatus } from '@/lib/types';
import { PlusCircle, Mail, Sparkles } from 'lucide-react';
import { ComposeEmailDialog } from '@/components/email/compose-email-dialog';
import { useLanguage } from '@/contexts/language-context';

export default function AnchorsPage() {
  const { anchors, currentUser } = useApp();
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ recipientEmail: string, entity: { id: string; name: string; type: 'anchor' } } | null>(null);

  const canAddAnchor = currentUser.role === 'Admin' || currentUser.role === 'Business Development';

  const pageTitle = currentUser.role === 'Business Development' ? t('anchors.onboardingTitle') : t('anchors.title');

  const userAnchors = anchors.filter(anchor => {
    if (anchor.status === 'Archived') return false;

    // Business Development role sees all non-archived anchors, with a special focus on 'Onboarding'
    if (currentUser.role === 'Business Development') {
      return true;
    }
    // Admin sees all non-archived anchors.
    if (currentUser.role === 'Admin') {
        return true;
    }
    // Other roles see all approved anchors that are not archived
    return anchor.status !== 'Pending Approval' && anchor.status !== 'Unassigned Lead';
  });


  const getStatusVariant = (status: LeadStatus): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'Active':
      case 'Onboarding':
        return 'default';
      case 'Proposal':
      case 'Negotiation':
      case 'Pending Approval':
        return 'secondary';
      case 'Lead':
      case 'Initial Contact':
        return 'outline';
      case 'Rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleEmailClick = (e: React.MouseEvent, anchor: Anchor, contact: Contact) => {
    e.stopPropagation();
    e.preventDefault();
    setEmailConfig({
        recipientEmail: contact.email,
        entity: { id: anchor.id, name: anchor.name, type: 'anchor' }
    });
    setIsEmailDialogOpen(true);
  }

  return (
    <>
      <PageHeader title={pageTitle} description={t('anchors.description')}>
        {canAddAnchor && (
          <Button onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('anchors.new')}
          </Button>
        )}
      </PageHeader>
      
      <NewAnchorDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      {emailConfig && (
        <ComposeEmailDialog 
            open={isEmailDialogOpen} 
            onOpenChange={setIsEmailDialogOpen}
            recipientEmail={emailConfig.recipientEmail}
            entity={emailConfig.entity}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {userAnchors.map(anchor => {
          const primaryContact = anchor.contacts.find(c => c.isPrimary) || anchor.contacts[0];
          return (
            <Link key={anchor.id} href={`/anchors/${anchor.id}`} className="block">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer">
              <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{anchor.name}</CardTitle>
                      <Badge variant={getStatusVariant(anchor.status)}>{anchor.status}</Badge>
                  </div>
                  <CardDescription>{anchor.industry}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                  {anchor.nextBestAction && (
                    <div className="mb-2">
                      <Badge variant="secondary" className="w-full justify-start py-1.5 px-2 text-left h-auto">
                        <Sparkles className="mr-2 h-4 w-4 text-primary shrink-0" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-xs text-primary">{t('common.nextBestAction')}</span>
                            <span className="text-sm">{anchor.nextBestAction.recommendedAction}</span>
                        </div>
                      </Badge>
                    </div>
                  )}
                  {primaryContact && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <p className="font-medium">{primaryContact.name}</p>
                      <div className="flex items-center justify-between">
                        <p>{primaryContact.email}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleEmailClick(e, anchor, primaryContact)}>
                            <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
              </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
      {userAnchors.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
              <p>{t('anchors.noAnchors')}</p>
              <p className="text-sm">{t('anchors.noAnchorsDescription')}</p>
          </div>
      )}
    </>
  );
}
