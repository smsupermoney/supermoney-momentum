'use server';
/**
 * @fileOverview An AI agent for generating a customized onboarding plan for new customers.
 *
 * - generateOnboardingPlan - A function that creates a list of onboarding tasks.
 * - GenerateOnboardingPlanInput - The input type for the function.
 * - GenerateOnboardingPlanOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOnboardingPlanInputSchema = z.object({
  customerName: z.string().describe("The new customer's name."),
  customerType: z.enum(['Anchor', 'Dealer', 'Vendor']).describe("The type of the customer."),
});
export type GenerateOnboardingPlanInput = z.infer<typeof GenerateOnboardingPlanInputSchema>;

const OnboardingTaskSchema = z.object({
    taskName: z.string().describe('The name of the onboarding task.'),
    isCompleted: z.boolean().describe('Whether the task is completed. Defaults to false.'),
});

const GenerateOnboardingPlanOutputSchema = z.object({
  tasks: z.array(OnboardingTaskSchema).describe('The list of onboarding tasks.'),
});
export type GenerateOnboardingPlanOutput = z.infer<typeof GenerateOnboardingPlanOutputSchema>;

export async function generateOnboardingPlan(input: GenerateOnboardingPlanInput): Promise<GenerateOnboardingPlanOutput> {
  return generateOnboardingPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOnboardingPlanPrompt',
  input: {schema: GenerateOnboardingPlanInputSchema},
  output: {schema: GenerateOnboardingPlanOutputSchema},
  prompt: `You are a meticulous Onboarding Specialist. Your job is to create a comprehensive and customized onboarding plan for new customers based on their type.

# Task
Generate a JSON array of onboarding tasks for the new customer. The list should include all standard tasks plus any tasks specific to the customer's type.

# Customer
- Name: {{{customerName}}}
- Type: {{{customerType}}}

# Standard Onboarding Tasks (for all customer types)
- Send Welcome Email
- Schedule Kickoff Call
- Grant Platform Access

# Customer-Type Specific Tasks
- If type is 'Anchor': Add a task for 'Technical Integration Scoping'.
- If type is 'Dealer': Add a task for 'Product Catalog Setup'.
- If type is 'Vendor': Add tasks for 'Collect KYC Documents' and 'Sign Vendor Agreement'.

# Rules
- The output MUST be a JSON object containing a 'tasks' array.
- Each object in the 'tasks' array must have a 'taskName' (string) and 'isCompleted' (boolean, default to false).
- The list must include all standard tasks AND the relevant type-specific tasks.
- Ensure the final output is a valid JSON object.
`,
});

const generateOnboardingPlanFlow = ai.defineFlow(
  {
    name: 'generateOnboardingPlanFlow',
    inputSchema: GenerateOnboardingPlanInputSchema,
    outputSchema: GenerateOnboardingPlanOutputSchema,
  },
  async (input) => {
    // INFOSEC: In a production environment, implement rate-limiting here
    // to prevent abuse and control costs. For example, using a Redis-backed
    // counter per user or IP address.
    const {output} = await prompt(input);
    return output!;
  }
);
