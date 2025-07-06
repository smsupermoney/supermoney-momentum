
'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { DailyActivity } from '@/lib/types';
import {
  Briefcase,
  Building2,
  Presentation,
  Mail,
  Plane,
  FileText,
  BookOpen,
  Users,
  MapPin,
} from 'lucide-react';
import Image from 'next/image';

const activityIcons: Record<DailyActivity['activityType'], React.ElementType> = {
  'Client Meeting': Briefcase,
  'Site Visit': Building2,
  'Sales Presentation': Presentation,
  'Follow-up': Mail,
  'Travel Time': Plane,
  'Administrative': FileText,
  'Training': BookOpen,
  'Networking': Users,
};

export function ActivityList() {
  const { dailyActivities, currentUser, visibleUserIds } = useApp();

  const userActivities = dailyActivities.filter(activity => visibleUserIds.includes(activity.userId));

  if (userActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mb-4 text-muted-foreground">
          <BookOpen className="h-12 w-12" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">No activities logged yet.</h3>
        <p className="text-sm text-muted-foreground">Click "Log New Activity" to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {userActivities.map(activity => {
        const Icon = activityIcons[activity.activityType] || Briefcase;
        
        const entityName = activity.anchorName || activity.dealerName || activity.vendorName;
        const entityType = activity.anchorName ? 'Client' : activity.dealerName ? 'Dealer' : activity.vendorName ? 'Vendor' : null;

        return (
          <Card key={activity.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg">{activity.title}</CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    {format(new Date(activity.startTime), 'PPP, p')} - {format(new Date(activity.endTime), 'p')}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                    <Badge variant="secondary">{activity.activityType}</Badge>
                     {currentUser?.role !== 'Sales' && <span className="text-xs text-muted-foreground">{activity.userName}</span>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {entityName && <p className="text-sm font-medium">{entityType}: {entityName}</p>}
              {activity.notes && <p className="text-sm text-muted-foreground">{activity.notes}</p>}
              {activity.location && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>Lat: {activity.location.latitude.toFixed(4)}, Lng: {activity.location.longitude.toFixed(4)}</span>
                  </div>
              )}
               {activity.images && activity.images.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Attachments</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                        {activity.images.map((src, index) => (
                            <div key={index} className="relative aspect-square">
                                <Image src={src} alt={`Attachment ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
