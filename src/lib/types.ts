export type UserRole = 'Admin' | 'Sales' | 'Zonal Sales Manager' | 'Onboarding Specialist';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string | null;
}

export type LeadStatus = 'Lead' | 'Initial Contact' | 'Proposal' | 'Negotiation' | 'Onboarding' | 'Active' | 'Unassigned Lead' | 'Assigned' | 'Contacted';
export type OnboardingStatus = 'Invited' | 'KYC Pending' | 'Not reachable' | 'Agreement Pending' | 'Active' | 'Inactive' | 'Unassigned Lead' | 'Rejected' | 'Not Interested';
export type TaskStatus = 'To-Do' | 'In Progress' | 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskType = 'Call' | 'Email' | 'Meeting (Online)' | 'Meeting (In-person)' | 'KYC Document Collection' | 'Proposal Preparation' | 'Internal Review';
export type LeadType = 'New Lead' | 'Renewal of limits' | 'Enhancement of limits' | 'Adhoc additional limits' | 'Cross sell of another product';


export interface Contact {
    id: string;
    name: string;
    designation: string;
    email: string;
    phone: string;
    isPrimary: boolean;
}

export interface BaseLead {
  id: string;
  name: string;
  contactNumber: string;
  email?: string;
  gstin?: string;
  location?: string;
  product?: string;
  assignedTo: string | null;
  createdAt: string;
  leadType?: LeadType;
}

export interface Anchor extends Omit<BaseLead, 'contactNumber' | 'name' | 'email' | 'product' | 'leadType'> {
  name: string; // Anchor name is company name
  industry: string;
  annualTurnover?: number;
  creditRating?: string;
  address?: string;
  leadSource?: string;
  status: LeadStatus;
  leadScore?: number;
  leadScoreReason?: string;
  dealerIds: string[];
  vendorIds: string[];
  contacts: Contact[];
}

export interface Dealer extends BaseLead {
  onboardingStatus: OnboardingStatus;
  anchorId: string | null;
  leadScore?: number;
  leadScoreReason?: string;
}

export interface Vendor extends BaseLead {
  onboardingStatus: OnboardingStatus;
  anchorId: string | null;
  leadScore?: number;
  leadScoreReason?: string;
}

export interface Task {
  id: string;
  title: string;
  associatedWith: {
    anchorId: string;
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
}

export interface ActivityLog {
  id: string;
  anchorId?: string;
  dealerId?: string;
  vendorId?: string;
  taskId?: string;
  timestamp: string;
  type: TaskType;
  title: string;
  outcome: string;
  userName: string;
}
