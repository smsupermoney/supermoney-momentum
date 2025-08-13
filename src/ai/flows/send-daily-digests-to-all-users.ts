'use server';
/**
 * @fileOverview A flow to generate and send daily digest emails to all eligible users.
 * This flow is designed to be triggered by a daily scheduler (e.g., Google Cloud Scheduler).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as firestoreService from '@/services/firestore';
import { generateDailyDigest } from './generate-daily-digest-flow';
import { sendNotificationEmail } from './send-notification-email-flow';
import { isPast, isToday } from 'date-fns';
import type { Task, Dealer, Vendor, User } from '@/lib/types';

// This flow doesn't need input schema as it's triggered by a scheduler
const SendDailyDigestsOutputSchema = z.object({
  status: z.string(),
  usersProcessed: z.number(),
  emailsSent: z.number(),
});
export type SendDailyDigestsOutput = z.infer<typeof SendDailyDigestsOutputSchema>;

export async function sendDailyDigestsToAllUsers(): Promise<SendDailyDigestsOutput> {
    return sendDailyDigestsFlow();
}

const sendDailyDigestsFlow = ai.defineFlow(
  {
    name: 'sendDailyDigestsToAllUsersFlow',
    outputSchema: SendDailyDigestsOutputSchema,
  },
  async () => {
    console.log("Starting daily digest flow for all users...");
    const users = await firestoreService.getUsers();
    const tasks = await firestoreService.getTasks();
    const dealers = await firestoreService.getDealers();
    const vendors = await firestoreService.getVendors();

    // Filter for users who should receive digests (e.g., active sales roles)
    const eligibleRoles = ['Area Sales Manager', 'Internal Sales', 'ETB Team', 'Telecaller'];
    const eligibleUsers = users.filter(u => eligibleRoles.includes(u.role) && u.status !== 'Ex-User');

    let emailsSent = 0;

    for (const user of eligibleUsers) {
      try {
        const userTasks = tasks.filter(t => t.assignedTo === user.uid);
        const tasksDueToday = userTasks.filter(t => isToday(new Date(t.dueDate)) && t.status !== 'Completed');
        const overdueTasks = userTasks.filter(t => isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)) && t.status !== 'Completed');

        const now = new Date();
        const yesterday = new Date(now.setDate(now.getDate() - 1));
        const newLeads = [...dealers, ...vendors].filter(lead => 
            lead.assignedTo === user.uid &&
            new Date(lead.createdAt) > yesterday
        ).map(l => ({ id: l.id, name: l.name, type: 'contactNumbers' in l ? 'Dealer' : 'Vendor', status: l.status}));
        
        // Don't send an email if there's nothing to report
        if (tasksDueToday.length === 0 && overdueTasks.length === 0 && newLeads.length === 0) {
            console.log(`No items to report for ${user.name}. Skipping digest.`);
            continue;
        }

        const digest = await generateDailyDigest({
            userName: user.name,
            tasksDueToday: tasksDueToday.map(t => ({id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority})),
            overdueTasks: overdueTasks.map(t => ({id: t.id, title: t.title, dueDate: t.dueDate, priority: t.priority})),
            newLeads: newLeads,
        });

        await sendNotificationEmail({
            to: user.email,
            type: 'DailyDigest',
            context: {
                subject: digest.subject,
                body: digest.body,
            }
        });
        
        console.log(`Successfully sent daily digest to ${user.name}`);
        emailsSent++;
      } catch (error) {
         console.error(`Failed to send daily digest to ${user.name}:`, error);
      }
    }

    return {
        status: 'Completed',
        usersProcessed: eligibleUsers.length,
        emailsSent: emailsSent,
    };
  }
);
