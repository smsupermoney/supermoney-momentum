'use client';

import { useApp } from '@/contexts/app-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { TaskPriority } from '@/lib/types';

export function TaskList() {
  const { tasks, anchors, currentUser } = useApp();
  
  const userTasks = tasks.filter(task => task.assignedTo === currentUser.uid);

  const getAnchorName = (anchorId: string) => {
    return anchors.find(a => a.id === anchorId)?.name || 'Unknown';
  };
  
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
              <TableCell>{task.type}</TableCell>
              <TableCell>{format(new Date(task.dueDate), 'PP')}</TableCell>
              <TableCell><Badge variant="outline">{task.status}</Badge></TableCell>
            </TableRow>
          )) : (
             <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
