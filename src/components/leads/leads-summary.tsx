
'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import type { Dealer, Vendor, User, SpokeStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Clock, Handshake, ListChecks, Users, ChevronDown } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { subHours, isBefore } from 'date-fns';
import { spokeStatuses } from '@/lib/types';
import { Separator } from '../ui/separator';

interface LeadsSummaryProps {
  leads: (Dealer | Vendor)[];
  type: 'Dealer' | 'Vendor';
}

interface SummaryData {
    totalLeads: number;
    byUser?: {
        name: string;
        totalLeads: number;
    }[];
}

export function LeadsSummary({ leads, type }: LeadsSummaryProps) {
    const { currentUser, users } = useApp(); // Use all users, not just visibleUsers
    const [statusFilter, setStatusFilter] = useState<SpokeStatus | 'all'>('all');

    const isManager = useMemo(() => currentUser && ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Manager'].includes(currentUser.role), [currentUser]);

    const summaryData = useMemo(() => {
        const filteredLeads = statusFilter === 'all'
            ? leads
            : leads.filter(l => l.status === statusFilter);

        const data: SummaryData = {
            totalLeads: filteredLeads.length,
        };

        if (isManager) {
            // Base the breakdown on all active sales users in the system.
            data.byUser = users
                .filter(u => 
                    u.status !== 'Ex-User' && 
                    ['Area Sales Manager', 'Internal Sales', 'ETB Executive', 'Telecaller'].includes(u.role)
                )
                .map(user => ({
                    name: user.name,
                    totalLeads: filteredLeads.filter(l => l.assignedTo === user.uid).length
                }))
                .filter(u => u.totalLeads > 0)
                .sort((a,b) => b.totalLeads - a.totalLeads);
        }

        return data;

    }, [leads, statusFilter, isManager, users]);

    return (
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
                    {/* Left Side: Title and Stats */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                             <div>
                                <h3 className="text-lg font-semibold">{type} Leads Summary</h3>
                                <p className="text-sm text-muted-foreground">A quick overview of your assigned leads.</p>
                            </div>
                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SpokeStatus | 'all')}>
                                <SelectTrigger className="w-full sm:w-auto min-w-[180px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {spokeStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 gap-4 rounded-lg border p-4">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Handshake className="h-4 w-4" /> Total Leads</div>
                                <div className="text-3xl font-bold mt-1">{summaryData.totalLeads}</div>
                                <p className="text-xs text-muted-foreground">{statusFilter !== 'all' ? `in "${statusFilter}"` : 'across all statuses'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Team Breakdown */}
                    {isManager && summaryData.byUser && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Users className="h-4 w-4" /> Team Breakdown</div>
                            <div className="rounded-lg border p-2">
                                <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                                    <AccordionItem value="item-1" className="border-b-0">
                                        <AccordionTrigger className="p-2 text-sm hover:no-underline rounded-md hover:bg-secondary">
                                            <span>View leads by team member</span>
                                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2">
                                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                                {summaryData.byUser.map(userStat => (
                                                    <div key={userStat.name} className="flex justify-between items-center text-sm p-2 rounded-md bg-secondary">
                                                        <span>{userStat.name}</span>
                                                        <span className="font-bold">{userStat.totalLeads} leads</span>
                                                    </div>
                                                ))}
                                                {summaryData.byUser.length === 0 && <p className="p-2 text-center text-xs text-muted-foreground">No leads found for team members with this filter.</p>}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
