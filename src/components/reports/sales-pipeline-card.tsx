
'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SpokeStatus } from '@/lib/types';
import { ChartContainer, ChartTooltipContent } from '../ui/chart';

export function SalesPipelineCard() {
    const { users, dealers, vendors, currentUser } = useApp();
    
    const salesTeam = useMemo(() => {
        return users.filter(u => u.role === 'Area Sales Manager' || u.role === 'Internal Sales');
    }, [users]);
    
    const [selectedUserId, setSelectedUserId] = useState<string>(() => {
        if (currentUser && (currentUser.role === 'Area Sales Manager' || currentUser.role === 'Internal Sales')) {
            return currentUser.uid;
        }
        return salesTeam.length > 0 ? salesTeam[0].uid : '';
    });
    
    const canChangeUser = useMemo(() => {
        if (!currentUser) return false;
        return ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser.role);
    }, [currentUser]);

    const chartData = useMemo(() => {
        if (!selectedUserId) return [];
        const userLeads = [...dealers, ...vendors].filter(l => l.assignedTo === selectedUserId);
        
        const leadsReceived = userLeads.length;

        const statusOrder: SpokeStatus[] = ['New', 'Follow Up', 'Partial Docs', 'Onboarding', 'Awaiting Sanction', 'Approved PF Collected', 'Limit Live', 'Disbursed', 'Rejected', 'Not Interested', 'Closed'];

        const statusCounts = statusOrder.reduce((acc, status) => {
            acc[status] = userLeads.filter(l => l.status === status).length;
            return acc;
        }, {} as Record<SpokeStatus, number>);

        const colors: Record<string, string> = {
            'Leads Received': 'hsl(var(--chart-1))',
            'In Discussion': 'hsl(var(--chart-2))',
            'Disbursed': 'hsl(var(--chart-3))',
            'Rejected': 'hsl(var(--destructive))',
        };

        const inDiscussionCount = statusCounts['New'] + statusCounts['Follow Up'] + statusCounts['Partial Docs'] + statusCounts['Onboarding'] + statusCounts['Awaiting Sanction'] + statusCounts['Approved PF Collected'];
        const disbursedCount = statusCounts['Limit Live'] + statusCounts['Disbursed'];
        const rejectedCount = statusCounts['Rejected'] + statusCounts['Not Interested'] + statusCounts['Closed'];

        return [
            { name: 'Leads Received', value: leadsReceived, fill: colors['Leads Received'] },
            { name: 'In Discussion', value: inDiscussionCount, fill: colors['In Discussion'] },
            { name: 'Disbursed', value: disbursedCount, fill: colors['Disbursed'] },
            { name: 'Rejected', value: rejectedCount, fill: colors['Rejected'] },
        ].filter(d => d.value > 0);

    }, [selectedUserId, dealers, vendors]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Sales Pipeline</CardTitle>
                        <CardDescription>Individual sales member pipeline performance.</CardDescription>
                    </div>
                    {canChangeUser && (
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Select Sales Member" />
                            </SelectTrigger>
                            <SelectContent>
                                {salesTeam.map(user => (
                                    <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {selectedUserId && chartData.length > 0 ? (
                     <ChartContainer config={{ value: { label: "Leads" } }} className="h-[300px] w-full">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                             <XAxis type="number" hide />
                             <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={100} />
                             <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                             <Bar dataKey="value" radius={5}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                             </Bar>
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <p>No data available for the selected user.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

