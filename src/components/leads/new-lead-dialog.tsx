

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
import type { Dealer, Vendor, LeadType as LeadTypeEnum } from '@/lib/types';
import { spokeScoring, SpokeScoringInput } from '@/ai/flows/spoke-scoring';
import { Loader2, PlusCircle, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { generateUniqueId } from '@/lib/utils';
import { NewSpokeSchema } from '@/lib/validation';
import { products } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const formSchema = NewSpokeSchema;

type NewLeadFormValues = z.infer<typeof formSchema>;

interface NewLeadDialogProps {
  type: 'Dealer' | 'Vendor';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorId?: string;
}

export function NewLeadDialog({ type, open, onOpenChange, anchorId }: NewLeadDialogProps) {
  const { addDealer, addVendor, currentUser, anchors, lenders } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contacts: [{ name: '', email: '', phone: '', designation: '', isPrimary: true }],
      gstin: '',
      city: '',
      state: '',
      zone: '',
      anchorId: '',
      product: '',
      leadType: 'Fresh',
      leadSource: '',
      lenderId: '',
      remarks: '',
      leadDate: new Date(),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
  });
  
  const handleClose = () => {
    form.reset({
        name: '',
        contacts: [{ name: '', email: '', phone: '', designation: '', isPrimary: true }],
        gstin: '',
        city: '',
        state: '',
        zone: '',
        anchorId: '',
        product: '',
        leadType: 'Fresh',
        leadSource: '',
        dealValue: undefined,
        lenderId: '',
        remarks: '',
        leadDate: new Date(),
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
        const isSpecialist = currentUser.role === 'Business Development';
        const finalAnchorId = anchorId || values.anchorId || null;
        const associatedAnchor = finalAnchorId ? anchors.find(a => a.id === finalAnchorId) : null;

        const scoringInput: SpokeScoringInput = {
            name: values.name,
            product: values.product,
            location: values.city,
            anchorName: associatedAnchor?.name,
            anchorIndustry: associatedAnchor?.industry,
        };

        const scoreResult = await spokeScoring(scoringInput);
        
        const commonData = {
          leadId: generateUniqueId(type === 'Dealer' ? 'dlr' : 'vnd'),
          name: values.name,
          contacts: values.contacts.map((c, index) => ({...c, id: `contact-${Date.now()}-${index}`, isPrimary: index === 0})),
          gstin: values.gstin,
          city: values.city,
          state: values.state,
          zone: values.zone,
          product: values.product || undefined,
          leadSource: values.leadSource,
          lenderId: values.lenderId || undefined,
          remarks: values.remarks,
          assignedTo: isSpecialist ? null : currentUser.uid,
          status: isSpecialist ? 'Unassigned Lead' : (finalAnchorId ? 'New' : 'Unassigned Lead'),
          anchorId: finalAnchorId,
          createdAt: new Date().toISOString(),
          leadDate: values.leadDate?.toISOString(),
          leadScore: scoreResult.score,
          leadScoreReason: scoreResult.reason,
          leadType: (values.leadType as LeadTypeEnum) || 'Fresh',
          dealValue: values.dealValue,
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
  
  const canEditLeadDate = currentUser && ['Admin', 'Business Development'].includes(currentUser.role);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>+ New {type} Lead</DialogTitle>
          <DialogDescription>
            Add a new {type.toLowerCase()} lead. Only Name and Contact Number are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                name="contacts.0.phone"
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
