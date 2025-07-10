
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
import { generateLeadId } from '@/lib/utils';
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
      dealValue: undefined,
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
          leadId: generateLeadId(),
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
          leadDate: values.leadDate.toISOString(),
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
            Add a new {type.toLowerCase()} lead. Can be used for new leads or new opportunities for existing clients.
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

            <div className="space-y-4 rounded-md border p-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Contacts</h3>
                     <Button type="button" size="sm" variant="outline" onClick={() => append({ name: '', email: '', phone: '', designation: '', isPrimary: false })}>
                        <PlusCircle className="mr-2 h-4 w-4"/> Add Contact
                    </Button>
                </div>
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-2 gap-x-4 gap-y-2 relative">
                       <FormField control={form.control} name={`contacts.${index}.name`} render={({ field }) => (
                           <FormItem><FormLabel className="text-xs">Name {index === 0 && <span className="text-muted-foreground">(Primary)</span>}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                       )}/>
                       <FormField control={form.control} name={`contacts.${index}.designation`} render={({ field }) => (
                           <FormItem><FormLabel className="text-xs">Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                       )}/>
                       <FormField control={form.control} name={`contacts.${index}.email`} render={({ field }) => (
                           <FormItem><FormLabel className="text-xs">Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                       )}/>
                       <FormField control={form.control} name={`contacts.${index}.phone`} render={({ field }) => (
                           <FormItem><FormLabel className="text-xs">Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                       )}/>
                       {index > 0 && (
                          <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4 text-destructive"/>
                          </Button>
                       )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="leadDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Lead Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              disabled={!canEditLeadDate}
                              className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dealValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deal Value (INR Cr)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 0.5 for 50 Lakhs" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <FormField
                    control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="zone" render={({ field }) => (
                    <FormItem><FormLabel>Zone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leadType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Fresh">Fresh</SelectItem>
                        <SelectItem value="Renewal">Renewal</SelectItem>
                        <SelectItem value="Adhoc">Adhoc</SelectItem>
                        <SelectItem value="Enhancement">Enhancement</SelectItem>
                        <SelectItem value="Cross sell">Cross sell</SelectItem>
                        <SelectItem value="Revive">Revive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lenderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lender (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a lender" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {lenders.map(lender => (
                          <SelectItem key={lender.id} value={lender.id}>{lender.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {products.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
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
                    <FormControl><Input placeholder="Enter GSTIN" {...field} /></FormControl>
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
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a lead source" /></SelectTrigger></FormControl>
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
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add any relevant remarks for this lead..." {...field} />
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
                            <FormControl><SelectTrigger><SelectValue placeholder="Select an anchor" /></SelectTrigger></FormControl>
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
