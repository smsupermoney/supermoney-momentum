
'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import type { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Mail, Phone, Calendar, PenSquare, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { LogOutcomeDialog } from './log-outcome-dialog';
import { NewTaskDialog } from './new-task-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from '@/contexts/language-context';

const taskTypeIcons = {
  'Call': Phone,
  'Email': Mail,
  'Meeting (Online)': Calendar,
  'Meeting (In-person)': Calendar,
  'KYC Document Collection': PenSquare,
  'Proposal Preparation': PenSquare,
  'Internal Review': PenSquare,
};

const priorityColors: Record<TaskPriority, string> = {
  'High': 'bg-red-500',
  'Medium': 'bg-yellow-500',
  'Low': 'bg-green-500',
};

export function TaskBoard() {
  const { tasks, anchors, updateTask, currentUser, users } = useApp();
  const { t } = useLanguage();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
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
      case 'Business Development':
      case 'Sales':
        return tasks.filter(task => task.assignedTo === currentUser.uid);
      default:
        return [];
    }
  }

  const userTasks = getVisibleTasks();
  
  const columnMap: Record<TaskStatus, string> = {
    'To-Do': t('tasks.board.todo'),
    'In Progress': t('tasks.board.inProgress'),
    'Completed': t('tasks.board.completed')
  }

  const columns: TaskStatus[] = ['To-Do', 'In Progress', 'Completed'];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTask(task);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    if (!draggedTask) return;
    
    if (status === 'Completed' && draggedTask.status !== 'Completed') {
      setCompletedTask(draggedTask);
      setIsLogOutcomeOpen(true);
    } else {
      updateTask({ ...draggedTask, status });
    }
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
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
  
  const handleMoveTask = (task: Task, status: TaskStatus) => {
       if (status === 'Completed' && task.status !== 'Completed') {
          setCompletedTask(task);
          setIsLogOutcomeOpen(true);
        } else {
          updateTask({ ...task, status });
        }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
      {columns.map(status => (
        <Card key={status} className="h-full flex flex-col bg-secondary" onDrop={(e) => handleDrop(e, status)} onDragOver={handleDragOver}>
          <CardHeader>
            <CardTitle>{columnMap[status]}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto">
            {userTasks
              .filter(task => task.status === status)
              .map(task => {
                const anchor = anchors.find(a => a.id === task.associatedWith.anchorId);
                const Icon = taskTypeIcons[task.type];

                return (
                  <div 
                    key={task.id} 
                    className="bg-card p-4 rounded-lg shadow-sm cursor-grab" 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, task)}
                  >
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{task.title}</span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {columns.filter(c => c !== status).map(col => (
                                    <DropdownMenuItem key={col} onClick={() => handleMoveTask(task, col)}>{t('tasks.board.moveTo', { status: columnMap[col] })}</DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{anchor?.name}</p>
                    <div className="flex items-center justify-between mt-3 text-xs">
                      <Badge variant="outline">{format(new Date(task.dueDate), 'MMM d')}</Badge>
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{task.priority}</span>
                        <div className={`h-3 w-3 rounded-full ${priorityColors[task.priority]}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      ))}
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
    </div>
  );
}
