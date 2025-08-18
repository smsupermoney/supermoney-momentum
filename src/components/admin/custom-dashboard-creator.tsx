
'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { LayoutDashboard } from 'lucide-react';

export function CustomDashboardCreator() {
    const { users, customDashboards } = useApp();
    const { toast } = useToast();

    const managers = useMemo(() => {
        return users.filter(u => u.role === 'Regional Sales Manager' || u.role === 'ETB Manager');
    }, [users]);

    const handleCreateDashboard = (userId: string) => {
        // In a real app, this would open a dialog to configure the dashboard.
        // For this mock, we'll just show a toast.
        toast({
            title: "Configuration Action",
            description: `Configuration dialog for this user would open here.`,
        });
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5" />
                    <CardTitle>Custom Dashboard Management</CardTitle>
                </div>
                <CardDescription>
                    Create and manage custom Target vs. Achievement dashboards for Regional and ETB Managers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {managers.map(manager => {
                        const existingConfig = customDashboards.find(d => d.userId === manager.uid);
                        return (
                            <div key={manager.uid} className="flex items-center justify-between p-3 rounded-md border">
                                <div>
                                    <p className="font-medium">{manager.name}</p>
                                    <p className="text-sm text-muted-foreground">{manager.role}</p>
                                </div>
                                <Button
                                    variant={existingConfig ? 'secondary' : 'default'}
                                    onClick={() => handleCreateDashboard(manager.uid)}
                                >
                                    {existingConfig ? 'Edit Dashboard' : 'Create Dashboard'}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
