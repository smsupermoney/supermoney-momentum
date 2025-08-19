
'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { AlertTriangle, User, Clock, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, subHours } from 'date-fns';
import type { Dealer, Vendor, UserRole } from '@/lib/types';
import Link from 'next/link';
import { Button } from '../ui/button';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


type StaleLead = (Dealer | Vendor) & { type: 'Dealer' | 'Vendor' };
const ALERTS_PER_PAGE = 10;

interface StaleLeadsCardProps {
  isAccordion?: boolean;
}

export function StaleLeadsCard({ isAccordion = false }: StaleLeadsCardProps) {
    const { dealers, vendors, users, currentUser, visibleUserIds, dailyActivities } = useApp();
    const [inactivePage, setInactivePage] = useState(1);
    const [stalePage, setStalePage] = useState(1);

    const { inactiveUsers, staleLeads } = useMemo(() => {
        // Hydration safety: Defer date-sensitive calculations until mounted on the client.
        if (typeof window === 'undefined') {
            return { inactiveUsers: [], staleLeads: [] };
        }
        
        const managerRoles: UserRole[] = ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Manager'];
        if (!currentUser || !managerRoles.includes(currentUser?.role || '')) {
            return { inactiveUsers: [], staleLeads: [] };
        }
        
        const twentyFourHoursAgo = subHours(new Date(), 24);

        const areaSalesManagers = users.filter(u => 
            ['Area Sales Manager', 'Internal Sales', 'ETB Executive', 'Telecaller'].includes(u.role) &&
            u.status !== 'Ex-User' &&
            visibleUserIds.includes(u.uid)
        );

        const allStaleLeads: StaleLead[] = [];
        const allInactiveUsers: User[] = [];

        areaSalesManagers.forEach(asm => {
            const userActivities = dailyActivities.filter(
                act => act.userId === asm.uid && new Date(act.activityTimestamp) >= twentyFourHoursAgo
            );
            const hasRecentActivity = userActivities.length > 0;

            if (!hasRecentActivity) {
                // If the user has no activity in the last 24 hours, flag the user.
                allInactiveUsers.push(asm);
            } else {
                // If the user HAS been active, check for stale leads.
                const allLeadsForUser: StaleLead[] = [
                    ...dealers.filter(d => d.assignedTo === asm.uid).map(d => ({ ...d, type: 'Dealer' as const })),
                    ...vendors.filter(v => v.assignedTo === asm.uid).map(v => ({ ...v, type: 'Vendor' as const })),
                ];

                allLeadsForUser.forEach(lead => {
                    const lastUpdate = new Date(lead.updatedAt || lead.createdAt);
                    
                    if (lastUpdate < twentyFourHoursAgo) {
                        const isLeadInRecentActivity = userActivities.some(act => 
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

        const sortedLeads = allStaleLeads.sort((a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
                const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
                return dateA.getTime() - dateB.getTime();
            });

        return { inactiveUsers: allInactiveUsers, staleLeads: sortedLeads };

    }, [dealers, vendors, users, dailyActivities, visibleUserIds, currentUser]);

    const paginatedInactiveUsers = useMemo(() => {
        const startIndex = (inactivePage - 1) * ALERTS_PER_PAGE;
        return inactiveUsers.slice(startIndex, startIndex + ALERTS_PER_PAGE);
    }, [inactiveUsers, inactivePage]);

    const paginatedStaleLeads = useMemo(() => {
        const startIndex = (stalePage - 1) * ALERTS_PER_PAGE;
        return staleLeads.slice(startIndex, startIndex + ALERTS_PER_PAGE);
    }, [staleLeads, stalePage]);

    const totalInactivePages = Math.ceil(inactiveUsers.length / ALERTS_PER_PAGE);
    const totalStalePages = Math.ceil(staleLeads.length / ALERTS_PER_PAGE);

    if (inactiveUsers.length === 0 && staleLeads.length === 0) {
        return null;
    }

    const getUserName = (userId: string | null) => {
        if (!userId) return 'Unassigned';
        return users.find(u => u.uid === userId)?.name || 'Unknown User';
    };
    
    const getLeadLink = (lead: StaleLead) => {
        switch(lead.type) {
            case 'Dealer': return `/dealers`;
            case 'Vendor': return `/suppliers`;
            default: return '/dashboard';
        }
    }
    
    const CardHeaderContent = () => (
        <CardHeader className={isAccordion ? 'p-0 text-left' : ''}>
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                <CardTitle className="text-amber-700 dark:text-amber-400">Team Activity Alert</CardTitle>
            </div>
            <CardDescription className="text-amber-600 dark:text-amber-500">
                Inactive users or stale leads that may require attention.
            </CardDescription>
        </CardHeader>
    );

    const CardBodyContent = () => (
      <CardContent className={isAccordion ? 'pt-0' : ''}>
          <Tabs defaultValue="inactive-users" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="inactive-users">Inactive Users ({inactiveUsers.length})</TabsTrigger>
                  <TabsTrigger value="stale-leads">Stale Leads ({staleLeads.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="inactive-users" className="mt-4">
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800">
                      <Table>
                          <TableBody>
                              {paginatedInactiveUsers.map(user => (
                                  <TableRow key={user.id}>
                                      <TableCell>
                                          <div className="font-medium text-destructive">{user.name}</div>
                                          <div className="text-xs text-muted-foreground">{user.role}</div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <div className="flex items-center justify-end gap-2 text-sm text-destructive">
                                              <Activity className="h-3 w-3" />
                                              <span>No activity logged in last 24h</span>
                                          </div>
                                      </TableCell>
                                  </TableRow>
                              ))}
                              {paginatedInactiveUsers.length === 0 && <TableRow><TableCell colSpan={2} className="h-24 text-center">No inactive users found.</TableCell></TableRow>}
                          </TableBody>
                      </Table>
                  </div>
                  {totalInactivePages > 1 && (
                      <PaginationControls currentPage={inactivePage} totalPages={totalInactivePages} onPageChange={setInactivePage} />
                  )}
              </TabsContent>
              <TabsContent value="stale-leads" className="mt-4">
                   <div className="rounded-lg border border-amber-200 dark:border-amber-800">
                      <Table>
                          <TableBody>
                             {paginatedStaleLeads.map(lead => (
                                <TableRow key={`${lead.type}-${lead.id}`}>
                                    <TableCell>
                                        <Link href={getLeadLink(lead)} className="font-medium text-primary hover:underline">{lead.name}</Link>
                                        <div className="text-xs text-muted-foreground">{lead.type} &bull; Status: {lead.status}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-3 w-3" />
                                            <span>{getUserName(lead.assignedTo)}</span>
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
                             {paginatedStaleLeads.length === 0 && <TableRow><TableCell colSpan={3} className="h-24 text-center">No stale leads found.</TableCell></TableRow>}
                          </TableBody>
                      </Table>
                  </div>
                   {totalStalePages > 1 && (
                      <PaginationControls currentPage={stalePage} totalPages={totalStalePages} onPageChange={setStalePage} />
                  )}
              </TabsContent>
          </Tabs>
      </CardContent>
    );

    if (isAccordion) {
        return (
            <Card className="border-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
                <AccordionTrigger className="p-6 hover:no-underline [&>svg]:mx-6">
                    <CardHeaderContent />
                </AccordionTrigger>
                <AccordionContent>
                    <CardBodyContent />
                </AccordionContent>
            </Card>
        )
    }

    return (
        <Card className="border-amber-500 bg-amber-50/50 dark:bg-amber-900/10">
            <CardHeaderContent />
            <CardBodyContent />
        </Card>
    );
}

const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => (
    <div className="flex items-center justify-end space-x-2 pt-4">
        <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
        </span>
        <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
        >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Page</span>
        </Button>
        <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
        >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Page</span>
        </Button>
    </div>
);
