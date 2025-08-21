

import { z } from 'zod';
import { parse, isValid } from 'date-fns';


// This file contains Zod schemas for "server-side" validation of data mutations.
// In a real application, these would be used within server actions or cloud functions
// to ensure data integrity before writing to the database.

export const userRoles = ['Admin', 'Area Sales Manager', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager', 'Business Development', 'BIU', 'ETB Team', 'ETB Manager', 'Telecaller', 'Internal Sales'] as const;
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
  remarks: z.record(RemarkSchema).optional(),
  leadDate: z.string().optional(),
  spoc: z.string().optional(),
  initialLeadDate: z.string().nullable().optional(),
  tat: z.number().int().optional(),
  priority: z.enum(['High', 'Normal']).optional(),
  assignedTo: z.string().optional().nullable(),
  internalReferralId: z.string().optional().nullable(),
});


export const UpdateSpokeSchema = NewSpokeSchema.partial().extend({
    contactNumbers: z.array(ContactNumberSchema).optional(),
    leadDate: z.union([z.date(), z.string()]).optional(),
    initialLeadDate: z.union([z.date(), z.string()]).optional().nullable(),
});


export const NewTaskSchema = z.object({
    title: z.string().min(3, "Task title is required."),
    associatedWith: z.object({
        anchorId: z.string().optional(),
        dealerId: z.string().optional(),
        vendorId: z.string().optional(),
    }).optional(),
    visitTo: z.string().optional(),
    planType: z.enum(['Task', 'Visit Plan']),
    type: z.string().min(1, 'Task type is required'),
    dueDate: z.date({ invalid_type_error: "That's not a valid date!"}).optional(),
    priority: z.string().min(1, 'Priority is required'),
    description: z.string().optional(),
    assignedTo: z.string().optional().nullable(),
    createdAt: z.string(),
    status: z.string(),
});


export const NewDailyActivitySchema = z.object({
    userId: z.string().min(1, "A user must be associated with the activity."),
    activityType: z.enum(['Client Meeting', 'Site Visit', 'Sales Presentation', 'Follow-up', 'Administrative', 'Training', 'Networking']),
    title: z.string().min(3, "A title is required for the activity."),
    activityTimestamp: z.string().datetime("A valid timestamp is required.").optional(),
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

// Schema for the custom dashboard configuration form
export const DashboardConfigSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  name: z.string().min(3, "Dashboard name is required."),
  selectedAnchors: z.array(z.string()).min(1, "At least one anchor must be selected."),
  statusToTrack: z.array(z.string()).min(1, "At least one status must be selected."),
  targets: z.record( // Anchor ID
    z.record( // YYYY-MM
      z.object({
        statusCount: z.coerce.number().optional(),
        dealValue: z.coerce.number().optional(),
        sanctionValueTarget: z.coerce.number().optional(),
        sanctionValueAchieved: z.coerce.number().optional(),
        aumValueTarget: z.coerce.number().optional(),
        aumValueAchieved: z.coerce.number().optional(),
      }).optional()
    ).optional()
  ).optional()
}).refine(data => {
    // This custom refinement checks if for at least one selected anchor,
    // there is at least one month target object,
    // and that target object has a defined aumValue.
    if (!data.targets) return true; // Pass if no targets are set yet
    
    return data.selectedAnchors.some(anchorId => {
        const anchorTargets = data.targets?.[anchorId];
        if (!anchorTargets) return false;
        return Object.values(anchorTargets).some(monthlyTarget => monthlyTarget?.aumValueTarget !== undefined && monthlyTarget?.aumValueTarget !== null);
    });
}, {
    message: "At least one anchor must have an AUM target set for at least one month.",
    // You can specify a path to show the error near a specific field,
    // but for a complex cross-field validation, showing it at the root is fine.
    path: ["targets"], 
});
