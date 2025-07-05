'use client';

import { useApp } from '@/contexts/app-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { TaskPriority } from '@/lib/types';

export function TaskList() {
  const { tasks, anchors, currentUser, users } = useApp();
  
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

  return (
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
              <TableCell><Badge variant="outline">{task.status}</Badge></TableCell>
            </TableRow>
          )) : (
             <TableRow>
                <TableCell colSpan={(currentUser.role === 'Admin' || currentUser.role === 'Zonal Sales Manager') ? 7 : 6} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
