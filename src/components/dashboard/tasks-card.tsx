'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { TaskPriority, UserRole } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';

export function TasksCard() {
  const { tasks, anchors, currentUser, users, visibleUserIds } = useApp();
  const { t } = useLanguage();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getVisibleTasks = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'Onboarding Specialist') {
      return tasks.filter(task => task.assignedTo === currentUser.uid);
    }
    return tasks.filter(task => visibleUserIds.includes(task.assignedTo));
  }

  const todaysTasks = getVisibleTasks().filter(task => {
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime() && task.status !== 'Completed';
  });

  const getAnchorName = (anchorId: string) => {
    return anchors.find(a => a.id === anchorId)?.name || 'Unknown Anchor';
  };
  
  const getAssignedToName = (userId: string) => {
      return users.find(u => u.uid === userId)?.name.split(' ')[0] || 'Unknown';
  }

  const priorityVariant: Record<TaskPriority, "destructive" | "secondary" | "default"> = {
      'High': 'destructive',
      'Medium': 'secondary',
      'Low': 'default'
  }

  const getTitle = () => {
    if (!currentUser) return t('dashboard.myTasksToday');
    const managerialRoles: UserRole[] = ['Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Admin'];
    if (managerialRoles.includes(currentUser.role)) {
      return t('dashboard.teamTasksToday');
    }
    return t('dashboard.myTasksToday');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
            {getTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <div className="space-y-4 pr-4">
            {todaysTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3">
                <Checkbox id={`task-${task.id}`} className="mt-1" />
                <div className="grid gap-1.5 leading-none flex-1">
                  <label htmlFor={`task-${task.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {task.title}
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{getAnchorName(task.associatedWith.anchorId)}</p>
                    <Badge variant={priorityVariant[task.priority]} className="capitalize">{task.priority}</Badge>
                     { (currentUser.role !== 'Sales' && currentUser.role !== 'Onboarding Specialist') && (
                        <Badge variant="outline">{getAssignedToName(task.assignedTo)}</Badge>
                     )}
                  </div>
                </div>
              </div>
            ))}
            {todaysTasks.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                {t('dashboard.noTasksToday')}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
