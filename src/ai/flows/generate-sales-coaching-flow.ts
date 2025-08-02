'use server';
/**
 * @fileOverview An AI agent that acts as a sales coach.
 *
 * - generateSalesCoaching - A function that analyzes sales performance and provides coaching.
 * - GenerateSalesCoachingInput - The input type for the function.
 * - GenerateSalesCoachingOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSalesCoachingInputSchema = z.object({
  salesRepName: z.string(),
  territory: z.string(),
  timePeriod: z.string(),
  targetAmount: z.number(),
  currentAchievement: z.number(),
  achievementPercentage: z.number(),
  daysLeft: z.number(),
  leadMetrics: z.object({
    totalLeads: z.number(),
    qualifiedLeads: z.number(),
    pipelineLeads: z.number(),
    convertedLeads: z.number(),
    conversionRate: z.number(),
  }),
  activityMetrics: z.object({
    meetingsScheduled: z.number(),
    meetingsCompleted: z.number(),
    meetingToConversionRate: z.number(),
    tasksCompleted: z.number(),
    totalTasks: z.number(),
    avgResponseTime: z.number().describe('in hours'),
  }),
  pipelineAnalysis: z.object({
    prospectingCount: z.number(),
    qualificationCount: z.number(),
    proposalCount: z.number(),
    negotiationCount: z.number(),
    avgDealSize: z.number(),
    pipelineVelocity: z.number().describe('in days'),
  }),
});
export type GenerateSalesCoachingInput = z.infer<typeof GenerateSalesCoachingInputSchema>;

const GenerateSalesCoachingOutputSchema = z.object({
  performanceAssessment: z.string().describe("A summary of strengths and gaps."),
  rootCauseAnalysis: z.string().describe("Analysis of underperforming areas."),
  actionRecommendations: z.array(z.string()).describe("Specific, actionable recommendations."),
  targetAchievementProbability: z.string().describe("The probability of hitting the target and what is required."),
  priorityFocusAreas: z.array(z.string()).describe("A list of priority focus areas for the next week."),
});
export type GenerateSalesCoachingOutput = z.infer<typeof GenerateSalesCoachingOutputSchema>;

export async function generateSalesCoaching(input: GenerateSalesCoachingInput): Promise<GenerateSalesCoachingOutput> {
  return generateSalesCoachingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSalesCoachingPrompt',
  input: {schema: GenerateSalesCoachingInputSchema},
  output: {schema: GenerateSalesCoachingOutputSchema},
  prompt: `You are an AI Sales Coach integrated into the Supermoney.in CRM system, specifically designed for the Indian downstream Supply Chain Finance (SCF) platform. Your role is to analyze sales performance data and provide actionable coaching insights to help sales representatives achieve their targets.

Analyze the following sales representative's performance data for {{{timePeriod}}}:

**Sales Rep**: {{{salesRepName}}}
**Territory**: {{{territory}}}
**Monthly Target**: ₹{{{targetAmount}}}
**Current Achievement**: ₹{{{currentAchievement}}} ({{{achievementPercentage}}}%)
**Days Remaining**: {{{daysLeft}}}

**Lead Metrics**:
- Total Leads Allocated: {{{leadMetrics.totalLeads}}}
- Qualified Leads: {{{leadMetrics.qualifiedLeads}}}
- Leads in Pipeline: {{{leadMetrics.pipelineLeads}}}
- Converted Leads: {{{leadMetrics.convertedLeads}}}
- Lead Conversion Rate: {{{leadMetrics.conversionRate}}}%

**Activity Metrics**:
- Meetings Scheduled: {{{activityMetrics.meetingsScheduled}}}
- Meetings Completed: {{{activityMetrics.meetingsCompleted}}}
- Meeting-to-Conversion Rate: {{{activityMetrics.meetingToConversionRate}}}%
- Follow-up Tasks Completed: {{{activityMetrics.tasksCompleted}}}/{{{activityMetrics.totalTasks}}}
- Average Response Time: {{{activityMetrics.avgResponseTime}}} hours

**Pipeline Analysis**:
- Leads in Prospecting: {{{pipelineAnalysis.prospectingCount}}}
- Leads in Qualification: {{{pipelineAnalysis.qualificationCount}}}
- Leads in Proposal: {{{pipelineAnalysis.proposalCount}}}
- Leads in Negotiation: {{{pipelineAnalysis.negotiationCount}}}
- Average Deal Size: ₹{{{pipelineAnalysis.avgDealSize}}}
- Pipeline Velocity: {{{pipelineAnalysis.pipelineVelocity}}} days

Based on this data, provide:
1.  A detailed performance assessment, highlighting both strengths and gaps.
2.  A root cause analysis for any areas of underperformance.
3.  A list of specific, actionable recommendations to address the gaps.
4.  An honest assessment of the target achievement probability and what specific actions are required to meet the target.
5.  A list of priority focus areas for the next week.
`,
});

const generateSalesCoachingFlow = ai.defineFlow(
  {
    name: 'generateSalesCoachingFlow',
    inputSchema: GenerateSalesCoachingInputSchema,
    outputSchema: GenerateSalesCoachingOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
