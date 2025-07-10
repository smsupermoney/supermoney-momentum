
'use client';

import { useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isPast, isToday, subDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { User, Activity, AlertCircle, Building } from 'lucide-react';
import { UserRole } from '@/lib/types';


export function TeamProgressCard() {
    const { currentUser, visibleUsers, anchors, tasks, activityLogs } = useApp();

    const teamMembers = useMemo(() => {
        if (!currentUser) return [];
        return visibleUsers.filter(u => u.uid !== currentUser.uid && u.role !== 'Admin' && u.role !== 'Business Development');
    }, [currentUser, visibleUsers]);

    const teamProgressData = useMemo(() => {
        const sevenDaysAgo = subDays(new Date(), 7);

        return teamMembers.map(member => {
            const memberAnchors = anchors.filter(a => a.createdBy === member.uid && a.status !== 'Archived' && a.status !== 'Active');
            const memberTasks = tasks.filter(t => t.assignedTo === member.uid);
            const memberActivities = activityLogs.filter(log => log.userId === member.uid && new Date(log.timestamp) >= sevenDaysAgo);

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
                activitiesLast7Days: memberActivities.length,
            };
        });
    }, [teamMembers, anchors, tasks, activityLogs]);

    const managerRoles: UserRole[] = ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];
    if (!currentUser || !managerRoles.includes(currentUser.role) || teamMembers.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Team Progress Summary</CardTitle>
                <CardDescription>An overview of your team's key performance indicators.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="hidden rounded-lg border md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><User className="inline-block h-4 w-4 mr-2" />Member</TableHead>
                                <TableHead><Building className="inline-block h-4 w-4 mr-2" />Active Leads</TableHead>
                                <TableHead><AlertCircle className="inline-block h-4 w-4 mr-2" />Overdue Tasks</TableHead>
                                <TableHead><Activity className="inline-block h-4 w-4 mr-2" />Activities (7d)</TableHead>
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
                                        <Badge variant="outline">{member.activitiesLast7Days}</Badge>
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
                                    <span className="text-muted-foreground">Activities (7d)</span>
                                    <Badge variant="outline">{member.activitiesLast7Days}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
