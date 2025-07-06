'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/lead-scoring.ts';
import '@/ai/flows/spoke-scoring.ts';
import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/qualify-lead-flow.ts';
import '@/ai/flows/suggest-next-action-flow.ts';
