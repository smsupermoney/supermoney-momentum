export type UserRole = 'Admin' | 'Sales' | 'Zonal Sales Manager' | 'Onboarding Specialist';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string | null;
}

export type LeadStatus = 'Lead' | 'Initial Contact' | 'Proposal' | 'Negotiation' | 'Onboarding' | 'Active' | 'Unassigned Lead' | 'Assigned' | 'Contacted';
export type OnboardingStatus = 'Invited' | 'KYC Pending' | 'Active' | 'Inactive' | 'Unassigned Lead';
export type TaskStatus = 'To-Do' | 'In Progress' | 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskType = 'Call' | 'Email' | 'Meeting (Online)' | 'Meeting (In-person)' | 'KYC Document Collection' | 'Proposal Preparation' | 'Internal Review';

export interface BaseLead {
  id: string;
  name: string;
  contactNumber: string;
  gstin?: string;
  location?: string;
  assignedTo: string | null;
  createdAt: string;
}

export interface Anchor extends BaseLead {
  industry: string;
  primaryContactName: string;
  email: string;
  annualTurnover?: number;
  creditRating?: string;
  address?: string;
  leadSource?: string;
  status: LeadStatus;
  leadScore?: number;
  leadScoreReason?: string;
  dealerIds: string[];
  supplierIds: string[];
}

export interface Dealer extends BaseLead {
  onboardingStatus: OnboardingStatus;
  anchorId: string | null;
}

export interface Supplier extends BaseLead {
  onboardingStatus: OnboardingStatus;
  anchorId: string | null;
}

export interface Task {
  id: string;
  title: string;
  associatedWith: {
    anchorId: string;
    dealerId?: string;
    supplierId?: string;
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
  anchorId: string;
  taskId?: string;
  timestamp: string;
  type: TaskType;
  title: string;
  outcome: string;
  userName: string;
}
