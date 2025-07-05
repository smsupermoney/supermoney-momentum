import { AnchorProfile } from "@/components/anchors/anchor-profile";
import { mockActivityLogs, mockAnchors, mockDealers, mockVendors, mockTasks, mockUsers } from "@/lib/mock-data";

// This is a server component to fetch data. In a real app, this would be an async function.
export default function AnchorProfilePage({ params }: { params: { id: string } }) {
  const anchor = mockAnchors.find((a) => a.id === params.id);
  
  if (!anchor) {
    return <div className="p-8 text-center">Anchor not found.</div>;
  }

  const dealers = mockDealers.filter(d => anchor.dealerIds.includes(d.id));
  const vendors = mockVendors.filter(s => anchor.vendorIds.includes(s.id));
  const activityLogs = mockActivityLogs.filter(log => log.anchorId === anchor.id);
  const tasks = mockTasks.filter(task => task.associatedWith.anchorId === anchor.id);


  return <AnchorProfile 
            anchor={anchor}
            dealers={dealers}
            vendors={vendors}
            activityLogs={activityLogs}
            tasks={tasks}
            users={mockUsers}
         />;
}
