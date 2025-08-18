


import type { User, Anchor, Dealer, Vendor, Task, ActivityLog, DailyActivity, CustomDashboardConfig, SanctionData, AumData } from './types';

// Let's assume today is 2024-07-26 for consistent mock data
const today = new Date('2024-07-26T10:00:00.000Z');
const daysAgo = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const daysFromNow = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString();


export const mockUsers: User[] = [
  { id: 'user-1', uid: 'user-1', name: 'Ashish Singh', email: 'asm@supermoney.in', role: 'Area Sales Manager', managerId: 'user-2', region: 'West' },
  { id: 'user-2', uid: 'user-2', name: 'Kamlesh Gupta', email: 'zsm@supermoney.in', role: 'Zonal Sales Manager', managerId: 'user-admin', region: 'West' },
  { id: 'user-3', uid: 'user-3', name: 'Falak Chawla', email: 'bd@supermoney.in', role: 'Business Development', region: 'National' },
  { id: 'user-admin', uid: 'user-admin', name: 'Admin User', email: 'admin@supermoney.in', role: 'Admin', region: 'National' },
  { id: 'user-4', uid: 'user-4', name: 'Rajesh Kumar', email: 'rsm@supermoney.in', role: 'Regional Sales Manager', managerId: 'user-admin', region: 'North' },
  { id: 'user-5', uid: 'user-5', name: 'Priya Sharma', email: 'etbm@supermoney.in', role: 'ETB Manager', managerId: 'user-admin', region: 'South' },
  { id: 'user-6', uid: 'user-6', name: 'Amit Verma', email: 'asm-north@supermoney.in', role: 'Area Sales Manager', managerId: 'user-4', region: 'North' },
  { id: 'user-7', uid: 'user-7', name: 'Sunita Reddy', email: 'etb-team@supermoney.in', role: 'ETB Team', managerId: 'user-5', region: 'South' },
];

