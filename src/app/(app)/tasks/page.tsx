'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { NewTaskDialog } from '@/components/tasks/new-task-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskBoard } from '@/components/tasks/task-board';
import { TaskList } from '@/components/tasks/task-list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { useApp } from '@/contexts/app-context';

export default function TasksPage() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const { anchors, currentUser } = useApp();

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

      <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">
            <TabsList>
                <TabsTrigger value="kanban">Kanban View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                 <Select><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Due Date" /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="this-week">This Week</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent></Select>
                 <Select><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Priority" /></SelectTrigger><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select>
                 <Select><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Anchor" /></SelectTrigger><SelectContent>{userAnchors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
            </div>
        </div>

        <TabsContent value="kanban" className="flex-1 overflow-auto">
          <TaskBoard />
        </TabsContent>
        <TabsContent value="list" className="flex-1">
          <TaskList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
