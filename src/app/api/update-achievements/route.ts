
// /src/app/api/update-achievements/route.ts
import { NextResponse } from 'next/server';
import { getDashboardConfigs, updateDashboardConfig, getUsers } from '@/services/firestore';
import type { CustomDashboardConfig, User } from '@/lib/types';

// This is your secret token. It must be set in your .env.local file.
// ANYONE with this token can update your data, so keep it secret.
const API_SECRET_TOKEN = process.env.API_SECRET_TOKEN;

// A simple mapping from the names in your Excel sheet to the manager names in the CRM.
// This might need adjustment if the names are not exact matches.
const TEAM_LEAD_TO_MANAGER_NAME_MAP: Record<string, string> = {
    'South- Ramesh Siva': 'Ramesh Siva',
    'North - Kamlesh Gupta': 'Kamlesh Gupta',
    'West-RK': 'Rajkumar Dhule',
    'East & Inside Sales - Harshita': 'Harshita',
    'Secondary business - Narayan Jha': 'Narayan Jha',
    'Alternate Business - Manish Tiwari': 'Manish Tiwari',
    'ETB - Nirbhay': 'Nirbhay'
};


export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!API_SECRET_TOKEN || authHeader !== `Bearer ${API_SECRET_TOKEN}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { updates, month } = payload; // month should be in 'YYYY-MM' format

    if (!Array.isArray(updates) || !month) {
        return NextResponse.json({ success: false, message: 'Invalid payload structure. "updates" array and "month" are required.' }, { status: 400 });
    }

    const configs = await getDashboardConfigs();
    const users = await getUsers();
    let updatedCount = 0;

    for (const update of updates) {
        const managerName = TEAM_LEAD_TO_MANAGER_NAME_MAP[update.team];
        if (!managerName) continue;

        const manager = users.find(u => u.name === managerName);
        if (!manager) continue;

        const configToUpdate = configs.find(c => c.userId === manager.uid);
        if (!configToUpdate) continue;

        // The logic here updates all selected anchors for the manager with the same achievement values.
        // This assumes the achievement data is at the manager level, not per-anchor.
        for (const anchorId of configToUpdate.selectedAnchors) {
            if (!configToUpdate.targets[anchorId]) {
                configToUpdate.targets[anchorId] = {};
            }
            if (!configToUpdate.targets[anchorId][month]) {
                 configToUpdate.targets[anchorId][month] = {};
            }
            
            configToUpdate.targets[anchorId][month]!.sanctionValueAchieved = parseFloat(update.sanctionLimit) || 0;
            configToUpdate.targets[anchorId][month]!.aumValueAchieved = parseFloat(update.aum) || 0;
        }

        await updateDashboardConfig(configToUpdate);
        updatedCount++;
    }

    if (updatedCount > 0) {
        return NextResponse.json({ success: true, message: `Successfully updated achievements for ${updatedCount} team(s).` });
    } else {
        return NextResponse.json({ success: false, message: 'No matching teams found to update.' }, { status: 404 });
    }

  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