export const mockAnchors: Anchor[] = [
  { 
    id: 'anchor-1',
    leadId: 'RLNC01',
    name: 'Reliance Retail', 
    industry: 'Retail',
    status: 'Active',
    contacts: [
      { id: 'contact-1', name: 'Anil Mehta', designation: 'CFO', email: 'anil.mehta@reliance.com', phone: '9876543210', isPrimary: true },
      { id: 'contact-2', name: 'Sunita Sharma', designation: 'Procurement Head', email: 'sunita.s@reliance.com', phone: '9876543219', isPrimary: false },
    ],
    createdBy: 'user-1',
    createdAt: daysAgo(20),
    dealerIds: ['dealer-1', 'dealer-4'],
    vendorIds: ['vendor-1', 'vendor-2'],
    annualTurnover: '5000 Cr+',
    gstin: '27AACCR1234A1Z5',
    creditRating: 'AAA',
    address: 'Reliance Corporate Park, Ghansoli, Navi Mumbai, Maharashtra 400701',
    leadScore: 95,
    leadScoreReason: "High turnover, strong credit rating, and strategic industry make this a prime lead."
  },
  { 
    id: 'anchor-2',
    leadId: 'TAMO02',
    name: 'Tata Motors', 
    industry: 'Automotive',
    status: 'Active',
    contacts: [
      { id: 'contact-3', name: 'Sunita Rao', designation: 'VP Finance', email: 'sunita.rao@tatamotors.com', phone: '9876543211', isPrimary: true },
    ],
    createdBy: 'user-1',
    createdAt: daysAgo(15),
    dealerIds: ['dealer-2'],
    vendorIds: [],
    annualTurnover: '5000 Cr+',
    nextBestAction: { recommendedAction: 'Schedule a Demo Call', justification: 'The client is in the onboarding phase, a demo call can help align expectations.' }
  },
  { 
    id: 'anchor-3', 
    leadId: 'APTY03',
    name: 'Apollo Tyres', 
    industry: 'Automotive',
    status: 'Active',
    contacts: [
        { id: 'contact-4', name: 'Vijay Singh', designation: 'Finance Director', email: 'vijay.s@apollotyres.com', phone: '9876543212', isPrimary: true },
    ],
    createdBy: 'user-2',
    createdAt: daysAgo(10),
    dealerIds: [],
    vendorIds: [],
    annualTurnover: '2000-5000 Cr',
    nextBestAction: { recommendedAction: 'Send Industry Case Study', justification: 'They are in negotiation, a case study can help build confidence.' }
  },
  { 
    id: 'anchor-4',
    leadId: 'FGRP04',
    name: 'Future Group', 
    industry: 'Retail',
    status: 'Active',
    contacts: [
        { id: 'contact-5', name: 'Kishore Biyani', designation: 'CEO', email: 'kb@futuregroup.in', phone: '9876543213', isPrimary: true },
    ],
    createdBy: 'user-2',
    createdAt: daysAgo(8),
    dealerIds: [],
    vendorIds: [],
    annualTurnover: '500-2000 Cr',
    nextBestAction: { recommendedAction: 'Send Follow-up Email', justification: 'It has been a while since initial contact, a follow-up email is appropriate.' }
  },
  { 
    id: 'anchor-5',
    leadId: 'UCRP05',
    name: 'Unassigned Corp', 
    industry: 'Manufacturing',
    status: 'Active',
    contacts: [
        { id: 'contact-6', name: 'John Doe', designation: 'Owner', email: 'john.doe@unassigned.com', phone: '9999999999', isPrimary: true },
    ],
    createdBy: 'user-admin',
    createdAt: daysAgo(2),
    dealerIds: [],
    vendorIds: [],
  },
   { 
    id: 'anchor-6',
    leadId: 'PHSL06',
    name: 'Pharma Solutions', 
    industry: 'Pharmaceutical',
    status: 'Active',
    contacts: [
        { id: 'contact-7', name: 'Aisha Khan', designation: 'Head of Finance', email: 'aisha.k@pharmasol.com', phone: '9876512345', isPrimary: true },
    ],
    createdBy: 'user-1',
    createdAt: daysAgo(5),
    dealerIds: [],
    vendorIds: [],
    annualTurnover: '500-2000 Cr',
  },
  { 
    id: 'anchor-7',
    leadId: 'LGKG07',
    name: 'Logistics King', 
    industry: 'Logistics',
    status: 'Pending Approval',
    contacts: [
        { id: 'contact-8', name: 'Raj Verma', designation: 'Director', email: 'raj.v@logisticking.com', phone: '9876543214', isPrimary: true },
    ],
    createdBy: 'user-3', // Business Development user
    createdAt: daysAgo(1),
    dealerIds: [],
    vendorIds: [],
  },
];

export const mockDealers: Dealer[] = [
  { 
    id: 'dealer-1', 
    leadId: 'MUMO01', 
    name: 'Mumbai Motors', 
    contactNumbers: [{ value: '9820098200' }],
    status: 'Login done', 
    anchorId: 'anchor-1', 
    assignedTo: 'user-1', 
    createdAt: '2025-08-05T10:00:00.000Z', 
    leadDate: '2025-08-05T10:00:00.000Z', 
    product: 'Primary', 
    leadSource: 'Connector', 
    leadScore: 85, 
    leadScoreReason: "Associated with a strong anchor. Good potential.", 
    leadType: 'Fresh', 
    remarks: [],
    state: 'Maharashtra',
    dealValue: 1.5, // Cr
  },
  { 
    id: 'dealer-2', 
    leadId: 'PUAU02', 
    name: 'Pune Auto', 
    contactNumbers: [{ value: '9820198201' }],
    status: 'Login done', 
    anchorId: 'anchor-2', 
    assignedTo: 'user-1', 
    createdAt: '2025-08-10T10:00:00.000Z',
    leadDate: '2025-08-10T10:00:00.000Z',
    product: 'Primary', 
    leadSource: 'Connector', 
    leadType: 'Fresh', 
    remarks: [],
    state: 'Maharashtra',
    dealValue: 2.0, // Cr
  },
  { 
    id: 'dealer-3', 
    leadId: 'UNDE03', 
    name: 'Unassigned Dealer', 
    contactNumbers: [{ value: '9820298202' }],
    status: 'Unassigned Lead', 
    anchorId: null, 
    assignedTo: null, 
    createdAt: daysAgo(1), 
    leadDate: daysAgo(1), 
    city: 'Delhi', 
    product: 'Other', 
    leadSource: 'Website Inquiry', 
    leadType: 'Fresh', 
    remarks: [] 
  },
  { 
    id: 'dealer-4', 
    leadId: 'DLSE04', 
    name: 'Delhi Service Center', 
    contactNumbers: [{ value: '9820398203' }],
    status: 'Partial Docs', 
    anchorId: 'anchor-1', 
    assignedTo: 'user-6', 
    createdAt: '2025-08-12T10:00:00.000Z',
    leadDate: '2025-08-12T10:00:00.000Z',
    product: 'Primary', 
    leadSource: 'Anchor Ecosystem (Cross-sell)', 
    leadType: 'Fresh', 
    nextBestAction: { recommendedAction: 'Mark as Unqualified', justification: 'No response after multiple follow-ups over two weeks.' }, 
    remarks: [],
    state: 'Delhi',
    dealValue: 0.75, // Cr
  },
];

