
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useApp } from '@/contexts/app-context';
import type { CustomDashboardConfig, Dealer, Vendor, SpokeStatus, Target, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IndianRupee, GanttChartSquare } from 'lucide-react';
import { format, getMonth, getYear } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';

export function TargetVsAchievementCard() {
    const { users, anchors, lenders, dealers, vendors, sanctionData, aumData, targets, currentUser } = useApp();
    const { t } = useLanguage();
    
    const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
    
    const monthOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        const endDate = new Date();
        let currentDate = new Date(2025, 3, 1); // April 2025

        while (currentDate <= endDate) {
            options.push({
                value: format(currentDate, 'yyyy-MM'),
                label: format(currentDate, 'MMMM yyyy'),
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return options.reverse(); // Show most recent months first
    }, []);

    const isManagerView = useMemo(() => {
        if (!currentUser) return false;
        return ['Admin', 'BIU', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'ETB Manager'].includes(currentUser.role);
    }, [currentUser]);

    const teamUserIds = useMemo(() => {
        if (!currentUser) return [];
        if (selectedEmployeeId !== 'all') return [selectedEmployeeId];
        if (currentUser.role === 'Admin' || currentUser.role === 'BIU' || currentUser.role === 'National Sales Manager') {
            return users.filter(u => ['Area Sales Manager', 'Internal Sales'].includes(u.role)).map(u => u.uid);
        }
        if (['Zonal Sales Manager', 'Regional Sales Manager', 'ETB Manager'].includes(currentUser.role)) {
            const team = users.filter(u => u.managerId === currentUser.uid);
            return team.map(u => u.uid);
        }
        return [currentUser.uid];
    }, [currentUser, users, selectedEmployeeId]);


    const dashboardData = useMemo(() => {
        if (!currentUser) return [];

        const teamLeads = [...dealers, ...vendors].filter(lead => lead.assignedTo && teamUserIds.includes(lead.assignedTo));

        const getAchievements = (anchorId: string, month: string) => {
            const monthLeads = teamLeads.filter(l => {
                if (l.anchorId !== anchorId) return false;
                const leadDate = new Date(l.leadDate);
                return getYear(leadDate) === parseInt(month.split('-')[0]) &&
                       getMonth(leadDate) === parseInt(month.split('-')[1]) - 1;
            });

            return {
                achievedLogins: monthLeads.filter(l => l.status === 'Login done').length,
                achievedValue: monthLeads
                    .filter(l => l.status === 'Login done')
                    .reduce((sum, l) => sum + (l.dealValue || 0), 0)
            };
        };

        const result: any[] = [];
        const seenAnchors = new Set<string>();

        const anchorTargets = targets.filter(t => t.month === selectedMonth && teamUserIds.includes(t.userId));
        
        anchorTargets.forEach(target => {
            if (seenAnchors.has(target.anchorId)) return;
            seenAnchors.add(target.anchorId);
            
            const anchor = anchors.find(a => a.id === target.anchorId);
            if (!anchor) return;
            
            const achievements = getAchievements(target.anchorId, selectedMonth);
            const sanction = sanctionData.find(d => d.anchorId === target.anchorId && d.month === selectedMonth)?.value || 0;
            const currentAum = aumData.find(d => d.anchorId === target.anchorId)?.value || 0;

            result.push({
                state: anchor.address, // Assuming state is in address
                anchorName: anchor.name,
                lenderName: lenders.find(l => l.id === target.lenderId)?.name || 'N/A',
                targetLogins: target.targetLogins,
                achievedLogins: achievements.achievedLogins,
                targetValue: target.targetValue,
                achievedValue: achievements.achievedValue,
                sanctionValue: sanction,
                aum: currentAum
            });
        });
        
        return result;

    }, [currentUser, selectedMonth, teamUserIds, dealers, vendors, anchors, lenders, targets, sanctionData, aumData]);


    const grandTotals = useMemo(() => {
        return dashboardData.reduce((totals, row) => {
            totals.logins += row.achievedLogins;
            totals.sanction += row.sanctionValue;
            totals.aum += row.aum;
            return totals;
        }, { logins: 0, sanction: 0, aum: 0 });
    }, [dashboardData]);

    if (!isManagerView && !teamUserIds.includes(currentUser?.uid || '')) return null;
    if (dashboardData.length === 0) return null;

    const availableEmployees = users.filter(u => ['Area Sales Manager', 'Internal Sales'].includes(u.role));

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle>Target vs. Achievement</CardTitle>
                        <CardDescription>Monthly performance tracking.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {isManagerView && (
                            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Employee" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Team Members</SelectItem>
                                    {availableEmployees.map(e => <SelectItem key={e.uid} value={e.uid}>{e.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
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
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>State</TableHead>
                                <TableHead>Anchor</TableHead>
                                <TableHead>Lender</TableHead>
                                <TableHead className="text-center">Target Logins</TableHead>
                                <TableHead className="text-center">Achieved Logins</TableHead>
                                <TableHead className="text-center">Target Value (Cr)</TableHead>
                                <TableHead className="text-center">Achieved Value (Cr)</TableHead>
                                <TableHead className="text-center">Sanction Value (Cr)</TableHead>
                                <TableHead className="text-center">AUM</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dashboardData.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>{row.state}</TableCell>
                                    <TableCell className="font-medium">{row.anchorName}</TableCell>
                                    <TableCell>{row.lenderName}</TableCell>
                                    <TableCell className="text-center">{row.targetLogins}</TableCell>
                                    <TableCell className="text-center">{row.achievedLogins}</TableCell>
                                    <TableCell className="text-center">{row.targetValue.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">{row.achievedValue.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">{row.sanctionValue.toFixed(2)}</TableCell>
                                    <TableCell className="text-center">{row.aum.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                             <TableRow className="font-bold bg-secondary hover:bg-secondary">
                                <TableCell colSpan={4}>Grand Total</TableCell>
                                <TableCell className="text-center">{grandTotals.logins}</TableCell>
                                <TableCell colSpan={2}></TableCell>
                                <TableCell className="text-center">{grandTotals.sanction.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{grandTotals.aum.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
