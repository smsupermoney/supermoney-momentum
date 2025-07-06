
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
import { useLanguage } from '@/contexts/language-context';
import {
  BookCheck,
  Building,
  Users,
  Handshake,
  ListTodo,
  Shield,
  BarChart,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';


function QuickNav() {
  const { currentUser, t } = useApp();

  if (!currentUser) return null;

  const allNavLinks = [
    { href: '/activities', labelKey: 'sidebar.activities', icon: BookCheck, roles: ['Admin', 'Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'] },
    { href: '/anchors', labelKey: 'sidebar.anchors', icon: Building, roles: ['Admin', 'Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Onboarding Specialist'] },
    { href: '/dealers', labelKey: 'sidebar.dealers', icon: Handshake, roles: ['Admin', 'Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Onboarding Specialist'] },
    { href: '/suppliers', labelKey: 'sidebar.vendors', icon: Users, roles: ['Admin', 'Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Onboarding Specialist'] },
    { href: '/tasks', labelKey: 'sidebar.tasks', icon: ListTodo, roles: ['Admin', 'Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Onboarding Specialist'] },
    { href: '/reports', labelKey: 'sidebar.reports', icon: BarChart, roles: ['Admin', 'Sales', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'] },
    { href: '/admin', labelKey: 'sidebar.admin', icon: Shield, roles: ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Onboarding Specialist'] },
  ];

  const visibleNavLinks = allNavLinks.filter(link => link.roles.includes(currentUser.role as UserRole));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      {visibleNavLinks.map(link => {
        const Icon = link.icon;
        let label = t(link.labelKey);
        if (currentUser.role === 'Onboarding Specialist' && link.href === '/anchors') {
          label = t('sidebar.onboarding');
        }
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
    const { currentUser } = useApp();
    const { t } = useLanguage();

    const renderDashboard = () => {
        switch (currentUser.role) {
            case 'Sales':
                return <SalesDashboard />;
            case 'Zonal Sales Manager':
            case 'Regional Sales Manager':
            case 'National Sales Manager':
                return <ManagerDashboard />;
            case 'Onboarding Specialist':
                return <OnboardingDashboard />;
            case 'Admin':
                return <AdminDashboard />;
            default:
                return <p>No dashboard view available for this role.</p>;
        }
    };

    const getHeaderDescription = (role: string) => {
      switch (role) {
          case 'Sales': return t('dashboard.salesDescription');
          case 'Zonal Sales Manager': 
          case 'Regional Sales Manager':
          case 'National Sales Manager':
              return t('dashboard.managerDescription');
          case 'Onboarding Specialist': return t('dashboard.specialistDescription');
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
    // For managers, the existing components are filtered for their team's data.
    // This is handled within the components themselves based on currentUser's visibility tree.
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

// Onboarding Specialist Dashboard
function OnboardingDashboard() {
    const { anchors, dealers, vendors } = useApp();
    const { t } = useLanguage();
    const onboardingAnchors = anchors.filter(a => a.status === 'Onboarding');

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('dashboard.onboardingAnchors')}</CardTitle>
                <CardDescription>{t('dashboard.onboardingDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Desktop Table */}
                <div className="hidden rounded-lg border md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Anchor Name</TableHead>
                                <TableHead>Industry</TableHead>
                                <TableHead>Active/Total Dealers</TableHead>
                                <TableHead>Active/Total Vendors</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {onboardingAnchors.length > 0 ? onboardingAnchors.map(anchor => {
                                const anchorDealers = dealers.filter(d => d.anchorId === anchor.id);
                                const activeDealers = anchorDealers.filter(d => d.onboardingStatus === 'Active').length;
                                const anchorVendors = vendors.filter(s => s.anchorId === anchor.id);
                                const activeVendors = anchorVendors.filter(s => s.onboardingStatus === 'Active').length;
                                return (
                                    <TableRow key={anchor.id}>
                                        <TableCell className="font-medium">{anchor.name}</TableCell>
                                        <TableCell>{anchor.industry}</TableCell>
                                        <TableCell><Badge variant="secondary">{activeDealers}/{anchorDealers.length}</Badge></TableCell>
                                        <TableCell><Badge variant="secondary">{activeVendors}/{anchorVendors.length}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/anchors/${anchor.id}`}>View Details</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">No anchors are currently in onboarding.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 {/* Mobile Cards */}
                 <div className="space-y-4 md:hidden">
                    {onboardingAnchors.length > 0 ? onboardingAnchors.map(anchor => {
                        const anchorDealers = dealers.filter(d => d.anchorId === anchor.id);
                        const activeDealers = anchorDealers.filter(d => d.onboardingStatus === 'Active').length;
                        const anchorVendors = vendors.filter(s => s.anchorId === anchor.id);
                        const activeVendors = anchorVendors.filter(s => s.onboardingStatus === 'Active').length;
                        return (
                             <Card key={anchor.id} className="p-0">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-base">{anchor.name}</CardTitle>
                                    <CardDescription>{anchor.industry}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 p-4 pt-0">
                                     <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Dealers:</span>
                                        <Badge variant="secondary">{activeDealers}/{anchorDealers.length} Active</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Vendors:</span>
                                        <Badge variant="secondary">{activeVendors}/{anchorVendors.length} Active</Badge>
                                    </div>
                                    <Button variant="outline" size="sm" asChild className="w-full mt-2">
                                        <Link href={`/anchors/${anchor.id}`}>View Details</Link>
                                    </Button>
                                </CardContent>
                             </Card>
                        )
                    }) : (
                         <div className="h-24 flex items-center justify-center text-center text-muted-foreground">No anchors are currently in onboarding.</div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


// Admin Dashboard (can be more comprehensive, but for now re-uses sales components which show global data for admin)
function AdminDashboard() {
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
