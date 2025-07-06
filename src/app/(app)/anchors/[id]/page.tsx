'use client';

import { useApp } from "@/contexts/app-context";
import { AnchorProfile } from "@/components/anchors/anchor-profile";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function AnchorProfilePage({ params }: { params: { id: string } }) {
  const { anchors, dealers, vendors, activityLogs, tasks, users, isLoading } = useApp();
  
  const { id } = params;
  const anchor = anchors.find((a) => a.id === id);
  
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!anchor) {
    return (
        <>
            <PageHeader title="Anchor Not Found" />
            <div className="p-8 text-center text-muted-foreground">The requested anchor could not be found.</div>
        </>
    );
  }

  const anchorDealers = dealers.filter(d => anchor.dealerIds.includes(d.id));
  const anchorVendors = vendors.filter(v => anchor.vendorIds.includes(v.id));
  const anchorActivityLogs = activityLogs.filter(log => log.anchorId === anchor.id);
  const anchorTasks = tasks.filter(task => task.associatedWith.anchorId === anchor.id);

  return <AnchorProfile 
            anchor={anchor}
            dealers={anchorDealers}
            vendors={anchorVendors}
            activityLogs={anchorActivityLogs}
            tasks={anchorTasks}
            users={users}
         />;
}
