
'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isPast, isToday, subDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { User, Activity, AlertCircle, Building } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


export function TeamProgressCard() {
    const { currentUser, visibleUsers, anchors, tasks, activityLogs } = useApp();
    const [period, setPeriod] = useState<'1d' | '7d' | '30d'>('7d');

    const teamMembers = useMemo(() => {
        if (!currentUser) return [];
        return visibleUsers.filter(u => u.uid !== currentUser.uid && u.role !== 'Admin' && u.role !== 'Business Development');
    }, [currentUser, visibleUsers]);

    const teamProgressData = useMemo(() => {
        let daysToSubtract = 7;
        if (period === '1d') daysToSubtract = 1;
        if (period === '30d') daysToSubtract = 30;
        
        const startDate = subDays(new Date(), daysToSubtract);

        return teamMembers.map(member => {
            const memberAnchors = anchors.filter(a => a.createdBy === member.uid && a.status !== 'Archived' && a.status !== 'Active');
            const memberTasks = tasks.filter(t => t.assignedTo === member.uid);
            const memberActivities = activityLogs.filter(log => log.userId === member.uid && new Date(log.timestamp) >= startDate);

            const overdueTasks = memberTasks.filter(t => 
                isPast(new Date(t.dueDate)) && 
                !isToday(new Date(t.dueDate)) &&
                t.status !== 'Completed'
            ).length;

            return {
                id: member.uid,
                name: member.name,
                role: member.role,
                activeLeads: memberAnchors.length,
                overdueTasks,
                activities: memberActivities.length,
            };
        });
    }, [teamMembers, anchors, tasks, activityLogs, period]);

    const managerRoles: UserRole[] = ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];
    if (!currentUser || !managerRoles.includes(currentUser.role) || teamMembers.length === 0) {
        return null;
    }
    
    const activityColumnTitle = `Activities (${period})`;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle>Team Progress Summary</CardTitle>
                        <CardDescription>An overview of your team's key performance indicators.</CardDescription>
                    </div>
                    <Tabs value={period} onValueChange={(value) => setPeriod(value as '1d' | '7d' | '30d')} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="1d">1D</TabsTrigger>
                            <TabsTrigger value="7d">7D</TabsTrigger>
                            <TabsTrigger value="30d">30D</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="hidden rounded-lg border md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><User className="inline-block h-4 w-4 mr-2" />Member</TableHead>
                                <TableHead><Building className="inline-block h-4 w-4 mr-2" />Active Leads</TableHead>
                                <TableHead><AlertCircle className="inline-block h-4 w-4 mr-2" />Overdue Tasks</TableHead>
                                <TableHead><Activity className="inline-block h-4 w-4 mr-2" />{activityColumnTitle}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamProgressData.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="font-medium">{member.name}</div>
                                        <div className="text-xs text-muted-foreground">{member.role}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{member.activeLeads}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={member.overdueTasks > 0 ? 'destructive' : 'default'}>{member.overdueTasks}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{member.activities}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                    {teamProgressData.map(member => (
                        <Card key={member.id} className="p-0">
                            <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-base">{member.name}</CardTitle>
                                <CardDescription className="text-xs">{member.role}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 text-sm space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Active Leads</span>
                                    <Badge variant="secondary">{member.activeLeads}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Overdue Tasks</span>
                                    <Badge variant={member.overdueTasks > 0 ? 'destructive' : 'default'}>{member.overdueTasks}</Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{activityColumnTitle}</span>
                                    <Badge variant="outline">{member.activities}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
