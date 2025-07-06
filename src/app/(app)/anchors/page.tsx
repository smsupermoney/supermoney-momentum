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

export default function AnchorsPage() {
  const { anchors, currentUser, visibleUserIds } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ recipientEmail: string, entity: { id: string; name: string; type: 'anchor' } } | null>(null);

  const pageTitle = currentUser.role === 'Onboarding Specialist' ? 'Onboarding Anchors' : 'Anchors';

  const userAnchors = anchors.filter(anchor => {
    if (currentUser.role === 'Onboarding Specialist') return true;
    return visibleUserIds.includes(anchor.assignedTo || '');
  });

  const getStatusVariant = (status: LeadStatus): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'Active':
      case 'Onboarding':
        return 'default';
      case 'Negotiation':
      case 'Proposal':
        return 'secondary';
      case 'Lead':
      case 'Initial Contact':
        return 'outline';
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
      <PageHeader title={pageTitle} description="Manage your anchor clients from lead to active.">
        <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Anchor
        </Button>
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
              <CardHeader>
                  <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{anchor.name}</CardTitle>
                      <Badge variant={getStatusVariant(anchor.status)}>{anchor.status}</Badge>
                  </div>
                  <CardDescription>{anchor.industry}</CardDescription>
              </CardHeader>
              <CardContent>
                  {anchor.nextBestAction && (
                    <div className="mb-2">
                      <Badge variant="secondary" className="w-full justify-start py-1.5 px-2 text-left h-auto">
                        <Sparkles className="mr-2 h-4 w-4 text-primary shrink-0" />
                        <div className="flex flex-col">
                            <span className="font-semibold text-xs text-primary">Next Best Action</span>
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
              <p>No anchors found.</p>
              <p className="text-sm">Click "+ New Anchor" to create one.</p>
          </div>
      )}
    </>
  );
}
