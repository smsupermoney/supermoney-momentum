

'use client';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, FunnelChart, Funnel, LabelList, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { isAfter, isBefore, isToday, startOfWeek, endOfWeek, startOfMonth, endOfQuarter, isWithinInterval, isPast, format, startOfQuarter } from 'date-fns';
import { Activity, Target, CheckCircle, Percent, ArrowRight, Mail, Phone, Calendar, Users, AlertTriangle, Lightbulb, User, FileText, Download, Loader2 } from 'lucide-react';
import type { Anchor, Task, ActivityLog, User as UserType, UserRole, Dealer, Vendor, SpokeStatus } from '@/lib/types';
import { AdminDataChat } from '@/components/admin/admin-data-chat';
import { useState, useMemo, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { generateHighlights } from '@/ai/flows/generate-highlights-flow';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { products } from '@/lib/types';

// Helper function to truncate long strings for Excel export
const truncateForExcel = (data: any[]): any[] => {
  const MAX_CELL_LENGTH = 32000; // A safe limit below Excel's 32,767
  return data.map(row => {
    const newRow = { ...row };
    for (const key in newRow) {
      if (typeof newRow[key] === 'string' && newRow[key].length > MAX_CELL_LENGTH) {
        newRow[key] = newRow[key].substring(0, MAX_CELL_LENGTH) + '... [TRUNCATED]';
      }
    }
    return newRow;
  });
};


// Main Page Component
export default function ReportsPage() {
  const { currentUser, anchors, users, dealers, vendors, activityLogs, tasks, dailyActivities, t } = useApp();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
        setIsDownloading(true);

        // 1. Prepare data
        const processedUsers = users.map(u => ({
            Name: u.name,
            Email: u.email,
            Role: u.role,
            Region: u.region || 'N/A',
            Manager: users.find(m => m.uid === u.managerId)?.name || 'N/A'
        }));

        const processedAnchors = anchors.map(a => {
            const primaryContact = a.contacts.find(c => c.isPrimary) || a.contacts[0];
            return {
                Name: a.name,
                Industry: a.industry,
                Status: a.status,
                'Annual Turnover': a.annualTurnover,
                'Credit Rating': a.creditRating || 'N/A',
                Address: a.address || 'N/A',
                'Lead Source': a.leadSource || 'N/A',
                'Lead Score': a.leadScore,
                'Lead Score Reason': a.leadScoreReason,
                'Primary Contact Name': primaryContact?.name || 'N/A',
                'Primary Contact Email': primaryContact?.email || 'N/A',
                'Primary Contact Phone': primaryContact?.phone || 'N/A',
                'Created By': users.find(u => u.uid === a.createdBy)?.name || 'N/A',
                'Created At': format(new Date(a.createdAt), 'yyyy-MM-dd HH:mm'),
            }
        });
        
        const getSpokeData = (spoke: Dealer | Vendor) => ({
            Name: spoke.name,
            'Contact Number': spoke.contactNumber,
            Email: spoke.email || 'N/A',
            'Onboarding Status': spoke.status,
            'Assigned To': users.find(u => u.uid === spoke.assignedTo)?.name || 'Unassigned',
            'Associated Anchor': anchors.find(a => a.id === spoke.anchorId)?.name || 'N/A',
            'Product Interest': spoke.product || 'N/A',
            'Lead Type': spoke.leadType || 'N/A',
            'Lead Score': spoke.leadScore,
            'Lead Score Reason': spoke.leadScoreReason,
            'Potential Deal Value (INR)': spoke.dealValue,
            'Created At': format(new Date(spoke.createdAt), 'yyyy-MM-dd HH:mm'),
        });
        
        const processedDealers = dealers.map(getSpokeData);
        const processedVendors = vendors.map(getSpokeData);

        const processedTasks = tasks.map(t => {
            let associatedWith = 'N/A';
            if (t.associatedWith.anchorId) associatedWith = `Anchor: ${anchors.find(a => a.id === t.associatedWith.anchorId)?.name}`;
            else if (t.associatedWith.dealerId) associatedWith = `Dealer: ${dealers.find(d => d.id === t.associatedWith.dealerId)?.name}`;
            else if (t.associatedWith.vendorId) associatedWith = `Vendor: ${vendors.find(v => v.id === t.associatedWith.vendorId)?.name}`;
            
            return {
                Title: t.title,
                'Assigned To': users.find(u => u.uid === t.assignedTo)?.name || 'N/A',
                'Associated With': associatedWith,
                Type: t.type,
                Status: t.status,
                Priority: t.priority,
                'Due Date': format(new Date(t.dueDate), 'yyyy-MM-dd'),
                Description: t.description,
                'Created At': format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm'),
            }
        });
        
        const processedActivityLogs = activityLogs.map(log => {
             let associatedWith = 'N/A';
            if (log.anchorId) associatedWith = `Anchor: ${anchors.find(a => a.id === log.anchorId)?.name}`;
            else if (log.dealerId) associatedWith = `Dealer: ${dealers.find(d => d.id === log.dealerId)?.name}`;
            else if (log.vendorId) associatedWith = `Vendor: ${vendors.find(v => v.id === log.vendorId)?.name}`;

            return {
                'User': log.userName,
                'Timestamp': format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm'),
                'Type': log.type,
                'Title': log.title,
                'Outcome': log.outcome,
                'Associated With': associatedWith,
                'Related Task ID': log.taskId || 'N/A'
            }
        });

        const processedDailyActivities = dailyActivities.map(activity => ({
            'User': activity.userName,
            'Timestamp': format(new Date(activity.activityTimestamp), 'yyyy-MM-dd HH:mm'),
            'Type': activity.activityType,
            'Title': activity.title,
            'Notes': activity.notes,
            'Location': activity.location ? `${activity.location.latitude}, ${activity.location.longitude}` : 'N/A',
            'Images': (activity.images || []).join(', '),
            'Associated Anchor': activity.anchorName || 'N/A',
            'Associated Dealer': activity.dealerName || 'N/A',
            'Associated Vendor': activity.vendorName || 'N/A',
        }));

        // 2. Create workbook and worksheets
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(truncateForExcel(processedUsers)), "Users");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(truncateForExcel(processedAnchors)), "Anchors");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(truncateForExcel(processedDealers)), "Dealers");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(truncateForExcel(processedVendors)), "Vendors");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(truncateForExcel(processedTasks)), "Tasks");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(truncateForExcel(processedActivityLogs)), "Interaction Logs");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(truncateForExcel(processedDailyActivities)), "Daily Activities");

        // 3. Trigger download
        XLSX.writeFile(wb, `Supermoney_CRM_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

        setIsDownloading(false);
    };

  const getPageTitle = (role: UserRole) => {
    switch (role) {
      case 'Admin': return t('reports.adminTitle');
      case 'National Sales Manager':
      case 'Regional Sales Manager':
      case 'Business Development':
      case 'Zonal Sales Manager': return t('reports.managerTitle');
      default: return t('reports.salesTitle');
    }
  }

  const getPageDescription = (role: UserRole) => {
     switch (role) {
      case 'Admin': return t('reports.adminDescription');
       case 'National Sales Manager':
       case 'Regional Sales Manager':
       case 'Business Development':
       case 'Zonal Sales Manager': return t('reports.managerDescription');
      default: return t('reports.salesDescription');
    }
  }

  const renderReports = () => {
    if (!currentUser) return null;
    switch(currentUser.role) {
        case 'Admin':
        case 'Business Development':
        case 'National Sales Manager':
        case 'Regional Sales Manager':
        case 'Zonal Sales Manager':
             return <LeadsDashboard />;
        case 'Area Sales Manager': return <SalespersonDashboard />;
        default: return <div className="text-center p-8">{t('reports.noReports')}</div>
    }
  }

  const adminActions = (
    <Button onClick={handleDownload} disabled={isDownloading} size="sm" variant="outline">
      {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Download All Data
    </Button>
  );

  return (
    <>
      <PageHeader
        title={getPageTitle(currentUser.role)}
        description={getPageDescription(currentUser.role)}
      >
        {(currentUser?.role === 'Admin' || currentUser?.role === 'Business Development') && adminActions}
      </PageHeader>
      {renderReports()}
    </>
  );
}

// Reports for individual Salesperson
function SalespersonDashboard() {
  const { currentUser, tasks, activityLogs, t, dealers, vendors } = useApp();
  const userTasks = tasks.filter(t => t.assignedTo === currentUser?.uid);
  const userDealers = dealers.filter(d => d.assignedTo === currentUser?.uid);
  const userVendors = vendors.filter(v => v.assignedTo === currentUser?.uid);
  const userLogs = activityLogs.filter(l => l.userName === currentUser?.name);

  const today = new Date();
  const overdueTasks = userTasks.filter(t => isBefore(new Date(t.dueDate), today) && t.status !== 'Completed').length;
  const todayTasks = userTasks.filter(t => isToday(new Date(t.dueDate)) && t.status !== 'Completed').length;
  const thisWeekTasks = userTasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return isAfter(dueDate, startOfWeek(today)) && isBefore(dueDate, endOfWeek(today)) && t.status !== 'Completed';
  }).length;

  // Pipeline Funnel Data
  const userLeads = [...userDealers, ...userVendors];
  const pipelineData = [
    { name: 'New', value: userLeads.filter(a => a.status === 'New').length, fill: 'hsl(var(--chart-1))' },
    { name: 'Onboarding', value: userLeads.filter(a => a.status === 'Onboarding').length, fill: 'hsl(var(--chart-2))' },
    { name: 'Partial Docs', value: userLeads.filter(a => a.status === 'Partial Docs').length, fill: 'hsl(var(--chart-3))' },
  ].filter(d => d.value > 0);

  // Weekly Activity Data
  const sevenDaysAgo = new Date(new Date().setDate(today.getDate() - 7));
  const weeklyLogs = userLogs.filter(l => new Date(l.timestamp) > sevenDaysAgo);
  const weeklyActivities = {
    'Call': weeklyLogs.filter(l => l.type === 'Call').length,
    'Email': weeklyLogs.filter(l => l.type === 'Email').length,
    'Meeting': weeklyLogs.filter(l => l.type.includes('Meeting')).length,
  };
  
  const completedTasks = userTasks.filter(t => t.status === 'Completed').length;
  const followUpRatio = completedTasks > 0 ? 65 : 0; // Mocked

  return (
    <div className="grid gap-4">
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard title={t('tasks.overdue')} value={overdueTasks} icon={Target} />
        <StatCard title={t('tasks.today')} value={todayTasks} icon={Target} />
        <StatCard title={t('tasks.thisWeek')} value={thisWeekTasks} icon={Target} />
      </div>
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{t('reports.myPipeline')}</CardTitle>
            <CardDescription>{t('reports.myPipelineDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="aspect-video h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                        <Tooltip />
                        <Funnel dataKey="value" data={pipelineData} isAnimationActive>
                           <LabelList position="right" fill="hsl(var(--foreground))" stroke="none" dataKey="name" />
                             {pipelineData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Funnel>
                    </FunnelChart>
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <div className="md:col-span-2 space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle>{t('reports.activities7Days')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-center">
                    <ActivityStat icon={Phone} label={t('reports.calls')} value={weeklyActivities.Call} />
                    <ActivityStat icon={Mail} label={t('reports.emails')} value={weeklyActivities.Email} />
                    <ActivityStat icon={Calendar} label={t('reports.meetings')} value={weeklyActivities.Meeting} />
                </CardContent>
             </Card>
             <StatCard title={t('reports.followUpRatio')} value={`${followUpRatio}%`} description={t('reports.followUpRatioDescription')} icon={Percent} />
        </div>
      </div>
    </div>
  );
}

// Leads Dashboard for Admins and Managers
function LeadsDashboard() {
    const { anchors, users, dealers, vendors, activityLogs, tasks, t, visibleUserIds } = useApp();
    const [period, setPeriod] = useState('this_month');
    const [productFilter, setProductFilter] = useState('all');

    const salesUsers = users.filter(u => u.role === 'Area Sales Manager' || u.role === 'Zonal Sales Manager');
    const allSpokes = useMemo(() => {
        return [...dealers, ...vendors].filter(spoke => visibleUserIds.includes(spoke.assignedTo || ''));
    }, [dealers, vendors, visibleUserIds]);
    
    const getFiscalYearStart = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return month >= 3 ? new Date(year, 3, 1) : new Date(year - 1, 3, 1);
    }
    
    const { periodSpokes, periodLogs, periodLabel } = useMemo(() => {
        const now = new Date();
        let interval: Interval;
        let label = t('reports.month');
        switch (period) {
            case 'this_quarter':
                interval = { start: startOfQuarter(now), end: endOfQuarter(now) };
                label = t('reports.quarter');
                break;
            case 'ytd':
                interval = { start: getFiscalYearStart(now), end: now };
                label = t('reports.ytd');
                break;
            case 'this_month':
            default:
                interval = { start: startOfMonth(now), end: endOfMonth(now) };
                break;
        }

        let filteredSpokes = allSpokes.filter(s => isWithinInterval(new Date(s.createdAt), interval));
        if (productFilter !== 'all') {
          filteredSpokes = filteredSpokes.filter(s => s.product === productFilter);
        }
        
        const periodActivityLogs = activityLogs.filter(l => visibleUserIds.includes(l.userId));

        return {
          periodSpokes: filteredSpokes,
          periodLogs: periodActivityLogs.filter(l => isWithinInterval(new Date(l.timestamp), interval)),
          periodLabel: label
        };
    }, [period, productFilter, allSpokes, activityLogs, t, visibleUserIds]);
    
    const pipelineStages: SpokeStatus[] = ['New', 'Onboarding', 'Partial Docs', 'Active', 'Disbursed'];
    const pipelineValueData = pipelineStages.map(stage => ({
        name: stage,
        value: periodSpokes
            .filter(s => s.status === stage && s.dealValue)
            .reduce((sum, s) => sum + (s.dealValue || 0), 0) / 100, // in Cr (value is in Lakhs)
    }));
    
    const activityCounts = salesUsers.filter(u => visibleUserIds.includes(u.uid))
        .map(user => ({
            name: user.name,
            activities: periodLogs.filter(log => log.userName === user.name).length
        }))
        .sort((a, b) => b.activities - a.activities)
        .slice(0, 5); // show top 5
        
    const getCount = (status: SpokeStatus) => periodSpokes.filter(s => s.status === status).length;
    const allLeadsCount = periodSpokes.length;
    const allOnboardingCount = getCount('Onboarding') + getCount('Partial Docs') + getCount('Active');
    const allActiveCount = getCount('Active');
    
    const newToOnboarding = allLeadsCount > 0 ? (allOnboardingCount / allLeadsCount) * 100 : 0;
    const onboardingToActive = allOnboardingCount > 0 ? (allActiveCount / allOnboardingCount) * 100 : 0;

    const activeAnchors = anchors.filter(a => a.status === 'Active');
    const totalSpokes = [...dealers, ...vendors].filter(s => activeAnchors.some(a => a.id === s.anchorId));
    const activeSpokes = totalSpokes.filter(s => s.status === 'Active');
    const spokeActivationRate = totalSpokes.length > 0 ? (activeSpokes.length / totalSpokes.length) * 100 : 0;

    return (
        <div className="grid gap-4">
        <AdminDataChat />
        <KeyHighlights period={periodLabel} anchors={anchors.filter(a => periodSpokes.some(s => s.anchorId === a.id))} activityLogs={periodLogs} users={salesUsers} />
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <CardTitle>{t('reports.pipelineValue', { period: periodLabel })}</CardTitle>
                    <CardDescription>{t('reports.pipelineValueDescription')}</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={productFilter} onValueChange={setProductFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by Product" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {products.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Tabs value={period} onValueChange={setPeriod} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="this_month">{t('reports.month')}</TabsTrigger>
                            <TabsTrigger value="this_quarter">{t('reports.quarter')}</TabsTrigger>
                            <TabsTrigger value="ytd">{t('reports.ytd')}</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={{ value: { label: "Value (Cr)" } }} className="h-[300px]">
                    <BarChart data={pipelineValueData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} unit=" Cr" />
                        <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent indicator="dot" />} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {pipelineValueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                        ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>{t('reports.activityLeaderboard', { period: '' })}</CardTitle>
                <CardDescription>Top performers for {periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                        {activityCounts.map((user, index) => (
                            <TableRow key={user.name}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                                        <div><p className="font-medium">{user.name}</p></div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="text-lg font-bold">{user.activities}</span>
                                    <span className="text-sm text-muted-foreground"> activities</span>
                                </TableCell>
                            </TableRow>
                        ))}
                        {activityCounts.length === 0 && <TableRow><TableCell colSpan={2} className="text-center h-24">No activity this period.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>
            </Card>
            <OverdueTasksByExecutive tasks={tasks.filter(t => visibleUserIds.includes(t.assignedTo))} users={users.filter(u => u.role !== 'Admin')} />
            <div className="lg:col-span-1 space-y-4">
                <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>{t('reports.stageConversionRates')}</CardTitle>
                    <CardDescription>{t('reports.stageConversionRatesDescription', { period: periodLabel })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                    <ConversionRateItem from="New" to="Onboarding" value={newToOnboarding} />
                    <ConversionRateItem from="Onboarding" to="Active" value={onboardingToActive} />
                </CardContent>
            </Card>
            <StatCard title={t('reports.spokeActivationRate')} value={`${spokeActivationRate.toFixed(1)}%`} description={t('reports.spokeActivationRateDescription')} icon={CheckCircle}/>
            </div>
        </div>
        </div>
    );
}


// New Helper Components
function OverdueTasksByExecutive({ tasks, users }: { tasks: Task[], users: UserType[] }) {
    const { t } = useApp();
    const overdueTasks = tasks.filter(t => 
        isPast(new Date(t.dueDate)) && 
        !isToday(new Date(t.dueDate)) && 
        t.status !== 'Completed'
    );

    const tasksByUser = useMemo(() => {
        return overdueTasks.reduce((acc, task) => {
            const userName = users.find(u => u.uid === task.assignedTo)?.name || 'Unknown User';
            if (!acc[userName]) {
                acc[userName] = [];
            }
            acc[userName].push(task);
            return acc;
        }, {} as Record<string, Task[]>);
    }, [overdueTasks, users]);

    const userEntries = Object.entries(tasksByUser);

    return (
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>{t('reports.overdueTasks')}</CardTitle>
                <CardDescription>{t('reports.overdueTasksDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                {userEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                        <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                        <p className="font-medium">{t('reports.noOverdueTasks')}</p>
                        <p className="text-sm text-muted-foreground">{t('reports.noOverdueTasksDescription')}</p>
                    </div>
                ) : (
                    <Accordion type="multiple" className="w-full">
                        {userEntries.map(([userName, userTasks]) => (
                            <AccordionItem value={userName} key={userName}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{userName}</span>
                                        <Badge variant="destructive">{userTasks.length} overdue</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-2 pl-4">
                                        {userTasks.map(task => (
                                            <li key={task.id} className="text-sm flex items-center gap-2">
                                                <FileText className="h-3 w-3 shrink-0" />
                                                <span>{task.title} (Due: {format(new Date(task.dueDate), 'MMM d')})</span>
                                            </li>
                                        ))}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    )
}

function KeyHighlights({ period, anchors, activityLogs, users }: { period: string, anchors: Anchor[], activityLogs: ActivityLog[], users: UserType[]}) {
    const { t } = useApp();
    const [highlights, setHighlights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHighlights = async () => {
            setIsLoading(true);
            setHighlights([]);

            try {
                const wonDeals = anchors.filter(a => a.status === 'Active');
                const totalDealValue = wonDeals.reduce((sum, a) => sum + (parseInt(a.annualTurnover || '0', 10) || 0), 0);
                const totalLeads = anchors.length;
                const totalActivities = activityLogs.length;

                const performerDeals = wonDeals.reduce((acc, deal) => {
                    const userName = users.find(u => u.uid === deal.createdBy)?.name || 'Unknown';
                    acc[userName] = (acc[userName] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const topPerformersByDeals = Object.entries(performerDeals)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a,b) => b.value - a.value)
                    .slice(0,3);

                const performerActivities = activityLogs.reduce((acc, log) => {
                    acc[log.userName] = (acc[log.userName] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const topPerformersByActivities = Object.entries(performerActivities)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a,b) => b.value - a.value)
                    .slice(0,3);

                const conversionRate = totalLeads > 0 ? (wonDeals.length / totalLeads) * 100 : 0;
                
                const input = {
                    period,
                    totalDealValue,
                    totalLeads,
                    totalActivities,
                    topPerformersByDeals,
                    topPerformersByActivities,
                    conversionRate,
                };
                
                const response = await generateHighlights(input);
                setHighlights(response.highlights);

            } catch (error) {
                console.error("Failed to generate highlights:", error);
                setHighlights(["AI analysis could not be completed for this period."]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHighlights();
    }, [period, anchors, activityLogs, users]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('reports.aiHighlights')}</CardTitle>
                <CardDescription>{t('reports.aiHighlightsDescription', { period: period })}</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {highlights.map((highlight, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
                                <span className="text-sm">{highlight}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}


// Helper Components
function StatCard({ title, value, icon: Icon, description, isPlaceholder }: { title: string; value: string | number; icon: React.ElementType; description?: string, isPlaceholder?: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {isPlaceholder && <Badge variant="outline" className="mt-2">Mock Data</Badge>}
      </CardContent>
    </Card>
  );
}

function ActivityStat({ icon: Icon, label, value }: { icon: React.ElementType, label: string; value: string | number }) {
  return (
    <div>
        <Icon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function ConversionRateItem({from, to, value}: {from: string, to: string, value: number}) {
    return (
        <div>
            <div className="flex justify-between items-center text-sm font-medium">
                <span>{from} <ArrowRight className="inline h-3 w-3 mx-1"/> {to}</span>
                <span className="font-bold">{value.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-1">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${value}%` }}></div>
            </div>
        </div>
    )
}
