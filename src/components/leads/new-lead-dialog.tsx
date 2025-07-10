
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
import { useToast } from '@/hooks/use-toast';
import type { Dealer, Vendor, LeadType } from '@/lib/types';
import { spokeScoring, SpokeScoringInput } from '@/ai/flows/spoke-scoring';
import { Loader2 } from 'lucide-react';
import { generateLeadId } from '@/lib/utils';
import { NewSpokeSchema } from '@/lib/validation';
import { products } from '@/lib/types';

const formSchema = NewSpokeSchema;

type NewLeadFormValues = z.infer<typeof formSchema>;

interface NewLeadDialogProps {
  type: 'Dealer' | 'Vendor';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorId?: string;
}

export function NewLeadDialog({ type, open, onOpenChange, anchorId }: NewLeadDialogProps) {
  const { addDealer, addVendor, currentUser, anchors } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contactNumber: '',
      email: '',
      gstin: '',
      location: '',
      anchorId: '',
      product: '',
      leadType: 'Fresh',
      leadSource: '',
      dealValue: undefined,
    },
  });
  
  const handleClose = () => {
    form.reset();
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
            location: values.location,
            anchorName: associatedAnchor?.name,
            anchorIndustry: associatedAnchor?.industry,
        };

        const scoreResult = await spokeScoring(scoringInput);
        
        const commonData = {
          leadId: generateLeadId(),
          name: values.name,
          contactNumber: values.contactNumber,
          email: values.email,
          gstin: values.gstin,
          location: values.location,
          product: values.product || undefined,
          leadSource: values.leadSource,
          assignedTo: isSpecialist ? null : currentUser.uid,
          status: isSpecialist ? 'Unassigned Lead' : (finalAnchorId ? 'New' : 'Unassigned Lead'),
          anchorId: finalAnchorId,
          createdAt: new Date().toISOString(),
          leadScore: scoreResult.score,
          leadScoreReason: scoreResult.reason,
          leadType: (values.leadType as LeadType) || 'Fresh',
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>+ New {type} Lead</DialogTitle>
          <DialogDescription>
            Add a new {type.toLowerCase()} lead. Can be used for new leads or new opportunities for existing clients.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="leadType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Type</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Fresh">Fresh</SelectItem>
                      <SelectItem value="Renewal">Renewal</SelectItem>
                      <SelectItem value="Adhoc">Adhoc</SelectItem>
                      <SelectItem value="Enhancement">Enhancement</SelectItem>
                      <SelectItem value="Cross sell">Cross sell</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dealValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Value (Lakhs INR)</FormLabel>
                    <FormControl>
                       <Input type="number" placeholder="e.g. 5" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!anchorId && (
                  <FormField
                  control={form.control}
                  name="anchorId"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Anchor (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select an anchor" />
                                  </SelectTrigger>
                              </FormControl>
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
              )}
             </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter GSTIN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="leadSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Source</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lead source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Connector">Connector</SelectItem>
                      <SelectItem value="CA / Financial Consultant Referral">CA / Financial Consultant Referral</SelectItem>
                      <SelectItem value="Industry Association">Industry Association</SelectItem>
                      <SelectItem value="Anchor Ecosystem (Cross-sell)">Anchor Ecosystem (Cross-sell)</SelectItem>
                      <SelectItem value="Conference / Event">Conference / Event</SelectItem>
                      <SelectItem value="Website Inquiry">Website Inquiry</SelectItem>
                      <SelectItem value="LinkedIn Campaign">LinkedIn Campaign</SelectItem>
                      <SelectItem value="Content Marketing">Content Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location" {...field} />
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
