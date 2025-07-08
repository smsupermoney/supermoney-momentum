
import { z } from 'zod';

// This file contains Zod schemas for "server-side" validation of data mutations.
// In a real application, these would be used within server actions or cloud functions
// to ensure data integrity before writing to the database.

export const NewAnchorSchema = z.object({
  name: z.string().min(2, "Company name is required."),
  industry: z.string().min(2, "Industry is required."),
  contacts: z.array(z.object({
      id: z.string(),
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string(),
      designation: z.string().min(2),
      isPrimary: z.boolean(),
  })).min(1, "At least one contact is required."),
  createdBy: z.string().min(1, "A creator must be assigned."),
  status: z.enum(['Lead', 'Initial Contact', 'Proposal', 'Negotiation', 'Onboarding', 'Active', 'Unassigned Lead', 'Assigned', 'Contacted', 'Pending Approval', 'Rejected', 'Archived']),
});

export const NewSpokeSchema = z.object({
  name: z.string().min(2, "Lead name is required."),
  contactNumber: z.string().regex(/^\d{10}$/, "A valid 10-digit phone number is required."),
  assignedTo: z.string().nullable(),
  status: z.enum(['Invited', 'KYC Pending', 'Not reachable', 'Agreement Pending', 'Active', 'Inactive', 'Unassigned Lead', 'Rejected', 'Not Interested', 'Onboarding']),
});


export const NewTaskSchema = z.object({
    title: z.string().min(3, "Task title is required."),
    dueDate: z.string().datetime("A valid due date is required."),
    priority: z.enum(['High', 'Medium', 'Low']),
    assignedTo: z.string().min(1, "A user must be assigned."),
    status: z.enum(['To-Do', 'In Progress', 'Completed']),
});


export const NewDailyActivitySchema = z.object({
    userId: z.string().min(1, "A user must be associated with the activity."),
    activityType: z.enum(['Client Meeting', 'Site Visit', 'Sales Presentation', 'Follow-up', 'Administrative', 'Training', 'Networking']),
    title: z.string().min(3, "A title is required for the activity."),
    activityTimestamp: z.string().datetime("A valid timestamp is required."),
});

export const NewUserSchema = z.object({
    name: z.string().min(2, "User name is required."),
    email: z.string().email("A valid email is required."),
    role: z.enum(['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development']),
});
