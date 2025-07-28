
'use client';

import { useState, useRef, useMemo } from 'react';
import type { Anchor, Dealer, Vendor, ActivityLog, Task, User, SpokeStatus, TaskType, LeadStatus, Contact, AnchorSPOC } from '@/lib/types';
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
import { Mail, Phone, Calendar, PenSquare, PlusCircle, User as UserIcon, History, MessageSquare, CheckCircle, Globe, Flame, Search, Pencil } from 'lucide-react';
import { ComposeEmailDialog } from '../email/compose-email-dialog';
import { DealerDetailsDialog } from '../dealers/dealer-details-dialog';
import { VendorDetailsDialog } from '../suppliers/supplier-details-dialog';
import { useLanguage } from '@/contexts/language-context';
import { NewContactDialog } from './new-contact-dialog';
import { cn } from '@/lib/utils';
import { spokeStatuses, leadTypes, products } from '@/lib/types';
import { regions } from '@/lib/validation';
import { NewAnchorSPOCDialog } from './new-anchor-spoc-dialog';
import { Input } from '../ui/input';
import { EditContactDialog } from './edit-contact-dialog';
import { EditAnchorSPOCDialog } from './edit-anchor-spoc-dialog';

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

type CombinedLead = (Dealer | Vendor) & { type: 'Dealer' | 'Vendor' };
interface AnchorProfileProps {
  anchor: Anchor;
  leads: CombinedLead[];
  activityLogs: ActivityLog[];
  tasks: Task[];
  users: User[];
  spocs: AnchorSPOC[];
}

