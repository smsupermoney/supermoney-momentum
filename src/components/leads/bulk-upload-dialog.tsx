
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
import { Loader2, Upload } from 'lucide-react';
import type { Dealer, Vendor } from '@/lib/types';
import { useLanguage } from '@/contexts/language-context';

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
            
            let finalAssignedToId = currentUser.uid;
            if (assignedToEmail) {
                const targetUser = users.find(u => u.email.toLowerCase() === assignedToEmail.toLowerCase());
                if(targetUser) {
                    finalAssignedToId = targetUser.uid;
                } else {
                    console.warn(`Bulk Upload: User with email "${assignedToEmail}" not found. Assigning to current user ${currentUser.name}.`);
                }
            }
            
            const commonData = {
              id: `${type.toLowerCase()}-${Date.now()}-${Math.random()}`,
              name: columns[0],
              contactNumber: columns[1],
              email: columns[2] || undefined,
              gstin: columns[3] || undefined,
              location: columns[4] || undefined,
              product: columns[6] || undefined,
              assignedTo: finalAssignedToId,
              onboardingStatus: 'Invited' as const,
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
            Upload a CSV file with columns: Name, Contact Number, Email, GSTIN, Location, Anchor Name, Product, Assigned To Email. The first row should be headers.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="csv-file">CSV File</Label>
          <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef}/>
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
