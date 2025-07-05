'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, Target, FileText, Bot } from 'lucide-react';

export function PipelineCard() {
  const { anchors, currentUser } = useApp();

  const userAnchors = anchors.filter(
    (anchor) => anchor.assignedTo === currentUser.uid
  );

  const pipeline = {
    'New Leads': userAnchors.filter((a) => a.status === 'Lead').length,
    'Contact Made': userAnchors.filter((a) => a.status === 'Initial Contact').length,
    'Proposal Sent': userAnchors.filter((a) => a.status === 'Proposal').length,
    'Negotiating': userAnchors.filter((a) => a.status === 'Negotiation').length,
  };

  const pipelineItems = [
    { title: 'New Leads', value: pipeline['New Leads'], icon: Target },
    { title: 'Contact Made', value: pipeline['Contact Made'], icon: Handshake },
    { title: 'Proposal Sent', value: pipeline['Proposal Sent'], icon: FileText },
    { title: 'Negotiating', value: pipeline['Negotiating'], icon: Bot },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Pipeline</CardTitle>
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
