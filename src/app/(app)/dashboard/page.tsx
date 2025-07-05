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

export default function DashboardPage() {
    const { currentUser } = useApp();

    const renderDashboard = () => {
        switch (currentUser.role) {
            case 'Sales':
                return <SalesDashboard />;
            case 'Zonal Sales Manager':
                return <ZsmDashboard />;
            case 'Onboarding Specialist':
                return <OnboardingDashboard />;
            case 'Admin':
                return <AdminDashboard />;
            default:
                return <p>No dashboard view available for this role.</p>;
        }
    };

    return (
        <>
            <PageHeader 
                title={`Welcome back, ${currentUser.name.split(' ')[0]}!`} 
                description={getHeaderDescription(currentUser.role)}
            />
            {renderDashboard()}
        </>
    );
}

const getHeaderDescription = (role: string) => {
    switch (role) {
        case 'Sales': return "Here's a snapshot of your sales activity.";
        case 'Zonal Sales Manager': return "Here's a snapshot of your team's activity.";
        case 'Onboarding Specialist': return "Here are the anchors currently in onboarding.";
        case 'Admin': return "Here's a global overview of the company's sales data.";
        default: return "Welcome to the dashboard.";
    }
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

// Zonal Sales Manager Dashboard
function ZsmDashboard() {
    // For ZSM, the existing components will be filtered for their team's data
    // This is handled within the components themselves based on currentUser role
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
    const { anchors, dealers, suppliers } = useApp();
    const onboardingAnchors = anchors.filter(a => a.status === 'Onboarding');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Anchors in Onboarding</CardTitle>
                <CardDescription>Manage the onboarding process for these anchors and their spokes.</CardDescription>
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
                                <TableHead>Active/Total Suppliers</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {onboardingAnchors.length > 0 ? onboardingAnchors.map(anchor => {
                                const anchorDealers = dealers.filter(d => d.anchorId === anchor.id);
                                const activeDealers = anchorDealers.filter(d => d.onboardingStatus === 'Active').length;
                                const anchorSuppliers = suppliers.filter(s => s.anchorId === anchor.id);
                                const activeSuppliers = anchorSuppliers.filter(s => s.onboardingStatus === 'Active').length;
                                return (
                                    <TableRow key={anchor.id}>
                                        <TableCell className="font-medium">{anchor.name}</TableCell>
                                        <TableCell>{anchor.industry}</TableCell>
                                        <TableCell><Badge variant="secondary">{activeDealers}/{anchorDealers.length}</Badge></TableCell>
                                        <TableCell><Badge variant="secondary">{activeSuppliers}/{anchorSuppliers.length}</Badge></TableCell>
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
                        const anchorSuppliers = suppliers.filter(s => s.anchorId === anchor.id);
                        const activeSuppliers = anchorSuppliers.filter(s => s.onboardingStatus === 'Active').length;
                        return (
                             <Card key={anchor.id} className="p-0">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{anchor.name}</CardTitle>
                                    <CardDescription>{anchor.industry}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                     <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Dealers:</span>
                                        <Badge variant="secondary">{activeDealers}/{anchorDealers.length} Active</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Suppliers:</span>
                                        <Badge variant="secondary">{activeSuppliers}/{anchorSuppliers.length} Active</Badge>
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
