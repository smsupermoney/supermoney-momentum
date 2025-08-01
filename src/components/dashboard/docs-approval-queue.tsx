
'use client';

import { useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, FileCheck, User } from 'lucide-react';
import type { Dealer, Vendor } from '@/lib/types';
import Link from 'next/link';
import { Badge } from '../ui/badge';

type ApprovalLead = (Dealer | Vendor) & { type: 'Dealer' | 'Vendor' };

export function DocsApprovalQueue() {
    const { dealers, vendors, users, currentUser, updateDealer, updateVendor } = useApp();
    const { toast } = useToast();

    const leadsForApproval = useMemo(() => {
        const canApprove = currentUser && ['Business Development', 'BIU'].includes(currentUser.role);
        if (!canApprove) return [];

        const allLeads: ApprovalLead[] = [
            ...dealers.map(d => ({ ...d, type: 'Dealer' as const })),
            ...vendors.map(v => ({ ...v, type: 'Vendor' as const })),
        ];

        return allLeads.filter(lead => lead.status === 'Awaiting Docs Approval');
    }, [dealers, vendors, currentUser]);

    const handleApproval = (lead: ApprovalLead, isApproved: boolean) => {
        const updateFunction = lead.type === 'Dealer' ? updateDealer : updateVendor;
        const newStatus = isApproved ? 'Partial Docs' : 'Follow Up';

        updateFunction({ id: lead.id, status: newStatus });

        toast({
            title: `Lead ${isApproved ? 'Approved' : 'Rejected'}`,
            description: `${lead.name}'s status has been updated to '${newStatus}'.`,
        });
    };

    if (leadsForApproval.length === 0) {
        return null;
    }

    const getUserName = (userId: string | null) => {
        if (!userId) return 'Unassigned';
        return users.find(u => u.uid === userId)?.name || 'Unknown User';
    };
    
    const getLeadLink = (lead: ApprovalLead) => {
        return lead.type === 'Dealer' ? '/dealers' : '/suppliers';
    }

    return (
        <Card className="border-blue-500 bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                    <CardTitle className="text-blue-700 dark:text-blue-400">Documents Approval Queue</CardTitle>
                </div>
                <CardDescription className="text-blue-600 dark:text-blue-500">
                    Review and approve leads submitted with partial documents.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="rounded-lg border border-blue-200 dark:border-blue-800">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Lead Name</TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leadsForApproval.map(lead => (
                                <TableRow key={`${lead.type}-${lead.id}`}>
                                    <TableCell>
                                        <Link href={getLeadLink(lead)} className="font-medium text-primary hover:underline">{lead.name}</Link>
                                        <div className="text-xs text-muted-foreground">{lead.type}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-3 w-3" />
                                            <span>{getUserName(lead.assignedTo)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 border-green-400 hover:bg-green-100" onClick={() => handleApproval(lead, true)}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 border-red-400 hover:bg-red-100" onClick={() => handleApproval(lead, false)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
