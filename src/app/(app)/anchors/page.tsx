'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewAnchorDialog } from '@/components/anchors/new-anchor-dialog';
import type { LeadStatus } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

export default function AnchorsPage() {
  const { anchors, currentUser, users } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const pageTitle = currentUser.role === 'Onboarding Specialist' ? 'Onboarding Anchors' : 'Anchors';

  const userAnchors = anchors.filter(anchor => {
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'Onboarding Specialist') {
      return anchor.status === 'Onboarding';
    }
    if (currentUser.role === 'Zonal Sales Manager') {
      const teamMemberIds = users.filter(u => u.managerId === currentUser.uid).map(u => u.uid);
      teamMemberIds.push(currentUser.uid); // Include ZSM's own leads
      return teamMemberIds.includes(anchor.assignedTo || '');
    }
    // Default for 'Sales' role
    return anchor.assignedTo === currentUser.uid;
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

  return (
    <>
      <PageHeader title={pageTitle} description="Manage your anchor clients from lead to active.">
        {currentUser.role !== 'Onboarding Specialist' && (
            <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Anchor
            </Button>
        )}
      </PageHeader>
      
      <NewAnchorDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {userAnchors.map(anchor => (
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
                <div className="text-sm text-muted-foreground">
                <p className="font-medium">{anchor.primaryContactName}</p>
                <p>{anchor.email}</p>
                </div>
            </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {userAnchors.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
              <p>No anchors found.</p>
              {currentUser.role !== 'Onboarding Specialist' && (
                <p className="text-sm">Click "+ New Anchor" to create one.</p>
              )}
          </div>
      )}
    </>
  );
}
