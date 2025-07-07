'use server';
/**
 * @fileOverview An AI agent for qualifying leads based on an Ideal Customer Profile (ICP).
 *
 * - qualifyLead - A function that handles the lead qualification process.
 * - QualifyLeadInput - The input type for the qualifyLead function.
 * - QualifyLeadOutput - The return type for the qualifyLead function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QualifyLeadInputSchema = z.object({
  companyName: z.string().describe("The lead's company name."),
  industry: z.string().describe("The lead's industry."),
  companySize: z.number().describe('The number of employees in the company.'),
  contactName: z.string().describe("The contact's name."),
  contactRole: z.string().describe("The contact's job title."),
  inquirySource: z.string().describe("The source of the inquiry (e.g., 'Web Form')."),
  inquiryText: z.string().describe("The text from the 'message' field of the contact form."),
});
export type QualifyLeadInput = z.infer<typeof QualifyLeadInputSchema>;

const QualifyLeadOutputSchema = z.object({
  score: z.number().int().min(1).max(10).describe('An integer score from 1 (very poor fit) to 10 (perfect fit).'),
  justification: z.string().describe('A concise, one-sentence justification for the score.'),
});
export type QualifyLeadOutput = z.infer<typeof QualifyLeadOutputSchema>;

export async function qualifyLead(input: QualifyLeadInput): Promise<QualifyLeadOutput> {
  return qualifyLeadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'qualifyLeadPrompt',
  input: {schema: QualifyLeadInputSchema},
  output: {schema: QualifyLeadOutputSchema},
  prompt: `You are an expert Sales Development Representative at a B2B software company. Your expertise is in rapidly qualifying inbound leads to determine if they are a good fit for the sales team.

Analyze the provided lead data against our Ideal Customer Profile (ICP). Your task is to provide a numerical quality score from 1 (very poor fit) to 10 (perfect fit) and a concise, one-sentence justification for that score.

# Ideal Customer Profile (ICP)
Our company sells a high-end project management solution. We are most successful with:
- Industries: Technology, Manufacturing, Marketing Agencies.
- Company Size: 50 - 1000 employees.
- Role of Inquirer: Project Manager, C-level executive, Head of Operations.
- Expressed Need: Clear mention of issues with project tracking, team collaboration, or resource management.

# Input Data
Company Name: {{{companyName}}}
Industry: {{{industry}}}
Company Size: {{{companySize}}}
Contact Name: {{{contactName}}}
Contact Role: {{{contactRole}}}
Inquiry Source: {{{inquirySource}}}
Inquiry Text: {{{inquiryText}}}

# Rules
- The score MUST be an integer between 1 and 10.
- The justification MUST be a single, clear sentence.
- Base your score primarily on how well the lead matches the ICP.
- The output MUST be a valid JSON object.
`,
});

const qualifyLeadFlow = ai.defineFlow(
  {
    name: 'qualifyLeadFlow',
    inputSchema: QualifyLeadInputSchema,
    outputSchema: QualifyLeadOutputSchema,
  },
  async (input) => {
    // INFOSEC: In a production environment, implement rate-limiting here
    // to prevent abuse and control costs. For example, using a Redis-backed
    // counter per user or IP address.
    const {output} = await prompt(input);
    return output!;
  }
);
