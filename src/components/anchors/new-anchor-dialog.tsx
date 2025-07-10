

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApp } from '@/contexts/app-context';
import { leadScoring, LeadScoringInput } from '@/ai/flows/lead-scoring';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Anchor } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { generateLeadId } from '@/lib/utils';
import { NewAnchorSchema } from '@/lib/validation';

type NewAnchorFormValues = z.infer<typeof NewAnchorSchema>;

const turnoverMap: { [key: string]: number } = {
  'Below 500 Cr': 2500000000,
  '500-2000 Cr': 12500000000,
  '2000-5000 Cr': 35000000000,
  '5000 Cr+': 75000000000,
};

interface NewAnchorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAnchorDialog({ open, onOpenChange }: NewAnchorDialogProps) {
  const { addAnchor, currentUser } = useApp();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewAnchorFormValues>({
    resolver: zodResolver(NewAnchorSchema),
    defaultValues: {
      companyName: '',
      industry: '',
      primaryContactName: '',
      primaryContactDesignation: '',
      email: '',
      phone: '',
      leadSource: '',
      gstin: '',
      location: '',
      annualTurnover: '',
    },
  });

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  }

  const onSubmit = async (values: NewAnchorFormValues) => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create an anchor.' });
      return;
    }
    setIsSubmitting(true);
    try {
      
      const numericalTurnover = values.annualTurnover ? turnoverMap[values.annualTurnover] : undefined;

      const leadScoringInput: LeadScoringInput = {
        companyName: values.companyName,
        industry: values.industry,
        primaryContactName: values.primaryContactName,
        email: values.email,
        phone: values.phone,
        leadSource: values.leadSource,
        gstin: values.gstin,
        location: values.location,
        annualTurnover: numericalTurnover,
      };

      const scoreResult = await leadScoring(leadScoringInput);
      
      const newAnchor: Omit<Anchor, 'id'> = {
        leadId: generateLeadId(),
        name: values.companyName,
        industry: values.industry,
        contacts: [{
            id: `contact-${Date.now()}`,
            name: values.primaryContactName,
            designation: values.primaryContactDesignation,
            email: values.email,
            phone: values.phone,
            isPrimary: true,
        }],
        leadSource: values.leadSource,
        gstin: values.gstin,
        location: values.location,
        annualTurnover: values.annualTurnover,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        dealerIds: [],
        vendorIds: [],
        leadScore: scoreResult.score,
        leadScoreReason: scoreResult.reason,
        status: 'Active', // New anchors are active immediately
      };

      addAnchor(newAnchor);

      toast({
        title: 'Anchor Created & Scored!',
        description: (
          <div>
            <p>{values.companyName} has been added and is now visible to all users.</p>
            <p className="font-bold mt-2">AI Lead Score: {scoreResult.score}/100</p>
            <p className="text-xs">{scoreResult.reason}</p>
          </div>
        ),
      });
      handleClose();

    } catch (error) {
      console.error('Failed to create or score anchor:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create new anchor. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t('anchors.newDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('anchors.newDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('anchors.newDialog.companyName')}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Tata Motors" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('anchors.newDialog.industry')}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Automotive" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="annualTurnover"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Turnover (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select turnover range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Below 500 Cr">Below 500 Cr</SelectItem>
                          <SelectItem value="500-2000 Cr">500-2000 Cr</SelectItem>
                          <SelectItem value="2000-5000 Cr">2000-5000 Cr</SelectItem>
                          <SelectItem value="5000 Cr+">5000 Cr+</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="primaryContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('anchors.newDialog.contactName')}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ramesh Kumar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryContactDesignation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('anchors.newDialog.contactDesignation')}</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. CFO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('anchors.newDialog.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('anchors.newDialog.phone')}</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="gstin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('anchors.newDialog.gstin')}</FormLabel>
                      <FormControl>
                        <Input placeholder="27AACCR1234A1Z5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('anchors.newDialog.location')}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mumbai" {...field} />
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
                  <FormLabel>{t('anchors.newDialog.leadSource')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('anchors.newDialog.selectLeadSource')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Banker Referral">Banker Referral</SelectItem>
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
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>{t('dialogs.cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('anchors.newDialog.createButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