export const mockVendors: Vendor[] = [
  { id: 'vendor-1', leadId: 'SKPA01', name: 'Shree Krishna Parts', contactNumbers: [{ value: '8123456780' }], status: 'Active', anchorId: 'anchor-1', assignedTo: 'user-1', createdAt: today.toISOString(), leadDate: today.toISOString(), product: 'Primary', leadSource: 'Anchor Ecosystem (Cross-sell)', leadScore: 90, leadScoreReason: "Long-standing supplier for a major anchor, indicating reliability.", leadType: 'Fresh', remarks: [] },
  { id: 'vendor-2', leadId: 'BACO02', name: 'Balaji Components', contactNumbers: [{ value: '8123456781' }], status: 'Partial Docs', anchorId: 'anchor-1', assignedTo: 'user-1', createdAt: today.toISOString(), leadDate: today.toISOString(), product: 'Primary', leadSource: 'Connector', leadType: 'Fresh', nextBestAction: { recommendedAction: 'Address a Specific Question', justification: 'KYC is pending, follow up to see if they have any questions holding them back.' }, remarks: [] },
  { id: 'vendor-3', leadId: 'UNVE03', name: 'Unassigned Vendors Inc', contactNumbers: [{ value: '8123456782' }], status: 'Unassigned Lead', anchorId: null, assignedTo: null, createdAt: today.toISOString(), leadDate: today.toISOString(), city: 'Chennai', product: 'Other', leadSource: 'Website Inquiry', leadType: 'Fresh', remarks: [] },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Follow up on Proposal V2',
    associatedWith: { anchorId: 'anchor-2' },
    type: 'Call',
    dueDate: today.toISOString(),
    priority: 'High',
    description: 'Check status of the proposal sent last week.',
    status: 'To-Do',
    assignedTo: 'user-1',
    createdAt: daysAgo(2),
  },
  {
    id: 'task-2',
    title: 'Prepare for negotiation meeting',
    associatedWith: { anchorId: 'anchor-3' },
    type: 'Proposal Preparation',
    dueDate: daysFromNow(2),
    priority: 'High',
    description: 'Get all the figures and final terms ready.',
    status: 'In Progress',
    assignedTo: 'user-2',
    createdAt: daysAgo(1),
  },
  {
    id: 'task-3',
    title: 'Initial contact call',
    associatedWith: { anchorId: 'anchor-4' },
    type: 'Call',
    dueDate: today.toISOString(),
    priority: 'Medium',
    description: 'First call to qualify the lead from website.',
    status: 'To-Do',
    assignedTo: 'user-2',
    createdAt: daysAgo(1),
  },
  {
    id: 'task-4',
    title: 'Send welcome kit to Mumbai Motors',
    associatedWith: { dealerId: 'dealer-1' },
    type: 'Email',
    dueDate: daysAgo(1),
    priority: 'Low',
    description: 'Welcome kit for the newly onboarded dealer.',
    status: 'Completed',
    assignedTo: 'user-1',
    createdAt: daysAgo(3),
  },
   {
    id: 'task-5',
    title: 'Finalize terms with Apollo',
    associatedWith: { anchorId: 'anchor-3' },
    type: 'Meeting (In-person)',
    dueDate: daysFromNow(7),
    priority: 'High',
    description: 'Final meeting to close the deal.',
    status: 'To-Do',
    assignedTo: 'user-2',
    createdAt: today.toISOString(),
  },
   {
    id: 'task-6',
    title: 'Overdue: Collect docs from Balaji',
    associatedWith: { vendorId: 'vendor-2' },
    type: 'KYC Document Collection',
    dueDate: daysAgo(3),
    priority: 'High',
    description: 'KYC documents are still pending.',
    status: 'To-Do',
    assignedTo: 'user-1',
    createdAt: daysAgo(10),
  },
  {
    id: 'task-7',
    title: 'Collect KYC for Pune Auto',
    associatedWith: { dealerId: 'dealer-2' },
    type: 'KYC Document Collection',
    dueDate: daysFromNow(3),
    priority: 'High',
    description: 'Collect all required KYC documents for Pune Auto.',
    status: 'To-Do',
    assignedTo: 'user-3', // Assigned to Business Development
    createdAt: daysAgo(1),
  },
];

