
'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, getMonth, getYear, startOfMonth } from 'date-fns';
import type { Target } from '@/lib/types';

export function TargetVsAchievementCard() {
    const { targets, users, currentUser, dealers, vendors, anchors, lenders } = useApp();
    const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

    const monthOptions = useMemo(() => {
        const options = new Set<string>();
        targets.forEach(t => options.add(format(new Date(t.month), 'yyyy-MM')));
        return Array.from(options).sort((a,b) => b.localeCompare(a));
    }, [targets]);
    
    const salesEmployees = useMemo(() => users.filter(u => u.role === 'Area Sales Manager'), [users]);
    const isAdmin = useMemo(() => currentUser?.role === 'Admin', [currentUser]);

    const filteredData = useMemo(() => {
        let employeeTargets: Target[];

        if (isAdmin) {
            employeeTargets = selectedEmployee === 'all'
                ? targets
                : targets.filter(t => t.userId === selectedEmployee);
        } else {
            employeeTargets = targets.filter(t => t.userId === currentUser?.uid);
        }

        const monthTargets = employeeTargets.filter(t => format(new Date(t.month), 'yyyy-MM') === selectedMonth);

        // This would be where you calculate achievements against targets.
        // For now, we'll display mock achievements.
        return monthTargets.map(target => {
            const anchor = anchors.find(a => a.id === target.anchorId);
            const lender = lenders.find(l => l.id === target.lenderId);
            const user = users.find(u => u.uid === target.userId);

            const achievedLogins = Math.floor(target.targetLogins * (Math.random() * 0.5 + 0.6)); // 60-110% of target
            const achievedValue = target.targetValue * (Math.random() * 0.5 + 0.6);
            const sanctionValue = achievedValue * (Math.random() * 0.4 + 0.8); // 80-120% of achieved
            const aum = sanctionValue * (Math.random() * 0.2 + 0.9); // 90-110% of sanction

            return {
                ...target,
                state: user?.region || 'N/A', // Using region as a proxy for state
                anchorName: anchor?.name || 'N/A',
                lenderName: lender?.name || 'N/A',
                achievedLogins,
                achievedValue,
                sanctionValue,
                aum,
            };
        });
    }, [targets, selectedMonth, selectedEmployee, isAdmin, currentUser, anchors, lenders, users]);
    
    const grandTotals = useMemo(() => {
        return filteredData.reduce((acc, row) => {
            acc.logins += row.achievedLogins;
            acc.sanctionValue += row.sanctionValue;
            acc.aum += row.aum;
            return acc;
        }, { logins: 0, sanctionValue: 0, aum: 0 });
    }, [filteredData]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Target vs Achievement</CardTitle>
                        <CardDescription>Monthly performance data against set targets.</CardDescription>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                <SelectValue placeholder="Select Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map(month => (
                                    <SelectItem key={month} value={month}>{format(new Date(month), 'MMMM yyyy')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isAdmin && (
                             <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
                                    <SelectValue placeholder="Select Employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Employees</SelectItem>
                                    {salesEmployees.map(emp => (
                                        <SelectItem key={emp.uid} value={emp.uid}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>State</TableHead>
                                <TableHead>Anchor</TableHead>
                                <TableHead>Lender</TableHead>
                                <TableHead>Target Logins</TableHead>
                                <TableHead>Achieved Logins</TableHead>
                                <TableHead>Target Value (Cr)</TableHead>
                                <TableHead>Achieved Value (Cr)</TableHead>
                                <TableHead>Sanction Value (Cr)</TableHead>
                                <TableHead>AUM</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length > 0 ? filteredData.map(row => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.state}</TableCell>
                                    <TableCell>{row.anchorName}</TableCell>
                                    <TableCell>{row.lenderName}</TableCell>
                                    <TableCell>{row.targetLogins}</TableCell>
                                    <TableCell>{row.achievedLogins}</TableCell>
                                    <TableCell>{row.targetValue.toFixed(2)}</TableCell>
                                    <TableCell>{row.achievedValue.toFixed(2)}</TableCell>
                                    <TableCell>{row.sanctionValue.toFixed(2)}</TableCell>
                                    <TableCell>{row.aum.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">No data for selected period.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-secondary/50">
                                <TableHead colSpan={4}>Grand Total</TableHead>
                                <TableHead>{grandTotals.logins}</TableHead>
                                <TableHead colSpan={2}></TableHead>
                                <TableHead>{grandTotals.sanctionValue.toFixed(2)}</TableHead>
                                <TableHead>{grandTotals.aum.toFixed(2)}</TableHead>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
