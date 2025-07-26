
'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, Target, FileText, Bot } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import type { UserRole } from '@/lib/types';

export function PipelineCard() {
  const { anchors, currentUser, visibleUserIds } = useApp();
  const { t } = useLanguage();

  const getVisibleAnchors = () => {
    if (!currentUser) return [];

    const managerRoles: UserRole[] = ['Admin', 'Business Development', 'BIU', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'ETB Manager'];
    if (managerRoles.includes(currentUser.role)) {
      // Managers and above see all non-archived anchors created by anyone in their visibility tree
      return anchors.filter(a => a.status !== 'Archived' && visibleUserIds.includes(a.createdBy || ''));
    }
    
    // Sales role sees only anchors they created
    return anchors.filter(a => a.status !== 'Archived' && a.createdBy === currentUser.uid);
  }

  const visibleAnchors = getVisibleAnchors();

  const pipeline = {
    'New Leads': visibleAnchors.filter((a) => a.status === 'Lead').length,
    'Contact Made': visibleAnchors.filter((a) => a.status === 'Initial Contact').length,
    'Proposal Sent': visibleAnchors.filter((a) => a.status === 'Proposal').length,
    'Negotiating': visibleAnchors.filter((a) => a.status === 'Negotiation').length,
  };

  const pipelineItems = [
    { title: t('dashboard.newLeads'), value: pipeline['New Leads'], icon: Target },
    { title: t('dashboard.contactMade'), value: pipeline['Contact Made'], icon: Handshake },
    { title: t('dashboard.proposalSent'), value: pipeline['Proposal Sent'], icon: FileText },
    { title: t('dashboard.negotiating'), value: pipeline['Negotiating'], icon: Bot },
  ];

  const getTitle = () => {
    if (!currentUser) return '';
    const managerRoles: UserRole[] = ['Admin', 'Business Development', 'BIU', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'ETB Manager'];
    if (managerRoles.includes(currentUser.role)) {
        return t('dashboard.teamPipeline');
    }
    return t('dashboard.myPipeline');
  }

  if (visibleAnchors.length === 0) {
      return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
            {getTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {pipelineItems.map((item) => (
            <Card key={item.title} className="flex flex-col justify-between p-4 bg-secondary">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-secondary-foreground">{item.title}</h3>
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold text-primary mt-2">{item.value}</p>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
