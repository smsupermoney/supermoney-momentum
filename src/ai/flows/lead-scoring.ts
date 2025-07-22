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
  creditRating: z.string().optional().describe('The most recent publicly available credit rating of the company (e.g., "AAA", "AA+").'),
  ratingAgency: z.string().optional().describe('The name of the credit rating agency that provided the rating.'),
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

You will use this information to score the lead, provide a reason for the score, and find the company's most recent credit rating from public sources.

Score should be from 0 to 100, where 100 is the most likely to convert to an onboarded customer.

Consider the following factors for the score:
- Industry: Some industries are more likely to need supply chain finance than others.
- Lead Source: Some lead sources are more likely to be qualified than others.
- Company Size: Larger companies are more likely to need supply chain finance. A higher annual turnover is a strong positive signal.
- Contact Information: Leads with complete contact information are more likely to be qualified.

# Credit Rating Search
Based on the company's name, industry, and annual turnover, perform a search of public information to find its latest credit rating. You must prioritize the rating agencies in this order:
1.  Credit Rating Information Services of India Ltd. (CRISIL)
2.  Investment Information and Credit Rating Agency of India (ICRA) Ltd.
3.  Any other major Indian rating agency (e.g., CARE, Acuite, Brickwork, India Ratings, INFOMERICS).

If the company is large and well-known (e.g., Tata Motors, Reliance), it's highly likely to have a rating from CRISIL or ICRA. For smaller or less-known companies, it might be from another agency. Find the most recent rating possible (e.g., "AAA", "AA+", "A-", "BBB") and set the 'creditRating' and 'ratingAgency' fields in your response. If no public rating is found, leave these fields blank.

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

Now, provide the lead score, reason, and the retrieved credit rating.`,
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
