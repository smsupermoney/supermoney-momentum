
'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CustomDashboardViewer } from '@/components/admin/custom-dashboard-viewer';
import { Users, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';

export function ManagerTargetsOverview() {
    const { customDashboards, users, currentUser } = useApp();
    const [openItems, setOpenItems] = useState<string[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    if (!currentUser || !['Admin', 'BIU'].includes(currentUser.role)) {
        return null;
    }
    
    if (customDashboards.length === 0) {
        return null;
    }

    const handleValueChange = (value: string[]) => {
        setOpenItems(value);
    }
    
    const handleRefresh = () => {
        // Incrementing the key will cause child components to re-mount and re-calculate data
        setRefreshKey(prev => prev + 1);
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <CardTitle>All Manager Dashboards</CardTitle>
                    </div>
                    <Button onClick={handleRefresh} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Achievements
                    </Button>
                </div>
                <CardDescription>
                    An overview of all configured Target vs. Achievement dashboards for managers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion 
                    type="multiple" 
                    className="w-full space-y-2"
                    value={openItems}
                    onValueChange={handleValueChange}
                >
                    {customDashboards.map(config => {
                        const manager = users.find(u => u.uid === config.userId);
                        return (
                            <AccordionItem value={config.id} key={config.id} className="border rounded-lg px-4 bg-background">
                                <AccordionTrigger className="py-3 hover:no-underline">
                                    <div className="flex flex-col items-start text-left">
                                        <p className="font-semibold">{config.name}</p>
                                        <p className="text-sm text-muted-foreground">{manager?.name || 'Unknown Manager'}</p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                     <CustomDashboardViewer config={config} key={`${config.id}-${refreshKey}`} />
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}
