
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { DailyActivity } from '@/lib/types';
import { NewDailyActivitySchema } from '@/lib/validation';

const EditActivitySchema = NewDailyActivitySchema.extend({ id: z.string() });
type EditActivityFormValues = z.infer<typeof EditActivitySchema>;

interface EditActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: DailyActivity;
}

export function EditActivityDialog({ open, onOpenChange, activity }: EditActivityDialogProps) {
  const { updateDailyActivity } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditActivityFormValues>({
    resolver: zodResolver(EditActivitySchema),
    defaultValues: {
      id: activity.id,
      userId: activity.userId,
      activityType: activity.activityType,
      title: activity.title,
      notes: activity.notes,
      activityTimestamp: new Date(activity.activityTimestamp).toISOString(),
    },
  });

  useEffect(() => {
    form.reset({
      id: activity.id,
      userId: activity.userId,
      activityType: activity.activityType,
      title: activity.title,
      notes: activity.notes,
      activityTimestamp: new Date(activity.activityTimestamp).toISOString(),
    });
  }, [activity, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (values: EditActivityFormValues) => {
    setIsSubmitting(true);
    try {
      const updatedActivity: DailyActivity = {
        ...activity,
        ...values,
        updatedAt: new Date().toISOString(),
      };
      
      updateDailyActivity(updatedActivity);
      toast({ title: 'Activity Updated', description: 'The activity log has been successfully updated.' });
      handleClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update activity. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Activity Log</DialogTitle>
          <DialogDescription>Modify the details of this activity.</DialogDescription>
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
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Client Meeting">Client Meeting</SelectItem>
                        <SelectItem value="Site Visit">Site Visit</SelectItem>
                        <SelectItem value="Sales Presentation">Sales Presentation</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
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
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
