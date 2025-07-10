
'use client';

import { useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { AlertTriangle, User, Clock, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Anchor, Dealer, Vendor } from '@/lib/types';
import { Badge } from '../ui/badge';
import Link from 'next/link';

type StaleLead = (Anchor | Dealer | Vendor) & { type: 'Anchor' | 'Dealer' | 'Vendor' };
type InactiveUser = {
    id: string;
    name: string;
    type: 'Inactive User';
}

export function StaleLeadsCard() {
    const { anchors, dealers, vendors, users, currentUser, visibleUserIds, dailyActivities } = useApp();

    const { staleLeads, inactiveUsers } = useMemo(() => {
        if (!currentUser || !['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser?.role || '')) {
            return { staleLeads: [], inactiveUsers: [] };
        }

        const now = new Date();
        const dayOfWeek = now.getDay(); // Sunday is 0, Monday is 1, etc.
        
        let lastWorkingDay = new Date(now);
        if (dayOfWeek === 0) { // Sunday
            lastWorkingDay.setDate(now.getDate() - 2); // Check since Friday
        } else if (dayOfWeek === 1) { // Monday
            lastWorkingDay.setDate(now.getDate() - 3); // Check since Friday
        } else { // Tuesday to Saturday
            lastWorkingDay.setDate(now.getDate() - 1); // Check since yesterday
        }
        lastWorkingDay.setHours(0, 0, 0, 0);

        const areaSalesManagers = users.filter(u => u.role === 'Area Sales Manager' && visibleUserIds.includes(u.uid));

        const allStaleLeads: StaleLead[] = [];
        const allInactiveUsers: InactiveUser[] = [];

        areaSalesManagers.forEach(asm => {
            const userActivities = dailyActivities.filter(
                act => act.userId === asm.uid && new Date(act.activityTimestamp) >= lastWorkingDay
            );
            const hasRecentActivity = userActivities.length > 0;

            if (!hasRecentActivity) {
                // If the user has no activity since the last working day, flag the user.
                allInactiveUsers.push({ id: asm.uid, name: asm.name, type: 'Inactive User' });
            } else {
                // If the user HAS been active, check for stale leads.
                const allLeadsForUser: StaleLead[] = [
                    ...anchors.filter(a => a.createdBy === asm.uid).map(a => ({ ...a, type: 'Anchor' as const })),
                    ...dealers.filter(d => d.assignedTo === asm.uid).map(d => ({ ...d, type: 'Dealer' as const })),
                    ...vendors.filter(v => v.assignedTo === asm.uid).map(v => ({ ...v, type: 'Vendor' as const })),
                ];

                allLeadsForUser.forEach(lead => {
                    const lastUpdate = new Date(lead.updatedAt || lead.createdAt);
                    
                    if (lastUpdate < lastWorkingDay) {
                        const isLeadInRecentActivity = userActivities.some(act => 
                            (act.anchorId && act.anchorId === lead.id && lead.type === 'Anchor') ||
                            (act.dealerId && act.dealerId === lead.id && lead.type === 'Dealer') ||
                            (act.vendorId && act.vendorId === lead.id && lead.type === 'Vendor')
                        );

                        if (!isLeadInRecentActivity) {
                            allStaleLeads.push(lead);
                        }
                    }
                });
            }
        });

        return { 
            staleLeads: allStaleLeads.sort((a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
                const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
                return dateA.getTime() - dateB.getTime();
            }),
            inactiveUsers: allInactiveUsers
        };

    }, [anchors, dealers, vendors, users, dailyActivities, visibleUserIds, currentUser]);

    if (staleLeads.length === 0 && inactiveUsers.length === 0) {
        return null;
    }

    const getUserName = (userId: string | null) => {
        if (!userId) return 'Unassigned';
        return users.find(u => u.uid === userId)?.name || 'Unknown User';
    };
    
    const getLeadLink = (lead: StaleLead) => {
        switch(lead.type) {
            case 'Anchor': return `/anchors/${lead.id}`;
            case 'Dealer': return `/dealers`;
            case 'Vendor': return `/suppliers`;
            default: return '/dashboard';
        }
    }


    return (
        <Card className="border-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                    <CardTitle className="text-amber-700 dark:text-amber-400">Team Activity Alert</CardTitle>
                </div>
                <CardDescription className="text-amber-600 dark:text-amber-500">
                    Inactive users or stale leads that may require attention.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border border-amber-200 dark:border-amber-800">
                    <Table>
                        <TableBody>
                            {inactiveUsers.map(user => (
                                 <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="font-medium text-destructive">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">Area Sales Manager</div>
                                    </TableCell>
                                    <TableCell colSpan={2} className="text-right">
                                        <div className="flex items-center justify-end gap-2 text-sm text-destructive">
                                            <Activity className="h-3 w-3" />
                                            <span>No activity logged since last working day</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {staleLeads.map(lead => (
                                <TableRow key={`${lead.type}-${lead.id}`}>
                                    <TableCell>
                                        <Link href={getLeadLink(lead)} className="font-medium text-primary hover:underline">{lead.name}</Link>
                                        <div className="text-xs text-muted-foreground">{lead.type} &bull; Status: {lead.status}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-3 w-3" />
                                            <span>{getUserName(lead.type === 'Anchor' ? lead.createdBy : lead.assignedTo)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2 text-sm">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatDistanceToNow(new Date(lead.updatedAt || lead.createdAt), { addSuffix: true })}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
