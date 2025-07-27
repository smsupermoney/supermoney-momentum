
'use client';

import { useApp } from '@/contexts/app-context';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, subDays } from 'date-fns';
import type { DailyActivity, UserRole } from '@/lib/types';
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
  Pencil,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';
import { useState } from 'react';
import { Button } from '../ui/button';
import { EditActivityDialog } from './edit-activity-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { dailyActivities, currentUser, visibleUserIds, deleteDailyActivity } = useApp();
  const { t } = useLanguage();
  const [activityToEdit, setActivityToEdit] = useState<DailyActivity | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<DailyActivity | null>(null);

  const threeDaysAgo = subDays(new Date(), 3);

  const userActivities = dailyActivities
    .filter(activity => visibleUserIds.includes(activity.userId))
    .filter(activity => isAfter(new Date(activity.createdAt), threeDaysAgo));

  const canModify = currentUser && ['Admin', 'BIU'].includes(currentUser.role);

  const handleDelete = () => {
    if (activityToDelete) {
        deleteDailyActivity(activityToDelete.id);
        setActivityToDelete(null);
    }
  }

  if (userActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <div className="mb-4 text-muted-foreground">
          <BookOpen className="h-12 w-12" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">{t('activities.noActivities')}</h3>
        <p className="text-sm text-muted-foreground">{t('activities.noActivitiesDescription')} (last 3 days)</p>
      </div>
    );
  }

  return (
    <>
      {activityToEdit && (
        <EditActivityDialog
            open={!!activityToEdit}
            onOpenChange={() => setActivityToEdit(null)}
            activity={activityToEdit}
        />
      )}
      <AlertDialog open={!!activityToDelete} onOpenChange={() => setActivityToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the activity log: "{activityToDelete?.title}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete Activity
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                 {canModify && (
                    <div className="border-t -mx-4 pt-3 mt-3 flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setActivityToEdit(activity)}>
                            <Pencil className="mr-2 h-3 w-3"/> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setActivityToDelete(activity)}>
                            <Trash2 className="mr-2 h-3 w-3"/> Delete
                        </Button>
                    </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );
}
