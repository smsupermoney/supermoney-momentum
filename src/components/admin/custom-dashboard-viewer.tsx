
'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/app-context';
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
    const { users, anchors, lenders, dealers, vendors, sanctionData, aumData } = useApp();
    const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(2025, 7, 1), 'yyyy-MM'));

    const monthOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        const startDate = new Date(2025, 7, 1); // August 2025
        const endDate = new Date();
        let currentDate = startDate;

        while (currentDate <= endDate) {
            options.push({
                value: format(currentDate, 'yyyy-MM'),
                label: format(currentDate, 'MMMM yyyy'),
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return options.reverse(); // Show most recent months first
    }, []);

    const dashboardData = useMemo(() => {
        if (!config) return [];

        const teamUserIds = [config.userId, ...users.filter(u => u.managerId === config.userId).map(u => u.uid)];
        const teamLeads = [...dealers, ...vendors].filter(lead => lead.assignedTo && teamUserIds.includes(lead.assignedTo));

        return config.selectedAnchors.map(anchorId => {
            const anchor = anchors.find(a => a.id === anchorId);
            if (!anchor) return null;

            const leadsForAnchor = teamLeads.filter(l => l.anchorId === anchorId);
            
            // Filter leads by selected month based on creation date
            const monthLeads = leadsForAnchor.filter(l => {
                const leadDate = new Date(l.createdAt);
                return getYear(leadDate) === parseInt(selectedMonth.split('-')[0]) &&
                       getMonth(leadDate) === parseInt(selectedMonth.split('-')[1]) - 1;
            });

            // Calculate achievements
            const achievedStatusCount = monthLeads.filter(l => l.status === config.statusToTrack).length;
            const achievedDealValue = monthLeads
                .filter(l => l.status === config.statusToTrack)
                .reduce((sum, l) => sum + (l.dealValue || 0), 0);

            const achievedSanctionValue = sanctionData
                .find(d => d.anchorId === anchorId && d.month === selectedMonth)?.value || 0;
            
            const aum = aumData.find(d => d.anchorId === anchorId)?.value || 0;

            // Get targets
            const targets = config.targets?.[anchorId]?.[selectedMonth] || {};
            const targetLogins = targets.statusCount || 0;
            const targetDealValue = targets.dealValue || 0;
            const targetSanctionValue = targets.sanctionValue || 0;

            // Grand totals
            const totalLogins = leadsForAnchor.filter(l => l.status === config.statusToTrack).length;
            const totalSanction = sanctionData.filter(s => s.anchorId === anchorId).reduce((sum, s) => sum + s.value, 0);

            return {
                anchorId,
                anchorName: anchor.name,
                lenderName: lenders.find(l => leadsForAnchor[0]?.lenderId === l.id)?.name || 'N/A',
                state: leadsForAnchor[0]?.state || 'N/A', // Simplified for now
                targetLogins,
                achievedLogins: achievedStatusCount,
                targetValue: targetDealValue,
                achievedValue: achievedDealValue,
                sanctionValue: achievedSanctionValue,
                aum,
                totalLogins,
                totalSanction,
                totalAum: aum,
            }
        }).filter(Boolean);
    }, [config, selectedMonth, users, anchors, dealers, vendors, sanctionData, aumData, lenders]);
    
    if (!config) return null;

    const grandTotals = dashboardData.reduce((totals, row) => {
        if (!row) return totals;
        totals.logins += row.totalLogins;
        totals.sanction += row.totalSanction;
        totals.aum += row.totalAum;
        return totals;
    }, { logins: 0, sanction: 0, aum: 0});

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>{config.name}</CardTitle>
                        <CardDescription>Your custom Target vs. Achievement dashboard.</CardDescription>
                    </div>
                     <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Month" /></SelectTrigger>
                        <SelectContent>
                            {monthOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead rowSpan={2} className="align-bottom">State</TableHead>
                            <TableHead rowSpan={2} className="align-bottom">Anchor</TableHead>
                            <TableHead rowSpan={2} className="align-bottom">Lender</TableHead>
                            <TableHead colSpan={2} className="text-center">Logins ({config.statusToTrack})</TableHead>
                            <TableHead colSpan={2} className="text-center">Value ({config.statusToTrack})</TableHead>
                            <TableHead rowSpan={2} className="align-bottom">Sanction Value (Cr)</TableHead>
                            <TableHead rowSpan={2} className="align-bottom">AUM</TableHead>
                        </TableRow>
                        <TableRow>
                            <TableHead className="text-center">Target</TableHead>
                            <TableHead className="text-center">Achieved</TableHead>
                            <TableHead className="text-center">Target (Cr)</TableHead>
                            <TableHead className="text-center">Achieved (Cr)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dashboardData.map(row => row && (
                             <TableRow key={row.anchorId}>
                                <TableCell>{row.state}</TableCell>
                                <TableCell className="font-medium">{row.anchorName}</TableCell>
                                <TableCell>{row.lenderName}</TableCell>
                                <TableCell className="text-center">{row.targetLogins}</TableCell>
                                <TableCell className="text-center">{row.achievedLogins}</TableCell>
                                <TableCell className="text-center">{row.targetValue}</TableCell>
                                <TableCell className="text-center">{row.achievedValue.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{row.sanctionValue.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{row.aum.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableRow className="font-bold bg-secondary hover:bg-secondary">
                        <TableCell colSpan={3}>Grand Total</TableCell>
                        <TableCell colSpan={4}></TableCell>
                        <TableCell className="text-center">{grandTotals.sanction.toFixed(2)}</TableCell>
                        <TableCell className="text-center">{grandTotals.aum.toFixed(2)}</TableCell>
                    </TableRow>
                </Table>
                </div>
            </CardContent>
        </Card>
    )
}
