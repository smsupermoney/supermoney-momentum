

'use client';

import { PageHeader } from '@/components/page-header';
import { useApp } from '@/contexts/app-context';
import { PipelineCard } from '@/components/dashboard/pipeline-card';
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card';
import { TasksCard } from '@/components/dashboard/tasks-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  BookCheck,
  Building,
  Users,
  Handshake,
  ListTodo,
  Shield,
  BarChart,
  LayoutDashboard,
  Mail,
  Loader2,
} from 'lucide-react';
import type { UserRole, Task } from '@/lib/types';
import { StaleLeadsCard } from '@/components/dashboard/stale-leads-card';
import { TeamProgressCard } from '@/components/dashboard/team-progress-card';
import { generateDailyDigest } from '@/ai/flows/generate-daily-digest-flow';
import { isPast, isToday } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SalesPipelineCard } from '@/components/reports/sales-pipeline-card';


function QuickNav() {
  const { currentUser, t } = useApp();

  if (!currentUser) return null;

  const allNavItems = [
    { href: '/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, roles: ['Admin', 'Area Sales Manager', 'Internal Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Executive', 'ETB Manager', 'Telecaller'] },
    { href: '/activities', labelKey: 'sidebar.activities', icon: BookCheck, roles: ['Admin', 'Area Sales Manager', 'Internal Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'ETB Executive', 'ETB Manager', 'Telecaller'] },
    { href: '/anchors', labelKey: 'sidebar.anchors', icon: Building, roles: ['Admin', 'Area Sales Manager', 'Internal Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Executive', 'ETB Manager'] },
    { href: '/dealers', labelKey: 'sidebar.dealers', icon: Handshake, roles: ['Admin', 'Area Sales Manager', 'Internal Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Executive', 'ETB Manager'] },
    { href: '/suppliers', labelKey: 'sidebar.vendors', icon: Users, roles: ['Admin', 'Area Sales Manager', 'Internal Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Executive', 'ETB Manager'] },
    { href: '/tasks', labelKey: 'sidebar.tasks', icon: ListTodo, roles: ['Admin', 'Area Sales Manager', 'Internal Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Executive', 'ETB Manager', 'Telecaller'] },
    { href: '/reports', labelKey: 'sidebar.reports', icon: BarChart, roles: ['Admin', 'Area Sales Manager', 'Internal Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Manager'] },
    { href: '/admin', labelKey: 'sidebar.admin', icon: Shield, roles: ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Manager'] },
  ];

  const visibleNavLinks = allNavItems.filter(link => link.roles.includes(currentUser.role as UserRole));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
      {visibleNavLinks.map(link => {
        const Icon = link.icon;
        let label = t(link.labelKey);
        return (
          <Button
            asChild
            key={link.href}
            variant="ghost"
            className="h-auto p-3 flex-col gap-1 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:bg-accent/50 active:translate-y-0 active:shadow-sm"
          >
            <Link href={link.href}>
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-center">{label}</span>
            </Link>
          </Button>
        );
      })}
    </div>
  );
}


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
        ).map(l => ({ id: l.id, name: l.name, type: 'contactNumber' in l ? 'Dealer' : 'Vendor', status: l.status}));


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
            <QuickNav />
            {renderDashboard()}
        </>
    );
}

// Sales Dashboard
function SalesDashboard() {
    return (
        <div className="grid gap-4">
            <div className="mb-6"><SalesPipelineCard /></div>
            <PipelineCard />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <RecentActivityCard className="lg:col-span-2" />
                <TasksCard />
            </div>
        </div>
    );
}

// Manager Dashboard (for ZSM, RSM, NSM)
function ManagerDashboard() {
    return (
        <div className="grid gap-4">
            <div className="mb-6"><SalesPipelineCard /></div>
            <TeamProgressCard />
            <StaleLeadsCard />
            <PipelineCard />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <RecentActivityCard className="lg:col-span-2" />
                <TasksCard />
            </div>
        </div>
    );
}


// Admin & BD Dashboard
function AdminDashboard() {
    return (
        <div className="grid gap-4">
            <div className="mb-6"><SalesPipelineCard /></div>
            <TeamProgressCard />
            <StaleLeadsCard />
            <PipelineCard />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <RecentActivityCard className="lg:col-span-2" />
                <TasksCard />
            </div>
        </div>
    );
}
