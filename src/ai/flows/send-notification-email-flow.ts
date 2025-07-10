'use server';
/**
 * @fileOverview An AI agent for sending notification emails.
 *
 * - sendNotificationEmail - A function that creates the subject and body for a notification.
 * - SendNotificationEmailInput - The input type for the function.
 * - SendNotificationEmailOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendNotificationEmailInputSchema = z.object({
  to: z.string().email().describe("The recipient's email address."),
  type: z.enum(['NewLeadAssignment', 'TaskOverdue', 'NewAnchorAdded']).describe('The type of notification.'),
  context: z.object({
    assigneeName: z.string().optional(),
    leadName: z.string().optional(),
    leadType: z.string().optional(),
    assignerName: z.string().optional(),
    taskTitle: z.string().optional(),
    taskDueDate: z.string().optional(),
    anchorName: z.string().optional(),
    creatorName: z.string().optional(),
  }).describe('The context for the notification.'),
});
export type SendNotificationEmailInput = z.infer<typeof SendNotificationEmailInputSchema>;

const SendNotificationEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line for the email.'),
  body: z.string().describe('The plain text body of the email.'),
});
export type SendNotificationEmailOutput = z.infer<typeof SendNotificationEmailOutputSchema>;

export async function sendNotificationEmail(input: SendNotificationEmailInput): Promise<SendNotificationEmailOutput> {
  return sendNotificationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sendNotificationEmailPrompt',
  input: {schema: SendNotificationEmailInputSchema},
  output: {schema: SendNotificationEmailOutputSchema},
  prompt: `You are an intelligent assistant for the Supermoney Sales Hub. Your task is to generate a concise and professional notification email based on the provided type and context.

# Notification Details
- Type: {{{type}}}
- Context: {{json context}}

# Instructions
1.  Based on the 'type', generate an appropriate 'subject' and 'body'.
2.  The tone should be direct and informative.
3.  Do not add salutations like "Hi [Name]," or sign-offs. The email body should be the notification text itself.
4.  The output must be a valid JSON object with 'subject' and 'body' keys.

# Examples
-   **Type: NewLeadAssignment**
    -   Subject: New {{context.leadType}} Lead Assigned: {{context.leadName}}
    -   Body: You have been assigned a new {{context.leadType}} lead, '{{context.leadName}}', by {{context.assignerName}}. Please review it in the Sales Hub.
-   **Type: TaskOverdue**
    -   Subject: Overdue Task Reminder: {{context.taskTitle}}
    -   Body: This is a reminder that your task, '{{context.taskTitle}}', was due on {{context.taskDueDate}}. Please take action as soon as possible.
-   **Type: NewAnchorAdded**
    -   Subject: New Anchor Added: {{context.anchorName}}
    -   Body: A new anchor, '{{context.anchorName}}', has been added to the system by {{context.creatorName}}.
`,
});

const sendNotificationEmailFlow = ai.defineFlow(
  {
    name: 'sendNotificationEmailFlow',
    inputSchema: SendNotificationEmailInputSchema,
    outputSchema: SendNotificationEmailOutputSchema,
  },
  async (input) => {
    // In a real application, you would add an email sending service call here.
    // e.g., await sendEmailWithSendGrid({ to: input.to, subject: email.subject, body: email.body });
    const {output} = await prompt(input);
    console.log(`--- SIMULATED EMAIL ---
To: ${input.to}
Subject: ${output!.subject}
Body: ${output!.body}
-----------------------`);
    return output!;
  }
);
