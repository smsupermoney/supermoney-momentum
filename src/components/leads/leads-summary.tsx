

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
                        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                            <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Handshake className="h-4 w-4" /> Total Leads</div>
                                <div className="text-3xl font-bold mt-1">{summaryData.totalLeads}</div>
                                <p className="text-xs text-muted-foreground">{statusFilter !== 'all' ? `in "${statusFilter}"` : 'across all statuses'}</p>
                            </div>
                             <div>
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Clock className="h-4 w-4" /> Stale Leads</div>
                                <div className="text-3xl font-bold mt-1">{staleHours === '24' ? summaryData.stale24h : summaryData.stale72h}</div>
                                <RadioGroup defaultValue="24" onValueChange={(value) => setStaleHours(value as '24' | '72')} className="flex items-center space-x-3 mt-1">
                                    <div className="flex items-center space-x-1"><RadioGroupItem value="24" id="r1" /><Label htmlFor="r1" className="text-xs">24h</Label></div>
                                    <div className="flex items-center space-x-1"><RadioGroupItem value="72" id="r2" /><Label htmlFor="r2" className="text-xs">72h</Label></div>
                                </RadioGroup>
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
