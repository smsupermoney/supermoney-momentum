import type { User, Anchor, Dealer, Supplier, Task, ActivityLog } from './types';

// Let's assume today is 2024-07-26 for consistent mock data
const today = new Date('2024-07-26T10:00:00.000Z');
const daysAgo = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const daysFromNow = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString();


export const mockUsers: User[] = [
  { uid: 'user-1', name: 'Ramesh Kumar', email: 'asm@supermoney.in', role: 'Sales', managerId: 'user-2' },
  { uid: 'user-2', name: 'Priya Sharma', email: 'zsm@supermoney.in', role: 'Zonal Sales Manager' },
  { uid: 'user-3', name: 'Sonia Singh', email: 'sonia@supermoney.in', role: 'Onboarding Specialist' },
  { uid: 'user-admin', name: 'Admin User', email: 'admin@supermoney.in', role: 'Admin' },
];

export const mockAnchors: Anchor[] = [
  { 
    id: 'anchor-1', 
    name: 'Reliance Retail', 
    industry: 'Retail',
    status: 'Active',
    contacts: [
      { id: 'contact-1', name: 'Anil Mehta', designation: 'CFO', email: 'anil.mehta@reliance.com', phone: '9876543210', isPrimary: true },
      { id: 'contact-2', name: 'Sunita Sharma', designation: 'Procurement Head', email: 'sunita.s@reliance.com', phone: '9876543219', isPrimary: false },
    ],
    assignedTo: 'user-1',
    createdAt: daysAgo(20),
    dealerIds: ['dealer-1', 'dealer-4'],
    supplierIds: ['supplier-1', 'supplier-2'],
    annualTurnover: 5000000000,
    gstin: '27AACCR1234A1Z5',
    creditRating: 'AAA',
    address: 'Reliance Corporate Park, Ghansoli, Navi Mumbai, Maharashtra 400701',
    leadSource: 'Banker Referral',
    leadScore: 95,
    leadScoreReason: "High turnover, strong credit rating, and strategic industry make this a prime lead."
  },
  { 
    id: 'anchor-2', 
    name: 'Tata Motors', 
    industry: 'Automotive',
    status: 'Onboarding', // Changed to Onboarding for the specialist to see it
    contacts: [
      { id: 'contact-3', name: 'Sunita Rao', designation: 'VP Finance', email: 'sunita.rao@tatamotors.com', phone: '9876543211', isPrimary: true },
    ],
    assignedTo: 'user-1',
    createdAt: daysAgo(15),
    dealerIds: ['dealer-2'],
    supplierIds: [],
    leadSource: 'Conference / Event',
    annualTurnover: 8500000000,
  },
  { 
    id: 'anchor-3', 
    name: 'Apollo Tyres', 
    industry: 'Automotive',
    status: 'Negotiation',
    contacts: [
        { id: 'contact-4', name: 'Vijay Singh', designation: 'Finance Director', email: 'vijay.s@apollotyres.com', phone: '9876543212', isPrimary: true },
    ],
    assignedTo: 'user-2',
    createdAt: daysAgo(10),
    dealerIds: [],
    supplierIds: [],
    leadSource: 'LinkedIn Campaign',
    annualTurnover: 2500000000,
  },
  { 
    id: 'anchor-4', 
    name: 'Future Group', 
    industry: 'Retail',
    status: 'Initial Contact',
    contacts: [
        { id: 'contact-5', name: 'Kishore Biyani', designation: 'CEO', email: 'kb@futuregroup.in', phone: '9876543213', isPrimary: true },
    ],
    assignedTo: 'user-2',
    createdAt: daysAgo(8),
    dealerIds: [],
    supplierIds: [],
    leadSource: 'Website Inquiry',
    annualTurnover: 1000000000,
  },
  { 
    id: 'anchor-5', 
    name: 'Unassigned Corp', 
    industry: 'Manufacturing',
    status: 'Unassigned Lead',
    contacts: [
        { id: 'contact-6', name: 'John Doe', designation: 'Owner', email: 'john.doe@unassigned.com', phone: '9999999999', isPrimary: true },
    ],
    assignedTo: null,
    createdAt: daysAgo(2),
    dealerIds: [],
    supplierIds: [],
    leadSource: 'CA / Financial Consultant Referral',
  },
   { 
    id: 'anchor-6', 
    name: 'Pharma Solutions', 
    industry: 'Pharmaceutical',
    status: 'Lead',
    contacts: [
        { id: 'contact-7', name: 'Aisha Khan', designation: 'Head of Finance', email: 'aisha.k@pharmasol.com', phone: '9876512345', isPrimary: true },
    ],
    assignedTo: 'user-1',
    createdAt: daysAgo(5),
    dealerIds: [],
    supplierIds: [],
    leadSource: 'Content Marketing',
    annualTurnover: 750000000,
  },
];

