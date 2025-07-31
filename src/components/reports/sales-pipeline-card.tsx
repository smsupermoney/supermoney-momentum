
'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
import type { SpokeStatus } from '@/lib/types';
import { ChartContainer, ChartTooltipContent } from '../ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval } from 'date-fns';

const getFiscalYearStart = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed (0 for January)
    // Fiscal year starts in April (month 3)
    return month >= 3 ? new Date(year, 3, 1) : new Date(year - 1, 3, 1);
};


export function SalesPipelineCard() {
    const { users, dealers, vendors, currentUser } = useApp();
    
    const salesTeam = useMemo(() => {
        return users.filter(u => u.role === 'Area Sales Manager' || u.role === 'Internal Sales');
    }, [users]);
    
    const [selectedUserId, setSelectedUserId] = useState<string>(() => {
        if (currentUser && (currentUser.role === 'Area Sales Manager' || currentUser.role === 'Internal Sales')) {
            return currentUser.uid;
        }
        const amitBisht = salesTeam.find(user => user.name === 'Amit Bisht');
        if (amitBisht) {
            return amitBisht.uid;
        }
        return salesTeam.length > 0 ? salesTeam[0].uid : '';
    });
    
    const [period, setPeriod] = useState<'month' | 'quarter' | 'ytd' | 'inception'>('inception');
    
    const canChangeUser = useMemo(() => {
        if (!currentUser) return false;
        return ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU'].includes(currentUser.role);
    }, [currentUser]);

    const chartData = useMemo(() => {
        if (!selectedUserId) return [];
        const allUserLeads = [...dealers, ...vendors].filter(l => l.assignedTo === selectedUserId);

        const now = new Date();
        let leadsInPeriod = allUserLeads;

        if (period !== 'inception') {
            let interval: Interval;
            switch(period) {
                case 'month':
                    interval = { start: startOfMonth(now), end: endOfMonth(now) };
                    break;
                case 'quarter':
                     interval = { start: startOfQuarter(now), end: endOfQuarter(now) };
                     break;
                case 'ytd':
                    interval = { start: getFiscalYearStart(now), end: now };
                    break;
            }
            leadsInPeriod = allUserLeads.filter(l => isWithinInterval(new Date(l.createdAt), interval));
        }
        
        const leadsReceived = leadsInPeriod.length;

        const statusOrder: SpokeStatus[] = ['New', 'Follow Up', 'Partial Docs', 'Onboarding', 'Awaiting Sanction', 'Approved PF Collected', 'Limit Live', 'Disbursed', 'Rejected', 'Not Interested', 'Closed'];

        const statusCounts = statusOrder.reduce((acc, status) => {
            const count = leadsInPeriod.filter(l => l.status === status).length;
            if (count > 0) {
              acc[status] = count;
            }
            return acc;
        }, {} as Record<SpokeStatus, number>);

        const totalFromStatus = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

        // This ensures the "Leads Received" bar reflects the sum of all filtered leads' statuses
        if (totalFromStatus > 0) {
             return [
                { name: 'Leads Received', value: leadsReceived, fill: 'hsl(var(--chart-1))' },
                ...Object.entries(statusCounts).map(([name, value], index) => ({
                    name,
                    value,
                    fill: `hsl(var(--chart-${(index % 5) + 2}))` // Cycle through chart colors
                }))
            ];
        }
        
        return [];

    }, [selectedUserId, dealers, vendors, period]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Sales Pipeline</CardTitle>
                        <CardDescription>Individual sales member pipeline performance.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {canChangeUser && (
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                    <SelectValue placeholder="Select Sales Member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {salesTeam.map(user => (
                                        <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                         <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full sm:w-auto">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="month">Month</TabsTrigger>
                                <TabsTrigger value="quarter">Quarter</TabsTrigger>
                                <TabsTrigger value="ytd">YTD</TabsTrigger>
                                <TabsTrigger value="inception">All</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {selectedUserId && chartData.length > 0 ? (
                     <ChartContainer config={{ value: { label: "Leads" } }} className="h-[350px] w-full">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40 }}>
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={120} />
                             <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent hideIndicator />} />
                             <Bar dataKey="value" radius={[5, 5, 5, 5]} barSize={20}>
                                <LabelList dataKey="value" position="right" offset={8} className="fill-foreground" fontSize={12} />
                                {chartData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                ))}
                             </Bar>
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                        <p>No data available for the selected user and period.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
