
'use client';

import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Anchor } from '@/lib/types';
import { format } from 'date-fns';

export function ArchivedAnchorsTable() {
  const { anchors, updateAnchor, currentUser } = useApp();
  const { toast } = useToast();

  if (currentUser?.role !== 'Admin') {
    return null;
  }

  const archivedAnchors = anchors.filter(a => a.status === 'Archived');

  if (archivedAnchors.length === 0) {
    return null;
  }

  const handleReactivate = (anchor: Anchor) => {
    updateAnchor({ ...anchor, status: 'Active' });
    toast({ title: 'Anchor Reactivated', description: `${anchor.name} is now active.` });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archived Anchors</CardTitle>
        <CardDescription>View and reactivate anchors that have been previously archived.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="hidden rounded-lg border md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Archived At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedAnchors.map((anchor) => (
                <TableRow key={anchor.id}>
                  <TableCell className="font-medium">{anchor.name}</TableCell>
                  <TableCell>{anchor.industry}</TableCell>
                  <TableCell>{anchor.updatedAt ? format(new Date(anchor.updatedAt), 'PP') : 'N/A'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleReactivate(anchor)}>Reactivate</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
         <div className="space-y-4 md:hidden">
          {archivedAnchors.map((anchor) => (
            <Card key={anchor.id} className="p-0">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{anchor.name}</CardTitle>
                <CardDescription>{anchor.industry}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Archived At:</span>
                    <span className="font-medium">{anchor.updatedAt ? format(new Date(anchor.updatedAt), 'PP') : 'N/A'}</span>
                 </div>
                 <Button size="sm" variant="outline" onClick={() => handleReactivate(anchor)} className="w-full">Reactivate</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