export function AnchorProfile({ anchor, leads, activityLogs: initialLogs, spocs }: AnchorProfileProps) {
  const { addActivityLog, updateAnchor, updateDealer, updateVendor, currentUser } = useApp();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [newActivity, setNewActivity] = useState('');
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [isNewSpocOpen, setIsNewSpocOpen] = useState(false);
  const [spocToEdit, setSpocToEdit] = useState<AnchorSPOC | null>(null);
  const [leadType, setLeadType] = useState<'Dealer' | 'Vendor'>('Dealer');
  const [activeTab, setActiveTab] = useState('details'); 
  const activityTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<{ recipientEmail: string, entity: { id: string; name: string; type: 'anchor' } } | null>(null);

  const [selectedLead, setSelectedLead] = useState<CombinedLead | null>(null);


  const isSalesRole = currentUser && ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'].includes(currentUser.role);
  const canAddOrEditContact = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Business Development');
  const canViewCentralSpocs = currentUser && !['Zonal Sales Manager', 'Area Sales Manager'].includes(currentUser.role);


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
  
  const handleEmailClick = (contact: Contact | AnchorSPOC['spocDetails']) => {
    setEmailConfig({
        recipientEmail: contact.email,
        entity: { id: anchor.id, name: anchor.name, type: 'anchor' }
    });
    setIsEmailDialogOpen(true);
  };
  
  const handleViewDetails = (lead: CombinedLead) => {
    setSelectedLead(lead);
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
      {contactToEdit && (
        <EditContactDialog 
            open={!!contactToEdit}
            onOpenChange={() => setContactToEdit(null)}
            anchor={anchor}
            contact={contactToEdit}
        />
      )}
      <NewAnchorSPOCDialog open={isNewSpocOpen} onOpenChange={setIsNewSpocOpen} anchor={anchor} />
      {spocToEdit && (
        <EditAnchorSPOCDialog 
            open={!!spocToEdit}
            onOpenChange={() => setSpocToEdit(null)}
            spoc={spocToEdit}
            anchor={anchor}
        />
      )}

      {emailConfig && (
        <ComposeEmailDialog 
            open={isEmailDialogOpen} 
            onOpenChange={setIsEmailDialogOpen}
            recipientEmail={emailConfig.recipientEmail}
            entity={emailConfig.entity}
        />
      )}
      
      {selectedLead && selectedLead.type === 'Dealer' && (
        <DealerDetailsDialog
            dealer={selectedLead as Dealer}
            open={!!selectedLead}
            onOpenChange={(open) => { if(!open) setSelectedLead(null); }}
        />
      )}
      {selectedLead && selectedLead.type === 'Vendor' && (
        <VendorDetailsDialog
            vendor={selectedLead as Vendor}
            open={!!selectedLead}
            onOpenChange={(open) => { if(!open) setSelectedLead(null); }}
        />
      )}


      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="details">{t('anchors.profile.detailsTab')}</TabsTrigger>
          <TabsTrigger value="spocs">SPOCs ({spocs.length})</TabsTrigger>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
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
                        <div>
                            <div className="text-muted-foreground">{t('anchors.profile.creditRating')}</div>
                            <div>{anchor.creditRating ? `${anchor.creditRating} (${anchor.ratingAgency || 'N/A'})` : 'N/A'}</div>
                        </div>
                        <div><div className="text-muted-foreground">{t('anchors.profile.annualTurnover')}</div><div>{anchor.annualTurnover ? `₹ ${anchor.annualTurnover}` : 'N/A'}</div></div>
                        <div className="sm:col-span-2"><div className="text-muted-foreground">{t('anchors.profile.address')}</div><div>{anchor.address || 'N/A'}</div></div>
                    </CardContent>
                </Card>
                 {canViewCentralSpocs && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{t('anchors.profile.keyContacts')}</CardTitle>
                                {canAddOrEditContact && <Button variant="outline" size="sm" onClick={() => setIsNewContactOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Contact</Button>}
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
                                         {canAddOrEditContact && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setContactToEdit(contact)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => handleLogInteractionClick(contact.name)} className="w-full sm:w-auto">{t('anchors.profile.logInteraction')}</Button>
                                    </div>
                                </div>
                               ))}
                            </div>
                        </CardContent>
                    </Card>
                 )}
            </div>
            {anchor.leadScoreReason && 
                <Card className="bg-secondary">
                    <CardHeader>
                        <CardTitle>{t('anchors.profile.aiAnalysis')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-secondary-foreground mb-1">Reason for Score</p>
                          <p className="text-sm text-secondary-foreground italic">"{anchor.leadScoreReason}"</p>
                        </div>
                         {anchor.industryBackground && (
                            <div>
                               <p className="text-sm font-semibold text-secondary-foreground mb-1">Industry Background</p>
                               <p className="text-sm text-secondary-foreground">{anchor.industryBackground}</p>
                            </div>
                        )}
                        {anchor.financialPerformance && (
                            <div>
                               <p className="text-sm font-semibold text-secondary-foreground mb-1">Financial Performance</p>
                               <p className="text-sm text-secondary-foreground">{anchor.financialPerformance}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            }
          </div>
        </TabsContent>

        <TabsContent value="spocs" className="mt-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Territory SPOCs</CardTitle>
                        {canAddOrEditContact && <Button variant="outline" onClick={() => setIsNewSpocOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add SPOC</Button>}
                    </div>
                    <CardDescription>Single Points of Contact for specific regions, states, or cities.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                       {spocs.length > 0 ? spocs.map(spoc => (
                         <div key={spoc.id} className="flex flex-col sm:flex-row items-start justify-between gap-2 border-b pb-4 last:border-b-0">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <UserIcon className="h-5 w-5 text-muted-foreground mt-1" />
                                    <div>
                                        <p className="font-semibold">{spoc.spocDetails.name}</p>
                                        <p className="text-sm text-muted-foreground">{spoc.spocDetails.designation}</p>
                                        <p className="text-xs text-muted-foreground">{spoc.spocDetails.email || 'N/A'} &bull; {spoc.spocDetails.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <div className="flex flex-wrap gap-1">
                                    {spoc.territories.map((territory, index) => (
                                        <Badge key={index} variant="secondary" className="font-normal">
                                            <Globe className="h-3 w-3 mr-1.5"/>
                                            {territory.city || territory.state || territory.region || 'N/A'}
                                            {territory.division && <span className="ml-1.5 pl-1.5 border-l border-muted-foreground/50">{territory.division}</span>}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1 w-full justify-end">
                                    <Button variant="ghost" size="sm" className="h-8 w-auto px-2" onClick={() => handleEmailClick(spoc.spocDetails)} disabled={!spoc.spocDetails.email}>
                                        <Mail className="mr-2 h-4 w-4" /> Email
                                    </Button>
                                    {canAddOrEditContact && (
                                        <Button variant="ghost" size="sm" className="h-8 w-auto px-2" onClick={() => setSpocToEdit(spoc)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                       )) : (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No territory-specific SPOCs have been added for this anchor yet.</p>
                        </div>
                       )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Associated Leads ({leads.length})</CardTitle>
                    <div className="flex gap-2">
                      {isSalesRole && <Button variant="outline" onClick={() => openNewLeadDialog('Dealer')}><PlusCircle className="h-4 w-4 mr-2" />{t('anchors.profile.addDealer')}</Button>}
                      {isSalesRole && <Button onClick={() => openNewLeadDialog('Vendor')}><PlusCircle className="h-4 w-4 mr-2" />{t('anchors.profile.addVendor')}</Button>}
                    </div>
                </div>
                 <CardDescription>All Dealers and Vendors associated with this anchor.</CardDescription>
            </CardHeader>
            <CardContent>
                <AnchorLeadsTable 
                  leads={leads}
                  onViewDetails={handleViewDetails}
                />
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

function AnchorLeadsTable({ leads, onViewDetails }: { leads: CombinedLead[]; onViewDetails: (lead: CombinedLead) => void; }) {
    const { users, currentUser } = useApp();
    const { t } = useLanguage();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [leadTypeFilter, setLeadTypeFilter] = useState('all');
    const [assignedToFilter, setAssignedToFilter] = useState('all');
    const [productFilter, setProductFilter] = useState('all');
    const [zoneFilter, setZoneFilter] = useState('all');
    
    const canShowAssignedToFilter = currentUser && ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU'].includes(currentUser.role);
    const assignableUsers = useMemo(() => {
      return users.filter(u => u.role === 'Area Sales Manager');
    }, [users]);
    
    const filteredLeads = useMemo(() => leads.filter(lead => {
        const searchMatch = searchQuery.length > 0 ? lead.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
        if (!searchMatch) return false;
        if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
        if (leadTypeFilter !== 'all' && lead.leadType !== leadTypeFilter) return false;
        if (assignedToFilter !== 'all' && lead.assignedTo !== assignedToFilter) return false;
        if (productFilter !== 'all' && lead.product !== productFilter) return false;
        if (zoneFilter !== 'all' && lead.zone !== zoneFilter) return false;
        return true;
    }), [leads, searchQuery, statusFilter, leadTypeFilter, assignedToFilter, productFilter, zoneFilter]);


    const getStatusVariant = (status: SpokeStatus): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
            case 'Active': case 'Already Onboarded': case 'Disbursed': case 'Approved PF Collected': case 'Limit Live':
                return 'default';
            case 'Rejected': case 'Not Interested': case 'Closed':
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
             <div className="space-y-4 pb-4">
                <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by lead name..."
                    className="w-full pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Status</SelectItem>
                        {spokeStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={leadTypeFilter} onValueChange={setLeadTypeFilter}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Lead Types" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Lead Types</SelectItem>
                        {leadTypes.map(lt => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={productFilter} onValueChange={setProductFilter}>
                      <SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Products" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">Products</SelectItem>
                          {products.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={zoneFilter} onValueChange={setZoneFilter}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Zones" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Zones</SelectItem>
                            {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {canShowAssignedToFilter && (
                    <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[150px]"><SelectValue placeholder="Users" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Users</SelectItem>
                            {assignableUsers.map(u => <SelectItem key={u.uid} value={u.uid}>{u.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    )}
                </div>
            </div>
            {/* Desktop Table View */}
            <div className="hidden rounded-lg border md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Lead Type</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLeads.length > 0 ? filteredLeads.map(lead => (
                        <TableRow key={lead.id} onClick={() => onViewDetails(lead)} className="cursor-pointer">
                            <TableCell className="font-medium hover:text-primary">
                                <div className="flex items-center gap-2">
                                {lead.priority === 'High' && <Flame className="h-4 w-4 text-destructive" />}
                                <span>{lead.name}</span>
                                </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{lead.type}</Badge></TableCell>
                            <TableCell>
                               <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>
                            </TableCell>
                            <TableCell>{getAssignedToName(lead.assignedTo)}</TableCell>
                            <TableCell>{lead.leadType || 'Fresh'}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm">View Details</Button>
                            </TableCell>
                        </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">No leads found for this anchor.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
                {filteredLeads.length > 0 ? filteredLeads.map(lead => (
                    <Card key={lead.id} onClick={() => onViewDetails(lead)} className="cursor-pointer">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between">
                                <p className="font-medium hover:text-primary pr-2 flex items-center gap-2">
                                    {lead.priority === 'High' && <Flame className="h-5 w-5 text-destructive" />}
                                    {lead.name}
                                </p>
                                <Badge variant="outline">{lead.type}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>
                                <Badge variant="outline">{lead.leadType || 'Fresh'}</Badge>
                            </div>
                            <p className="text-sm"><span className="font-medium">Assigned To:</span> {getAssignedToName(lead.assignedTo)}</p>
                        </CardContent>
                    </Card>
                )) : (
                     <div className="h-24 flex items-center justify-center text-center text-muted-foreground">No leads found for this anchor.</div>
                )}
            </div>
        </div>
    )
}
