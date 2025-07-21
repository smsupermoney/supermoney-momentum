

export type UserRole = 'Admin' | 'Area Sales Manager' | 'Zonal Sales Manager' | 'Regional Sales Manager' | 'National Sales Manager' | 'Business Development';

export interface User {
  id: string; // Document ID from Firestore
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string | null;
  region?: string;
}

export type LeadStatus = 'Lead' | 'Initial Contact' | 'Proposal' | 'Negotiation' | 'Onboarding' | 'Active' | 'Unassigned Lead' | 'Assigned' | 'Contacted' | 'Rejected' | 'Archived' | 'Pending Approval';

export const spokeStatuses = [
    'New', 'Partial Docs', 'Follow Up', 'Already Onboarded', 'Disbursed', 
    'Not reachable', 'Active', 'Unassigned Lead', 'Rejected', 'Not Interested', 
    'Onboarding', 'Approved PF Collected', 'Awaiting Sanction', 'Closed', 
    'Limit Live', 'Login Pending', 'On Hold', 'Queries Raised', 'Relook'
] as const;
export type SpokeStatus = (typeof spokeStatuses)[number];

export type TaskStatus = 'To-Do' | 'In Progress' | 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskType = 'Call' | 'Email' | 'Meeting (Online)' | 'Meeting (In-person)' | 'KYC Document Collection' | 'Proposal Preparation' | 'Internal Review';
export type LeadType = 'Fresh' | 'Renewal' | 'Adhoc' | 'Enhancement' | 'Cross sell' | 'Revive';

export const products = ['Primary', 'Secondary', 'BL', 'LAP', 'WCDL', 'WCTL', 'PID', 'SID', 'Other'] as const;
export type Product = (typeof products)[number];


export interface Contact {
    id: string;
    name: string;
    designation: string;
    email: string;
    phone: string;
    isPrimary: boolean;
}

export type NextBestActionType = 'Send Follow-up Email' | 'Schedule a Demo Call' | 'Send Industry Case Study' | 'Address a Specific Question' | 'Nurture (Wait)' | 'Mark as Unqualified';

export interface NextBestAction {
    recommendedAction: NextBestActionType;
    justification: string;
}

export interface Remark {
  text: string;
  timestamp: string;
  userName: string;
}

export interface BaseLead {
  id: string;
  leadId?: string;
  name: string;
  contacts: Contact[];
  gstin?: string;
  city?: string;
  state?: string;
  zone?: string;
  product?: string;
  leadSource?: string;
  assignedTo: string | null;
  createdAt: string;
  leadDate: string;
  updatedAt?: string;
  leadType?: LeadType;
  dealValue?: number;
  remarks?: Remark[];
  lenderId?: string;
  spoc?: string; // Single Point of Contact
  initialLeadDate?: string; // For 'Revive' lead type
  tat?: number; // Turn Around Time in days, for bulk uploads
}

export interface Anchor {
  id: string;
  leadId: string;
  name: string; // Anchor name is company name
  industry: string;
  annualTurnover?: string;
  creditRating?: string;
  address?: string;
  status: LeadStatus;
  leadScore?: number;
  leadScoreReason?: string;
  dealerIds: string[];
  vendorIds: string[];
  contacts: Contact[];
  nextBestAction?: NextBestAction;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Dealer extends BaseLead {
  status: SpokeStatus;
  anchorId: string | null;
  leadScore?: number;
  leadScoreReason?: string;
  nextBestAction?: NextBestAction;
}

export interface Vendor extends BaseLead {
  status: SpokeStatus;
  anchorId: string | null;
  leadScore?: number;
  leadScoreReason?: string;
  nextBestAction?: NextBestAction;
}

export interface Task {
  id: string;
  title: string;
  associatedWith: {
    anchorId?: string;
    dealerId?: string;
    vendorId?: string;
  };
  type: TaskType;
  dueDate: string;
  priority: TaskPriority;
  description: string;
  status: TaskStatus;
  assignedTo: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  anchorId?: string;
  dealerId?: string;
  vendorId?: string;
  taskId?: string;
  timestamp: string;
  type: string;
  title: string;
  outcome: string;
  userName: string;
  userId: string;
  systemGenerated?: boolean;
}

export type DailyActivityType = 'Client Meeting' | 'Site Visit' | 'Sales Presentation' | 'Follow-up' | 'Administrative' | 'Training' | 'Networking';

export interface DailyActivity {
    id: string;
    userId: string;
    userName: string;
    activityType: DailyActivityType;
    title: string;
    notes?: string;
    activityTimestamp: string;
    anchorId?: string;
    anchorName?: string;
    dealerId?: string;
    dealerName?: string;
    vendorId?: string;
    vendorName?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
    images?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  href: string;
  timestamp: string;
  isRead: boolean;
  icon: string;
}

export interface Lender {
  id: string;
  name: string;
}
