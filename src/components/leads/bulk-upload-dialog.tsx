
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
    const headers = "Name,Contact Number,Email,GSTIN,Location,Anchor Name,Product,Assigned To Email";
    const sampleData = type === 'Dealer' 
      ? ["Prime Autos,9876543210,contact@primeautos.com,27AAAAA0000A1Z5,Mumbai,Reliance Retail,SCF - Primary,asm@supermoney.in"]
      : ["Quality Supplies,8765432109,sales@qualitysupplies.co,29BBBBB1111B2Z6,Bengaluru,Tata Motors,BL,zsm@supermoney.in"];
    
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

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1); // Skip header row
      let successCount = 0;
      let errorCount = 0;

      rows.forEach(row => {
        const columns = row.split(',').map(c => c.trim());
        // Expected format: Name, Contact Number, Email, GSTIN, Location, Anchor Name, Product, Assigned To Email
        if (columns.length >= 2 && columns[0] && columns[1]) {
          try {
            const anchorName = (columns[5] || '').trim();
            const assignedToEmail = (columns[7] || '').trim();

            const associatedAnchor = anchorName ? anchors.find(a => a.name.toLowerCase() === anchorName.toLowerCase()) : null;
            const finalAnchorId = anchorId || associatedAnchor?.id || null;
            
            const targetUser = users.find(u => u.email.toLowerCase() === assignedToEmail.toLowerCase());
            const finalAssignedToId = targetUser ? targetUser.uid : null;
            
            const commonData = {
              id: `${type.toLowerCase()}-${Date.now()}-${Math.random()}`,
              leadId: generateLeadId(),
              name: columns[0],
              contactNumber: columns[1],
              email: columns[2] || undefined,
              gstin: columns[3] || undefined,
              location: columns[4] || undefined,
              product: columns[6] || undefined,
              assignedTo: finalAssignedToId,
              status: finalAssignedToId ? 'Invited' as const : 'Unassigned Lead' as const,
              anchorId: finalAnchorId,
              createdAt: new Date().toISOString(),
              leadType: 'New Lead' as const,
            };

            if (type === 'Dealer') {
              addDealer(commonData as Dealer);
            } else {
              addVendor(commonData as Vendor);
            }
            successCount++;
          } catch (err) {
            errorCount++;
          }
        } else if (row.trim() !== '') {
            errorCount++;
        }
      });
      
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
            Upload a CSV file with columns: <b>Name, Contact Number, Email, GSTIN, Location, Anchor Name, Product, Assigned To Email</b>. Download our sample file to ensure the format is correct.
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


    