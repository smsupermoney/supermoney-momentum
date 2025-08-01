

'use client';

import { useApp } from "@/contexts/app-context";
import { useParams } from "next/navigation";
import { AnchorProfile } from "@/components/anchors/anchor-profile";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useLanguage } from "@/contexts/language-context";
import { useMemo } from "react";
import { getAllSubordinates } from "@/contexts/app-context";

export default function AnchorProfilePage() {
  const { anchors, dealers, vendors, activityLogs, tasks, users, isLoading, anchorSPOCs, currentUser } = useApp();
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

  const visibleSpocs = useMemo(() => {
    if (!currentUser) return [];

    const spocsForAnchor = anchorSPOCs.filter(spoc => spoc.anchorId === id);

    // Roles that see all SPOCs for the anchor
    const unrestrictedRoles = ['Admin', 'Business Development', 'BIU', 'National Sales Manager', 'Regional Sales Manager'];
    if (unrestrictedRoles.includes(currentUser.role)) {
      return spocsForAnchor;
    }
    
    const subordinates = getAllSubordinates(currentUser.uid, users);
    const visibleTeamIds = [currentUser.uid, ...subordinates.map(u => u.uid)];
    
    // ZSMs and ASMs see SPOCs if their region matches OR if they or their subordinates are explicitly granted access.
    return spocsForAnchor.filter(spoc => {
        const isExplicitlyVisible = spoc.visibleTo && spoc.visibleTo.some(uid => visibleTeamIds.includes(uid));
        if (isExplicitlyVisible) {
          return true;
        }

        // Fallback to region-based visibility if no explicit users are set
        if ((!spoc.visibleTo || spoc.visibleTo.length === 0) && currentUser.region) {
          return spoc.territories.some(t => t.region === currentUser.region);
        }

        return false;
    });

  }, [currentUser, users, anchorSPOCs, id]);


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

  return <AnchorProfile 
            anchor={anchor}
            leads={combinedLeads}
            activityLogs={anchorActivityLogs}
            tasks={anchorTasks}
            users={users}
            spocs={visibleSpocs}
         />;
}
