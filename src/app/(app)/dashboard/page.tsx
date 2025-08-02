

'use client';

import { PageHeader } from '@/components/page-header';
import { useApp } from '@/contexts/app-context';
import { PipelineCard } from '@/components/dashboard/pipeline-card';
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card';
import { TasksCard } from '@/components/dashboard/tasks-card';
import { StaleLeadsCard } from '@/components/dashboard/stale-leads-card';
import { TeamProgressCard } from '@/components/dashboard/team-progress-card';
import { generateDailyDigest } from '@/ai/flows/generate-daily-digest-flow';
import { isPast, isToday } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SalesPipelineCard } from '@/components/reports/sales-pipeline-card';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserRole } from '@/lib/types';
import { DocsApprovalQueue } from '@/components/dashboard/docs-approval-queue';


export default function DashboardPage() {
    const { currentUser, t, tasks, dealers, vendors, sendEmail } = useApp();
    const { toast } = useToast();
    const [isDigestLoading, setIsDigestLoading] = useState(false);

    const handleSendDigest = async () => {
      if (!currentUser) return;
      setIsDigestLoading(true);

      try {
        const userTasks = tasks.filter(t => t.assignedTo === currentUser.uid);
        const tasksDueToday = userTasks.filter(t => isToday(new Date(t.dueDate)) && t.status !== 'Completed');
        const overdueTasks = userTasks.filter(t => isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'Completed');

        const now = new Date();
        const yesterday = new Date(now.setDate(now.getDate() - 1));
        const newLeads = [...dealers, ...vendors].filter(lead => 
            lead.assignedTo === currentUser.uid &&
            new Date(lead.createdAt) > yesterday
        ).map(l => ({ id: l.id, name: l.name, type: 'contactNumbers' in l ? 'Dealer' : 'Vendor', status: l.status}));


        const digest = await generateDailyDigest({
            userName: currentUser.name,
            tasksDueToday: tasksDueToday.map(t => ({id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority})),
            overdueTasks: overdueTasks.map(t => ({id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority})),
            newLeads: newLeads,
        });

        await sendEmail({
            to: currentUser.email,
            type: 'DailyDigest',
            context: {
                subject: digest.subject,
                body: digest.body,
            }
        });
        
        toast({
            title: "Daily Digest Sent (Simulation)",
            description: "The summary email has been generated and logged.",
        });

      } catch (error) {
         console.error("Failed to generate or send daily digest:", error);
         toast({
            variant: "destructive",
            title: "Digest Failed",
            description: "Could not generate or send the daily digest email.",
         })
      } finally {
        setIsDigestLoading(false);
      }
    };

    if (!currentUser) return null;

    const renderDashboard = () => {
        switch (currentUser.role) {
            case 'Area Sales Manager':
            case 'Internal Sales':
            case 'ETB Executive':
            case 'Telecaller':
                return <SalesDashboard />;
            case 'Zonal Sales Manager':
            case 'Regional Sales Manager':
            case 'National Sales Manager':
            case 'ETB Manager':
                return <ManagerDashboard />;
            case 'Business Development':
            case 'Admin':
            case 'BIU':
                return <AdminDashboard />;
            default:
                return <p>No dashboard view available for this role.</p>;
        }
    };

    const getHeaderDescription = (role: string) => {
      switch (role) {
          case 'Area Sales Manager': 
          case 'Internal Sales':
            return t('dashboard.salesDescription');
          case 'Zonal Sales Manager': 
          case 'Regional Sales Manager':
          case 'National Sales Manager':
          case 'ETB Manager':
              return t('dashboard.managerDescription');
          case 'Business Development':
          case 'BIU':
          case 'Admin': return t('dashboard.adminDescription');
          default: return "";
      }
    }

    return (
        <>
            <PageHeader 
                title={t('dashboard.welcome', { name: currentUser.name.split(' ')[0] })} 
                description={getHeaderDescription(currentUser.role)}
            >
              {['Area Sales Manager', 'Internal Sales', 'ETB Executive', 'Telecaller'].includes(currentUser.role) && (
                <Button variant="outline" onClick={handleSendDigest} disabled={isDigestLoading}>
                  {isDigestLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send Daily Digest
                </Button>
              )}
            </PageHeader>
            <div className="space-y-6">
                {renderDashboard()}
            </div>
        </>
    );
}

// Sales Dashboard
function SalesDashboard() {
    return (
        <>
            <SalesPipelineCard />
            <PipelineCard />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <RecentActivityCard className="lg:col-span-2" />
                <TasksCard />
            </div>
        </>
    );
}

// Manager Dashboard (for ZSM, RSM, NSM)
function ManagerDashboard() {
    return (
        <>
            <SalesPipelineCard />
            <TeamProgressCard />
            <StaleLeadsCard />
            <PipelineCard />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <RecentActivityCard className="lg:col-span-2" />
                <TasksCard />
            </div>
        </>
    );
}


// Admin & BD Dashboard
function AdminDashboard() {
    return (
        <>
            <DocsApprovalQueue />
            <SalesPipelineCard />
            <TeamProgressCard />
            <StaleLeadsCard />
            <PipelineCard />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <RecentActivityCard className="lg:col-span-2" />
                <TasksCard />
            </div>
        </>
    );
}
