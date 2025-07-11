

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
import { format } from 'date-fns';

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };
  
  const handleClose = () => {
    setSelectedFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  }

  const handleDownloadSample = () => {
    const headers = "Name,Contact Number,Email,GSTIN,City,State,Zone,Anchor Name,Product,Lead Source,Lead Type,Lead Date (YYYY-MM-DD),Status,Assigned To Email,Deal Value (Cr),Lender,Remarks,SPOC,Initial Lead Date (YYYY-MM-DD)";
    const sampleData = type === 'Dealer' 
      ? ["Prime Autos,9876543210,contact@primeautos.com,27AAAAA0000A1Z5,Mumbai,Maharashtra,West,Reliance Retail,Primary,Connector,Fresh,2024-07-26,New,asm@supermoney.in,0.5,HDFC Bank,Initial discussion positive.,Ramesh Patel,"]
      : ["Quality Supplies,8765432109,sales@qualitysupplies.co,29BBBBB1111B2Z6,Bengaluru,Karnataka,South,Tata Motors,BL,Conference / Event,Revive,2024-05-10,Partial Docs,zsm@supermoney.in,0.25,ICICI Bank,Re-engaged after 2 months.,Sunil Gupta,2023-11-15"];
    
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


  const processCSV = () => {
    if (!selectedFile) {
      toast({ variant: 'destructive', title: 'No file selected', description: 'Please select a CSV file to upload.' });
      return;
    }
    if (!currentUser) return;

    setIsProcessing(true);
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
              name, contactNumber, email, gstin, city, state, zone,
              anchorName, product, leadSource, leadType, leadDateStr,
              statusStr, assignedToEmail, dealValueStr, lenderName, remarks,
              spoc, initialLeadDateStr
            ] = columns;

            const associatedAnchor = anchorName ? anchors.find(a => a.name.toLowerCase() === anchorName.toLowerCase()) : null;
            const finalAnchorId = anchorId || associatedAnchor?.id || null;

            const targetUser = assignedToEmail ? users.find(u => u.email.toLowerCase() === assignedToEmail.toLowerCase()) : null;
            const finalAssignedToId = targetUser?.uid || null;

            const contactInfo = [];
            if (contactNumber) {
                contactInfo.push({
                    name: name || 'Primary Contact',
                    phone: contactNumber,
                    email: email || undefined,
                    designation: ''
                });
            }
            
            const targetLender = lenderName ? lenders.find(l => l.name.toLowerCase() === lenderName.toLowerCase()) : null;
            
            const rawData = {
              name: name || '',
              dealValue: parseFloat(dealValueStr) || undefined,
              leadType: leadType || undefined,
              leadDate: leadDateStr ? new Date(leadDateStr) : new Date(),
              contacts: contactInfo,
              gstin, city, state, zone, anchorId: finalAnchorId, product, leadSource, 
              lenderId: targetLender?.id || null,
              spoc,
              initialLeadDate: initialLeadDateStr ? new Date(initialLeadDateStr) : undefined,
              remarks: remarks ? [{ text: remarks, timestamp: new Date().toISOString(), userName: currentUser.name }] : [],
            };
            
            const validatedData = NewSpokeSchema.parse(rawData);
            
            const commonData = {
              leadId: generateUniqueId(type === 'Dealer' ? 'dlr' : 'vnd'),
              name: validatedData.name,
              contacts: validatedData.contacts ? validatedData.contacts.map((c, index) => ({...c, id: `contact-${Date.now()}-${index}`, isPrimary: index === 0})) : [],
              gstin: validatedData.gstin,
              city: validatedData.city,
              state: validatedData.state,
              zone: validatedData.zone,
              product: validatedData.product,
              leadSource: validatedData.leadSource,
              lenderId: validatedData.lenderId,
              remarks: validatedData.remarks,
              assignedTo: finalAssignedToId,
              status: finalAssignedToId ? 'New' : ('Unassigned Lead' as SpokeStatus),
              anchorId: finalAnchorId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              leadDate: validatedData.leadDate?.toISOString(),
              leadType: (validatedData.leadType as LeadTypeEnum) || 'Fresh',
              dealValue: validatedData.dealValue || 0,
              spoc: validatedData.spoc,
              initialLeadDate: validatedData.initialLeadDate?.toISOString(),
            };

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
      
      if (errors.length > 0) {
        toast({
          variant: 'destructive',
          title: `Bulk Upload Complete with ${errors.length} Error(s)`,
          description: `Successfully uploaded ${successCount} leads. Check console for error details.`,
          duration: 9000,
        });
        console.error("Bulk Upload Errors:", errors.map(e => `Row ${e.row}: ${e.messages.join('; ')}`).join('\n'));
      } else {
         toast({
          title: 'Bulk Upload Complete',
          description: `${successCount} ${type.toLowerCase()}s uploaded successfully.`,
        });
      }

      setIsProcessing(false);
      handleClose();
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
            Upload a CSV file with lead details. Only Name and Contact Number are required.
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
