'use server';
/**
 * @fileOverview An AI agent for suggesting the next best action for a sales lead.
 *
 * - suggestNextAction - A function that handles the suggestion process.
 * - SuggestNextActionInput - The input type for the suggestNextAction function.
 * - SuggestNextActionOutput - The return type for the suggestNextAction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InteractionLogEntrySchema = z.object({
  date: z.string().describe("The date of the interaction (e.g., '2023-10-01')."),
  type: z.string().describe("The type of interaction (e.g., 'Email', 'Call')."),
  summary: z.string().describe('A summary of the interaction.'),
});

const SuggestNextActionInputSchema = z.object({
  leadStatus: z.string().describe("The lead's current status in the CRM (e.g., 'Contacted')."),
  interactionLog: z.array(InteractionLogEntrySchema).describe("The lead's interaction history."),
});
export type SuggestNextActionInput = z.infer<typeof SuggestNextActionInputSchema>;

const validActions = [
  "Send Follow-up Email",
  "Schedule a Demo Call",
  "Send Industry Case Study",
  "Address a Specific Question",
  "Nurture (Wait)",
  "Mark as Unqualified"
] as const;

const SuggestNextActionOutputSchema = z.object({
  recommendedAction: z.enum(validActions).describe('The single next best action to take, chosen from the valid actions list.'),
  justification: z.string().describe('A brief justification for why this action is appropriate now.'),
});
export type SuggestNextActionOutput = z.infer<typeof SuggestNextActionOutputSchema>;

export async function suggestNextAction(input: SuggestNextActionInput): Promise<SuggestNextActionOutput> {
  return suggestNextActionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextActionPrompt',
  input: {schema: SuggestNextActionInputSchema},
  output: {schema: SuggestNextActionOutputSchema},
  prompt: `You are a strategic sales coach with years of experience in B2B sales cycles. Your goal is to analyze a lead's complete interaction history and recommend the most impactful next action to move the deal forward.

You must choose from a predefined list of actions and provide a brief justification.

# Valid Actions List
- "Send Follow-up Email"
- "Schedule a Demo Call"
- "Send Industry Case Study"
- "Address a Specific Question"
- "Nurture (Wait)"
- "Mark as Unqualified"

# Lead Data
Current Status: {{{leadStatus}}}

Interaction History:
{{#each interactionLog}}
- Date: {{this.date}}, Type: {{this.type}}, Summary: {{this.summary}}
{{/each}}

# Rules
- The recommended action MUST be one of the strings from the 'Valid Actions List'.
- The justification should explain WHY this action is appropriate now.
- Consider the time elapsed between interactions. A long silence might warrant a follow-up.
- The output MUST be a valid JSON object.
`,
});

const suggestNextActionFlow = ai.defineFlow(
  {
    name: 'suggestNextActionFlow',
    inputSchema: SuggestNextActionInputSchema,
    outputSchema: SuggestNextActionOutputSchema,
  },
  async (input) => {
    // INFOSEC: In a production environment, implement rate-limiting here
    // to prevent abuse and control costs. For example, using a Redis-backed
    // counter per user or IP address.
    const {output} = await prompt(input);
    return output!;
  }
);
