'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, Target, FileText, Bot } from 'lucide-react';

export function PipelineCard() {
  const { anchors, currentUser, visibleUserIds } = useApp();

  const getVisibleAnchors = () => {
    if (!currentUser) return [];
    // Onboarding specialists do not see a pipeline view on their dashboard
    if (currentUser.role === 'Onboarding Specialist') return [];
    return anchors.filter(anchor => visibleUserIds.includes(anchor.assignedTo || ''));
  }

  const visibleAnchors = getVisibleAnchors();

  const pipeline = {
    'New Leads': visibleAnchors.filter((a) => a.status === 'Lead').length,
    'Contact Made': visibleAnchors.filter((a) => a.status === 'Initial Contact').length,
    'Proposal Sent': visibleAnchors.filter((a) => a.status === 'Proposal').length,
    'Negotiating': visibleAnchors.filter((a) => a.status === 'Negotiation').length,
  };

  const pipelineItems = [
    { title: 'New Leads', value: pipeline['New Leads'], icon: Target },
    { title: 'Contact Made', value: pipeline['Contact Made'], icon: Handshake },
    { title: 'Proposal Sent', value: pipeline['Proposal Sent'], icon: FileText },
    { title: 'Negotiating', value: pipeline['Negotiating'], icon: Bot },
  ];

  const getTitle = () => {
    if (!currentUser) return 'My Pipeline';
    if (currentUser.role === 'Sales') return 'My Pipeline';
    if (currentUser.role === 'Admin') return 'Company Pipeline';
    // For ZSM, RSM, NSM
    return 'Team Pipeline';
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
