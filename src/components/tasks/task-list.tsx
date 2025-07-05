'use client';
import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import type { Task, TaskPriority } from '@/lib/types';
import { LogOutcomeDialog } from './log-outcome-dialog';
import { NewTaskDialog } from './new-task-dialog';

export function TaskList() {
  const { tasks, anchors, currentUser, users, updateTask } = useApp();
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [isLogOutcomeOpen, setIsLogOutcomeOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  
  const getVisibleTasks = () => {
    switch (currentUser.role) {
      case 'Admin':
        return tasks;
      case 'Zonal Sales Manager':
        const teamMemberIds = users.filter(u => u.managerId === currentUser.uid).map(u => u.uid);
        teamMemberIds.push(currentUser.uid);
        return tasks.filter(task => teamMemberIds.includes(task.assignedTo));
      case 'Onboarding Specialist':
      case 'Sales':
        return tasks.filter(task => task.assignedTo === currentUser.uid);
      default:
        return [];
    }
  }
  
  const userTasks = getVisibleTasks();

  const getAnchorName = (anchorId: string) => {
    return anchors.find(a => a.id === anchorId)?.name || 'Unknown';
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Priority</TableHead>
            <TableHead>Task Title</TableHead>
            <TableHead>Associated Anchor</TableHead>
            {(currentUser.role === 'Admin' || currentUser.role === 'Zonal Sales Manager') && <TableHead>Assigned To</TableHead>}
            <TableHead>Task Type</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userTasks.length > 0 ? userTasks.map(task => (
            <TableRow key={task.id}>
              <TableCell><Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge></TableCell>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>{getAnchorName(task.associatedWith.anchorId)}</TableCell>
              {(currentUser.role === 'Admin' || currentUser.role === 'Zonal Sales Manager') && <TableCell>{getAssignedToName(task.assignedTo)}</TableCell>}
              <TableCell>{task.type}</TableCell>
              <TableCell>{format(new Date(task.dueDate), 'PP')}</TableCell>
              <TableCell><Badge variant={task.status === 'Completed' ? 'default' : 'outline'}>{task.status}</Badge></TableCell>
              <TableCell className="text-right">
                {task.status !== 'Completed' && (
                    <Button variant="outline" size="sm" onClick={() => handleCompleteClick(task)}>Complete</Button>
                )}
              </TableCell>
            </TableRow>
          )) : (
             <TableRow>
                <TableCell colSpan={(currentUser.role === 'Admin' || currentUser.role === 'Zonal Sales Manager') ? 8 : 7} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
          )}
        </TableBody>
      </Table>
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
