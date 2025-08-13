
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
import nodemailer from 'nodemailer';

const SendNotificationEmailInputSchema = z.object({
  to: z.string().email().describe("The recipient's email address."),
  type: z.enum(['NewLeadAssignment', 'TaskOverdue', 'NewAnchorAdded', 'DailyDigest']).describe('The type of notification.'),
  context: z.object({
    assigneeName: z.string().optional(),
    leadName: z.string().optional(),
    leadType: z.string().optional(),
    assignerName: z.string().optional(),
    taskTitle: z.string().optional(),
    taskDueDate: z.string().optional(),
    anchorName: z.string().optional(),
    creatorName: z.string().optional(),
    subject: z.string().optional(),
    body: z.string().optional(), // For raw HTML emails like the digest
  }).describe('The context for the notification.'),
});
export type SendNotificationEmailInput = z.infer<typeof SendNotificationEmailInputSchema>;

const SendNotificationEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line for the email.'),
  body: z.string().describe('The plain text or HTML body of the email.'),
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
2.  If the type is 'DailyDigest', the 'subject' and 'body' are already provided in the context. Simply pass them through. The body will be HTML.
3.  For all other types, the tone should be direct and informative.
4.  Do not add salutations like "Hi [Name]," or sign-offs. The email body should be the notification text itself.
5.  The output must be a valid JSON object with 'subject' and 'body' keys.

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
    // Generate the email content using the AI prompt
    const {output: email} = await prompt(input);
    if (!email) {
      throw new Error("Failed to generate email content.");
    }
    
    // Check if email credentials are configured in environment variables
    if (process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_APP_PASSWORD) {
        // Create a transporter object using the default SMTP transport
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_APP_PASSWORD,
          },
        });

        // Send mail with defined transport object
        const mailOptions = {
          from: `"Supermoney Sales Hub" <${process.env.EMAIL_SERVER_USER}>`,
          to: input.to,
          subject: email.subject,
          text: input.type === 'DailyDigest' ? 'Please view this email in an HTML-compatible client.' : email.body,
          html: input.type === 'DailyDigest' ? email.body : undefined,
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          console.log('Email sent: ' + info.response);
        } catch (error) {
          console.error("Failed to send email:", error);
          // Don't throw an error to the client, just log it.
          // The primary function is to log the interaction.
        }
    } else {
        // Fallback to simulation if credentials are not set
        console.log(`--- SIMULATED EMAIL (credentials not configured) ---
To: ${input.to}
Subject: ${email.subject}
Body: ${email.body}
-----------------------`);
    }

    // Return the generated email content regardless of send status
    return email;
  }
);
