
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApp } from '@/contexts/app-context';
import { useToast } from '@/hooks/use-toast';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import type { User, CustomDashboardConfig, Anchor, SpokeStatus } from '@/lib/types';
import { IndianStatesAndCities } from '@/lib/india-states-cities';
import { spokeStatuses } from '@/lib/types';
import { DashboardConfigSchema } from '@/lib/validation';
import { format } from 'date-fns';

type FormValues = z.infer<typeof DashboardConfigSchema>;

interface ConfigureDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager: User;
  existingConfig: CustomDashboardConfig | null;
}

export function ConfigureDashboardDialog({ open, onOpenChange, manager, existingConfig }: ConfigureDashboardDialogProps) {
  const { anchors, saveDashboardConfig } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(DashboardConfigSchema),
    defaultValues: existingConfig ? {
        ...existingConfig,
        targets: existingConfig.targets || {},
    } : {
      userId: manager.uid,
      name: `${manager.name}'s Dashboard`,
      selectedAnchors: [],
      statusToTrack: ['Login done'],
      targets: {},
    },
  });

  const anchorOptions = React.useMemo(() => anchors.map(a => ({ value: a.id, label: a.name })), [anchors]);

  const statusOptions: MultiSelectOption[] = spokeStatuses.map(s => ({ value: s, label: s}));
  
  const selectedAnchors = form.watch('selectedAnchors');

  const monthOptions = React.useMemo(() => {
    const options: string[] = [];
    let currentDate = new Date(2025, 7, 1); // Start from August 2025
    for(let i=0; i<3; i++) {
      options.push(format(currentDate, 'yyyy-MM'));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return options;
  }, []);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    const configToSave: CustomDashboardConfig = {
      ...values,
      id: existingConfig?.id || `config-${manager.uid}`,
    };
    saveDashboardConfig(configToSave);
    setIsSubmitting(false);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure Dashboard for {manager.name}</DialogTitle>
          <DialogDescription>Set up the anchors, states, and targets for this manager's custom report.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-1 min-h-0 flex flex-col">
            <ScrollArea className="flex-1 pr-6">
              <div className="space-y-4">
                <FormField name="name" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Dashboard Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="selectedAnchors" render={({ field }) => (
                    <FormItem><FormLabel>Anchors</FormLabel><MultiSelect options={anchorOptions} {...field} placeholder="Select anchors..." /><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="statusToTrack" render={({ field }) => (
                    <FormItem><FormLabel>Status to Track for Achievements</FormLabel>
                      <MultiSelect options={statusOptions} {...field} placeholder="Select statuses..." />
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                
                {selectedAnchors && selectedAnchors.length > 0 && (
                    <div>
                        <FormLabel>Monthly Targets</FormLabel>
                         <ScrollArea className="h-[300px] w-full mt-2">
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Anchor</TableHead>
                                            <TableHead>Month</TableHead>
                                            <TableHead className="text-center">Target Logins</TableHead>
                                            <TableHead className="text-center">Target Value (Cr)</TableHead>
                                            <TableHead className="text-center">Sanction Target (Cr)</TableHead>
                                            <TableHead className="text-center">Sanction Achieved (Cr)</TableHead>
                                            <TableHead className="text-center">AUM Target (Cr)</TableHead>
                                            <TableHead className="text-center">AUM Achieved (Cr)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedAnchors.map(anchorId => {
                                            const anchor = anchors.find(a => a.id === anchorId);
                                            return (
                                                <React.Fragment key={anchorId}>
                                                    {monthOptions.map((month, monthIndex) => (
                                                        <TableRow key={`${anchorId}-${month}`}>
                                                            {monthIndex === 0 && <TableCell rowSpan={monthOptions.length} className="font-medium align-top pt-4">{anchor?.name}</TableCell>}
                                                            <TableCell>{format(new Date(month + '-02'), 'MMM yyyy')}</TableCell>
                                                            <TableCell>
                                                                <FormField control={form.control} name={`targets.${anchorId}.${month}.statusCount`} render={({ field }) => (
                                                                    <Input type="number" placeholder="0" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                                                )}/>
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormField control={form.control} name={`targets.${anchorId}.${month}.dealValue`} render={({ field }) => (
                                                                    <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                                                )}/>
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormField control={form.control} name={`targets.${anchorId}.${month}.sanctionValueTarget`} render={({ field }) => (
                                                                    <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                                                )}/>
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormField control={form.control} name={`targets.${anchorId}.${month}.sanctionValueAchieved`} render={({ field }) => (
                                                                    <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                                                )}/>
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormField control={form.control} name={`targets.${anchorId}.${month}.aumValueTarget`} render={({ field }) => (
                                                                    <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                                                )}/>
                                                            </TableCell>
                                                            <TableCell>
                                                                <FormField control={form.control} name={`targets.${anchorId}.${month}.aumValueAchieved`} render={({ field }) => (
                                                                    <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                                                )}/>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </ScrollArea>
                    </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
