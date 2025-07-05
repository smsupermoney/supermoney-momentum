'use client';

import { useState } from 'react';
import type { Anchor, Dealer, Supplier, ActivityLog, Task, User, OnboardingStatus, TaskType } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { NewLeadDialog } from '../leads/new-lead-dialog';
import { useApp } from '@/contexts/app-context';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, Calendar, PenSquare, PlusCircle } from 'lucide-react';

const iconMap: Record<TaskType, React.ElementType> = {
    'Call': Phone,
    'Email': Mail,
    'Meeting (Online)': Calendar,
    'Meeting (In-person)': Calendar,
    'KYC Document Collection': PenSquare,
    'Proposal Preparation': PenSquare,
    'Internal Review': PenSquare,
};

interface AnchorProfileProps {
  anchor: Anchor;
  dealers: Dealer[];
  suppliers: Supplier[];
  activityLogs: ActivityLog[];
  tasks: Task[];
  users: User[];
}

export function AnchorProfile({ anchor, dealers: initialDealers, suppliers: initialSuppliers, activityLogs: initialLogs }: AnchorProfileProps) {
  const { addActivityLog, addDealer, addSupplier, currentUser } = useApp();
  const { toast } = useToast();
  
  const [newActivity, setNewActivity] = useState('');
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [leadType, setLeadType] = useState<'Dealer' | 'Supplier'>('Dealer');

  const handleLogActivity = () => {
    if (newActivity.trim() === '') return;
    const log: ActivityLog = {
      id: `log-${Date.now()}`,
      anchorId: anchor.id,
      timestamp: new Date().toISOString(),
      type: 'Call', // Defaulting for manual entry, could be a dropdown
      title: 'Manual Log Entry',
      outcome: newActivity,
      userName: currentUser.name,
    };
    addActivityLog(log);
    setNewActivity('');
    toast({ title: 'Activity logged successfully.' });
  };
  
  const openNewLeadDialog = (type: 'Dealer' | 'Supplier') => {
      setLeadType(type);
      setIsNewLeadOpen(true);
  }

  return (
    <>
      <PageHeader title={anchor.name} description={anchor.industry}>
          <div className="flex items-center gap-2">
            {anchor.leadScore && (
                <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm">
                    <span className="font-medium text-secondary-foreground">AI Score:</span>
                    <span className="font-bold text-primary">{anchor.leadScore}/100</span>
                </div>
            )}
            <Button variant="outline">Initiate Credit Check</Button>
            <Button>Add Task</Button>
          </div>
      </PageHeader>
      
      <NewLeadDialog type={leadType} open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen} anchorId={anchor.id} />

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="dealers">Dealers ({initialDealers.length})</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers ({initialSuppliers.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({initialLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div><p className="text-muted-foreground">GSTIN</p><p>{anchor.gstin || 'N/A'}</p></div>
                        <div><p className="text-muted-foreground">Credit Rating</p><p>{anchor.creditRating || 'N/A'}</p></div>
                        <div><p className="text-muted-foreground">Annual Turnover</p><p>{anchor.annualTurnover ? `₹ ${anchor.annualTurnover.toLocaleString('en-IN')}` : 'N/A'}</p></div>
                        <div><p className="text-muted-foreground">Address</p><p>{anchor.address || 'N/A'}</p></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Key Contacts</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{anchor.primaryContactName}</p>
                                    <p className="text-sm text-muted-foreground">{anchor.email} &bull; {anchor.contactNumber}</p>
                                </div>
                                <Button variant="outline" size="sm">Log Interaction</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {anchor.leadScoreReason && 
                <Card className="bg-secondary">
                    <CardHeader>
                        <CardTitle>AI Scoring Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-secondary-foreground italic">"{anchor.leadScoreReason}"</p>
                    </CardContent>
                </Card>
            }
          </div>
        </TabsContent>

        <TabsContent value="dealers" className="mt-4">
          <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Associated Dealers</CardTitle>
                    <Button onClick={() => openNewLeadDialog('Dealer')}><PlusCircle className="h-4 w-4 mr-2" />Add New Dealer</Button>
                </div>
            </CardHeader>
            <CardContent>
                <SpokeTable spokes={initialDealers} type="Dealer" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <Card>
             <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Associated Suppliers</CardTitle>
                    <Button onClick={() => openNewLeadDialog('Supplier')}><PlusCircle className="h-4 w-4 mr-2" />Add New Supplier</Button>
                </div>
            </CardHeader>
            <CardContent>
                <SpokeTable spokes={initialSuppliers} type="Supplier" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
            <Card>
                <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <Textarea placeholder={`Log new activity for ${anchor.name}...`} value={newActivity} onChange={(e) => setNewActivity(e.target.value)} />
                           <Button onClick={handleLogActivity}>Log New Activity</Button>
                        </div>
                        <Separator />
                        <div className="space-y-6">
                            {initialLogs.map(log => {
                                const Icon = iconMap[log.type] || PenSquare;
                                return (
                                <div key={log.id} className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                                        <Icon className="h-5 w-5 text-secondary-foreground" />
                                    </div>
                                    <div>
                                    <p className="font-medium">{log.title} <span className="text-sm text-muted-foreground">by {log.userName}</span></p>
                                    <p className="text-sm">{log.outcome}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(log.timestamp), 'PPpp')}</p>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </>
  );
}

function SpokeTable({ spokes, type }: { spokes: Array<Dealer | Supplier>; type: 'Dealer' | 'Supplier' }) {
    const getStatusVariant = (status: OnboardingStatus) => {
        if (status === 'Active') return 'default';
        if (status === 'KYC Pending') return 'secondary';
        return 'outline';
    };
    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{type} Name</TableHead>
                        <TableHead>Contact Number</TableHead>
                        <TableHead>Onboarding Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {spokes.length > 0 ? spokes.map(spoke => (
                    <TableRow key={spoke.id}>
                        <TableCell className="font-medium">{spoke.name}</TableCell>
                        <TableCell>{spoke.contactNumber}</TableCell>
                        <TableCell><Badge variant={getStatusVariant(spoke.onboardingStatus)}>{spoke.onboardingStatus}</Badge></TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm">View Details</Button>
                        </TableCell>
                    </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">No {type.toLowerCase()}s associated yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
