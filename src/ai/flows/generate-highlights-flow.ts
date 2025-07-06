'use server';
/**
 * @fileOverview An AI agent for generating sales highlights for a given period.
 *
 * - generateHighlights - A function that creates a list of key insights.
 * - GenerateHighlightsInput - The input type for the function.
 * - GenerateHighlightsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PerformerSchema = z.object({
  name: z.string(),
  value: z.number(),
});

const GenerateHighlightsInputSchema = z.object({
  period: z.string().describe("The reporting period, e.g., 'This Month', 'This Quarter'."),
  totalDealValue: z.number().describe("The total value of deals won in the period."),
  totalLeads: z.number().describe("The total number of new leads generated."),
  totalActivities: z.number().describe("The total number of activities logged."),
  topPerformersByDeals: z.array(PerformerSchema).describe("Top sales performers by number of deals closed."),
  topPerformersByActivities: z.array(PerformerSchema).describe("Top sales performers by number of activities logged."),
  conversionRate: z.number().describe("The lead-to-won conversion rate for the period as a percentage."),
});
export type GenerateHighlightsInput = z.infer<typeof GenerateHighlightsInputSchema>;

const GenerateHighlightsOutputSchema = z.object({
  highlights: z.array(z.string()).describe('An array of 3-5 key highlight strings, each being a concise sentence.'),
});
export type GenerateHighlightsOutput = z.infer<typeof GenerateHighlightsOutputSchema>;

export async function generateHighlights(input: GenerateHighlightsInput): Promise<GenerateHighlightsOutput> {
  return generateHighlightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHighlightsPrompt',
  input: {schema: GenerateHighlightsInputSchema},
  output: {schema: GenerateHighlightsOutputSchema},
  prompt: `You are a sharp and insightful Sales Analyst. Your task is to review the following performance data for a sales team for the period of {{{period}}} and generate 3 to 5 key, concise highlights. Focus on celebrating wins, identifying strong performance, and gently pointing out areas for attention without being negative.

# Performance Data for {{{period}}}

- **Total Deal Value:** {{{totalDealValue}}}
- **Total New Leads:** {{{totalLeads}}}
- **Total Activities Logged:** {{{totalActivities}}}
- **Lead to Won Conversion Rate:** {{{conversionRate}}}%

- **Top Performers (Deals Closed):**
{{#each topPerformersByDeals}}
  - {{this.name}}: {{this.value}} deals
{{else}}
  - No deals were closed this period.
{{/each}}

- **Top Performers (Activities Logged):**
{{#each topPerformersByActivities}}
  - {{this.name}}: {{this.value}} activities
{{else}}
  - No activities were logged this period.
{{/each}}

# Instructions
- Generate a JSON object with a "highlights" array.
- Each highlight should be a single, impactful sentence.
- Mix positive highlights with observational ones.
- If deal value is zero, focus on lead generation and activity.
- If conversion rate is low, you might suggest focusing on lead quality.
- Your tone should be encouraging and data-driven.

# Example Highlights
- "The team achieved an impressive total deal value of [value], with [Top Performer] leading the charge."
- "Lead generation was strong this period, with [number] new opportunities created."
- "[Top Activity Performer] demonstrated excellent prospecting effort with [number] activities logged."
- "While activity is high, our conversion rate of [rate]% suggests a potential focus on lead qualification could yield better results."

Now, analyze the provided data and generate your highlights.
`,
});

const generateHighlightsFlow = ai.defineFlow(
  {
    name: 'generateHighlightsFlow',
    inputSchema: GenerateHighlightsInputSchema,
    outputSchema: GenerateHighlightsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
