'use server';
/**
 * @fileOverview An AI agent for generating a daily summary digest email for a user.
 *
 * - generateDailyDigest - A function that creates the subject and body for a daily digest.
 * - GenerateDailyDigestInput - The input type for the function.
 * - GenerateDailyDigestOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  dueDate: z.string().datetime(),
  priority: z.string(),
});

const LeadSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['Dealer', 'Vendor']),
    status: z.string(),
});

const GenerateDailyDigestInputSchema = z.object({
  userName: z.string().describe("The user's name."),
  tasksDueToday: z.array(TaskSchema).describe('A list of tasks due today.'),
  overdueTasks: z.array(TaskSchema).describe('A list of overdue tasks.'),
  newLeads: z.array(LeadSchema).describe('A list of new leads assigned recently.'),
});
export type GenerateDailyDigestInput = z.infer<typeof GenerateDailyDigestInputSchema>;

const GenerateDailyDigestOutputSchema = z.object({
  subject: z.string().describe('The subject line for the email.'),
  body: z.string().describe('The HTML body of the email.'),
});
export type GenerateDailyDigestOutput = z.infer<typeof GenerateDailyDigestOutputSchema>;

export async function generateDailyDigest(input: GenerateDailyDigestInput): Promise<GenerateDailyDigestOutput> {
  return generateDailyDigestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyDigestPrompt',
  input: {schema: GenerateDailyDigestInputSchema},
  output: {schema: GenerateDailyDigestOutputSchema},
  prompt: `You are an intelligent assistant for the Supermoney Sales Hub. Your task is to generate a concise and helpful daily digest email for a sales user named {{{userName}}}.

The email should be in HTML format.

# User's Data
- User Name: {{{userName}}}
- Tasks Due Today: {{json tasksDueToday}}
- Overdue Tasks: {{json overdueTasks}}
- New Leads Assigned: {{json newLeads}}

# Instructions
1.  Generate a compelling subject line for the email, like "Your Daily Briefing for [Today's Date]".
2.  Generate the HTML body for the email.
3.  The tone should be professional, encouraging, and action-oriented.
4.  If there are overdue tasks, highlight them prominently and with a sense of urgency. Use a red color for overdue items.
5.  If there are no items in a particular section (e.g., no overdue tasks), provide a positive message like "Great job, no overdue tasks!".
6.  The output must be a valid JSON object with 'subject' and 'body' keys.

## Example HTML Body Structure:
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
    .overdue { color: #D9534F; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <h2>Good morning, {{{userName}}}!</h2>
  <p>Here is your daily snapshot from the Sales Hub.</p>
  
  <div class="card">
    <h3 class="title overdue">Overdue Tasks ({{overdueTasks.length}})</h3>
    {{#if overdueTasks}}
      <ul>
      {{#each overdueTasks}}
        <li>{{this.title}} (Due: {{this.dueDate}}, Priority: {{this.priority}})</li>
      {{/each}}
      </ul>
    {{else}}
      <p>Great job, no overdue tasks!</p>
    {{/if}}
  </div>

  <div class="card">
    <h3 class="title">Tasks Due Today ({{tasksDueToday.length}})</h3>
    {{#if tasksDueToday}}
      <ul>
      {{#each tasksDueToday}}
        <li>{{this.title}} (Priority: {{this.priority}})</li>
      {{/each}}
      </ul>
    {{else}}
      <p>No tasks scheduled for today. Time to plan!</p>
    {{/if}}
  </div>

  <div class="card">
    <h3 class="title">New Leads</h3>
     {{#if newLeads}}
      <ul>
      {{#each newLeads}}
        <li>{{this.name}} ({{this.type}}) - Status: {{this.status}}</li>
      {{/each}}
      </ul>
    {{else}}
      <p>No new leads assigned recently.</p>
    {{/if}}
  </div>
</body>
</html>
\`\`\`
`,
});

const generateDailyDigestFlow = ai.defineFlow(
  {
    name: 'generateDailyDigestFlow',
    inputSchema: GenerateDailyDigestInputSchema,
    outputSchema: GenerateDailyDigestOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
