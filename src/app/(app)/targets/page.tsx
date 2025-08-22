
'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isWithinInterval } from 'date-fns';
import type { Target } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// Static team configuration as per the requirement
const TEAMS = [
  { id: 'team-south', name: 'South- Ramesh Siva', leadIds: ['user-id-for-ramesh-siva'], teamLead: 'Ramesh Siva' },
  { id: 'team-north', name: 'North - Kamlesh Gupta', leadIds: ['user-2'], teamLead: 'Kamlesh Gupta' },
  { id: 'team-west', name: 'West-RK', leadIds: ['user-id-for-rajkumar-dhule'], teamLead: 'Rajkumar Dhule'},
  { id: 'team-east', name: 'East & Inside Sales - Harshita', leadIds: ['user-id-for-harshita'], teamLead: 'Harshita' },
  { id: 'team-secondary', name: 'Secondary business - Narayan Jha', leadIds: ['user-id-for-narayan-jha'], teamLead: 'Narayan Jha' },
  { id: 'team-alternate', name: 'Alternate Business - Manish Tiwari', leadIds: ['user-id-for-manish-tiwari'], teamLead: 'Manish Tiwari' },
  { id: 'team-etb', name: 'ETB - Nirbhay', leadIds: ['user-id-for-nirbhay'], teamLead: 'Nirbhay'},
];

const NTB_TEAM_LEADS = ['Ramesh Siva', 'Kamlesh Gupta', 'Rajkumar Dhule', 'Harshita', 'Narayan Jha', 'Manish Tiwari'];


export default function TargetsPage() {
  const { targets, dealers, vendors, users, saveTargets } = useApp();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fixed period from August 1st to October 20th
  const reportingPeriod = {
    start: new Date('2024-08-01'),
    end: new Date('2024-10-20'),
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Start processing from row 2 (index 1) to skip headers
            const newTargets: Target[] = jsonData.slice(2).map((row: any) => {
                const teamName = (row[0] || '').trim();
                const teamConfig = TEAMS.find(t => teamName.includes(t.teamLead));
                
                if (!teamConfig) return null;

                return {
                    id: teamConfig.id,
                    logins: parseInt(row[1], 10) || 0,
                    sanctionLimit: parseFloat(row[2]) || 0,
                    aum: parseFloat(row[3]) || 0,
                    revenue: parseFloat(row[4]) || 0,
                };
            }).filter((t): t is Target => t !== null);

            saveTargets(newTargets);

            toast({
                title: 'Upload Successful',
                description: `${newTargets.length} team targets have been updated.`,
            });
        } catch (error) {
            console.error("Failed to parse Excel file:", error);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Could not process the Excel file. Please ensure it has the correct format.',
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
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
    const teamTarget = targets.find(t => t.id === teamId) || { id: teamId, logins: 0, sanctionLimit: 0, aum: 0, revenue: 0 };
    
    // Get all subordinates for the team lead
    const manager = users.find(u => teamLeadIds.includes(u.uid));
    const subordinateIds = manager ? getAllSubordinates(manager.uid, users).map(u => u.uid) : [];
    const allTeamMemberIds = [...teamLeadIds, ...subordinateIds];
    
    return {
      ...teamTarget,
      achievedLogins: getLoginsAchievement(allTeamMemberIds),
    };
  };

  const tableData = TEAMS.map(team => ({
    name: team.name,
    isNtb: NTB_TEAM_LEADS.includes(team.teamLead),
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
      <PageHeader title="Target vs Achievement Summary" description="Summary for the period of 1st August to 20th October.">
         <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
         <Button onClick={triggerFileUpload} disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload Targets
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px] font-semibold text-foreground">Team</TableHead>
                  <TableHead colSpan={4} className="text-center border-l border-r">Targets till 20th Oct</TableHead>
                  <TableHead colSpan={4} className="text-center">Achievements till Date</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead className="text-center border-l">Logins</TableHead>
                  <TableHead className="text-center">Sanction Limits (Cr)</TableHead>
                  <TableHead className="text-center">AUM (Cr)</TableHead>
                  <TableHead className="text-center border-r">Revenue (Lacs)</TableHead>
                  <TableHead className="text-center">Logins</TableHead>
                  <TableHead className="text-center">Sanction Limits (Cr)</TableHead>
                  <TableHead className="text-center">AUM (Cr)</TableHead>
                  <TableHead className="text-center">Revenue (Lacs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalTableRows.map((row, index) => {
                  if (!row) return null;
                  const isTotalRow = row.name.includes('Total');
                  const isNtbTotal = row.name === 'NTB Total';
                  return (
                    <TableRow key={index} className={cn(isTotalRow && 'bg-secondary font-bold')}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell className="text-center border-l">{row.logins}</TableCell>
                      <TableCell className="text-center">{row.sanctionLimit.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{row.aum.toFixed(2)}</TableCell>
                      <TableCell className="text-center border-r">{row.revenue.toFixed(2)}</TableCell>
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

const getAllSubordinates = (managerId: string, users: User[]): User[] => {
    const subordinates: User[] = [];
    const directReports = users.filter(u => u.managerId === managerId);
    subordinates.push(...directReports);
    directReports.forEach(report => {
        subordinates.push(...getAllSubordinates(report.uid, users));
    });
    return subordinates;
};

