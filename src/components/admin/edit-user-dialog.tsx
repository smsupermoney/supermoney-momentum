
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { EditUserSchema, userRoles, regions } from '@/lib/validation';

type EditUserFormValues = z.infer<typeof EditUserSchema>;

interface EditUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const managerRolesHierarchy: Record<string, UserRole[]> = {
    'Area Sales Manager': ['Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Admin'],
    'Zonal Sales Manager': ['Regional Sales Manager', 'National Sales Manager', 'Admin'],
    'Regional Sales Manager': ['National Sales Manager', 'Admin'],
    'National Sales Manager': ['Admin'],
    'ETB Executive': ['ETB Manager', 'Admin'],
    'ETB Manager': ['Admin'],
    'Telecaller': ['ETB Manager', 'Admin'],
};

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const { updateUser, users } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(EditUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      managerId: user.managerId || '',
      region: user.region || '',
    },
  });
  
  useEffect(() => {
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      managerId: user.managerId || '',
      region: user.region || '',
    });
  }, [user, form]);


  const selectedRole = form.watch('role');

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

  const onSubmit = (values: EditUserFormValues) => {
    setIsSubmitting(true);
    try {
      const updatedUser: User = {
        ...user,
        ...values,
        managerId: showManagerDropdown ? values.managerId : null,
      };
      updateUser(updatedUser);
      toast({
        title: 'User Updated',
        description: `${values.name}'s profile has been updated.`,
      });
      handleClose();
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update user. Please try again.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User: {user.name}</DialogTitle>
          <DialogDescription>Modify the details for this user.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
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
                  <FormLabel>Email (Cannot be changed)</FormLabel>
                  <FormControl><Input type="email" {...field} disabled /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
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
                  <FormLabel>Region</FormLabel>
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
                    <FormLabel>Manager</FormLabel>
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
