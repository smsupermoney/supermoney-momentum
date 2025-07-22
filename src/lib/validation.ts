

import { z } from 'zod';

// This file contains Zod schemas for "server-side" validation of data mutations.
// In a real application, these would be used within server actions or cloud functions
// to ensure data integrity before writing to the database.

export const userRoles = ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development'] as const;
export const regions = ['National', 'West', 'East', 'North', 'South'] as const;

export const NewAnchorSchema = z.object({
  companyName: z.string().min(2, { message: 'Company name is required' }),
  industry: z.string().min(2, { message: 'Industry is required' }),
  annualTurnover: z.string().optional(),
  primaryContactName: z.string().min(2, { message: 'Contact name is required' }),
  primaryContactDesignation: z.string().min(2, { message: 'Designation is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Phone number must be 10 digits.' }),
  gstin: z.string().optional(),
  address: z.string().optional(),
});

export const ContactSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
    phone: z.string().regex(/^\d{10}$/, { message: 'Phone number must be 10 digits.' }).optional().or(z.literal('')),
    designation: z.string().optional(),
    isPrimary: z.boolean().optional(),
});

export const RemarkSchema = z.object({
  text: z.string(),
  timestamp: z.string(),
  userName: z.string(),
});

export const NewSpokeSchema = z.object({
  name: z.string().min(2, "Lead name is required."),
  contacts: z.array(ContactSchema).min(1, "At least one contact is required."),
  anchorId: z.string().min(1, "An anchor must be associated with the lead."),

  // Optional fields from now on
  dealValue: z.coerce.number().optional(),
  leadType: z.string().optional(),
  gstin: z.string().optional().or(z.literal('')),
  city: z.string().optional(),
  state: z.string().optional(),
  zone: z.string().optional(),
  product: z.string().optional(),
  leadSource: z.string().optional(),
  lenderId: z.string().nullable().optional(),
  remarks: z.array(RemarkSchema).optional(),
  leadDate: z.coerce.date().optional(),
  spoc: z.string().optional(),
  initialLeadDate: z.coerce.date().optional(),
  tat: z.number().int().optional(),
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
    role: z.enum(userRoles),
    region: z.enum(regions).optional().or(z.literal('')),
    managerId: z.string().optional(),
});

export const EditUserSchema = z.object({
    name: z.string().min(2, "User name is required."),
    email: z.string().email("A valid email is required.").readonly(),
    role: z.enum(userRoles),
    region: z.enum(regions).optional().or(z.literal('')),
    managerId: z.string().optional().nullable(),
});
