

import { z } from 'zod';
import { parse, isValid } from 'date-fns';


// This file contains Zod schemas for "server-side" validation of data mutations.
// In a real application, these would be used within server actions or cloud functions
// to ensure data integrity before writing to the database.

export const userRoles = ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Executive', 'ETB Manager', 'Telecaller', 'Internal Sales'] as const;
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

const ContactNumberSchema = z.object({
  value: z.string().regex(/^\d{10}$/, { message: 'Phone number must be 10 digits.' }).or(z.literal(''))
});

export const NewSpokeSchema = z.object({
  name: z.string().min(2, "Lead name is required."),
  anchorId: z.string().min(1, "An anchor must be associated with the lead."),
  contactNumbers: z.array(ContactNumberSchema).optional(),
  email: z.string().email("A valid email is required.").optional().or(z.literal('')),
  
  // Optional fields from now on
  dealValue: z.coerce.number().optional(),
  leadType: z.string().optional(),
  gstin: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zone: z.string().optional(),
  product: z.string().optional(),
  leadSource: z.string().optional(),
  lenderId: z.string().nullable().optional(),
  remarks: z.array(RemarkSchema).optional(),
  leadDate: z.string().optional(),
  spoc: z.string().optional(),
  initialLeadDate: z.string().nullable().optional(),
  tat: z.number().int().optional(),
  priority: z.enum(['High', 'Normal']).optional(),
  assignedTo: z.string().optional().nullable(),
});


export const UpdateSpokeSchema = NewSpokeSchema.partial().extend({
    leadDate: z.date({ invalid_type_error: "Lead Date must be a valid date." }).optional(),
    initialLeadDate: z.date({ invalid_type_error: "Initial Lead Date must be a valid date." }).optional().nullable(),
});


export const NewTaskSchema = z.object({
    title: z.string().min(3, "Task title is required."),
    associatedEntity: z.string().optional(),
    visitTo: z.string().optional(), // For free-form visit plan entries
    planType: z.enum(['Task', 'Visit Plan']),
    type: z.string().min(1, 'Task type is required'),
    dueDate: z.string().refine((val) => {
        if (!val) return false;
        const parsedDate = parse(val, 'dd/MM/yyyy', new Date());
        return isValid(parsedDate);
    }, { message: "Due date is required in dd/mm/yyyy format." }),
    priority: z.string().min(1, 'Priority is required'),
    description: z.string().optional(),
    assignedTo: z.string().optional(),
});


export const NewDailyActivitySchema = z.object({
    userId: z.string().min(1, "A user must be associated with the activity."),
    activityType: z.enum(['Client Meeting', 'Site Visit', 'Sales Presentation', 'Follow-up', 'Administrative', 'Training', 'Networking']),
    title: z.string().min(3, "A title is required for the activity."),
    activityTimestamp: z.string().datetime("A valid timestamp is required."),
    location: z.object({ latitude: z.number(), longitude: z.number() }).nullable().optional(),
    locationAddress: z.string().nullable().optional(),
});

const TerritoryAccessSchema = z.object({
    states: z.array(z.string()),
    cities: z.array(z.string()),
}).optional();

export const NewUserSchema = z.object({
    name: z.string().min(2, "User name is required."),
    email: z.string().email("A valid email is required."),
    role: z.enum(userRoles),
    region: z.enum(regions).optional().or(z.literal('')),
    managerId: z.string().optional(),
    territoryAccess: TerritoryAccessSchema,
});

export const EditUserSchema = z.object({
    name: z.string().min(2, "User name is required."),
    email: z.string().email("A valid email is required.").readonly(),
    role: z.enum(userRoles),
    region: z.enum(regions).optional().or(z.literal('')),
    managerId: z.string().optional().nullable(),
    territoryAccess: TerritoryAccessSchema,
});
