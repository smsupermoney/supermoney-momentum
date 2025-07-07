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
});

export type LeadScoringInput = z.infer<typeof LeadScoringInputSchema>;

const LeadScoringOutputSchema = z.object({
  score: z.number().describe('The score of the lead, from 0 to 100.'),
  reason: z.string().describe('The reason for the score.'),
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

You will use this information to score the lead, and provide a reason for the score.

Score should be from 0 to 100, where 100 is the most likely to convert to an onboarded customer.

Consider the following factors:

- Industry: Some industries are more likely to need supply chain finance than others.
- Lead Source: Some lead sources are more likely to be qualified than others.
- Company Size: Larger companies are more likely to need supply chain finance.
- Contact Information: Leads with complete contact information are more likely to be qualified.

Company Name: {{{companyName}}}
Industry: {{{industry}}}
Primary Contact Name: {{{primaryContactName}}}
Email: {{{email}}}
Phone: {{{phone}}}
Lead Source: {{{leadSource}}}
GSTIN: {{{gstin}}}
Location: {{{location}}}

Score:`,
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
