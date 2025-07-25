
'use client';

import { useEffect, useState } from 'react';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { format, parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Task, UserRole } from '@/lib/types';
import { NewTaskSchema } from '@/lib/validation';


type NewTaskFormValues = z.infer<typeof NewTaskSchema>;

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledAnchorId?: string;
}

const managerRoles: UserRole[] = ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];

export function NewTaskDialog({ open, onOpenChange, prefilledAnchorId }: NewTaskDialogProps) {
  const { anchors, dealers, vendors, addTask, currentUser, visibleUsers } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const isManager = currentUser && managerRoles.includes(currentUser.role);
  
  const allEntities = [
      ...anchors.map(a => ({ value: `anchor:${a.id}`, label: a.name, group: 'Anchors' })),
      ...dealers.map(d => ({ value: `dealer:${d.id}`, label: d.name, group: 'Dealers' })),
      ...vendors.map(v => ({ value: `vendor:${v.id}`, label: v.name, group: 'Vendors' })),
  ];

  const form = useForm<NewTaskFormValues>({
    resolver: zodResolver(NewTaskSchema),
    defaultValues: {
        title: '',
        associatedEntity: prefilledAnchorId ? `anchor:${prefilledAnchorId}` : '',
        type: '',
        priority: 'Medium',
        description: '',
        assignedTo: currentUser?.uid,
    },
  });

  useEffect(() => {
    if(prefilledAnchorId) {
        form.setValue('associatedEntity', `anchor:${prefilledAnchorId}`);
    }
     form.setValue('assignedTo', currentUser?.uid);
  }, [prefilledAnchorId, currentUser, form, open]);

  const handleClose = () => {
    form.reset({
        title: '',
        associatedEntity: prefilledAnchorId ? `anchor:${prefilledAnchorId}` : '',
        type: '',
        priority: 'Medium',
        description: '',
        dueDate: undefined,
        assignedTo: currentUser?.uid,
    });
    onOpenChange(false);
  };

  const onSubmit = (values: NewTaskFormValues) => {
    if(!currentUser) {
        toast({variant: 'destructive', title: 'Error', description: 'You must be logged in.'});
        return;
    }
    setIsSubmitting(true);
    try {
        const assignedToId = values.assignedTo || currentUser.uid;
        
        const associatedWith: { anchorId?: string; dealerId?: string; vendorId?: string; } = {};
        if (values.associatedEntity) {
            const [type, id] = values.associatedEntity.split(':');
            if (type === 'anchor') associatedWith.anchorId = id;
            if (type === 'dealer') associatedWith.dealerId = id;
            if (type === 'vendor') associatedWith.vendorId = id;
        }

        const newTask: Omit<Task, 'id'> = {
          title: values.title,
          associatedWith: associatedWith,
          type: values.type as Task['type'],
          dueDate: parse(values.dueDate, 'dd/MM/yyyy', new Date()).toISOString(),
          priority: values.priority as Task['priority'],
          description: values.description || '',
          status: 'To-Do',
          assignedTo: assignedToId,
          createdAt: new Date().toISOString(),
        };
        addTask(newTask);
        toast({ title: 'Task Created', description: `Task "${values.title}" has been added.` });
        handleClose();
    } catch (error) {
        toast({variant: 'destructive', title: 'Error', description: 'Failed to create task.'});
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>+ New Task</DialogTitle>
          <DialogDescription>Schedule a new action or follow-up.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            {isManager && (
                <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a team member" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {visibleUsers.map((user) => (
                                <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}

            <FormField name="title" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Task Title</FormLabel><FormControl><Input placeholder="e.g. Follow up on Proposal V2" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField
                control={form.control}
                name="associatedEntity"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Associated With (Optional)</FormLabel>
                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value
                                        ? allEntities.find(
                                            (entity) => entity.value === field.value
                                          )?.label
                                        : "Select an entity"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search entity..." />
                                    <CommandEmpty>No entity found.</CommandEmpty>
                                    <CommandList>
                                        <CommandGroup heading="Anchors">
                                            {anchors.map((item) => (
                                                <CommandItem
                                                  key={item.id}
                                                  value={item.name}
                                                  onSelect={() => {
                                                    form.setValue("associatedEntity", `anchor:${item.id}`);
                                                    setComboboxOpen(false);
                                                  }}
                                                >
                                                  <Check className={cn("mr-2 h-4 w-4", field.value === `anchor:${item.id}` ? "opacity-100" : "opacity-0")}/>
                                                  {item.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandGroup heading="Dealers">
                                             {dealers.map((item) => (
                                                <CommandItem
                                                  key={item.id}
                                                  value={item.name}
                                                  onSelect={() => {
                                                    form.setValue("associatedEntity", `dealer:${item.id}`);
                                                    setComboboxOpen(false);
                                                  }}
                                                >
                                                   <Check className={cn("mr-2 h-4 w-4", field.value === `dealer:${item.id}` ? "opacity-100" : "opacity-0")}/>
                                                   {item.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandGroup heading="Vendors">
                                             {vendors.map((item) => (
                                                <CommandItem
                                                  key={item.id}
                                                  value={item.name}
                                                  onSelect={() => {
                                                    form.setValue("associatedEntity", `vendor:${item.id}`);
                                                    setComboboxOpen(false);
                                                  }}
                                                >
                                                   <Check className={cn("mr-2 h-4 w-4", field.value === `vendor:${item.id}` ? "opacity-100" : "opacity-0")}/>
                                                   {item.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
                />
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
                       <Input
                          placeholder="dd/mm/yyyy"
                          {...field}
                        />
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
             <Calendar
                mode="single"
                onSelect={(date) => {
                    if (date) {
                        form.setValue('dueDate', format(date, 'dd/MM/yyyy'));
                    }
                }}
                className="rounded-md border"
             />
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
