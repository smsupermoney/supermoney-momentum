
'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CustomDashboardViewer } from '@/components/admin/custom-dashboard-viewer';
import { Users } from 'lucide-react';
import { useState } from 'react';

export function ManagerTargetsOverview() {
    const { customDashboards, users } = useApp();
    const [openItems, setOpenItems] = useState<string[]>([]);

    if (customDashboards.length === 0) {
        return null;
    }

    const handleValueChange = (value: string[]) => {
        setOpenItems(value);
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle>All Manager Dashboards</CardTitle>
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
                                <div className="pb-4">
                                     <CustomDashboardViewer config={config} />
                                </div>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}