export const mockActivityLogs: ActivityLog[] = [
    {
        id: 'log-1',
        anchorId: 'anchor-2',
        timestamp: daysAgo(1),
        type: 'Email',
        title: "Proposal sent to 'Tata Motors'",
        outcome: "Proposal V2 sent to Sunita Rao. Acknowledged receipt.",
        userName: 'Ashish Singh',
        userId: 'user-1'
    },
    {
        id: 'log-2',
        anchorId: 'anchor-1',
        timestamp: daysAgo(3),
        type: 'Meeting (Online)',
        title: "Onboarding call with 'Reliance Retail'",
        outcome: "Successful onboarding call. Discussed next steps for dealer integration.",
        userName: 'Ashish Singh',
        userId: 'user-1'
    },
    {
        id: 'log-3',
        anchorId: 'anchor-4',
        timestamp: daysAgo(5),
        type: 'Call',
        title: "Call logged with Kishore Biyani at 'Future Group'",
        outcome: "Discussed initial requirements. Client is interested in vendor finance. Sent introductory email.",
        userName: 'Kamlesh Gupta',
        userId: 'user-2'
    },
     {
        id: 'log-4',
        anchorId: 'anchor-3',
        timestamp: daysAgo(2),
        type: 'Call',
        title: "Negotiation call with 'Apollo Tyres'",
        outcome: "Client has some objections on the pricing. Scheduled a follow-up meeting.",
        userName: 'Kamlesh Gupta',
        userId: 'user-2'
    },
    {
        id: 'log-5',
        dealerId: 'dealer-2',
        taskId: 'task-7',
        timestamp: daysAgo(1),
        type: 'Email',
        title: 'Sent KYC document list to Pune Auto',
        outcome: 'Emailed the list of required documents to the primary contact at Pune Auto.',
        userName: 'Falak Chawla',
        userId: 'user-3'
      },
];

export const mockDailyActivities: DailyActivity[] = [];

export const mockCustomDashboardConfigs: CustomDashboardConfig[] = [
    {
        id: 'config-user-4', // For Rajesh Kumar (RSM)
        userId: 'user-4',
        name: "Rajesh Kumar's North Region Dashboard",
        selectedAnchors: ['anchor-1', 'anchor-2'],
        selectedStates: ['Delhi', 'Punjab'],
        statusToTrack: 'Login done',
        targets: {
            'anchor-1': {
                '2025-08': {
                    statusCount: 5,
                    dealValue: 10, // Cr
                    sanctionValue: 8, // Cr
                }
            },
            'anchor-2': {
                '2025-08': {
                    statusCount: 3,
                    dealValue: 5, // Cr
                    sanctionValue: 4.5, // Cr
                }
            }
        }
    }
];

export const mockSanctionData: SanctionData[] = [
    { id: 'anchor-1-2025-08', anchorId: 'anchor-1', month: '2025-08', value: 7.5 },
    { id: 'anchor-2-2025-08', anchorId: 'anchor-2', month: '2025-08', value: 5.0 },
];

export const mockAumData: AumData[] = [
    { id: 'anchor-1', anchorId: 'anchor-1', value: 50.5 },
    { id: 'anchor-2', anchorId: 'anchor-2', value: 30.0 },
    { id: 'anchor-3', anchorId: 'anchor-3', value: 25.2 },
];
