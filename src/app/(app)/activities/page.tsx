
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { NewActivityDialog } from '@/components/activities/new-activity-dialog';
import { ActivityList } from '@/components/activities/activity-list';

export default function ActivitiesPage() {
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Daily Activity Log"
        description="Log and review your daily sales activities."
      >
        <Button onClick={() => setIsNewActivityOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Log New Activity
        </Button>
      </PageHeader>

      <NewActivityDialog open={isNewActivityOpen} onOpenChange={setIsNewActivityOpen} />
      
      <div className="mt-6">
        <ActivityList />
      </div>
    </>
  );
}
