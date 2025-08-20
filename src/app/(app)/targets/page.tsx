
'use client';

import React from 'react';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isWithinInterval, startOfMonth, parse } from 'date-fns';
import type { Target } from '@/lib/types';
import { cn } from '@/lib/utils';

// Static team configuration as per the requirement
const TEAMS = [
  { id: 'team-south', name: 'South - Ramesh Siva', leadIds: ['user-id-for-ramesh-siva'] },
  { id: 'team-north', name: 'North - Kamlesh Gupta', leadIds: ['user-2'] },
  { id: 'team-west', name: 'West - Rajkumar Dhule', leadIds: ['user-id-for-rajkumar-dhule'] },
  { id: 'team-inside-sales', name: 'Inside Sales - Harshita', leadIds: ['user-id-for-harshita'] },
  { id: 'team-secondary', name: 'Secondary Business - Narayan Jha', leadIds: ['user-id-for-narayan-jha'] },
  { id: 'team-alternate', name: 'Manish - Alternate Products', leadIds: ['user-id-for-manish'] },
  { id: 'team-etb', name: 'ETB – Nirbhay', leadIds: ['user-id-for-nirbhay'] },
];

const NTB_TEAM_IDS = ['team-south', 'team-north', 'team-west', 'team-inside-sales', 'team-secondary', 'team-alternate'];

export default function TargetsPage() {
  const { targets, dealers, vendors } = useApp();

  // Fixed period from August 1st to October 20th
  const reportingPeriod = {
    start: new Date('2024-08-01'),
    end: new Date('2024-10-20'),
  };

  const getLoginsAchievement = (teamLeadIds: string[]) => {
    const relevantLeads = [...dealers, ...vendors].filter(lead => 
      lead.assignedTo && teamLeadIds.includes(lead.assignedTo) && 
      lead.status === 'Login done' &&
      isWithinInterval(new Date(lead.updatedAt || lead.createdAt), reportingPeriod)
    );
    return relevantLeads.length;
  };
  
  const getTeamData = (teamId: string, teamLeadIds: string[]): Target & { achievedLogins: number } => {
    const teamTarget = targets.find(t => t.id === teamId);
    return {
      id: teamId,
      logins: teamTarget?.logins || 0,
      sanctionLimit: teamTarget?.sanctionLimit || 0,
      aum: teamTarget?.aum || 0,
      revenue: teamTarget?.revenue || 0,
      achievedLogins: getLoginsAchievement(teamLeadIds),
    };
  };

  const tableData = TEAMS.map(team => ({
    name: team.name,
    isNtb: NTB_TEAM_IDS.includes(team.id),
    ...getTeamData(team.id, team.leadIds)
  }));
  
  const ntbTotal = tableData
    .filter(row => row.isNtb)
    .reduce((acc, curr) => {
        acc.logins += curr.logins;
        acc.sanctionLimit += curr.sanctionLimit;
        acc.aum += curr.aum;
        acc.revenue += curr.revenue;
        acc.achievedLogins += curr.achievedLogins;
        return acc;
    }, { name: 'NTB Total', logins: 0, sanctionLimit: 0, aum: 0, revenue: 0, achievedLogins: 0, isNtb: false });

  const etbTeam = tableData.find(t => t.id === 'team-etb');
  
  const grandTotal = {
      name: 'Grand Total',
      logins: ntbTotal.logins + (etbTeam?.logins || 0),
      sanctionLimit: ntbTotal.sanctionLimit + (etbTeam?.sanctionLimit || 0),
      aum: ntbTotal.aum + (etbTeam?.aum || 0),
      revenue: ntbTotal.revenue + (etbTeam?.revenue || 0),
      achievedLogins: ntbTotal.achievedLogins + (etbTeam?.achievedLogins || 0)
  };
  
  const finalTableRows = [
    ...tableData.filter(row => row.isNtb),
    ntbTotal,
    etbTeam,
    grandTotal
  ];


  return (
    <>
      <PageHeader title="Target vs Achievement Summary" description="Summary for the period of 1st August to 20th October." />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]"></TableHead>
                  <TableHead colSpan={4} className="text-center border-b">Targets till 20th Oct</TableHead>
                  <TableHead colSpan={4} className="text-center border-b">Achievements till Date</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead className="text-center">Logins</TableHead>
                  <TableHead className="text-center">Sanction Limits (Cr)</TableHead>
                  <TableHead className="text-center">AUM (Cr)</TableHead>
                  <TableHead className="text-center">Revenue Target (Lacs)</TableHead>
                  <TableHead className="text-center">Logins</TableHead>
                  <TableHead className="text-center">Sanction Limits (Cr)</TableHead>
                  <TableHead className="text-center">AUM (Cr)</TableHead>
                  <TableHead className="text-center">Revenue Achievement (Lacs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalTableRows.map((row, index) => {
                  if (!row) return null;
                  const isTotalRow = row.name.includes('Total');
                  return (
                    <TableRow key={index} className={cn(isTotalRow && 'bg-secondary font-bold')}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-center">{row.logins}</TableCell>
                      <TableCell className="text-center">{row.sanctionLimit.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{row.aum.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{row.revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{row.achievedLogins}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{/* Placeholder */}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{/* Placeholder */}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{/* Placeholder */}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
