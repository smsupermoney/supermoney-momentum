'use server';

/**
 * @fileOverview A spoke (dealer/vendor) lead scoring AI agent.
 *
 * - spokeScoring - A function that scores the spoke lead.
 * - SpokeScoringInput - The input type for the spokeScoring function.
 * - SpokeScoringOutput - The return type for the spokeScoring function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpokeScoringInputSchema = z.object({
  name: z.string().describe('The name of the dealer or vendor company.'),
  product: z.string().optional().describe('The financial product they are interested in.'),
  location: z.string().optional().describe('The location of the company.'),
  anchorName: z.string().optional().describe('The name of the associated anchor company.'),
  anchorIndustry: z.string().optional().describe('The industry of the associated anchor company.'),
});
export type SpokeScoringInput = z.infer<typeof SpokeScoringInputSchema>;

const SpokeScoringOutputSchema = z.object({
  score: z.number().describe('The score of the lead, from 0 to 100.'),
  reason: z.string().describe('The reason for the score, in a concise summary.'),
});
export type SpokeScoringOutput = z.infer<typeof SpokeScoringOutputSchema>;

export async function spokeScoring(input: SpokeScoringInput): Promise<SpokeScoringOutput> {
  return spokeScoringFlow(input);
}

const prompt = ai.definePrompt({
  name: 'spokeScoringPrompt',
  input: {schema: SpokeScoringInputSchema},
  output: {schema: SpokeScoringOutputSchema},
  prompt: `You are an expert sales consultant specializing in supply chain finance. You need to score a dealer or vendor lead.

Score should be from 0 to 100, where 100 is the most likely to convert.

Consider these factors:
- Association with a strong anchor is a very positive signal.
- Interest in core products like SCF (Supply Chain Finance) is better than ancillary ones.
- Location in a major industrial or business hub is a plus.

Lead Name: {{{name}}}
Interested Product: {{{product}}}
Location: {{{location}}}
Associated Anchor: {{{anchorName}}}
Anchor's Industry: {{{anchorIndustry}}}

Provide a score and a concise reason.`,
});

const spokeScoringFlow = ai.defineFlow(
  {
    name: 'spokeScoringFlow',
    inputSchema: SpokeScoringInputSchema,
    outputSchema: SpokeScoringOutputSchema,
  },
  async input => {
    // INFOSEC: In a production environment, implement rate-limiting here
    // to prevent abuse and control costs. For example, using a Redis-backed
    // counter per user or IP address.
    const {output} = await prompt(input);
    return output!;
  }
);
