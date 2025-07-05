'use client';

import { PageHeader } from '@/components/page-header';
import { PipelineCard } from '@/components/dashboard/pipeline-card';
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card';
import { TasksCard } from '@/components/dashboard/tasks-card';
import { useApp } from '@/contexts/app-context';

export default function DashboardPage() {
    const { currentUser } = useApp();
  return (
    <>
      <PageHeader title={`Welcome back, ${currentUser.name.split(' ')[0]}!`} description="Here's a snapshot of your sales activity." />
      <div className="grid gap-6">
        <PipelineCard />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RecentActivityCard className="lg:col-span-2" />
          <TasksCard />
        </div>
      </div>
    </>
  );
}
