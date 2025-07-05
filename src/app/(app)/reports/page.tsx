'use client';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, FunnelChart, Funnel, LabelList, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { isAfter, isBefore, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { Activity, Target, CheckCircle, Percent, ArrowRight, Mail, Phone, Calendar } from 'lucide-react';
import type { Anchor, Task, ActivityLog } from '@/lib/types';


// Main Page Component
export default function ReportsPage() {
  const { currentUser } = useApp();
  const pageTitle = currentUser.role === 'Admin' ? 'Management Reports' : 'My Performance Report';
  const pageDescription = currentUser.role === 'Admin' ? 'Analytics for team performance and pipeline health.' : 'A summary of your sales activities and pipeline.';

  return (
    <>
      <PageHeader title={pageTitle} description={pageDescription} />
      {currentUser.role === 'Admin' ? <AdminReports /> : <SalesReports />}
    </>
  );
}

// Reports for Sales Role
function SalesReports() {
  const { currentUser, tasks, anchors, activityLogs } = useApp();
  const userTasks = tasks.filter(t => t.assignedTo === currentUser.uid);
  const userAnchors = anchors.filter(a => a.assignedTo === currentUser.uid);
  const userLogs = activityLogs.filter(l => l.userName === currentUser.name);

  // Task Summary Calculation
  const today = new Date();
  const overdueTasks = userTasks.filter(t => isBefore(new Date(t.dueDate), today) && t.status !== 'Completed').length;
  const todayTasks = userTasks.filter(t => isToday(new Date(t.dueDate)) && t.status !== 'Completed').length;
  const thisWeekTasks = userTasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return isAfter(dueDate, startOfWeek(today)) && isBefore(dueDate, endOfWeek(today)) && t.status !== 'Completed';
  }).length;

  // Pipeline Funnel Data
  const pipelineData = [
    { name: 'Lead', value: userAnchors.filter(a => a.status === 'Lead').length, fill: 'hsl(var(--chart-1))' },
    { name: 'Initial Contact', value: userAnchors.filter(a => a.status === 'Initial Contact').length, fill: 'hsl(var(--chart-2))' },
    { name: 'Proposal', value: userAnchors.filter(a => a.status === 'Proposal').length, fill: 'hsl(var(--chart-3))' },
    { name: 'Negotiation', value: userAnchors.filter(a => a.status === 'Negotiation').length, fill: 'hsl(var(--chart-4))' },
  ].filter(d => d.value > 0);

  // Weekly Activity Data
  const sevenDaysAgo = new Date(new Date().setDate(today.getDate() - 7));
  const weeklyLogs = userLogs.filter(l => new Date(l.timestamp) > sevenDaysAgo);
  const weeklyActivities = {
    'Call': weeklyLogs.filter(l => l.type === 'Call').length,
    'Email': weeklyLogs.filter(l => l.type === 'Email').length,
    'Meeting': weeklyLogs.filter(l => l.type.includes('Meeting')).length,
  };
  
  // Follow-up Ratio (mocked)
  const completedTasks = userTasks.filter(t => t.status === 'Completed').length;
  const followUpRatio = completedTasks > 0 ? 65 : 0; // Static mock value

  return (
    <div className="grid gap-6">
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard title="Overdue Tasks" value={overdueTasks} icon={Target} />
        <StatCard title="Tasks For Today" value={todayTasks} icon={Target} />
        <StatCard title="Tasks This Week" value={thisWeekTasks} icon={Target} />
      </div>
      <div className="grid md:grid-cols-5 gap-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>My Pipeline</CardTitle>
            <CardDescription>A funnel view of your assigned leads.</CardDescription>
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
        <div className="md:col-span-2 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Activities Logged (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 text-center">
                    <ActivityStat icon={Phone} label="Calls" value={weeklyActivities.Call} />
                    <ActivityStat icon={Mail} label="Emails" value={weeklyActivities.Email} />
                    <ActivityStat icon={Calendar} label="Meetings" value={weeklyActivities.Meeting} />
                </CardContent>
             </Card>
             <StatCard title="Follow-up Ratio" value={`${followUpRatio}%`} description="Of completed tasks resulting in a follow-up." icon={Percent} />
        </div>
      </div>
    </div>
  );
}

// Reports for Admin Role
function AdminReports() {
    const { anchors, users, dealers, suppliers, activityLogs } = useApp();

    // Team Pipeline Value
    const pipelineStages = ['Lead', 'Initial Contact', 'Proposal', 'Negotiation', 'Active'];
    const pipelineValueData = pipelineStages.map(stage => ({
        name: stage,
        value: anchors
            .filter(a => a.status === stage && a.annualTurnover)
            .reduce((sum, a) => sum + (a.annualTurnover || 0), 0) / 10000000, // in Cr
    }));
    
    // Activity Leaderboard
    const activityCounts = users
        .filter(u => u.role === 'Sales')
        .map(user => ({
            name: user.name,
            activities: activityLogs.filter(log => log.userName === user.name).length
        }))
        .sort((a, b) => b.activities - a.activities)
        .slice(0, 5); // show top 5
        
    // Conversion Rates
    const getCount = (status: string) => anchors.filter(a => a.status === status).length;
    const allLeadsCount = getCount('Lead') + getCount('Initial Contact') + getCount('Proposal') + getCount('Negotiation') + getCount('Active');
    const allContactsCount = getCount('Initial Contact') + getCount('Proposal') + getCount('Negotiation') + getCount('Active');
    const allProposalsCount = getCount('Proposal') + getCount('Negotiation') + getCount('Active');
    
    const leadToContact = allLeadsCount > 0 ? (allContactsCount / allLeadsCount) * 100 : 0;
    const contactToProposal = allContactsCount > 0 ? (allProposalsCount / allContactsCount) * 100 : 0;
    const proposalToWon = allProposalsCount > 0 ? (getCount('Active') / allProposalsCount) * 100 : 0;


    // Spoke Activation Rate
    const activeAnchors = anchors.filter(a => a.status === 'Active');
    const totalSpokes = [...dealers, ...suppliers].filter(s => activeAnchors.some(a => a.id === s.anchorId));
    const activeSpokes = totalSpokes.filter(s => s.onboardingStatus === 'Active');
    const spokeActivationRate = totalSpokes.length > 0 ? (activeSpokes.length / totalSpokes.length) * 100 : 0;

  return (
    <div className="grid gap-6">
      <Card>
          <CardHeader>
              <CardTitle>Team Pipeline Value (by Stage)</CardTitle>
              <CardDescription>Estimated total value of deals (in ₹ Cr) in each stage.</CardDescription>
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
              <CardTitle>Activity Leaderboard</CardTitle>
              <CardDescription>Top performers this week</CardDescription>
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
                </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Stage Conversion Rates</CardTitle>
                <CardDescription>From one stage to the next</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                <ConversionRateItem from="Lead" to="Contact" value={leadToContact} />
                <ConversionRateItem from="Contact" to="Proposal" value={contactToProposal} />
                <ConversionRateItem from="Proposal" to="Won" value={proposalToWon} />
            </CardContent>
        </Card>
        <div className="lg:col-span-1 space-y-6">
            <StatCard title="Spoke Activation Rate" value={`${spokeActivationRate.toFixed(1)}%`} description="Of invited spokes on active anchors." icon={CheckCircle}/>
            <StatCard title="Lead Velocity" value="12 Days" description="Avg. time from Lead to Proposal." icon={ArrowRight} isPlaceholder/>
        </div>
      </div>
    </div>
  );
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
