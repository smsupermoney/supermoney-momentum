

'use client';
import { useState, useRef } from 'react';
import { useApp } from '@/contexts/app-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Download } from 'lucide-react';
import type { Dealer, Vendor, SpokeStatus, LeadType as LeadTypeEnum } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { NewSpokeSchema } from '@/lib/validation';
import { z } from 'zod';
import { generateUniqueId } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';

interface BulkUploadDialogProps {
  type: 'Dealer' | 'Vendor';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorId?: string;
}

export function BulkUploadDialog({ type, open, onOpenChange, anchorId }: BulkUploadDialogProps) {
  const { addDealer, addVendor, currentUser, anchors, users, lenders } = useApp();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadErrors, setUploadErrors] = useState<{ row: number; messages: string[] }[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadErrors([]);
    }
  };
  
  const handleClose = () => {
    setSelectedFile(null);
    setUploadErrors([]);
    if(fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  }

  const handleDownloadSample = () => {
    const headers = "Name,Contact Number,Email,City,State,Zone,Anchor Name,Product,Lead Source,Lead Type,Lead Date (DD/MM/YYYY),Status,Assigned To Email,Deal Value (Cr),Lender,Remarks,SPOC,Initial Lead Date (DD/MM/YYYY),TAT";
    const sampleData = type === 'Dealer' 
      ? ["Prime Autos,9876543210,contact@primeautos.com,Mumbai,Maharashtra,West,Reliance Retail,Primary,Connector,Fresh,26/07/2024,New,asm@supermoney.in,0.5,HDFC Bank,Initial discussion positive.,Ramesh Patel,,"]
      : ["Quality Supplies,8765432109,sales@qualitysupplies.co,Bengaluru,Karnataka,South,Tata Motors,BL,Conference / Event,Revive,10/05/2024,Partial Docs,zsm@supermoney.in,0.25,ICICI Bank,Re-engaged after 2 months.,Sunil Gupta,15/11/2023,120"];
    
    const csvContent = [headers, ...sampleData].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sample_${type.toLowerCase()}_upload.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseDate = (dateStr: string | undefined): Date | undefined => {
    if (!dateStr) return undefined;
    const parts = dateStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (!parts) return undefined;
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(parts[3], 10);
    if (day > 0 && day <= 31 && month >= 0 && month < 12 && year > 1900) {
      return new Date(year, month, day);
    }
    return undefined;
  };

  const processCSV = () => {
    if (!selectedFile) {
      toast({ variant: 'destructive', title: 'No file selected', description: 'Please select a CSV file to upload.' });
      return;
    }
    if (!currentUser) return;

    setIsProcessing(true);
    setUploadErrors([]);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1); // Skip header row
      let successCount = 0;
      const errors: { row: number; messages: string[] }[] = [];

      for (const [index, row] of rows.entries()) {
        if (!row.trim()) continue;
        const columns = row.split(',').map(c => c.trim());
        const rowNumber = index + 2;
        
        try {
            const [
              name, contactNumber, email, city, state, zone,
              anchorName, product, leadSource, leadType, leadDateStr,
              statusStr, assignedToEmail, dealValueStr, lenderName, remarksStr,
              spoc, initialLeadDateStr, tatStr
            ] = columns;

            const associatedAnchor = anchorName ? anchors.find(a => a.name.toLowerCase() === anchorName.toLowerCase()) : null;
            const finalAnchorId = anchorId || associatedAnchor?.id || null;
            
            if (anchorName && !associatedAnchor) {
              throw new z.ZodError([{ path: ['anchorName'], message: `Anchor named '${anchorName}' not found.`, code: 'custom' }]);
            }

            const targetUser = assignedToEmail ? users.find(u => u.email.toLowerCase() === assignedToEmail.toLowerCase()) : null;
            const finalAssignedToId = targetUser?.uid || null;
            
            const targetLender = lenderName ? lenders.find(l => l.name.toLowerCase() === lenderName.toLowerCase()) : null;
            
            const parsedLeadDate = parseDate(leadDateStr);
            const parsedInitialLeadDate = parseDate(initialLeadDateStr);

            const rawData = {
              name: name || '',
              contacts: contactNumber ? [{ name: spoc || name || 'Primary Contact', phone: contactNumber, email: email || undefined, designation: '' }] : [],
              anchorId: finalAnchorId,
            };
            
            NewSpokeSchema.parse(rawData);
            
            const commonData: Record<string, any> = {
              leadId: generateUniqueId(type === 'Dealer' ? 'dlr' : 'vnd'),
              name: name,
              contacts: [{ name: spoc || name || 'Primary Contact', phone: contactNumber, email: email, designation: '', id: `contact-${Date.now()}`, isPrimary: true }],
              assignedTo: finalAssignedToId,
              status: finalAssignedToId ? (statusStr as SpokeStatus || 'New') : ('Unassigned Lead' as SpokeStatus),
              anchorId: finalAnchorId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              leadType: (leadType as LeadTypeEnum) || 'Fresh',
            };
            
            if (city) commonData.city = city;
            if (state) commonData.state = state;
            if (zone) commonData.zone = zone;
            if (product) commonData.product = product;
            if (leadSource) commonData.leadSource = leadSource;
            if (targetLender?.id) commonData.lenderId = targetLender.id;
            if (remarksStr) commonData.remarks = [{ text: remarksStr, timestamp: new Date().toISOString(), userName: currentUser.name }];
            if (dealValueStr) commonData.dealValue = parseFloat(dealValueStr);
            if (spoc) commonData.spoc = spoc;
            if (parsedLeadDate) commonData.leadDate = parsedLeadDate.toISOString();
            if (parsedInitialLeadDate) commonData.initialLeadDate = parsedInitialLeadDate.toISOString();
            if (tatStr && !isNaN(parseInt(tatStr, 10))) commonData.tat = parseInt(tatStr, 10);
            if (email) commonData.contacts[0].email = email;

            // Final check to remove any undefined values before sending to Firestore
            Object.keys(commonData).forEach(key => {
                if (commonData[key] === undefined || commonData[key] === null || commonData[key] === '') {
                    delete commonData[key];
                }
            });


            if (type === 'Dealer') {
              await addDealer(commonData as Omit<Dealer, 'id'>);
            } else {
              await addVendor(commonData as Omit<Vendor, 'id'>);
            }
            successCount++;

          } catch (err) {
            if (err instanceof z.ZodError) {
              const errorMessages = Object.entries(err.flatten().fieldErrors).map(([field, messages]) => `${field}: ${messages.join(', ')}`);
              errors.push({ row: rowNumber, messages: errorMessages });
            } else {
              console.error(`Unknown error processing row ${rowNumber}:`, row, err);
              errors.push({ row: rowNumber, messages: ["An unexpected error occurred."] });
            }
          }
        }
      
      setIsProcessing(false);

      if (errors.length > 0) {
        setUploadErrors(errors);
        toast({
          variant: 'destructive',
          title: `Bulk Upload Complete with ${errors.length} Error(s)`,
          description: `Successfully uploaded ${successCount} leads. See details below.`,
          duration: 9000,
        });
      } else {
         toast({
          title: 'Bulk Upload Complete',
          description: `${successCount} ${type.toLowerCase()}s uploaded successfully.`,
        });
        handleClose();
      }
    };

    reader.onerror = () => {
      toast({ variant: 'destructive', title: 'Error reading file', description: 'Could not read the selected file.' });
      setIsProcessing(false);
    };

    reader.readAsText(selectedFile);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Upload {type}s</DialogTitle>
          <DialogDescription>
            Upload a CSV file with lead details. Name, Contact Number and Anchor Name are required.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Button variant="outline" className="w-full" onClick={handleDownloadSample}>
            <Download className="mr-2 h-4 w-4" />
            Download Sample CSV
          </Button>
          <div>
            <Label htmlFor="csv-file">CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef}/>
          </div>
          {uploadErrors.length > 0 && (
            <Alert variant="destructive">
                <AlertTitle>Upload Errors</AlertTitle>
                <AlertDescription>
                    <ScrollArea className="h-24 pr-4">
                        <ul className="text-xs space-y-1">
                          {uploadErrors.map(err => (
                            <li key={err.row}>
                                <strong>Row {err.row}:</strong> {err.messages.join('; ')}
                            </li>
                          ))}
                        </ul>
                    </ScrollArea>
                </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>{t('dialogs.cancel')}</Button>
          <Button onClick={processCSV} disabled={!selectedFile || isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Process File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
