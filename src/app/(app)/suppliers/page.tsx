'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { NewLeadDialog } from '@/components/leads/new-lead-dialog';
import { BulkUploadDialog } from '@/components/leads/bulk-upload-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Upload } from 'lucide-react';
import type { Supplier, OnboardingStatus } from '@/lib/types';
import { SupplierDetailsDialog } from '@/components/suppliers/supplier-details-dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';


export default function SuppliersPage() {
  const { suppliers, anchors, users, currentUser } = useApp();
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const userSuppliers = suppliers.filter(s => {
    if (currentUser.role === 'Admin' || currentUser.role === 'Onboarding Specialist') return true;
    if (currentUser.role === 'Zonal Sales Manager') {
        const teamMemberIds = users.filter(u => u.managerId === currentUser.uid).map(u => u.uid);
        teamMemberIds.push(currentUser.uid);
        return teamMemberIds.includes(s.assignedTo || '');
    }
    return s.assignedTo === currentUser.uid;
  });


  const getAnchorName = (anchorId: string | null) => {
    if (!anchorId) return 'N/A';
    return anchors.find(a => a.id === anchorId)?.name || 'Unknown';
  };

  const getAssignedToName = (userId: string | null) => {
    if (!userId) return 'Unassigned';
    return users.find(u => u.uid === userId)?.name || 'Unknown';
  };

  const getStatusVariant = (status: OnboardingStatus): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
        case 'Active':
            return 'default';
        case 'Rejected':
        case 'Not Interested':
        case 'Inactive':
            return 'destructive';
        case 'Unassigned Lead':
            return 'outline';
        case 'Invited':
        case 'KYC Pending':
        case 'Not reachable':
        case 'Agreement Pending':
            return 'secondary';
        default:
            return 'outline';
    }
  };

  return (
    <>
      <PageHeader title="Suppliers" description="Manage all supplier relationships.">
        <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
        <Button onClick={() => setIsNewLeadOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Supplier Lead
        </Button>
      </PageHeader>
      
      <NewLeadDialog type="Supplier" open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen} />
      <BulkUploadDialog type="Supplier" open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen} />
      {selectedSupplier && (
        <SupplierDetailsDialog
            supplier={selectedSupplier}
            open={!!selectedSupplier}
            onOpenChange={(open) => { if(!open) setSelectedSupplier(null); }}
        />
      )}


      {/* Desktop Table View */}
      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden lg:table-cell">Contact Number</TableHead>
              <TableHead className="hidden lg:table-cell">Location</TableHead>
              <TableHead>Onboarding Status</TableHead>
              <TableHead>Associated Anchor</TableHead>
              <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userSuppliers.length > 0 ? userSuppliers.map(supplier => (
              <TableRow key={supplier.id} onClick={() => setSelectedSupplier(supplier)} className="cursor-pointer">
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell className="hidden lg:table-cell">{supplier.contactNumber}</TableCell>
                <TableCell className="hidden lg:table-cell">{supplier.location || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(supplier.onboardingStatus)}>{supplier.onboardingStatus}</Badge>
                </TableCell>
                <TableCell>{getAnchorName(supplier.anchorId)}</TableCell>
                <TableCell className="hidden lg:table-cell">{getAssignedToName(supplier.assignedTo)}</TableCell>
                <TableCell className="text-right">
                    <Button size="sm" asChild onClick={(e) => e.stopPropagation()}>
                        <Link href="https://supermoney.in/onboarding" target="_blank">
                            Start Onboarding
                        </Link>
                    </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No suppliers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="grid gap-4 md:hidden">
          {userSuppliers.length > 0 ? userSuppliers.map(supplier => (
              <Card key={supplier.id} onClick={() => setSelectedSupplier(supplier)} className="cursor-pointer">
                  <CardHeader>
                      <CardTitle>{supplier.name}</CardTitle>
                      <CardDescription>{getAnchorName(supplier.anchorId)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Badge variant={getStatusVariant(supplier.onboardingStatus)}>{supplier.onboardingStatus}</Badge>
                      <p className="text-sm text-muted-foreground mt-2">{supplier.contactNumber}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                       <Button size="sm" asChild onClick={(e) => e.stopPropagation()}>
                            <Link href="https://supermoney.in/onboarding" target="_blank">
                                Start Onboarding
                            </Link>
                        </Button>
                  </CardFooter>
              </Card>
          )) : (
              <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
                  No suppliers found.
              </div>
          )}
      </div>
    </>
  );
}
