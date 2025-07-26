
'use client';

import { useApp } from "@/contexts/app-context";
import { useParams } from "next/navigation";
import { AnchorProfile } from "@/components/anchors/anchor-profile";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/contexts/language-context";
import { useMemo } from "react";

export default function AnchorProfilePage() {
  const { anchors, dealers, vendors, activityLogs, tasks, users, isLoading, anchorSPOCs } = useApp();
  const params = useParams();
  const id = params.id as string;
  const { t } = useLanguage();
  
  const anchor = anchors.find((a) => a.id === id);
  
  const combinedLeads = useMemo(() => {
    if (!anchor) return [];
    
    // An anchor's leads are identified by their 'anchorId' field, not by IDs in the anchor object.
    const anchorDealers = dealers
      .filter(d => d.anchorId === anchor.id)
      .map(d => ({ ...d, type: 'Dealer' as const }));
      
    const anchorVendors = vendors
      .filter(v => v.anchorId === anchor.id)
      .map(v => ({ ...v, type: 'Vendor' as const }));

    return [...anchorDealers, ...anchorVendors].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [anchor, dealers, vendors]);


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
            <PageHeader title={t('anchors.notFound')} />
            <div className="p-8 text-center text-muted-foreground">{t('anchors.notFoundDescription')}</div>
        </>
    );
  }

  const anchorActivityLogs = activityLogs.filter(log => log.anchorId === anchor.id);
  const anchorTasks = tasks.filter(task => task.associatedWith.anchorId === anchor.id);
  const spocsForAnchor = anchorSPOCs.filter(spoc => spoc.anchorId === anchor.id);


  return <AnchorProfile 
            anchor={anchor}
            leads={combinedLeads}
            activityLogs={anchorActivityLogs}
            tasks={anchorTasks}
            users={users}
            spocs={spocsForAnchor}
         />;
}
