import { config } from 'dotenv';
config();

import '@/ai/flows/lead-scoring.ts';
import '@/ai/flows/spoke-scoring.ts';
import '@/ai/flows/transcribe-audio.ts';
