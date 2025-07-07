
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { NewTaskDialog } from '@/components/tasks/new-task-dialog';
import { TaskList } from '@/components/tasks/task-list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { useApp } from '@/contexts/app-context';
import { useLanguage } from '@/contexts/language-context';

export default function TasksPage() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const { anchors, currentUser } = useApp();
  const { t } = useLanguage();

  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [anchorFilter, setAnchorFilter] = useState('all');

  const userAnchors = anchors.filter(anchor => {
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'Business Development') return anchor.status === 'Onboarding';
    return anchor.assignedTo === currentUser.uid;
  })

  return (
    <div className="h-full flex flex-col">
      <PageHeader title={t('tasks.title')} description={t('tasks.description')}>
        <Button onClick={() => setIsNewTaskOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('tasks.newTask')}
        </Button>
      </PageHeader>
      
      <NewTaskDialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto ml-auto">
               <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder={t('tasks.filterDueDate')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tasks.allDueDates')}</SelectItem>
                    <SelectItem value="today">{t('tasks.today')}</SelectItem>
                    <SelectItem value="this-week">{t('tasks.thisWeek')}</SelectItem>
                    <SelectItem value="overdue">{t('tasks.overdue')}</SelectItem>
                  </SelectContent>
               </Select>
               <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder={t('tasks.filterPriority')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tasks.allPriorities')}</SelectItem>
                    <SelectItem value="High">{t('tasks.high')}</SelectItem>
                    <SelectItem value="Medium">{t('tasks.medium')}</SelectItem>
                    <SelectItem value="Low">{t('tasks.low')}</SelectItem>
                  </SelectContent>
               </Select>
               <Select value={anchorFilter} onValueChange={setAnchorFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder={t('tasks.filterAnchor')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('tasks.allAnchors')}</SelectItem>
                    {userAnchors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
               </Select>
          </div>
      </div>

      <div className="flex-1">
        <TaskList 
          dueDateFilter={dueDateFilter}
          priorityFilter={priorityFilter}
          anchorFilter={anchorFilter}
        />
      </div>
    </div>
  );
}
