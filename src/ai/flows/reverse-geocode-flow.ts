'use server';
/**
 * @fileOverview An AI agent for reverse geocoding GPS coordinates.
 *
 * - reverseGeocode - A function that converts latitude and longitude into an address.
 * - ReverseGeocodeInput - The input type for the function.
 * - ReverseGeocodeOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReverseGeocodeInputSchema = z.object({
  latitude: z.number().describe("The latitude of the location."),
  longitude: z.number().describe("The longitude of the location."),
});
export type ReverseGeocodeInput = z.infer<typeof ReverseGeocodeInputSchema>;

const ReverseGeocodeOutputSchema = z.object({
  address: z.string().describe("The formatted street address for the given coordinates."),
});
export type ReverseGeocodeOutput = z.infer<typeof ReverseGeocodeOutputSchema>;

export async function reverseGeocode(input: ReverseGeocodeInput): Promise<ReverseGeocodeOutput> {
  return reverseGeocodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reverseGeocodePrompt',
  input: {schema: ReverseGeocodeInputSchema},
  output: {schema: ReverseGeocodeOutputSchema},
  prompt: `You are a reverse geocoding service. Based on the following latitude and longitude, provide the most likely and precise street address.

Latitude: {{{latitude}}}
Longitude: {{{longitude}}}

Your task is to return a single, formatted address string. Do not provide any additional explanation.
`,
});

const reverseGeocodeFlow = ai.defineFlow(
  {
    name: 'reverseGeocodeFlow',
    inputSchema: ReverseGeocodeInputSchema,
    outputSchema: ReverseGeocodeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
