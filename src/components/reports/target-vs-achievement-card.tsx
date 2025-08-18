

'use client';

import { useMemo, useState, useEffect } from 'react';
import { useApp } from '@/contexts/app-context';
import type { CustomDashboardConfig, Dealer, Vendor, SpokeStatus, Target, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IndianRupee, GanttChartSquare } from 'lucide-react';
import { format, getMonth, getYear } from 'date-fns';
import { useLanguage } from '@/contexts/language-context';
import { CustomDashboardViewer } from '../admin/custom-dashboard-viewer';

export function TargetVsAchievementCard() {
    const { currentUser, customDashboards } = useApp();
    const { t } = useLanguage();
    
    const displayConfig = useMemo(() => {
        if (!currentUser) return null;
        
        // Find config for the current user (if they are a manager)
        const userConfig = customDashboards.find(d => d.userId === currentUser.uid);
        if (userConfig) return userConfig;

        // If no config for them, find config for their manager
        if (currentUser.managerId) {
            const managerConfig = customDashboards.find(d => d.userId === currentUser.managerId);
            if (managerConfig) return managerConfig;
        }

        return null;
    }, [currentUser, customDashboards]);


    if (!displayConfig) {
        return null;
    }

    return <CustomDashboardViewer config={displayConfig} />;
}
