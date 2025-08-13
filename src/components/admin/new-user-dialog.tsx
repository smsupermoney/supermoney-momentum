
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';
import type { User, UserRole } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { NewUserSchema, userRoles, regions } from '@/lib/validation';


type NewUserFormValues = z.infer<typeof NewUserSchema>;

interface NewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const managerRolesHierarchy: Record<string, UserRole[]> = {
    'Area Sales Manager': ['Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Admin'],
    'Internal Sales': ['Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Admin'],
    'Zonal Sales Manager': ['Regional Sales Manager', 'National Sales Manager', 'Admin'],
    'Regional Sales Manager': ['National Sales Manager', 'Admin'],
    'National Sales Manager': ['Admin'],
    'ETB Team': ['ETB Manager', 'Admin'],
    'ETB Manager': ['Admin'],
    'Telecaller': ['ETB Manager', 'Admin'],
};

export function NewUserDialog({ open, onOpenChange }: NewUserDialogProps) {
  const { addUser, users } = useApp();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewUserFormValues>({
    resolver: zodResolver(NewUserSchema),
    defaultValues: { name: '', email: '', role: '', managerId: '', region: '', territoryAccess: { states: [], cities: [] } },
  });

  const selectedRole = form.watch('role') as UserRole;

  const possibleManagerRoles = useMemo(() => {
    return selectedRole ? managerRolesHierarchy[selectedRole] || [] : [];
  }, [selectedRole]);

  const managers = useMemo(() => {
    return users.filter(u => possibleManagerRoles.includes(u.role));
  }, [possibleManagerRoles, users]);

  const showManagerDropdown = useMemo(() => {
    if (!selectedRole) return false;
    return possibleManagerRoles.length > 0;
  }, [possibleManagerRoles]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  }

  const onSubmit = (values: NewUserFormValues) => {
    setIsSubmitting(true);
    try {
      const newUser: Omit<User, 'uid' | 'id'> = {
        name: values.name,
        email: values.email,
        role: values.role as UserRole,
        managerId: showManagerDropdown ? values.managerId : null,
        region: values.region,
        territoryAccess: values.territoryAccess || { states: [], cities: [] },
      };
      addUser(newUser);
      toast({
        title: 'User Created',
        description: `${values.name} has been added to the system.`,
      });
      handleClose();
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create new user. Please try again.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.addNewUser')}</DialogTitle>
          <DialogDescription>{t('admin.userManagementDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.table.name')}</FormLabel>
                  <FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.table.email')}</FormLabel>
                  <FormControl><Input type="email" placeholder="e.g. john.doe@supermoney.in" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.table.role')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {userRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.table.region')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a region" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {regions.map(region => <SelectItem key={region} value={region}>{region}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showManagerDropdown && (
              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.table.manager')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} required>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {managers.map(manager => (
                          <SelectItem key={manager.uid} value={manager.uid}>{manager.name} ({manager.role})</SelectItem>
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
                {t('dialogs.create')} User
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
