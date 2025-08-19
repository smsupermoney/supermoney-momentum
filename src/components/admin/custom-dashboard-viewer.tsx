
'use client';

import { useMemo, useState } from 'react';
import { useApp, getAllSubordinates } from '@/contexts/app-context';
import type { CustomDashboardConfig, Dealer, Vendor, SpokeStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IndianRupee, GanttChartSquare } from 'lucide-react';
import { format, getMonth, getYear } from 'date-fns';

interface CustomDashboardViewerProps {
    config: CustomDashboardConfig;
}

export function CustomDashboardViewer({ config }: CustomDashboardViewerProps) {
    const { users, anchors, lenders, dealers, vendors } = useApp();
    const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(2025, 7, 1), 'yyyy-MM'));
    const [selectedState, setSelectedState] = useState<string>('all');

    const monthOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        let currentDate = new Date(2025, 7, 1); // August 2025
        const endDate = new Date(2025, 10, 1); // October 2025, to show 3 months
        while (currentDate <= endDate) {
            options.push({
                value: format(currentDate, 'yyyy-MM'),
                label: format(currentDate, 'MMMM yyyy'),
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return options.reverse(); // Show most recent months first
    }, []);
    
    const stateOptions = useMemo(() => {
        if (!config || !Array.isArray(config.selectedStates) || config.selectedStates.length === 0) {
            return [];
        }
        return ['all', ...config.selectedStates];
    }, [config]);


    const dashboardData = useMemo(() => {
        if (!config || !Array.isArray(config.selectedAnchors)) return [];

        const managerSubordinates = getAllSubordinates(config.userId, users);
        const teamUserIds = [config.userId, ...managerSubordinates.map(u => u.uid)];
        
        const teamLeads = [...dealers, ...vendors].filter(lead => lead.assignedTo && teamUserIds.includes(lead.assignedTo));

        // Filter leads based on the *configured* states first.
        const leadsInConfiguredStates = teamLeads.filter(lead => 
            config.selectedStates.length === 0 || (lead.state && config.selectedStates.includes(lead.state))
        );

        // Then, filter by the selected state dropdown.
        const leadsForSelectedState = selectedState === 'all' 
            ? leadsInConfiguredStates
            : leadsInConfiguredStates.filter(lead => lead.state === selectedState);
            
        // Now, iterate through every anchor configured for the dashboard
        return config.selectedAnchors.map(anchorId => {
            const anchor = anchors.find(a => a.id === anchorId);
            if (!anchor) return null;

            const leadsForThisAnchor = leadsForSelectedState.filter(l => l.anchorId === anchorId);

            const leadsForThisAnchorInPeriod = leadsForThisAnchor.filter(l => {
                 const leadDate = new Date(l.createdAt);
                 return getYear(leadDate) === parseInt(selectedMonth.split('-')[0]) &&
                        getMonth(leadDate) === parseInt(selectedMonth.split('-')[1]) - 1;
            });

            const achievedStatusCount = leadsForThisAnchorInPeriod.filter(l => (config.statusToTrack || []).includes(l.status)).length;
            const achievedDealValue = leadsForThisAnchorInPeriod
                .filter(l => (config.statusToTrack || []).includes(l.status))
                .reduce((sum, l) => sum + (l.dealValue || 0), 0);

            const targets = config.targets?.[anchorId]?.[selectedMonth] || {};
            
            const sanctionTarget = targets.sanctionValueTarget || 0;
            const sanctionAchieved = targets.sanctionValueAchieved || 0;
            const aumTarget = targets.aumValueTarget || 0;
            const aumAchieved = targets.aumValueAchieved || 0;

            const targetLogins = targets.statusCount || 0;
            const targetDealValue = targets.dealValue || 0;
            
            return {
                anchorId,
                anchorName: anchor.name,
                lenderName: lenders.find(l => leadsForThisAnchorInPeriod[0]?.lenderId === l.id)?.name || 'N/A',
                targetLogins,
                achievedLogins: achievedStatusCount,
                targetValue: targetDealValue,
                achievedValue: achievedDealValue,
                sanctionTarget,
                sanctionAchieved,
                aumTarget,
                aumAchieved
            }
        }).filter(Boolean);
    }, [config, selectedMonth, selectedState, users, anchors, dealers, vendors, lenders]);
    
    if (!config) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>{config.name}</CardTitle>
                        <CardDescription>Your custom Target vs. Achievement dashboard.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Select value={selectedState} onValueChange={setSelectedState}>
                            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select State" /></SelectTrigger>
                            <SelectContent>
                                {stateOptions.map(opt => <SelectItem key={opt} value={opt}>{opt === 'all' ? 'All Configured States' : opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Month" /></SelectTrigger>
                            <SelectContent>
                                {monthOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead rowSpan={2} className="align-bottom">Anchor</TableHead>
                            <TableHead rowSpan={2} className="align-bottom">Lender</TableHead>
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
                             <TableRow key={row.anchorId}>
                                <TableCell className="font-medium">{row.anchorName}</TableCell>
                                <TableCell>{row.lenderName}</TableCell>
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
                                    No data available for the selected configuration and period.
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
