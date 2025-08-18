
'use client';
import { PageHeader } from '@/components/page-header';
import { TargetVsAchievementCard } from '@/components/reports/target-vs-achievement-card';

export default function TargetsPage() {
    return (
        <>
            <PageHeader
                title="Target vs Achievement"
                description="Review monthly performance data against set targets."
            />
            <div className="mt-6">
                <TargetVsAchievementCard />
            </div>
        </>
    );
}
