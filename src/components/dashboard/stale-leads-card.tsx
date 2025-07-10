'use client';

import { useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { AlertTriangle, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Anchor, Dealer, Vendor } from '@/lib/types';
import { Badge } from '../ui/badge';
import Link from 'next/link';

type StaleLead = (Anchor | Dealer | Vendor) & { type: 'Anchor' | 'Dealer' | 'Vendor' };

export function StaleLeadsCard() {
    const { anchors, dealers, vendors, users, currentUser, visibleUserIds, dailyActivities } = useApp();

    const staleLeads: StaleLead[] = useMemo(() => {
        if (!currentUser || !['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser?.role || '')) {
            return [];
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

        areaSalesManagers.forEach(asm => {
            const userActivities = dailyActivities.filter(
                act => act.userId === asm.uid && new Date(act.activityTimestamp) >= lastWorkingDay
            );
            const hasRecentActivity = userActivities.length > 0;

            const allLeadsForUser: StaleLead[] = [
                ...anchors.filter(a => a.createdBy === asm.uid).map(a => ({ ...a, type: 'Anchor' as const })),
                ...dealers.filter(d => d.assignedTo === asm.uid).map(d => ({ ...d, type: 'Dealer' as const })),
                ...vendors.filter(v => v.assignedTo === asm.uid).map(v => ({ ...v, type: 'Vendor' as const })),
            ];

            allLeadsForUser.forEach(lead => {
                const lastUpdate = new Date(lead.updatedAt || lead.createdAt);
                
                if (lastUpdate < lastWorkingDay && !hasRecentActivity) {
                    // Check if this lead was updated in any of user's recent activities
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
        });

        return allStaleLeads.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
            const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
            return dateA.getTime() - dateB.getTime();
        });

    }, [anchors, dealers, vendors, users, dailyActivities, visibleUserIds, currentUser]);

    if (staleLeads.length === 0) {
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
                    <CardTitle className="text-amber-700 dark:text-amber-400">Stale Leads Alert</CardTitle>
                </div>
                <CardDescription className="text-amber-600 dark:text-amber-500">
                    These leads have not been updated in over 24 hours and may require attention.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="hidden rounded-lg border border-amber-200 dark:border-amber-800 md:block">
                    <Table>
                        <TableBody>
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
                 <div className="space-y-4 md:hidden">
                    {staleLeads.map(lead => (
                        <Card key={`${lead.type}-${lead.id}`} className="border-amber-200 dark:border-amber-800">
                            <CardContent className="p-3 space-y-2">
                                <div className="flex justify-between items-start">
                                    <Link href={getLeadLink(lead)} className="font-medium text-primary hover:underline">{lead.name}</Link>
                                    <Badge variant="secondary">{lead.type}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">Status: <span className="font-medium">{lead.status}</span></div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{getUserName(lead.type === 'Anchor' ? lead.createdBy : lead.assignedTo)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDistanceToNow(new Date(lead.updatedAt || lead.createdAt), { addSuffix: true })}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
