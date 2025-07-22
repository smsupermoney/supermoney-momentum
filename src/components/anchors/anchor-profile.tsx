

'use client';

import { useState, useRef } from 'react';
import type { Anchor, Dealer, Vendor, ActivityLog, Task, User, SpokeStatus, TaskType, LeadStatus, Contact } from '@/lib/types';
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
import { Mail, Phone, Calendar, PenSquare, PlusCircle, User as UserIcon, History, MessageSquare, CheckCircle } from 'lucide-react';
import { ComposeEmailDialog } from '../email/compose-email-dialog';
import { DealerDetailsDialog } from '../dealers/dealer-details-dialog';
import { VendorDetailsDialog } from '../suppliers/supplier-details-dialog';
import { useLanguage } from '@/contexts/language-context';
import { NewContactDialog } from './new-contact-dialog';
import { cn } from '@/lib/utils';
import { spokeStatuses } from '@/lib/types';

const activityIconMap: Record<string, React.ElementType> = {
    'Call': Phone,
    'Email': Mail,
    'Meeting (Online)': Calendar,
    'Meeting (In-person)': Calendar,
    'KYC Document Collection': PenSquare,
    'Proposal Preparation': PenSquare,
    'Internal Review': PenSquare,
    'Status Change': History,
    'Creation': PlusCircle,
    'Assignment': CheckCircle,
    'Note': MessageSquare,
    'Deletion': PenSquare,
};


interface AnchorProfileProps {
  anchor: Anchor;
  dealers: Dealer[];
  vendors: Vendor[];
  activityLogs: ActivityLog[];
  tasks: Task[];
  users: User[];
}

