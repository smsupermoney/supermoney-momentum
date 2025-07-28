

'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import type { Dealer, Vendor, User, SpokeStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Clock, Handshake, ListChecks, Users } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { subHours, isBefore } from 'date-fns';
import { spokeStatuses } from '@/lib/types';

interface LeadsSummaryProps {
  leads: (Dealer | Vendor)[];
  type: 'Dealer' | 'Vendor';
}

interface SummaryData {
    totalLeads: number;
    stale24h: number;
    stale72h: number;
    byUser?: {
        name: string;
        totalLeads: number;
    }[];
}

export function LeadsSummary({ leads, type }: LeadsSummaryProps) {
    const { currentUser, visibleUsers } = useApp();
    const [statusFilter, setStatusFilter] = useState<SpokeStatus | 'all'>('all');
    const [staleHours, setStaleHours] = useState<'24' | '72'>('24');

    const isManager = useMemo(() => currentUser && ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser.role), [currentUser]);

    const summaryData = useMemo(() => {
        const now = new Date();
        const staleTime24 = subHours(now, 24);
        const staleTime72 = subHours(now, 72);

        const filteredLeads = statusFilter === 'all'
            ? leads
            : leads.filter(l => l.status === statusFilter);

        const data: SummaryData = {
            totalLeads: filteredLeads.length,
            stale24h: filteredLeads.filter(l => isBefore(new Date(l.updatedAt || l.createdAt), staleTime24)).length,
            stale72h: filteredLeads.filter(l => isBefore(new Date(l.updatedAt || l.createdAt), staleTime72)).length,
        };

        if (isManager) {
            data.byUser = visibleUsers
                .filter(u => u.uid !== currentUser?.uid && (u.role === 'Area Sales Manager' || u.role === 'Telecaller'))
                .map(user => ({
                    name: user.name,
                    totalLeads: filteredLeads.filter(l => l.assignedTo === user.uid).length
                }))
                .filter(u => u.totalLeads > 0)
                .sort((a,b) => b.totalLeads - a.totalLeads);
        }

        return data;

    }, [leads, statusFilter, isManager, visibleUsers, currentUser]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>{type} Leads Summary</CardTitle>
                        <CardDescription>A quick overview of your assigned leads.</CardDescription>
                    </div>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SpokeStatus | 'all')}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {spokeStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-4">
                        <StatCard
                          title="Total Leads"
                          value={summaryData.totalLeads}
                          icon={Handshake}
                          description={statusFilter !== 'all' ? `in "${statusFilter}" status` : 'across all statuses'}
                        />
                         <StatCard
                          title="Stale Leads"
                          value={staleHours === '24' ? summaryData.stale24h : summaryData.stale72h}
                          icon={Clock}
                          description={`No status change in the last ${staleHours} hours`}
                        >
                            <RadioGroup defaultValue="24" onValueChange={(value) => setStaleHours(value as '24' | '72')} className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="24" id="r1" /><Label htmlFor="r1">24h</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="72" id="r2" /><Label htmlFor="r2">72h</Label></div>
                            </RadioGroup>
                         </StatCard>
                    </div>

                    {isManager && summaryData.byUser && (
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4"/> Team Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="item-1">
                                        <AccordionTrigger>View leads by team member</AccordionTrigger>
                                        <AccordionContent>
                                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-2">
                                                {summaryData.byUser.map(userStat => (
                                                    <div key={userStat.name} className="flex justify-between items-center text-sm p-2 rounded-md bg-secondary">
                                                        <span>{userStat.name}</span>
                                                        <span className="font-bold">{userStat.totalLeads} leads</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function StatCard({ title, value, icon: Icon, description, children }: { title: string; value: string | number; icon: React.ElementType; description?: string, children?: React.ReactNode }) {
  return (
    <Card className="bg-secondary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
