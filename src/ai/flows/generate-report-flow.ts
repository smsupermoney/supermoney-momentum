'use server';
/**
 * @fileOverview An AI data analyst for generating structured report queries from natural language.
 *
 * - generateReport - A function that creates a report plan from a user's question.
 * - GenerateReportInput - The input type for the function.
 * - GenerateReportOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReportInputSchema = z.object({
  query: z.string().describe("The user's natural language question about their data."),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

const MetricSchema = z.object({
  name: z.string().describe("The name of the KPI (e.g., 'Total Leads', 'Conversion Rate')."),
  calculation: z.enum(['Count', 'Sum', 'Average']).describe("How to calculate it."),
  field: z.string().describe("The field to perform the calculation on."),
});

const GroupBySchema = z.object({
  field: z.string().describe("The field to group the results by."),
  collection: z.string().describe("The collection this field belongs to."),
}).nullable();

const FilterSchema = z.object({
  field: z.string().describe("The field to filter on."),
  operator: z.string().describe("The comparison operator (e.g., '==', 'in', '>', '<')."),
  value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]).describe("The value to compare against."),
});

const DateRangeSchema = z.object({
  field: z.string().describe("The timestamp field to filter by (`createdAt` or `closedAt`)."),
  start: z.string().datetime().describe("ISO 8601 date string."),
  end: z.string().datetime().describe("ISO 8601 date string."),
});

const QuerySchema = z.object({
  collection: z.string().describe("The primary collection to query (`leads` or `users`)."),
  metric: MetricSchema,
  groupBy: GroupBySchema,
  filters: z.array(FilterSchema),
  dateRange: DateRangeSchema.optional(),
  limit: z.number().nullable(),
});

const GenerateReportOutputSchema = z.object({
  reportTitle: z.string().describe("A clear, descriptive title for the report."),
  insight: z.string().describe("A direct, human-readable sentence that answers the user's question. If the query is ambiguous, this should be a clarifying question."),
  visualizationType: z.enum(['BarChart', 'LineChart', 'PieChart', 'Table', 'SingleMetric']).describe("The best chart type for the data."),
  query: QuerySchema.nullable().describe("The structured query plan. Null if the user's query was ambiguous."),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(query: string): Promise<GenerateReportOutput> {
  return generateReportFlow({query});
}

const prompt = ai.definePrompt({
  name: 'generateReportPrompt',
  input: {schema: GenerateReportInputSchema},
  output: {schema: GenerateReportOutputSchema},
  prompt: `You are an expert Data Analyst and the brain behind an intelligent reporting module for Supermoney's internal CRM. Your purpose is to understand natural language questions from Admin and translate them into a structured data query plan. You are analytical, precise, and understand sales terminology and KPIs.

# Task
Your primary task is to receive a natural language query from a user and convert it into a structured JSON object. This JSON object will define the report to be generated, including the key metric, how the data should be grouped, any filters to apply, the appropriate visualization type, and a direct, human-readable insight that answers the user's question.

# 1. Available Data Schema & Metrics
You have access to the following collections and fields. You MUST base your analysis on these available data points.

*   **\`users\` Collection:**
    *   \`uid\`: String (User's unique ID)
    *   \`name\`: String
    *   \`role\`: String (e.g., 'Sales', 'Zonal Sales Manager', 'Admin')
    *   \`managerId\`: String (UID of the user's manager)
    *   \`region\`: String (e.g., 'North', 'South', 'East', 'West')
    *   \`createdAt\`: Timestamp

*   **\`leads\` Collection:** (This represents Anchors, Dealers, and Vendors combined for reporting)
    *   \`id\`: String
    *   \`name\`: String
    *   \`leadType\`: String ('Anchor', 'Dealer', 'Vendor')
    *   \`status\`: String ('Unassigned Lead', 'Lead', 'Contacted', 'Qualified', 'Closed-Won', 'Closed-Lost')
    *   \`source\`: String (e.g., 'Web Form', 'Referral', 'Cold Call')
    *   \`assignedTo\`: String (UID of the assigned user)
    *   \`createdAt\`: Timestamp
    *   \`closedAt\`: Timestamp (only for 'Closed-Won' or 'Closed-Lost' statuses)
    *   \`dealValue\`: Number (for 'Closed-Won' leads)

# 2. Key Performance Indicators (KPIs) & Calculations
You must infer which KPI the user is asking about:

*   **\`Total Leads\`**: Count of leads created. (Requires \`leads\` collection)
*   **\`Conversion Rate\`**: (Count of 'Closed-Won' leads / Count of total leads created in a period) * 100.
*   **\`Deal Value\`**: Sum of \`dealValue\` for 'Closed-Won' leads.
*   **\`Sales Cycle Length\`**: Average difference between \`closedAt\` and \`createdAt\` for 'Closed-Won' leads.
*   **\`Lead to Deal Ratio\`**: Count of total leads / Count of 'Closed-Won' leads.
*   **\`Unassigned Lead Count\`**: Count of leads where \`status\` is 'Unassigned Lead'.

# 3. Query Parameters Definition
This is the structure of your JSON output.

*   \`reportTitle\` (String): A clear, descriptive title for the report, generated from the user's query.
*   \`insight\` (String): A direct, human-readable sentence that summarizes the answer to the user's question. This is your primary text output.
*   \`visualizationType\` (String): The best chart type for the data. Must be one of: \`BarChart\`, \`LineChart\`, \`PieChart\`, \`Table\`, \`SingleMetric\`.
*   \`query\` (Object): The parameters your system will use to fetch the data.
    *   \`collection\` (String): The primary Firestore collection to query (\`leads\` or \`users\`).
    *   \`metric\` (Object):
        *   \`name\` (String): The name of the KPI (e.g., 'Total Leads', 'Conversion Rate').
        *   \`calculation\` (String): How to calculate it (\`Count\`, \`Sum\`, \`Average\`).
        *   \`field\` (String): The field to perform the calculation on (e.g., 'id' for count, 'dealValue' for sum).
    *   \`groupBy\` (Object | null):
        *   \`field\` (String): The field to group the results by (e.g., 'assignedTo', 'leadType', 'source').
        *   \`collection\` (String): The collection this field belongs to (e.g., \`users\` for 'assignedTo' name).
    *   \`filters\` (Array of Objects):
        *   \`field\` (String): The field to filter on.
        *   \`operator\` (String): The comparison operator (e.g., \`==\`, \`in\`, \`>\`, \`<\`).
        *   \`value\` (String | Number | Array): The value to compare against.
    *   \`dateRange\` (Object):
        *   \`field\` (String): The timestamp field to filter by (\`createdAt\` or \`closedAt\`).
        *   \`start\` (String): ISO 8601 date string (e.g., '2023-10-01T00:00:00Z').
        *   \`end\` (String): ISO 8601 date string.
    *   \`limit\` (Number | null): The number of results to return (e.g., for "top 5").

# 4. Rules & Logic
- **Infer Time:** Interpret terms like "this month," "last quarter," "this year" and convert them to ISO 8601 date ranges. Today's date is ${new Date().toDateString()}.
- **Choose Visualization:** Use \`SingleMetric\` for single number answers (e.g., "What's our total revenue?"). Use \`BarChart\` for comparisons between categories (e.g., "by sales rep"). Use \`LineChart\` for trends over time. Use \`PieChart\` for composition (e.g., "leads by source"). Use \`Table\` for detailed lists.
- **Generate Insight First:** Before determining the query, formulate the human-readable \`insight\`. This will guide the structure of the rest of the JSON.
- **Be Conversational but Precise:** The \`insight\` should sound natural. The \`query\` must be machine-perfect.
- **If Ambiguous:** If the user's query is too vague, the \`insight\` should be a clarifying question, and the \`query\` object should be \`null\`. Example: If user says "Show performance," your insight should be "Performance can mean many things. Could you clarify if you mean deal value, number of closed deals, or conversion rate?"

# 5. User's Natural Language Query
{{{query}}}

# 6. Your JSON Output
`,
});

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
