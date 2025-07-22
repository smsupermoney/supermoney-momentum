// Lead scoring AI agent.

'use server';

/**
 * @fileOverview A lead scoring AI agent.
 *
 * - leadScoring - A function that scores the lead.
 * - LeadScoringInput - The input type for the leadScoring function.
 * - LeadScoringOutput - The return type for the leadScoring function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LeadScoringInputSchema = z.object({
  companyName: z.string().describe('The name of the company.'),
  industry: z.string().describe('The industry of the company.'),
  primaryContactName: z.string().describe('The name of the primary contact.'),
  email: z.string().describe('The email address of the primary contact.'),
  phone: z.string().describe('The phone number of the primary contact.'),
  leadSource: z.string().describe('The source of the lead.'),
  gstin: z.string().optional().describe('The GSTIN of the company.'),
  location: z.string().optional().describe('The location of the company.'),
  annualTurnover: z.number().optional().describe('The annual turnover of the company in Indian Rupees.'),
});

export type LeadScoringInput = z.infer<typeof LeadScoringInputSchema>;

const LeadScoringOutputSchema = z.object({
  score: z.number().describe('The score of the lead, from 0 to 100.'),
  reason: z.string().describe('The reason for the score.'),
  creditRating: z.string().optional().describe('The most recent publicly available long-term credit rating of the company (e.g., "AAA", "AA+").'),
  ratingAgency: z.string().optional().describe('The name of the credit rating agency that provided the rating.'),
  industryBackground: z.string().optional().describe("A brief summary of the company's industry background."),
  financialPerformance: z.string().optional().describe("A brief summary of the company's latest annual financial performance."),
});

export type LeadScoringOutput = z.infer<typeof LeadScoringOutputSchema>;

export async function leadScoring(input: LeadScoringInput): Promise<LeadScoringOutput> {
  return leadScoringFlow(input);
}

const prompt = ai.definePrompt({
  name: 'leadScoringPrompt',
  input: {schema: LeadScoringInputSchema},
  output: {schema: LeadScoringOutputSchema},
  prompt: `You are an expert sales consultant specializing in supply chain finance.

Your task is to analyze a new lead based on the provided details and public information. You will perform the following actions:
1.  **Analyze Public Information**: Conduct an online search for the company '{{{companyName}}}'.
2.  **Summarize Industry Background**: Provide a concise summary of the company's industry background.
3.  **Summarize Financial Performance**: Provide a brief summary of the company's latest reported annual financial performance.
4.  **Find Credit Rating**: Search for the company's long-term credit rating. For example, search for "'{{{companyName}}}' credit rating". Prioritize results from the following Indian rating agencies in this order: CRISIL, ICRA, CARE, Acuite, Brickwork, India Ratings, INFOMERICS. Extract the latest long-term rating (e.g., "AAA", "AA+", "A-", "BBB") and the agency name. If no public rating is found, leave the credit rating fields blank.
5.  **Score the Lead**: Generate a lead score from 0 to 100, where 100 is the most likely to convert.
6.  **Provide a Reason**: Write a summary reason for your score, incorporating your findings on their industry, financials, and credit rating.

# Lead Details
Company Name: {{{companyName}}}
Industry: {{{industry}}}
Annual Turnover (INR): {{{annualTurnover}}}
Primary Contact Name: {{{primaryContactName}}}
Email: {{{email}}}
Phone: {{{phone}}}
Lead Source: {{{leadSource}}}
GSTIN: {{{gstin}}}
Location: {{{location}}}

Now, provide the lead score, reason, and all other requested analytical information.`,
});

const leadScoringFlow = ai.defineFlow(
  {
    name: 'leadScoringFlow',
    inputSchema: LeadScoringInputSchema,
    outputSchema: LeadScoringOutputSchema,
  },
  async input => {
    // INFOSEC: In a production environment, implement rate-limiting here
    // to prevent abuse and control costs. For example, using a Redis-backed
    // counter per user or IP address.
    const {output} = await prompt(input);
    return output!;
  }
);
