
'use client';
import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isToday, isThisWeek, isPast } from 'date-fns';
import type { Task, TaskPriority, UserRole } from '@/lib/types';
import { LogOutcomeDialog } from './log-outcome-dialog';
import { NewTaskDialog } from './new-task-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/language-context';

interface TaskListProps {
  dueDateFilter?: string;
  priorityFilter?: string;
  anchorFilter?: string;
  assignedToFilter?: string;
}

export function TaskList({ dueDateFilter, priorityFilter, anchorFilter, assignedToFilter }: TaskListProps) {
  const { tasks, anchors, dealers, vendors, currentUser, users, updateTask, visibleUserIds } = useApp();
  const { t } = useLanguage();
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [isLogOutcomeOpen, setIsLogOutcomeOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  
  const getVisibleTasks = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'Business Development') {
      return tasks.filter(task => task.assignedTo === currentUser.uid);
    }
    return tasks.filter(task => visibleUserIds.includes(task.assignedTo));
  }
  
  const filteredTasks = getVisibleTasks()
    .filter(task => task.status !== 'Completed')
    .filter(task => {
        if (!dueDateFilter || dueDateFilter === 'all') return true;
        const dueDate = new Date(task.dueDate);
        if (dueDateFilter === 'today') return isToday(dueDate);
        if (dueDateFilter === 'this-week') return isThisWeek(dueDate, { weekStartsOn: 1 });
        if (dueDateFilter === 'overdue') return isPast(dueDate) && !isToday(dueDate);
        return true;
    })
    .filter(task => {
        if (!priorityFilter || priorityFilter === 'all') return true;
        return task.priority === priorityFilter;
    })
    .filter(task => {
        if (!anchorFilter || anchorFilter === 'all') return true;
        return task.associatedWith.anchorId === anchorFilter;
    })
    .filter(task => {
      if (!assignedToFilter || assignedToFilter === 'all') return true;
      return task.assignedTo === assignedToFilter;
    });


  const getEntityName = (task: Task) => {
    const { anchorId, dealerId, vendorId } = task.associatedWith;
    if (anchorId) return anchors.find(a => a.id === anchorId)?.name || 'Unknown Anchor';
    if (dealerId) return dealers.find(d => d.id === dealerId)?.name || 'Unknown Dealer';
    if (vendorId) return vendors.find(v => v.id === vendorId)?.name || 'Unknown Vendor';
    return 'N/A';
  };

  const getAssignedToName = (userId: string) => {
    return users.find(u => u.uid === userId)?.name || 'Unknown';
  }
  
  const priorityVariant: Record<TaskPriority, "destructive" | "secondary" | "default"> = {
      'High': 'destructive',
      'Medium': 'secondary',
      'Low': 'default'
  }

  const handleCompleteClick = (task: Task) => {
      setCompletedTask(task);
      setIsLogOutcomeOpen(true);
  }

  const handleLogOutcomeSubmit = (createFollowUp: boolean) => {
      if(completedTask) {
        updateTask({ ...completedTask, status: 'Completed' });
        if (createFollowUp) {
            // Slight delay to allow one modal to close before the next opens
            setTimeout(() => setIsNewTaskOpen(true), 100);
        }
      }
      setCompletedTask(null);
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tasks.list.priority')}</TableHead>
              <TableHead>{t('tasks.list.title')}</TableHead>
              <TableHead>{t('tasks.list.anchor')}</TableHead>
              <TableHead>{t('tasks.list.assignedTo')}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('tasks.list.type')}</TableHead>
              <TableHead>{t('tasks.list.dueDate')}</TableHead>
              <TableHead>{t('tasks.list.status')}</TableHead>
              <TableHead className="text-right">{t('tasks.list.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length > 0 ? filteredTasks.map(task => (
              <TableRow key={task.id}>
                <TableCell><Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge></TableCell>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{getEntityName(task)}</TableCell>
                <TableCell>{getAssignedToName(task.assignedTo)}</TableCell>
                <TableCell className="hidden lg:table-cell">{task.type}</TableCell>
                <TableCell>{format(new Date(task.dueDate), 'PP')}</TableCell>
                <TableCell><Badge variant={task.status === 'Completed' ? 'default' : 'outline'}>{task.status}</Badge></TableCell>
                <TableCell className="text-right">
                  {task.status !== 'Completed' && (
                      <Button variant="outline" size="sm" onClick={() => handleCompleteClick(task)}>{t('tasks.list.complete')}</Button>
                  )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {t('tasks.list.noTasks')}
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="grid gap-4 md:hidden">
        {filteredTasks.length > 0 ? filteredTasks.map(task => (
          <Card key={task.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <p className="font-medium pr-2">{task.title}</p>
                <Badge variant={priorityVariant[task.priority]} className="flex-shrink-0">{task.priority}</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium">{t('tasks.list.anchor')}:</span> {getEntityName(task)}</p>
                <p><span className="font-medium">{t('tasks.list.assignedTo')}:</span> {getAssignedToName(task.assignedTo)}</p>
                <p><span className="font-medium">{t('tasks.list.dueDate')}:</span> {format(new Date(task.dueDate), 'PP')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{task.type}</Badge>
                <Badge variant={task.status === 'Completed' ? 'default' : 'outline'}>{task.status}</Badge>
              </div>
              {task.status !== 'Completed' && (
                  <Button variant="outline" size="sm" onClick={() => handleCompleteClick(task)} className="w-full">{t('tasks.list.complete')} Task</Button>
              )}
            </CardContent>
          </Card>
        )) : (
          <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
            {t('tasks.list.noTasks')}
          </div>
        )}
      </div>

      {completedTask && (
        <LogOutcomeDialog 
            open={isLogOutcomeOpen} 
            onOpenChange={setIsLogOutcomeOpen}
            task={completedTask}
            onSubmit={handleLogOutcomeSubmit}
        />
      )}
      {completedTask && (
        <NewTaskDialog
            open={isNewTaskOpen}
            onOpenChange={setIsNewTaskOpen}
            prefilledAnchorId={completedTask.associatedWith.anchorId}
        />
      )}
    </>
  );
}
