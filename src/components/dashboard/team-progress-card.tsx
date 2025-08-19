
'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isPast, isToday, subDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { User, Activity, AlertCircle, Package, Handshake, IndianRupee } from 'lucide-react';
import { UserRole, products as allProducts, spokeStatuses } from '@/lib/types';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const TeamProgressTitle = () => <CardTitle>Team Progress Summary</CardTitle>;
const TeamProgressDescription = () => <CardDescription>An overview of your team's key performance indicators.</CardDescription>;

const TeamProgressContent = () => {
    const { currentUser, visibleUsers, dealers, vendors, tasks, activityLogs } = useApp();
    const [period, setPeriod] = useState<'1d' | '7d' | '30d'>('7d');
    const [regionFilter, setRegionFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const regions = useMemo(() => {
        const allRegions = new Set(visibleUsers.filter(u => u.status !== 'Ex-User').map(u => u.region).filter(Boolean));
        return ['all', ...Array.from(allRegions)];
    }, [visibleUsers]);

    const filteredUsers = useMemo(() => {
        if (!currentUser) return [];
        let users = visibleUsers.filter(u => u.uid !== currentUser.uid && u.role !== 'Admin' && u.role !== 'Business Development' && u.role !== 'BIU' && u.status !== 'Ex-User');
        if (regionFilter !== 'all') {
            users = users.filter(u => u.region === regionFilter);
        }
        return users;
    }, [currentUser, visibleUsers, regionFilter]);

    const teamProgressData = useMemo(() => {
        let daysToSubtract = 7;
        if (period === '1d') daysToSubtract = 1;
        if (period === '30d') daysToSubtract = 30;
        
        const startDate = subDays(new Date(), daysToSubtract);

        const allLeads = [...dealers, ...vendors];

        return filteredUsers.map(member => {
            const memberLeads = allLeads.filter(l => l.assignedTo === member.uid);

            const leadsByStatus = statusFilter === 'all'
                ? memberLeads.filter(l => l.status !== 'Closed' && l.status !== 'Rejected' && l.status !== 'Not Interested').length
                : memberLeads.filter(l => l.status === statusFilter).length;
            
            const memberTasks = tasks.filter(t => t.assignedTo === member.uid);
            const memberActivities = activityLogs.filter(log => log.userId === member.uid && new Date(log.timestamp) >= startDate);
            const overdueTasks = memberTasks.filter(t => 
                isPast(new Date(t.dueDate)) && 
                !isToday(new Date(t.dueDate)) &&
                t.status !== 'Completed'
            ).length;

            return { id: member.uid, name: member.name, role: member.role, newLeads: leadsByStatus, overdueTasks, activities: memberActivities.length };
        });
    }, [filteredUsers, dealers, vendors, tasks, activityLogs, period, statusFilter]);

    const productProgressData = useMemo(() => {
        const allLeads = [...dealers, ...vendors];
        
        let leadsInRegion = allLeads;
        if (regionFilter !== 'all') {
            const userIdsInRegion = visibleUsers.filter(u => u.region === regionFilter && u.status !== 'Ex-User').map(u => u.uid);
            leadsInRegion = allLeads.filter(lead => lead.assignedTo && userIdsInRegion.includes(lead.assignedTo));
        }

        return allProducts.map(product => {
            const productLeads = leadsInRegion.filter(lead => lead.product === product && lead.status === 'New');
            const newLeads = productLeads.length;
            const dealValue = productLeads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);
            return { name: product, newLeads, dealValue };
        }).filter(p => p.newLeads > 0 || p.dealValue > 0);
    }, [dealers, vendors, regionFilter, visibleUsers]);

    const activityColumnTitle = `Activities (${period})`;
    const leadColumnTitle = statusFilter === 'all' ? 'Active Leads' : `Leads in '${statusFilter}'`;

    return (
        <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={regionFilter} onValueChange={setRegionFilter}>
                      <SelectTrigger className="w-full sm:w-auto min-w-[150px]"><SelectValue placeholder="Filter by Region" /></SelectTrigger>
                      <SelectContent>
                        {regions.map(r => <SelectItem key={r} value={r}>{r === 'all' ? 'All Regions' : r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-auto min-w-[150px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Active Leads</SelectItem>
                            {spokeStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Tabs value={period} onValueChange={(value) => setPeriod(value as '1d' | '7d' | '30d')} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="1d">1D</TabsTrigger>
                            <TabsTrigger value="7d">7D</TabsTrigger>
                            <TabsTrigger value="30d">30D</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>
             <Tabs defaultValue="member" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="member">By Member</TabsTrigger>
                    <TabsTrigger value="product">By Product</TabsTrigger>
                </TabsList>
                <TabsContent value="member" className="mt-4">
                    <div className="hidden rounded-lg border md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><User className="inline-block h-4 w-4 mr-2" />Member</TableHead>
                                    <TableHead><Handshake className="inline-block h-4 w-4 mr-2" />{leadColumnTitle}</TableHead>
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
                                        <TableCell><Badge variant="secondary">{member.newLeads}</Badge></TableCell>
                                        <TableCell><Badge variant={member.overdueTasks > 0 ? 'destructive' : 'default'}>{member.overdueTasks}</Badge></TableCell>
                                        <TableCell><Badge variant="outline">{member.activities}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                        {teamProgressData.map(member => (
                            <Card key={member.id} className="p-0">
                                <CardHeader className="p-3 pb-2"><CardTitle className="text-base">{member.name}</CardTitle><CardDescription className="text-xs">{member.role}</CardDescription></CardHeader>
                                <CardContent className="p-3 pt-0 text-sm space-y-2">
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground">{leadColumnTitle}</span><Badge variant="secondary">{member.newLeads}</Badge></div>
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Overdue Tasks</span><Badge variant={member.overdueTasks > 0 ? 'destructive' : 'default'}>{member.overdueTasks}</Badge></div>
                                    <div className="flex justify-between items-center"><span className="text-muted-foreground">{activityColumnTitle}</span><Badge variant="outline">{member.activities}</Badge></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="product" className="mt-4">
                    <div className="rounded-lg border">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Package className="inline-block h-4 w-4 mr-2" />Product</TableHead>
                                    <TableHead><Handshake className="inline-block h-4 w-4 mr-2" />New Leads</TableHead>
                                    <TableHead><IndianRupee className="inline-block h-4 w-4 mr-2" />Total Deal Value (Cr)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {productProgressData.map(product => (
                                    <TableRow key={product.name}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell><Badge variant="secondary">{product.newLeads}</Badge></TableCell>
                                        <TableCell><Badge variant="outline">{product.dealValue.toFixed(2)}</Badge></TableCell>
                                    </TableRow>
                                ))}
                                {productProgressData.length === 0 && <TableRow><TableCell colSpan={3} className="h-24 text-center">No product data for this period/region.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
};

export function TeamProgressCard() {
    const { currentUser, visibleUsers } = useApp();

    const managerRoles: UserRole[] = ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Manager'];
    if (!currentUser || !managerRoles.includes(currentUser.role) || visibleUsers.length <= 1) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <TeamProgressTitle />
                <TeamProgressDescription />
            </CardHeader>
            <CardContent>
                <TeamProgressContent />
            </CardContent>
        </Card>
    );
}

TeamProgressCard.Title = TeamProgressTitle;
TeamProgressCard.Description = TeamProgressDescription;
TeamProgressCard.Content = TeamProgressContent;
