

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { useToast } from '@/hooks/use-toast';
import type { Dealer, Vendor, LeadType as LeadTypeEnum, UserRole } from '@/lib/types';
import { spokeScoring, SpokeScoringInput } from '@/ai/flows/spoke-scoring';
import { Loader2 } from 'lucide-react';
import { generateUniqueId } from '@/lib/utils';
import { NewSpokeSchema } from '@/lib/validation';

type NewLeadFormValues = z.infer<typeof NewSpokeSchema>;

interface NewLeadDialogProps {
  type: 'Dealer' | 'Vendor';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorId?: string;
}

const managerRoles: UserRole[] = ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU'];

export function NewLeadDialog({ type, open, onOpenChange, anchorId }: NewLeadDialogProps) {
  const { addDealer, addVendor, currentUser, anchors } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(NewSpokeSchema),
    defaultValues: {
      name: '',
      contactNumber: '',
      anchorId: anchorId || '',
      leadType: 'Fresh',
      priority: 'Normal',
    },
  });

  const handleClose = () => {
    form.reset({
      name: '',
      contactNumber: '',
      anchorId: anchorId || '',
      leadType: 'Fresh',
      priority: 'Normal',
    });
    onOpenChange(false);
  }

  const onSubmit = async (values: NewLeadFormValues) => {
    setIsSubmitting(true);
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        setIsSubmitting(false);
        return;
    }
    try {
        const isManagerCreating = managerRoles.includes(currentUser.role);
        const finalAnchorId = anchorId || values.anchorId || null;
        
        if (!finalAnchorId) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'An anchor must be selected.' });
            setIsSubmitting(false);
            return;
        }

        const associatedAnchor = anchors.find(a => a.id === finalAnchorId);

        const scoringInput: SpokeScoringInput = {
            name: values.name,
            anchorName: associatedAnchor?.name,
            anchorIndustry: associatedAnchor?.industry,
        };

        const scoreResult = await spokeScoring(scoringInput);
        
        const commonData = {
          leadId: generateUniqueId(type === 'Dealer' ? 'dlr' : 'vnd'),
          name: values.name,
          contactNumber: values.contactNumber,
          email: values.email,
          assignedTo: isManagerCreating ? null : currentUser.uid,
          status: isManagerCreating ? 'Unassigned Lead' : 'New',
          anchorId: finalAnchorId,
          createdAt: new Date().toISOString(),
          leadDate: new Date().toISOString(),
          leadScore: scoreResult.score,
          leadScoreReason: scoreResult.reason,
          leadType: (values.leadType as LeadTypeEnum) || 'Fresh',
          priority: values.priority as 'High' | 'Normal',
          remarks: [],
        }

        if (type === 'Dealer') {
          addDealer(commonData as Omit<Dealer, 'id'>);
        } else {
          addVendor(commonData as Omit<Vendor, 'id'>);
        }

        toast({
          title: `${type} Lead Created & Scored!`,
          description: (
            <div>
              <p>{values.name} has been added as a new lead.</p>
              <p className="font-bold mt-2">AI Lead Score: {scoreResult.score}/100</p>
            </div>
          ),
        });
        handleClose();
    } catch (error) {
        console.error('Failed to create or score lead:', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to create new ${type.toLowerCase()}. Please try again.`,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>+ New {type} Lead</DialogTitle>
          <DialogDescription>
            Add a new {type.toLowerCase()} lead. Only Name, Contact Number, and Anchor are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {!anchorId && (
                 <FormField
                  control={form.control}
                  name="anchorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anchor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the associated anchor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {anchors.filter(a => a.status === 'Active').map((anchor) => (
                            <SelectItem key={anchor.id} value={anchor.id}>
                              {anchor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type} Name</FormLabel>
                  <FormControl>
                    <Input placeholder={`Enter ${type.toLowerCase()} name`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
                control={form.control}
                name={`contactNumber`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 10-digit phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Set lead priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
               <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add {type}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
