
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useApp, getAllSubordinates } from '@/contexts/app-context';
import type { CustomDashboardConfig, Dealer, Vendor, SpokeStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IndianRupee, GanttChartSquare } from 'lucide-react';
import { format, parse, getMonth, getYear, isWithinInterval } from 'date-fns';

interface CustomDashboardViewerProps {
    config: CustomDashboardConfig;
}

const ACHIEVEMENT_STATUSES: SpokeStatus[] = ["Login done", "Awaiting Sanction", "Approved", "Disbursed"];

export function CustomDashboardViewer({ config }: CustomDashboardViewerProps) {
    const { anchors, users, dealers, vendors } = useApp();
    const [monthFilter, setMonthFilter] = useState('all');

    const uniqueMonths = useMemo(() => {
        if (!config || !config.targets) return [];
        const months = new Set<string>();
        for (const anchorId in config.targets) {
            const monthlyTargets = config.targets[anchorId];
            if (monthlyTargets) {
                Object.keys(monthlyTargets).forEach(monthStr => months.add(monthStr));
            }
        }
        return Array.from(months).sort();
    }, [config]);


    const dashboardData = useMemo(() => {
        if (!config || !config.targets) return [];

        const allRows: any[] = [];
        const managerSubordinateIds = getAllSubordinates(config.userId, users).map(u => u.uid);
        const teamIds = [config.userId, ...managerSubordinateIds];
        const allTeamLeads = [...dealers, ...vendors].filter(lead => lead.assignedTo && teamIds.includes(lead.assignedTo));

        // Directly iterate over the configured targets to build the base structure
        for (const anchorId in config.targets) {
            const anchor = anchors.find(a => a.id === anchorId);
            if (!anchor) continue;

            const monthlyTargets = config.targets[anchorId];
            if (!monthlyTargets) continue;

            for (const monthStr in monthlyTargets) {
                if (monthFilter !== 'all' && monthStr !== monthFilter) continue;

                const targets = monthlyTargets[monthStr] || {};
                const targetDate = parse(monthStr, 'yyyy-MM', new Date());
                const targetYear = getYear(targetDate);
                const targetMonth = getMonth(targetDate);

                // Calculate achievements for this specific anchor and month
                const achievedLeads = allTeamLeads.filter(lead => {
                    const updatedAt = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt);
                    return lead.anchorId === anchorId &&
                           ACHIEVEMENT_STATUSES.includes(lead.status) &&
                           getMonth(updatedAt) === targetMonth &&
                           getYear(updatedAt) === targetYear;
                });
                
                const achievedLogins = achievedLeads.length;
                const achievedValue = achievedLeads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);
                
                allRows.push({
                    anchorId,
                    anchorName: anchor.name,
                    month: monthStr,
                    targetLogins: targets.statusCount || 0,
                    achievedLogins,
                    targetValue: targets.dealValue || 0,
                    achievedValue,
                    sanctionTarget: targets.sanctionValueTarget || 0,
                    sanctionAchieved: targets.sanctionValueAchieved || 0,
                    aumTarget: targets.aumValueTarget || 0,
                    aumAchieved: targets.aumValueAchieved || 0,
                });
            }
        }
        
        return allRows.sort((a,b) => {
            if (a.anchorName < b.anchorName) return -1;
            if (a.anchorName > b.anchorName) return 1;
            return a.month.localeCompare(b.month);
        });

    }, [config, anchors, monthFilter, users, dealers, vendors]);
    
    if (!config) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>{config.name}</CardTitle>
                        <CardDescription>Your custom Target vs. Achievement dashboard.</CardDescription>
                    </div>
                     <Select value={monthFilter} onValueChange={setMonthFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Months</SelectItem>
                            {uniqueMonths.map(month => (
                                <SelectItem key={month} value={month}>
                                    {format(parse(month, 'yyyy-MM', new Date()), 'MMM yyyy')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead rowSpan={2} className="align-bottom">Anchor</TableHead>
                            <TableHead rowSpan={2} className="align-bottom">Month</TableHead>
                            <TableHead colSpan={2} className="text-center">Logins ({config.statusToTrack.join(', ')})</TableHead>
                            <TableHead colSpan={2} className="text-center">Value ({config.statusToTrack.join(', ')})</TableHead>
                            <TableHead colSpan={2} className="text-center">Sanction Value (Cr)</TableHead>
                            <TableHead colSpan={2} className="text-center">AUM (Cr)</TableHead>
                        </TableRow>
                        <TableRow>
                            <TableHead className="text-center">Target</TableHead>
                            <TableHead className="text-center">Achieved</TableHead>
                            <TableHead className="text-center">Target</TableHead>
                            <TableHead className="text-center">Achieved</TableHead>
                            <TableHead className="text-center">Target</TableHead>
                            <TableHead className="text-center">Achieved</TableHead>
                             <TableHead className="text-center">Target</TableHead>
                            <TableHead className="text-center">Achieved</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dashboardData.map(row => row && (
                             <TableRow key={`${row.anchorId}-${row.month}`}>
                                <TableCell className="font-medium">{row.anchorName}</TableCell>
                                <TableCell>{format(parse(row.month, 'yyyy-MM', new Date()), 'MMM yyyy')}</TableCell>
                                <TableCell className="text-center">{row.targetLogins}</TableCell>
                                <TableCell className="text-center">{row.achievedLogins}</TableCell>
                                <TableCell className="text-center">{row.targetValue}</TableCell>
                                <TableCell className="text-center">{row.achievedValue.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{row.sanctionTarget}</TableCell>
                                <TableCell className="text-center">{row.sanctionAchieved}</TableCell>
                                <TableCell className="text-center">{row.aumTarget}</TableCell>
                                <TableCell className="text-center">{row.aumAchieved}</TableCell>
                            </TableRow>
                        ))}
                         {dashboardData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    No target data available for the selected configuration.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
    )
}
