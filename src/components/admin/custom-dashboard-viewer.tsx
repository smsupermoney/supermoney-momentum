
'use client';

import { useMemo, useState } from 'react';
import { useApp, getAllSubordinates } from '@/contexts/app-context';
import type { CustomDashboardConfig, Dealer, Vendor, SpokeStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IndianRupee, GanttChartSquare } from 'lucide-react';
import { format, getMonth, getYear, parse } from 'date-fns';

interface CustomDashboardViewerProps {
    config: CustomDashboardConfig;
}

export function CustomDashboardViewer({ config }: CustomDashboardViewerProps) {
    const { users, anchors, dealers, vendors } = useApp();

    const dashboardData = useMemo(() => {
        if (!config || !Array.isArray(config.selectedAnchors)) return [];

        const managerSubordinates = getAllSubordinates(config.userId, users);
        const teamUserIds = [config.userId, ...managerSubordinates.map(u => u.uid)];
        
        const teamLeads = [...dealers, ...vendors].filter(lead => lead.assignedTo && teamUserIds.includes(lead.assignedTo));

        const allRows: any[] = [];

        // Iterate through each anchor configured for the dashboard
        config.selectedAnchors.forEach(anchorId => {
            const anchor = anchors.find(a => a.id === anchorId);
            if (!anchor) return;
            
            const anchorTargetsByMonth = config.targets?.[anchorId];
            if (!anchorTargetsByMonth) return;

            // For each anchor, iterate through all the months that have targets defined
            Object.keys(anchorTargetsByMonth).forEach(monthStr => { // monthStr is "YYYY-MM"
                const monthDate = parse(monthStr, 'yyyy-MM', new Date());

                const leadsForThisAnchorInMonth = teamLeads.filter(l => {
                    const leadDate = new Date(l.leadDate);
                    return l.anchorId === anchorId &&
                           getYear(leadDate) === getYear(monthDate) &&
                           getMonth(leadDate) === getMonth(monthDate);
                });

                const achievedStatusCount = leadsForThisAnchorInMonth.filter(l => (config.statusToTrack || []).includes(l.status)).length;
                const achievedDealValue = leadsForThisAnchorInMonth
                    .filter(l => (config.statusToTrack || []).includes(l.status))
                    .reduce((sum, l) => sum + (l.dealValue || 0), 0);
                
                const targets = anchorTargetsByMonth[monthStr] || {};
                
                const sanctionTarget = targets.sanctionValueTarget || 0;
                const sanctionAchieved = targets.sanctionValueAchieved || 0;
                const aumTarget = targets.aumValueTarget || 0;
                const aumAchieved = targets.aumValueAchieved || 0;

                const targetLogins = targets.statusCount || 0;
                const targetDealValue = targets.dealValue || 0;

                allRows.push({
                    anchorId,
                    anchorName: anchor.name,
                    month: monthStr,
                    targetLogins,
                    achievedLogins: achievedStatusCount,
                    targetValue: targetDealValue,
                    achievedValue: achievedDealValue,
                    sanctionTarget,
                    sanctionAchieved,
                    aumTarget,
                    aumAchieved
                });
            });
        });
        
        // Sort by anchor name, then by month
        return allRows.sort((a,b) => {
            if (a.anchorName < b.anchorName) return -1;
            if (a.anchorName > b.anchorName) return 1;
            return a.month.localeCompare(b.month);
        });

    }, [config, users, anchors, dealers, vendors]);
    
    if (!config) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>{config.name}</CardTitle>
                        <CardDescription>Your custom Target vs. Achievement dashboard.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead rowSpan={2} className="align-bottom">Anchor</TableHead>
                            <TableHead rowSpan={2} className="align-bottom">Month</TableHead>
                            <TableHead colSpan={2} className="text-center">Logins ({Array.isArray(config.statusToTrack) ? config.statusToTrack.join(', ') : ''})</TableHead>
                            <TableHead colSpan={2} className="text-center">Value ({Array.isArray(config.statusToTrack) ? config.statusToTrack.join(', ') : ''})</TableHead>
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
