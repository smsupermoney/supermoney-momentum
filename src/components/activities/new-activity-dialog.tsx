
'use client';

import { useState } from 'react';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { DailyActivity, DailyActivityType } from '@/lib/types';

const formSchema = z.object({
  activityType: z.string().min(1, 'Activity type is required'),
  title: z.string().min(3, 'Title is required'),
  date: z.date({ required_error: 'A date is required.' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'),
  anchorId: z.string().optional(),
  description: z.string().optional(),
});

type NewActivityFormValues = z.infer<typeof formSchema>;

interface NewActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewActivityDialog({ open, onOpenChange }: NewActivityDialogProps) {
  const { currentUser, addDailyActivity, anchors } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewActivityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityType: '',
      title: '',
      startTime: format(new Date(), 'HH:mm'),
      endTime: format(new Date(Date.now() + 60 * 60 * 1000), 'HH:mm'),
      anchorId: '',
      description: '',
    },
  });

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (values: NewActivityFormValues) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    
    try {
      const [startHours, startMinutes] = values.startTime.split(':').map(Number);
      const activityStartTime = new Date(values.date);
      activityStartTime.setHours(startHours, startMinutes);

      const [endHours, endMinutes] = values.endTime.split(':').map(Number);
      const activityEndTime = new Date(values.date);
      activityEndTime.setHours(endHours, endMinutes);

      if (activityEndTime <= activityStartTime) {
        toast({ variant: 'destructive', title: 'Invalid Time', description: 'End time must be after start time.' });
        setIsSubmitting(false);
        return;
      }

      const selectedAnchor = anchors.find(a => a.id === values.anchorId);

      const newActivity: Omit<DailyActivity, 'id'> = {
        userId: currentUser.uid,
        userName: currentUser.name,
        activityType: values.activityType as DailyActivityType,
        title: values.title,
        description: values.description,
        startTime: activityStartTime.toISOString(),
        endTime: activityEndTime.toISOString(),
        anchorId: values.anchorId,
        anchorName: selectedAnchor?.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDailyActivity(newActivity);
      toast({ title: 'Activity Logged', description: 'Your activity has been successfully logged.' });
      handleClose();

    } catch (error) {
      console.error("Failed to log activity:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to log your activity. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a New Activity</DialogTitle>
          <DialogDescription>Fill in the details of your sales activity.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select an activity type" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Client Meeting">Client Meeting</SelectItem>
                        <SelectItem value="Site Visit">Site Visit</SelectItem>
                        <SelectItem value="Sales Presentation">Sales Presentation</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                        <SelectItem value="Travel Time">Travel Time</SelectItem>
                        <SelectItem value="Administrative">Administrative</SelectItem>
                        <SelectItem value="Training">Training</SelectItem>
                        <SelectItem value="Networking">Networking</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField name="title" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g. Q3 Proposal with Reliance" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField
                control={form.control}
                name="anchorId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Associated Client (Anchor)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a client (optional)" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {anchors.map(anchor => (
                                    <SelectItem key={anchor.id} value={anchor.id}>{anchor.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />
            <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col col-span-3 sm:col-span-1">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild><FormControl>
                                <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>
                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem className="col-span-3 sm:col-span-1"><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem className="col-span-3 sm:col-span-1"><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description / Notes</FormLabel><FormControl><Textarea placeholder="Add details, outcomes, or next steps..." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Activity
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
