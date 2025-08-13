
'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Mail, Phone, Calendar, PenSquare } from 'lucide-react';
import type { TaskType } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';


const iconMap: Record<TaskType, React.ElementType> = {
    'Call': Phone,
    'Email': Mail,
    'Meeting (Online)': Calendar,
    'Meeting (In-person)': Calendar,
    'KYC Document Collection': PenSquare,
    'Proposal Preparation': PenSquare,
    'Internal Review': PenSquare,
};


export function RecentActivityCard({ className }: { className?: string }) {
  const { activityLogs, visibleUserIds } = useApp();
  const { t } = useLanguage();

  const visibleLogs = activityLogs
    .filter(log => visibleUserIds.includes(log.userId))
    .slice(0, 10);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <div className="space-y-6 pr-4">
            {visibleLogs.map((log) => {
              const Icon = iconMap[log.type as TaskType] || PenSquare;
              return (
                <div key={log.id} className="flex items-start gap-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1 flex-1">
                    <p className="text-sm font-medium leading-none">{log.title}</p>
                    <p className="text-sm text-muted-foreground">{log.outcome}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.userName} &bull; {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })}
             {visibleLogs.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                {t('dashboard.noRecentActivity')}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