export const mockDealers: Dealer[] = [
  { id: 'dealer-1', name: 'Mumbai Motors', contactNumber: '9123456780', email: 'contact@mumbaimotors.com', onboardingStatus: 'Active', anchorId: 'anchor-1', assignedTo: 'user-1', createdAt: today.toISOString(), product: 'SCF - Primary', leadScore: 85, leadScoreReason: "Strong association with a top-tier anchor in a major hub." },
  { id: 'dealer-2', name: 'Pune Auto', contactNumber: '9123456781', email: 'puneauto@example.com', onboardingStatus: 'Invited', anchorId: 'anchor-2', assignedTo: 'user-1', createdAt: today.toISOString(), product: 'SCF - Secondary' },
  { id: 'dealer-3', name: 'Delhi Dealers', contactNumber: '9123456782', email: 'info@delhidealers.co', onboardingStatus: 'Unassigned Lead', anchorId: null, assignedTo: null, createdAt: today.toISOString(), location: 'Delhi', product: 'BL' },
  { id: 'dealer-4', name: 'Reliance Autozone', contactNumber: '9123456783', email: 'autozone@reliance.com', onboardingStatus: 'KYC Pending', anchorId: 'anchor-1', assignedTo: 'user-1', createdAt: today.toISOString(), product: 'SCF - Primary' },
];

export const mockSuppliers: Supplier[] = [
  { id: 'supplier-1', name: 'Shree Krishna Parts', contactNumber: '8123456780', email: 'skp@gmail.com', onboardingStatus: 'Active', anchorId: 'anchor-1', assignedTo: 'user-1', createdAt: today.toISOString(), product: 'SCF - Primary', leadScore: 90, leadScoreReason: "Long-standing supplier for a major anchor, indicating reliability." },
  { id: 'supplier-2', name: 'Balaji Components', contactNumber: '8123456781', onboardingStatus: 'KYC Pending', anchorId: 'anchor-1', assignedTo: 'user-1', createdAt: today.toISOString(), product: 'SCF - Primary' },
  { id: 'supplier-3', name: 'Unassigned Suppliers Inc', contactNumber: '8123456782', email: 'contact@unassigned.co', onboardingStatus: 'Unassigned Lead', anchorId: null, assignedTo: null, createdAt: today.toISOString(), location: 'Chennai', product: 'Other' },
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
    associatedWith: { anchorId: 'anchor-1', dealerId: 'dealer-1' },
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
    title: 'Overdue: Collect KYC from Balaji',
    associatedWith: { anchorId: 'anchor-1' },
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
    associatedWith: { anchorId: 'anchor-2' },
    type: 'KYC Document Collection',
    dueDate: daysFromNow(3),
    priority: 'High',
    description: 'Collect all required KYC documents for Pune Auto.',
    status: 'To-Do',
    assignedTo: 'user-3', // Assigned to Onboarding Specialist
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
        userName: 'Ramesh Kumar',
    },
    {
        id: 'log-2',
        anchorId: 'anchor-1',
        timestamp: daysAgo(3),
        type: 'Meeting (Online)',
        title: "Onboarding call with 'Reliance Retail'",
        outcome: "Successful onboarding call. Discussed next steps for dealer integration.",
        userName: 'Ramesh Kumar',
    },
    {
        id: 'log-3',
        anchorId: 'anchor-4',
        timestamp: daysAgo(5),
        type: 'Call',
        title: "Call logged with Kishore Biyani at 'Future Group'",
        outcome: "Discussed initial requirements. Client is interested in supplier finance. Sent introductory email.",
        userName: 'Priya Sharma',
    },
     {
        id: 'log-4',
        anchorId: 'anchor-3',
        timestamp: daysAgo(2),
        type: 'Call',
        title: "Negotiation call with 'Apollo Tyres'",
        outcome: "Client has some objections on the pricing. Scheduled a follow-up meeting.",
        userName: 'Priya Sharma',
    },
    {
        id: 'log-5',
        anchorId: 'anchor-2',
        taskId: 'task-7',
        timestamp: daysAgo(1),
        type: 'Email',
        title: 'Sent KYC document list to Pune Auto',
        outcome: 'Emailed the list of required documents to the primary contact at Pune Auto.',
        userName: 'Sonia Singh',
      },
];
