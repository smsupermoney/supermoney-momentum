

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
} from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { StaleLeadsCard } from '@/components/dashboard/stale-leads-card';
import { TeamProgressCard } from '@/components/dashboard/team-progress-card';


function QuickNav() {
  const { currentUser, t } = useApp();

  if (!currentUser) return null;

  const allNavLinks = [
    { href: '/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/activities', labelKey: 'sidebar.activities', icon: BookCheck, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'] },
    { href: '/anchors', labelKey: 'sidebar.anchors', icon: Building, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/dealers', labelKey: 'sidebar.dealers', icon: Handshake, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/suppliers', labelKey: 'sidebar.vendors', icon: Users, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/tasks', labelKey: 'sidebar.tasks', icon: ListTodo, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/reports', labelKey: 'sidebar.reports', icon: BarChart, roles: ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
    { href: '/admin', labelKey: 'sidebar.admin', icon: Shield, roles: ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] },
  ];

  const visibleNavLinks = allNavLinks.filter(link => link.roles.includes(currentUser.role as UserRole));

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
    const { currentUser, t } = useApp();

    if (!currentUser) return null;

    const renderDashboard = () => {
        switch (currentUser.role) {
            case 'Area Sales Manager':
                return <SalesDashboard />;
            case 'Zonal Sales Manager':
            case 'Regional Sales Manager':
            case 'National Sales Manager':
                return <ManagerDashboard />;
            case 'Business Development':
            case 'Admin':
                return <AdminDashboard />;
            default:
                return <p>No dashboard view available for this role.</p>;
        }
    };

    const getHeaderDescription = (role: string) => {
      switch (role) {
          case 'Area Sales Manager': return t('dashboard.salesDescription');
          case 'Zonal Sales Manager': 
          case 'Regional Sales Manager':
          case 'National Sales Manager':
              return t('dashboard.managerDescription');
          case 'Business Development':
          case 'Admin': return t('dashboard.adminDescription');
          default: return "";
      }
    }

    return (
        <>
            <PageHeader 
                title={t('dashboard.welcome', { name: currentUser.name.split(' ')[0] })} 
                description={getHeaderDescription(currentUser.role)}
            />
            <QuickNav />
            {renderDashboard()}
        </>
    );
}

// Sales Dashboard
function SalesDashboard() {
    return (
        <div className="grid gap-4">
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
            <StaleLeadsCard />
            <TeamProgressCard />
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
            <StaleLeadsCard />
            <TeamProgressCard />
            <PipelineCard />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <RecentActivityCard className="lg:col-span-2" />
                <TasksCard />
            </div>
        </div>
    );
}
