

'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { generateUniqueId } from '@/lib/utils';
import { NewSpokeSchema } from '@/lib/validation';
import { products, leadTypes } from '@/lib/types';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type NewLeadFormValues = z.infer<typeof NewSpokeSchema>;

interface NewLeadDialogProps {
  type: 'Dealer' | 'Vendor';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorId?: string;
}

const managerRoles: UserRole[] = ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU'];

export function NewLeadDialog({ type, open, onOpenChange, anchorId }: NewLeadDialogProps) {
  const { addDealer, addVendor, currentUser, anchors, lenders, users, visibleUsers } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(NewSpokeSchema),
    defaultValues: {
      name: '',
      contactNumbers: [{ value: '' }],
      anchorId: anchorId || '',
      email: '',
      gstin: '',
      city: '',
      state: '',
      zone: '',
      product: '',
      leadSource: '',
      lenderId: '',
      spoc: '',
      leadType: 'Fresh',
      priority: 'Normal',
      remarks: [],
      dealValue: undefined,
      initialLeadDate: undefined,
      assignedTo: currentUser?.uid,
    },
  });

  const watchLeadType = form.watch("leadType");
  const isManagerCreating = currentUser && managerRoles.includes(currentUser.role);
  
  const assignableUsers = visibleUsers.filter(u => ['Area Sales Manager', 'Internal Sales', 'ETB Team', 'Telecaller'].includes(u.role));


  useEffect(() => {
    if (open) {
        form.reset({
            name: '',
            contactNumbers: [{ value: '' }],
            anchorId: anchorId || '',
            email: '',
            gstin: '',
            city: '',
            state: '',
            zone: '',
            product: '',
            leadSource: '',
            lenderId: '',
            spoc: '',
            leadType: 'Fresh',
            priority: 'Normal',
            remarks: [],
            dealValue: undefined,
            initialLeadDate: undefined,
            assignedTo: currentUser?.uid,
        });
    }
  }, [open, anchorId, form, currentUser]);

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
        
        const finalAssignedToId = isManagerCreating ? (values.assignedTo || null) : currentUser.uid;

        const commonData = {
          ...values,
          leadId: generateUniqueId(type === 'Dealer' ? 'dlr' : 'vnd'),
          assignedTo: finalAssignedToId,
          status: finalAssignedToId ? 'New' : 'Unassigned Lead',
          anchorId: finalAnchorId,
          createdAt: new Date().toISOString(),
          leadDate: new Date().toISOString(),
          leadScore: scoreResult.score,
          leadScoreReason: scoreResult.reason,
          remarks: [],
        };

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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>+ New {type} Lead</DialogTitle>
          <DialogDescription>
            Add a new {type.toLowerCase()} lead. Name and Anchor are required.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-6 pl-1 -mr-6">
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
                          {anchors.filter(a => a.status !== 'Archived').map((anchor) => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  name={`email`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <FormField
                control={form.control}
                name="spoc"
                render={({ field }) => (
                    <FormItem><FormLabel>SPOC Name</FormLabel><FormControl><Input placeholder="Enter Single Point of Contact's name" {...field} /></FormControl><FormMessage /></FormItem>
                )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                      <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                      <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="zone"
                  render={({ field }) => (
                      <FormItem><FormLabel>Zone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="product"
                  render={({ field }) => (
                      <FormItem><FormLabel>Product</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                          <SelectContent>
                              {products.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                          </SelectContent>
                          </Select><FormMessage />
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
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value ?? ''} // Ensure value is never null/undefined for the input
                            onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                  )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leadType"
                render={({ field }) => (
                  <FormItem><FormLabel>Lead Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {leadTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
              )}/>
               {watchLeadType === 'Revive' && (
                  <FormField
                    control={form.control}
                    name="initialLeadDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Initial Lead Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                              >
                                {field.value instanceof Date ? format(field.value, 'PPP') : <span>Pick initial date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               )}
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="gstin" render={({ field }) => (
                  <FormItem><FormLabel>GSTIN (Optional)</FormLabel><FormControl><Input placeholder="Enter GSTIN" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
               <FormField
                control={form.control}
                name="lenderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lender (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lenders.map(lender => (<SelectItem key={lender.id} value={lender.id}>{lender.name}</SelectItem>))}
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
                name="priority"
                render={({ field }) => (
                    <FormItem><FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Set lead priority" /></SelectTrigger></FormControl>
                        <SelectContent>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 {isManagerCreating && (
                    <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                        <FormItem><FormLabel>Assign To (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {assignableUsers.map(user => (
                                    <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
             </div>
            
            <DialogFooter className="pt-4">
               <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add {type}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
