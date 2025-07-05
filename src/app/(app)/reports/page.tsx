'use client';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, FunnelChart, Funnel, LabelList, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { isAfter, isBefore, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { Activity, Target, CheckCircle, Percent, ArrowRight, User, Star } from 'lucide-react';
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
  ];

  // Weekly Activity Data
  const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));
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
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Pipeline</CardTitle>
            <CardDescription>A funnel view of your assigned leads.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="aspect-video h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                        <Tooltip />
                        <Funnel dataKey="value" data={pipelineData} isAnimationActive>
                           <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                        </Funnel>
                    </FunnelChart>
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Activities Logged (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                     <StatCardMini title="Calls" value={weeklyActivities.Call} />
                     <StatCardMini title="Emails" value={weeklyActivities.Email} />
                     <StatCardMini title="Meetings" value={weeklyActivities.Meeting} />
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
        .sort((a, b) => b.activities - a.activities);
        
    // Conversion Rates
    const getCount = (status: string) => anchors.filter(a => a.status === status).length;
    const leadToContact = (getCount('Initial Contact') + getCount('Proposal') + getCount('Negotiation') + getCount('Active')) / (getCount('Lead') + getCount('Initial Contact') + getCount('Proposal') + getCount('Negotiation') + getCount('Active')) * 100;
    const contactToProposal = (getCount('Proposal') + getCount('Negotiation') + getCount('Active')) / (getCount('Initial Contact') + getCount('Proposal') + getCount('Negotiation') + getCount('Active')) * 100;
    const proposalToWon = (getCount('Active')) / (getCount('Proposal') + getCount('Negotiation') + getCount('Active')) * 100;

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
              <ChartContainer config={{ value: { label: "Value (Cr)" } }} className="h-[250px]">
                  <BarChart data={pipelineValueData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={4}>
                        {pipelineValueData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                        ))}
                      </Bar>
                  </BarChart>
              </ChartContainer>
          </CardContent>
      </Card>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Activity Leaderboard</CardTitle></CardHeader>
          <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Sales Executive</TableHead><TableHead className="text-right">Activities</TableHead></TableRow></TableHeader>
                <TableBody>
                    {activityCounts.map((user, index) => (
                        <TableRow key={user.name}>
                            <TableCell className="font-medium flex items-center gap-2">
                                {index < 3 && <Star className={`w-4 h-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-700'}`} />}
                                {user.name}
                            </TableCell>
                            <TableCell className="text-right font-bold">{user.activities}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Conversion Rates</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <ConversionRateItem from="Lead" to="Contact" value={leadToContact} />
                    <ConversionRateItem from="Contact" to="Proposal" value={contactToProposal} />
                    <ConversionRateItem from="Proposal" to="Won" value={proposalToWon} />
                </CardContent>
            </Card>
            <div className="space-y-6">
                <StatCard title="Spoke Activation Rate" value={`${spokeActivationRate.toFixed(1)}%`} description="Of invited spokes on active anchors." icon={CheckCircle}/>
                <StatCard title="Lead Velocity" value="12 Days" description="Avg. time from Lead to Proposal." icon={ArrowRight} isPlaceholder/>
            </div>
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

function StatCardMini({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="text-center">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
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
            <div className="w-full bg-secondary rounded-full h-2.5 mt-1">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${value}%` }}></div>
            </div>
        </div>
    )
}
