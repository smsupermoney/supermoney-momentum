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
import type { Dealer, Supplier } from '@/lib/types';

interface BulkUploadDialogProps {
  type: 'Dealer' | 'Supplier';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorId?: string;
}

export function BulkUploadDialog({ type, open, onOpenChange, anchorId }: BulkUploadDialogProps) {
  const { addDealer, addSupplier, currentUser } = useApp();
  const { toast } = useToast();
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

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').slice(1); // Skip header row
      let successCount = 0;
      let errorCount = 0;

      rows.forEach(row => {
        const columns = row.split(',');
        // Expected format: Name,Contact Number,GSTIN,Location
        if (columns.length >= 2 && columns[0] && columns[1]) {
          try {
            const commonData = {
              id: `${type.toLowerCase()}-${Date.now()}-${Math.random()}`,
              name: columns[0].trim(),
              contactNumber: columns[1].trim(),
              gstin: columns[2]?.trim() || undefined,
              location: columns[3]?.trim() || undefined,
              assignedTo: currentUser.uid,
              onboardingStatus: anchorId ? 'Invited' : 'Unassigned Lead',
              anchorId: anchorId || null,
              createdAt: new Date().toISOString()
            };

            if (type === 'Dealer') {
              addDealer(commonData as Dealer);
            } else {
              addSupplier(commonData as Supplier);
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
            Upload a CSV file with columns: Name, Contact Number, GSTIN, Location. The first row should be headers.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="csv-file">CSV File</Label>
          <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef}/>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button onClick={processCSV} disabled={!selectedFile || isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Process File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
