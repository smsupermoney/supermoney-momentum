'use client';

import { useState, useRef } from 'react';
import type { Anchor, Dealer, Supplier, ActivityLog, Task, User, OnboardingStatus, TaskType, LeadStatus } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { NewLeadDialog } from '../leads/new-lead-dialog';
import { NewTaskDialog } from '../tasks/new-task-dialog';
import { useApp } from '@/contexts/app-context';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, Calendar, PenSquare, PlusCircle, User as UserIcon } from 'lucide-react';

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
  const { addActivityLog, updateAnchor, currentUser } = useApp();
  const { toast } = useToast();
  
  const [newActivity, setNewActivity] = useState('');
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [leadType, setLeadType] = useState<'Dealer' | 'Supplier'>('Dealer');
  const [activeTab, setActiveTab] = useState('details'); // For tab control
  const activityTextareaRef = useRef<HTMLTextAreaElement>(null); // For focusing textarea

  const isSalesRole = ['Admin', 'Sales', 'Zonal Sales Manager'].includes(currentUser.role);
  const primaryContact = anchor.contacts.find(c => c.isPrimary) || anchor.contacts[0];


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
    toast({ title: 'Interaction logged successfully.' });
  };
  
  const openNewLeadDialog = (type: 'Dealer' | 'Supplier') => {
      setLeadType(type);
      setIsNewLeadOpen(true);
  }

  const handleStatusChange = (newStatus: LeadStatus) => {
    updateAnchor({...anchor, status: newStatus});
    toast({ title: "Anchor Status Updated", description: `${anchor.name} is now in '${newStatus}' stage.`});
  }

  const handleLogInteractionClick = (contactName: string) => {
    setNewActivity(`Logged interaction with ${contactName}. `);
    setActiveTab('interactions'); // Switch to interactions tab
    setTimeout(() => {
      activityTextareaRef.current?.focus();
      activityTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100); // Timeout to allow tab to render before focus
  };

  return (
    <>
      <PageHeader title={anchor.name} description={anchor.industry}>
          <div className="flex items-center gap-2">
            {isSalesRole && (
              <Select onValueChange={(v) => handleStatusChange(v as LeadStatus)} defaultValue={anchor.status}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Onboarding">Onboarding</SelectItem>
                </SelectContent>
              </Select>
            )}
            {anchor.leadScore && (
                <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm">
                    <span className="font-medium text-secondary-foreground">AI Score:</span>
                    <span className="font-bold text-primary">{anchor.leadScore}/100</span>
                </div>
            )}
            <Button onClick={() => setIsNewTaskOpen(true)}>Add Task</Button>
          </div>
      </PageHeader>
      
      <NewLeadDialog type={leadType} open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen} anchorId={anchor.id} />
      <NewTaskDialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} prefilledAnchorId={anchor.id} />

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="dealers">Dealers ({initialDealers.length})</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers ({initialSuppliers.length})</TabsTrigger>
          <TabsTrigger value="interactions">Interactions ({initialLogs.length})</TabsTrigger>
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
                           {anchor.contacts.map(contact => (
                             <div key={contact.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium flex items-center gap-2">{contact.name} {contact.isPrimary && <Badge variant="outline">Primary</Badge>}</div>
                                        <p className="text-sm text-muted-foreground">{contact.designation} &bull; {contact.email} &bull; {contact.phone}</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleLogInteractionClick(contact.name)} className="w-full sm:w-auto">Log Interaction</Button>
                            </div>
                           ))}
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
                    {isSalesRole && <Button onClick={() => openNewLeadDialog('Dealer')}><PlusCircle className="h-4 w-4 mr-2" />Add New Dealer</Button>}
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
                    {isSalesRole && <Button onClick={() => openNewLeadDialog('Supplier')}><PlusCircle className="h-4 w-4 mr-2" />Add New Supplier</Button>}
                </div>
            </CardHeader>
            <CardContent>
                <SpokeTable spokes={initialSuppliers} type="Supplier" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="mt-4">
            <Card>
                <CardHeader><CardTitle>Interaction Log</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <Textarea 
                             ref={activityTextareaRef}
                             placeholder={`Log new interaction for ${anchor.name}...`} 
                             value={newActivity} 
                             onChange={(e) => setNewActivity(e.target.value)} 
                           />
                           <Button onClick={handleLogActivity}>Log Interaction</Button>
                        </div>
                        <Separator />
                        <div className="space-y-6">
                            {initialLogs.map(log => {
                                const Icon = iconMap[log.type] || PenSquare;
                                return (
                                <div key={log.id} className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary flex-shrink-0">
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
    const { currentUser, updateDealer, updateSupplier } = useApp();
    const isSpecialist = currentUser.role === 'Onboarding Specialist';

    const handleStatusChange = (spoke: Dealer | Supplier, newStatus: OnboardingStatus) => {
        if (type === 'Dealer') {
            updateDealer({...(spoke as Dealer), onboardingStatus: newStatus});
        } else {
            updateSupplier({...(spoke as Supplier), onboardingStatus: newStatus});
        }
    }

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
        <div>
            {/* Desktop Table View */}
            <div className="hidden rounded-lg border md:block">
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
                            <TableCell>
                                {isSpecialist ? (
                                    <Select onValueChange={(v) => handleStatusChange(spoke, v as OnboardingStatus)} defaultValue={spoke.onboardingStatus}>
                                        <SelectTrigger className="w-[180px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Invited">Invited</SelectItem>
                                            <SelectItem value="KYC Pending">KYC Pending</SelectItem>
                                            <SelectItem value="Not reachable">Not reachable</SelectItem>
                                            <SelectItem value="Agreement Pending">Agreement Pending</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Rejected">Rejected</SelectItem>
                                            <SelectItem value="Not Interested">Not Interested</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant={getStatusVariant(spoke.onboardingStatus)}>{spoke.onboardingStatus}</Badge>
                                )}
                            </TableCell>
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
            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
                {spokes.length > 0 ? spokes.map(spoke => (
                    <Card key={spoke.id}>
                        <CardContent className="p-4 space-y-3">
                            <div>
                                <p className="font-medium">{spoke.name}</p>
                                <p className="text-sm text-muted-foreground">{spoke.contactNumber}</p>
                            </div>
                            <div>
                                {isSpecialist ? (
                                    <Select onValueChange={(v) => handleStatusChange(spoke, v as OnboardingStatus)} defaultValue={spoke.onboardingStatus}>
                                        <SelectTrigger className="w-full h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Invited">Invited</SelectItem>
                                            <SelectItem value="KYC Pending">KYC Pending</SelectItem>
                                            <SelectItem value="Not reachable">Not reachable</SelectItem>
                                            <SelectItem value="Agreement Pending">Agreement Pending</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Rejected">Rejected</SelectItem>
                                            <SelectItem value="Not Interested">Not Interested</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant={getStatusVariant(spoke.onboardingStatus)}>{spoke.onboardingStatus}</Badge>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto">View Details</Button>
                        </CardContent>
                    </Card>
                )) : (
                     <div className="h-24 flex items-center justify-center text-center text-muted-foreground">No {type.toLowerCase()}s associated yet.</div>
                )}
            </div>
        </div>
    )
}
