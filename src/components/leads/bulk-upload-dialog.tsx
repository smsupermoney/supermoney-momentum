
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
import type { Dealer, Vendor } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';
import { generateLeadId } from '@/lib/utils';
import { NewSpokeSchema } from '@/lib/validation';
import { z } from 'zod';

interface BulkUploadDialogProps {
  type: 'Dealer' | 'Vendor';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorId?: string;
}

export function BulkUploadDialog({ type, open, onOpenChange, anchorId }: BulkUploadDialogProps) {
  const { addDealer, addVendor, currentUser, anchors, users } = useApp();
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
    const headers = "Name,Contact Number,Email,GSTIN,Location,Anchor Name,Product,Lead Source,Assigned To Email,Deal Value (Lakhs)";
    const sampleData = type === 'Dealer' 
      ? ["Prime Autos,9876543210,contact@primeautos.com,27AAAAA0000A1Z5,Mumbai,Reliance Retail,SCF - Primary,Connector,asm@supermoney.in,50"]
      : ["Quality Supplies,8765432109,sales@qualitysupplies.co,29BBBBB1111B2Z6,Bengaluru,Tata Motors,BL,Conference / Event,zsm@supermoney.in,25"];
    
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
      let errorCount = 0;

      for (const row of rows) {
        const columns = row.split(',').map(c => c.trim());
        if (columns.length >= 2 && columns[0] && columns[1]) {
          try {
            const anchorName = (columns[5] || '').trim();
            const leadSource = (columns[7] || '').trim();
            const assignedToEmail = (columns[8] || '').trim();
            const dealValueStr = (columns[9] || '').trim();
            const dealValue = dealValueStr ? parseInt(dealValueStr, 10) : undefined;

            const associatedAnchor = anchorName ? anchors.find(a => a.name.toLowerCase() === anchorName.toLowerCase()) : null;
            const finalAnchorId = anchorId || associatedAnchor?.id || null;
            
            const targetUser = users.find(u => u.email.toLowerCase() === assignedToEmail.toLowerCase());
            const finalAssignedToId = targetUser ? targetUser.uid : null;
            
            const commonData: Omit<Dealer | Vendor, 'id'> = {
              name: columns[0],
              contactNumber: columns[1],
              assignedTo: finalAssignedToId,
              status: finalAssignedToId ? 'New' as const : 'Unassigned Lead' as const,
              anchorId: finalAnchorId,
              createdAt: new Date().toISOString(),
              leadType: 'New' as const,
              leadId: generateLeadId(),
            };
            
            if (columns[2]) commonData.email = columns[2];
            if (columns[3]) commonData.gstin = columns[3];
            if (columns[4]) commonData.location = columns[4];
            if (columns[6]) commonData.product = columns[6];
            if (leadSource) commonData.leadSource = leadSource;
            if (dealValue !== undefined && !isNaN(dealValue)) commonData.dealValue = dealValue;
            

            if (type === 'Dealer') {
              await addDealer(commonData as Omit<Dealer, 'id'>);
            } else {
              await addVendor(commonData as Omit<Vendor, 'id'>);
            }
            successCount++;
          } catch (err) {
            console.error("Error processing row:", row, err);
            errorCount++;
          }
        } else if (row.trim() !== '') {
            errorCount++;
        }
      }
      
      toast({
        title: 'Bulk Upload Complete',
        description: `${successCount} ${type.toLowerCase()}s uploaded successfully. ${errorCount} rows failed.`,
      });
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
            Upload a CSV file. Only <b>Name</b> and <b>Contact Number</b> are mandatory. Optional columns include: Email, GSTIN, Location, Anchor Name, Product, Lead Source, Assigned To Email, and Deal Value (Lakhs).
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
