'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApp } from '@/contexts/app-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/types';

const formSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  anchorId: z.string().min(1, 'Associated anchor is required'),
  type: z.string().min(1, 'Task type is required'),
  dueDate: z.date({ required_error: 'A due date is required.' }),
  priority: z.string().min(1, 'Priority is required'),
  description: z.string().optional(),
});

type NewTaskFormValues = z.infer<typeof formSchema>;

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledAnchorId?: string;
}

export function NewTaskDialog({ open, onOpenChange, prefilledAnchorId }: NewTaskDialogProps) {
  const { anchors, addTask, currentUser } = useApp();
  const { toast } = useToast();

  const form = useForm<NewTaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: '',
        anchorId: prefilledAnchorId || '',
        type: '',
        priority: 'Medium',
        description: '',
    },
  });

  useEffect(() => {
    if(prefilledAnchorId) {
        form.setValue('anchorId', prefilledAnchorId);
    }
  }, [prefilledAnchorId, form]);

  const handleClose = () => {
    form.reset({
        title: '',
        anchorId: prefilledAnchorId || '',
        type: '',
        priority: 'Medium',
        description: '',
        dueDate: undefined
    });
    onOpenChange(false);
  };

  const onSubmit = (values: NewTaskFormValues) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: values.title,
      associatedWith: { anchorId: values.anchorId },
      type: values.type as Task['type'],
      dueDate: values.dueDate.toISOString(),
      priority: values.priority as Task['priority'],
      description: values.description || '',
      status: 'To-Do',
      assignedTo: currentUser.uid,
      createdAt: new Date().toISOString(),
    };
    addTask(newTask);
    toast({ title: 'Task Created', description: `Task "${values.title}" has been added.` });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>+ New Task</DialogTitle>
          <DialogDescription>Schedule a new action or follow-up.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField name="title" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Task Title</FormLabel><FormControl><Input placeholder="e.g. Follow up on Proposal V2" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField name="anchorId" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Associated With</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select an Anchor" /></SelectTrigger></FormControl>
                        <SelectContent>{anchors.map(a => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}</SelectContent>
                    </Select><FormMessage />
                </FormItem>
            )}/>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <FormField name="type" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Task Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Call">Call</SelectItem><SelectItem value="Email">Email</SelectItem>
                                <SelectItem value="Meeting (Online)">Meeting (Online)</SelectItem><SelectItem value="Meeting (In-person)">Meeting (In-person)</SelectItem>
                                <SelectItem value="KYC Document Collection">KYC Document Collection</SelectItem><SelectItem value="Proposal Preparation">Proposal Preparation</SelectItem>
                                <SelectItem value="Internal Review">Internal Review</SelectItem>
                            </SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )}/>
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
             <FormField name="priority" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                    </Select><FormMessage />
                </FormItem>
            )}/>
             <FormField name="description" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Description / Notes</FormLabel><FormControl><Textarea placeholder="Add any details, agenda points, or context..." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
