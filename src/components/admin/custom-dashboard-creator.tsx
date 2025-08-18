
'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { LayoutDashboard } from 'lucide-react';
import type { User, CustomDashboardConfig } from '@/lib/types';
import { ConfigureDashboardDialog } from './configure-dashboard-dialog';

export function CustomDashboardCreator() {
    const { users, customDashboards } = useApp();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedManager, setSelectedManager] = useState<User | null>(null);
    const [selectedConfig, setSelectedConfig] = useState<CustomDashboardConfig | null>(null);

    const managers = useMemo(() => {
        return users.filter(u => u.role === 'Regional Sales Manager' || u.role === 'ETB Manager' || u.role === 'Internal Sales');
    }, [users]);

    const handleConfigureClick = (manager: User) => {
        const existingConfig = customDashboards.find(d => d.userId === manager.uid);
        setSelectedManager(manager);
        setSelectedConfig(existingConfig || null);
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedManager(null);
        setSelectedConfig(null);
    }

    return (
        <>
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
                                        onClick={() => handleConfigureClick(manager)}
                                    >
                                        {existingConfig ? 'Edit Dashboard' : 'Create Dashboard'}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
            {selectedManager && (
                <ConfigureDashboardDialog
                    open={dialogOpen}
                    onOpenChange={handleDialogClose}
                    manager={selectedManager}
                    existingConfig={selectedConfig}
                />
            )}
        </>
    );
}
