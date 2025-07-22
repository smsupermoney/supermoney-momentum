

'use client';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Vendor, SpokeStatus, LeadType as LeadTypeEnum, Remark } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NewSpokeSchema } from '@/lib/validation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { products, spokeStatuses } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

type FormValues = z.infer<typeof NewSpokeSchema>;

interface VendorDetailsDialogProps {
  vendor: Vendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorDetailsDialog({ vendor, open, onOpenChange }: VendorDetailsDialogProps) {
  const { updateVendor, currentUser, deleteVendor, lenders, users } = useApp();
  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRemark, setNewRemark] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(NewSpokeSchema),
    defaultValues: {
      name: '',
      contacts: [{ name: '', email: '', phone: '', designation: '' }],
      gstin: '',
      city: '',
      state: '',
      zone: '',
      product: '',
      leadSource: '',
      lenderId: '',
      remarks: [],
      leadType: 'Fresh',
      dealValue: undefined,
      leadDate: new Date(),
      spoc: '',
      initialLeadDate: undefined,
      anchorId: '',
    },
  });

  const watchLeadType = form.watch("leadType");

  useEffect(() => {
    if (open && vendor) {
        form.reset({
            name: vendor.name || '',
            contacts: vendor.contacts?.length ? vendor.contacts : [{ name: '', phone: '', email: '', designation: ''}],
            gstin: vendor.gstin || '',
            city: vendor.city || '',
            state: vendor.state || '',
            zone: vendor.zone || '',
            product: vendor.product || '',
            leadSource: vendor.leadSource || '',
            lenderId: vendor.lenderId || '',
            remarks: vendor.remarks || [],
            leadType: vendor.leadType || 'Fresh',
            dealValue: vendor.dealValue,
            leadDate: vendor.leadDate ? new Date(vendor.leadDate) : new Date(),
            spoc: vendor.spoc || '',
            initialLeadDate: vendor.initialLeadDate ? new Date(vendor.initialLeadDate) : undefined,
            anchorId: vendor.anchorId || '',
        });
    }
  }, [vendor, form, open]);

  const handleStatusChange = (newStatus: SpokeStatus) => {
    updateVendor({ ...vendor, status: newStatus });
    toast({
      title: 'Vendor Status Updated',
      description: `${vendor.name}'s status is now ${newStatus}.`,
    });
  };

  const handleAssignmentChange = (newUserId: string) => {
    updateVendor({ ...vendor, assignedTo: newUserId });
    toast({
      title: 'Lead Re-assigned',
      description: `${vendor.name} has been assigned to a new user.`,
    });
  }

  const handleDelete = () => {
    deleteVendor(vendor.id);
    onOpenChange(false);
  };

   const handleAddRemark = () => {
    if (!newRemark.trim() || !currentUser) return;
    const remark: Remark = {
        text: newRemark.trim(),
        timestamp: new Date().toISOString(),
        userName: currentUser.name,
    };
    const currentRemarks = form.getValues('remarks') || [];
    form.setValue('remarks', [...currentRemarks, remark]);
    setNewRemark('');
  };
  
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    const updatedVendorData: Vendor = {
      ...vendor,
      ...values,
      contacts: values.contacts.map((c, index) => ({...c, id: vendor.contacts[index]?.id || `contact-${Date.now()}-${index}`, isPrimary: index === 0 })),
      leadDate: values.leadDate?.toISOString() || new Date().toISOString(),
      initialLeadDate: values.initialLeadDate?.toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateVendor(updatedVendorData);
    toast({
      title: "Vendor Updated",
      description: `${values.name} has been successfully updated.`
    });
    setIsSubmitting(false);
    onOpenChange(false);
  };
  
  const canDelete = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Business Development');
  const canEditLeadDate = currentUser && ['Admin', 'Business Development'].includes(currentUser.role);
  const canReassign = currentUser && ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'].includes(currentUser.role);

  const assignableUsers = useMemo(() => {
    if (!canReassign) return [];
    return users.filter(u => u.role === 'Area Sales Manager');
  }, [canReassign, users]);


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vendor: {vendor.name}</DialogTitle>
            <DialogDescription>
              Update the status and details for this vendor lead.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={(v) => handleStatusChange(v as SpokeStatus)} defaultValue={vendor.status}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {spokeStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     {canReassign && (
                        <div className="space-y-2">
                            <FormLabel>Assigned To</FormLabel>
                            <Select onValueChange={handleAssignmentChange} defaultValue={vendor.assignedTo || ''}>
                                <SelectTrigger><SelectValue placeholder="Assign user..."/></SelectTrigger>
                                <SelectContent>
                                    {assignableUsers.map(user => (
                                        <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name={`contacts.0.phone`} render={({ field }) => (
                    <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name={`contacts.0.email`} render={({ field }) => (
                    <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>

                 <FormField control={form.control} name="spoc" render={({ field }) => (
                    <FormItem><FormLabel>Vendor SPOC</FormLabel><FormControl><Input placeholder="Single Point of Contact" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>


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
                                {field.value ? format(new Date(field.value), 'PPP') : <span>Pick a date</span>}
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
                  <FormField control={form.control} name="dealValue" render={({ field }) => (
                      <FormItem><FormLabel>Deal Value (INR Cr)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
                  )}/>
              </div>

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
                                  {field.value ? format(new Date(field.value), 'PPP') : <span>Pick initial date</span>}
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
                )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <FormField control={form.control} name="city" render={({ field }) => (
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
                <FormField control={form.control} name="leadType" render={({ field }) => (
                    <FormItem><FormLabel>Lead Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Fresh">Fresh</SelectItem><SelectItem value="Renewal">Renewal</SelectItem>
                          <SelectItem value="Adhoc">Adhoc</SelectItem><SelectItem value="Enhancement">Enhancement</SelectItem>
                          <SelectItem value="Cross sell">Cross sell</SelectItem><SelectItem value="Revive">Revive</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="lenderId" render={({ field }) => (
                    <FormItem><FormLabel>Lender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a lender" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {lenders.map(lender => (<SelectItem key={lender.id} value={lender.id}>{lender.name}</SelectItem>))}
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                )}/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="product" render={({ field }) => (
                    <FormItem><FormLabel>Product</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {products.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="gstin" render={({ field }) => (
                    <FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>

              <div className="space-y-2">
                    <FormLabel>Remarks</FormLabel>
                    <Card>
                        <CardContent className="p-2 space-y-2">
                            <ScrollArea className="h-24 pr-4">
                                {(form.getValues('remarks') || []).map((remark, index) => (
                                    <div key={index} className="text-xs p-1">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">{remark.userName}</span>
                                            <span className="text-muted-foreground">{format(new Date(remark.timestamp), 'PP p')}</span>
                                        </div>
                                        <p className="text-muted-foreground">{remark.text}</p>
                                    </div>
                                ))}
                            </ScrollArea>
                            <Separator />
                            <div className="flex gap-2">
                                <Textarea value={newRemark} onChange={(e) => setNewRemark(e.target.value)} placeholder="Add a new remark..."/>
                                <Button type="button" onClick={handleAddRemark}>Add</Button>
                            </div>
                        </CardContent>
                    </Card>
              </div>
                
              {vendor.leadScore && (
                  <Card className="bg-secondary">
                      <CardHeader className="p-4"><CardTitle className="text-base">AI Scoring Analysis</CardTitle></CardHeader>
                      <CardContent className="p-4 pt-0">
                          <div className="flex items-baseline gap-2 mb-2">
                              <span className="text-2xl font-bold text-primary">{vendor.leadScore}</span>
                              <span className="text-sm text-muted-foreground">/ 100</span>
                          </div>
                          <p className="text-xs text-secondary-foreground italic">"{vendor.leadScoreReason}"</p>
                      </CardContent>
                  </Card>
              )}

              <DialogFooter className="justify-between sm:justify-between pt-4">
                  <div>
                    {canDelete && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => setIsDeleteAlertOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the lead for {vendor.name}.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Delete Lead
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
