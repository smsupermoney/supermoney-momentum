'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { NewTaskDialog } from '@/components/tasks/new-task-dialog';
import { TaskList } from '@/components/tasks/task-list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { useApp } from '@/contexts/app-context';

export default function TasksPage() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const { anchors, currentUser } = useApp();

  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [anchorFilter, setAnchorFilter] = useState('all');

  const userAnchors = anchors.filter(anchor => {
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'Onboarding Specialist') return anchor.status === 'Onboarding';
    return anchor.assignedTo === currentUser.uid;
  })

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Tasks" description="Your central workspace for all sales activities and follow-ups.">
        <Button onClick={() => setIsNewTaskOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </PageHeader>
      
      <NewTaskDialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto ml-auto">
               <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Due Date" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Due Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
               </Select>
               <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
               </Select>
               <Select value={anchorFilter} onValueChange={setAnchorFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Anchor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Anchors</SelectItem>
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
