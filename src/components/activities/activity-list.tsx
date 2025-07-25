
'use client';

import { useApp } from '@/contexts/app-context';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { DailyActivity } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Briefcase,
  Building2,
  Presentation,
  Mail,
  FileText,
  BookOpen,
  Users,
  MapPin,
} from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';

const activityIcons: Record<DailyActivity['activityType'], React.ElementType> = {
  'Client Meeting': Briefcase,
  'Site Visit': Building2,
  'Sales Presentation': Presentation,
  'Follow-up': Mail,
  'Administrative': FileText,
  'Training': BookOpen,
  'Networking': Users,
};

export function ActivityList() {
  const { dailyActivities, currentUser, visibleUserIds } = useApp();
  const { t } = useLanguage();

  const userActivities = dailyActivities.filter(activity => visibleUserIds.includes(activity.userId));

  if (userActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mb-4 text-muted-foreground">
          <BookOpen className="h-12 w-12" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">{t('activities.noActivities')}</h3>
        <p className="text-sm text-muted-foreground">{t('activities.noActivitiesDescription')}</p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full space-y-2">
      {userActivities.map(activity => {
        const Icon = activityIcons[activity.activityType] || Briefcase;
        const entityName = activity.anchorName || activity.dealerName || activity.vendorName;
        const entityType = activity.anchorName ? 'Client' : activity.dealerName ? 'Dealer' : activity.vendorName ? 'Vendor' : null;

        return (
          <AccordionItem value={activity.id} key={activity.id} className="rounded-lg border bg-card px-4">
            <AccordionTrigger className="w-full hover:no-underline py-3">
              <div className="flex w-full items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3 flex-1">
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(activity.activityTimestamp), 'PP, p')}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                  <Badge variant="secondary">{activity.activityType}</Badge>
                  {currentUser?.role !== 'Area Sales Manager' && <span className="text-xs text-muted-foreground">{activity.userName}</span>}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-3">
              <div className="border-t -mx-4 my-2"></div>
              {entityName && <p className="text-sm font-medium">{entityType}: {entityName}</p>}
              {activity.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.notes}</p>}
              {activity.locationAddress && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{activity.locationAddress}</span>
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
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