export function AnchorProfile({ anchor, dealers: initialDealers, vendors: initialVendors, activityLogs: initialLogs }: AnchorProfileProps) {
  const { addActivityLog, updateAnchor, updateDealer, updateVendor, currentUser } = useApp();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [newActivity, setNewActivity] = useState('');
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [leadType, setLeadType] = useState<'Dealer' | 'Vendor'>('Dealer');
  const [activeTab, setActiveTab] = useState('details'); 
  const activityTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ recipientEmail: string, entity: { id: string; name: string; type: 'anchor' } } | null>(null);

  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);


  const isSalesRole = currentUser && ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser.role);
  const canAddContact = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Business Development');


  const handleLogActivity = () => {
    if (newActivity.trim() === '' || !currentUser) return;
    const log: Omit<ActivityLog, 'id'> = {
      anchorId: anchor.id,
      timestamp: new Date().toISOString(),
      type: 'Note',
      title: 'Note Added',
      outcome: newActivity,
      userName: currentUser.name,
      userId: currentUser.uid,
      systemGenerated: false,
    };
    addActivityLog(log);
    setNewActivity('');
    toast({ title: 'Interaction logged successfully.' });
  };
  
  const openNewLeadDialog = (type: 'Dealer' | 'Vendor') => {
      setLeadType(type);
      setIsNewLeadOpen(true);
  }

  const handleStatusChange = (newStatus: LeadStatus) => {
    updateAnchor({...anchor, status: newStatus});
    toast({ title: "Anchor Status Updated", description: `${anchor.name} is now in '${newStatus}' stage.`});
  }

  const handleLogInteractionClick = (contactName: string) => {
    setNewActivity(`Logged interaction with ${contactName}. `);
    setActiveTab('interactions'); 
    setTimeout(() => {
      activityTextareaRef.current?.focus();
      activityTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100); 
  };
  
  const handleEmailClick = (contact: Contact) => {
    setEmailConfig({
        recipientEmail: contact.email,
        entity: { id: anchor.id, name: anchor.name, type: 'anchor' }
    });
    setIsEmailDialogOpen(true);
  };
  
  const handleViewDetails = (spoke: Dealer | Vendor, type: 'Dealer' | 'Vendor') => {
    if (type === 'Dealer') {
        setSelectedDealer(spoke as Dealer);
    } else {
        setSelectedVendor(spoke as Vendor);
    }
  }


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
                  <SelectItem value="Active">Active</SelectItem>
                  {currentUser?.role === 'Admin' && anchor.status === 'Active' && (
                    <>
                      <Separator />
                      <SelectItem value="Archived">Archive</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
            {anchor.leadScore && (
                <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm">
                    <span className="font-medium text-secondary-foreground">{t('anchors.profile.aiScore')}:</span>
                    <span className="font-bold text-primary">{anchor.leadScore}/100</span>
                </div>
            )}
            <Button onClick={() => setIsNewTaskOpen(true)}>{t('anchors.profile.addTask')}</Button>
          </div>
      </PageHeader>
      
      <NewLeadDialog type={leadType} open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen} anchorId={anchor.id} />
      <NewTaskDialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} prefilledAnchorId={anchor.id} />
      <NewContactDialog open={isNewContactOpen} onOpenChange={setIsNewContactOpen} anchor={anchor} />
      {emailConfig && (
        <ComposeEmailDialog 
            open={isEmailDialogOpen} 
            onOpenChange={setIsEmailDialogOpen}
            recipientEmail={emailConfig.recipientEmail}
            entity={emailConfig.entity}
        />
      )}
      {selectedDealer && (
        <DealerDetailsDialog
            dealer={selectedDealer}
            open={!!selectedDealer}
            onOpenChange={(open) => { if(!open) setSelectedDealer(null); }}
        />
      )}
      {selectedVendor && (
        <VendorDetailsDialog
            vendor={selectedVendor}
            open={!!selectedVendor}
            onOpenChange={(open) => { if(!open) setSelectedVendor(null); }}
        />
      )}


      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="details">{t('anchors.profile.detailsTab')}</TabsTrigger>
          <TabsTrigger value="dealers">{t('anchors.profile.dealersTab', { count: initialDealers.length })}</TabsTrigger>
          <TabsTrigger value="vendors">{t('anchors.profile.vendorsTab', { count: initialVendors.length })}</TabsTrigger>
          <TabsTrigger value="interactions">{t('anchors.profile.interactionsTab', { count: initialLogs.length })}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
                <Card>
                    <CardHeader><CardTitle>{t('anchors.profile.companyInfo')}</CardTitle></CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div><div className="text-muted-foreground">Lead ID</div><div>{anchor.leadId || 'N/A'}</div></div>
                        <div><div className="text-muted-foreground">{t('anchors.profile.gstin')}</div><div>{anchor.gstin || 'N/A'}</div></div>
                        <div><div className="text-muted-foreground">{t('anchors.profile.creditRating')}</div><div>{anchor.creditRating || 'N/A'}</div></div>
                        <div><div className="text-muted-foreground">{t('anchors.profile.annualTurnover')}</div><div>{anchor.annualTurnover ? `₹ ${anchor.annualTurnover.toLocaleString('en-IN')}` : 'N/A'}</div></div>
                        <div><div className="text-muted-foreground">{t('anchors.profile.address')}</div><div>{anchor.address || 'N/A'}</div></div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{t('anchors.profile.keyContacts')}</CardTitle>
                            {canAddContact && <Button variant="outline" size="sm" onClick={() => setIsNewContactOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Contact</Button>}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                           {anchor.contacts.map(contact => (
                             <div key={contact.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <div className="font-medium flex items-center gap-2">{contact.name} {contact.isPrimary && <Badge variant="outline">{t('anchors.profile.primary')}</Badge>}</div>
                                        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2">{contact.designation} <span className="hidden sm:inline">&bull;</span> {contact.email} <span className="hidden sm:inline">&bull;</span> {contact.phone}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 w-full sm:w-auto">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEmailClick(contact)}>
                                        <Mail className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleLogInteractionClick(contact.name)} className="w-full sm:w-auto">{t('anchors.profile.logInteraction')}</Button>
                                </div>
                            </div>
                           ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {anchor.leadScoreReason && 
                <Card className="bg-secondary">
                    <CardHeader>
                        <CardTitle>{t('anchors.profile.aiAnalysis')}</CardTitle>
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
                    <CardTitle>{t('anchors.profile.associatedDealers')} ({initialDealers.length})</CardTitle>
                    {isSalesRole && <Button onClick={() => openNewLeadDialog('Dealer')}><PlusCircle className="h-4 w-4 mr-2" />{t('anchors.profile.addDealer')}</Button>}
                </div>
            </CardHeader>
            <CardContent>
                <SpokeTable spokes={initialDealers} type="Dealer" onUpdateSpoke={updateDealer} onViewDetails={handleViewDetails} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="mt-4">
          <Card>
             <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>{t('anchors.profile.associatedVendors')} ({initialVendors.length})</CardTitle>
                    {isSalesRole && <Button onClick={() => openNewLeadDialog('Vendor')}><PlusCircle className="h-4 w-4 mr-2" />{t('anchors.profile.addVendor')}</Button>}
                </div>
            </CardHeader>
            <CardContent>
                <SpokeTable spokes={initialVendors} type="Vendor" onUpdateSpoke={updateVendor} onViewDetails={handleViewDetails} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="mt-4">
            <Card>
                <CardHeader><CardTitle>{t('anchors.profile.interactionLog')}</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <Textarea 
                             ref={activityTextareaRef}
                             placeholder={t('anchors.profile.logNewInteractionPlaceholder', { name: anchor.name })}
                             value={newActivity} 
                             onChange={(e) => setNewActivity(e.target.value)} 
                           />
                           <Button onClick={handleLogActivity}>{t('anchors.profile.logInteraction')}</Button>
                        </div>
                        <Separator />
                        <div className="space-y-6">
                            {initialLogs.map(log => {
                                const Icon = activityIconMap[log.type] || PenSquare;
                                return (
                                <div key={log.id} className="flex items-start gap-4">
                                    <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-full bg-secondary flex-shrink-0",
                                        log.systemGenerated && "bg-muted"
                                    )}>
                                        <Icon className="h-5 w-5 text-secondary-foreground" />
                                    </div>
                                    <div>
                                    <p className="font-medium">{log.title}
                                      {!log.systemGenerated && <span className="text-sm text-muted-foreground"> by {log.userName}</span>}
                                    </p>
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

function SpokeTable({ spokes, type, onUpdateSpoke, onViewDetails }: { spokes: Array<Dealer | Vendor>; type: 'Dealer' | 'Vendor'; onUpdateSpoke: (spoke: any) => void; onViewDetails: (spoke: Dealer | Vendor, type: 'Dealer' | 'Vendor') => void; }) {
    const { currentUser, users } = useApp();
    const { t } = useLanguage();
    const isSpecialist = currentUser?.role === 'Business Development';

    const handleStatusChange = (spoke: Dealer | Vendor, newStatus: SpokeStatus) => {
        onUpdateSpoke({...spoke, status: newStatus});
    }

    const getStatusVariant = (status: SpokeStatus): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
            case 'Active':
            case 'Already Onboarded':
            case 'Disbursed':
            case 'Approved PF Collected':
            case 'Limit Live':
                return 'default';
            case 'Rejected':
            case 'Not Interested':
            case 'Closed':
                return 'destructive';
            default:
                return 'secondary';
        }
    };
    
    const getAssignedToName = (userId: string | null) => {
        if (!userId) return 'Unassigned';
        return users.find(u => u.uid === userId)?.name || 'Unknown';
    };

    return (
        <div>
            {/* Desktop Table View */}
            <div className="hidden rounded-lg border md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('anchors.profile.spokeTable.name', { type })}</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>{t('anchors.profile.spokeTable.status')}</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead className="text-right">{t('anchors.profile.spokeTable.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {spokes.length > 0 ? spokes.map(spoke => (
                        <TableRow key={spoke.id}>
                            <TableCell className="font-medium">{spoke.name}</TableCell>
                            <TableCell>{spoke.contacts?.[0]?.phone || 'N/A'}</TableCell>
                            <TableCell>
                                {isSpecialist ? (
                                    <Select onValueChange={(v) => handleStatusChange(spoke, v as SpokeStatus)} defaultValue={spoke.status}>
                                        <SelectTrigger className="w-[180px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {spokeStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant={getStatusVariant(spoke.status)}>{spoke.status}</Badge>
                                )}
                            </TableCell>
                            <TableCell>{getAssignedToName(spoke.assignedTo)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => onViewDetails(spoke, type)}>{t('anchors.profile.spokeTable.viewDetails')}</Button>
                            </TableCell>
                        </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">{t('anchors.profile.spokeTable.noSpokes', { type: type.toLowerCase()+'s' })}</TableCell>
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
                                <p className="text-sm text-muted-foreground">{spoke.contacts?.[0]?.phone || 'N/A'}</p>
                            </div>
                             <p className="text-sm"><span className="font-medium">Assigned To:</span> {getAssignedToName(spoke.assignedTo)}</p>
                            <div>
                                {isSpecialist ? (
                                    <Select onValueChange={(v) => handleStatusChange(spoke, v as SpokeStatus)} defaultValue={spoke.status}>
                                        <SelectTrigger className="w-full h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {spokeStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant={getStatusVariant(spoke.status)}>{spoke.status}</Badge>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto" onClick={() => onViewDetails(spoke, type)}>{t('anchors.profile.spokeTable.viewDetails')}</Button>
                        </CardContent>
                    </Card>
                )) : (
                     <div className="h-24 flex items-center justify-center text-center text-muted-foreground">{t('anchors.profile.spokeTable.noSpokes', { type: type.toLowerCase()+'s' })}</div>
                )}
            </div>
        </div>
    )
}
