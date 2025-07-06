
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApp } from '@/contexts/app-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, Loader2, MapPin, Paperclip, Camera } from 'lucide-react';
import type { DailyActivity, DailyActivityType } from '@/lib/types';
import Image from 'next/image';
import { CameraCaptureDialog } from './camera-capture-dialog';

const formSchema = z.object({
  activityType: z.string().min(1, 'Activity type is required'),
  title: z.string().min(3, 'Title is required'),
  associatedEntity: z.string().optional(),
  notes: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  images: z.array(z.string()).optional(),
  activityTimestamp: z.string().optional(),
});

type NewActivityFormValues = z.infer<typeof formSchema>;

interface NewActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewActivityDialog({ open, onOpenChange }: NewActivityDialogProps) {
  const { currentUser, addDailyActivity, anchors, dealers, vendors } = useApp();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const form = useForm<NewActivityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityType: '',
      title: '',
      associatedEntity: '',
      notes: '',
    },
  });

  const allEntities = [
      ...anchors.map(a => ({ value: `anchor:${a.id}`, label: a.name, group: 'Anchors' })),
      ...dealers.map(d => ({ value: `dealer:${d.id}`, label: d.name, group: 'Dealers' })),
      ...vendors.map(v => ({ value: `vendor:${v.id}`, label: v.name, group: 'Vendors' })),
  ];

  const handleClose = () => {
    form.reset();
    setImagePreviews([]);
    onOpenChange(false);
  };
  
  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Geolocation not supported', description: 'Your browser does not support geolocation.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const timestamp = new Date().toISOString();
        form.setValue('location', { latitude, longitude });
        form.setValue('activityTimestamp', timestamp);
        toast({ title: 'Location Captured', description: `Timestamp set to current time.` });
      },
      () => {
        toast({ variant: 'destructive', title: 'Unable to retrieve location', description: 'Please ensure location services are enabled.' });
      }
    );
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPreviews: string[] = [];
    const newImageValues: string[] = [];

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
            newPreviews.push(result);
            newImageValues.push(result);
            if (newPreviews.length === files.length) {
                setImagePreviews(prev => [...prev, ...newPreviews]);
                form.setValue('images', [...(form.getValues('images') || []), ...newImageValues]);
            }
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  const handlePhotoCapture = (imageDataUrl: string) => {
    setImagePreviews(prev => [...prev, imageDataUrl]);
    form.setValue('images', [...(form.getValues('images') || []), imageDataUrl]);
    toast({ title: 'Photo Added', description: 'The photo has been attached to the activity.' });
  };


  const onSubmit = (values: NewActivityFormValues) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    
    try {
      const newActivity: Omit<DailyActivity, 'id'> = {
        userId: currentUser.uid,
        userName: currentUser.name,
        activityType: values.activityType as DailyActivityType,
        title: values.title,
        notes: values.notes,
        activityTimestamp: values.activityTimestamp || new Date().toISOString(),
        location: values.location,
        images: values.images,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (values.associatedEntity) {
        const [type, id] = values.associatedEntity.split(':');
        if (type === 'anchor') {
            const selected = anchors.find(a => a.id === id);
            newActivity.anchorId = id;
            newActivity.anchorName = selected?.name;
        } else if (type === 'dealer') {
            const selected = dealers.find(d => d.id === id);
            newActivity.dealerId = id;
            newActivity.dealerName = selected?.name;
        } else if (type === 'vendor') {
            const selected = vendors.find(v => v.id === id);
            newActivity.vendorId = id;
            newActivity.vendorName = selected?.name;
        }
      }

      addDailyActivity(newActivity);
      toast({ title: 'Activity Logged', description: 'Your activity has been successfully logged.' });
      handleClose();

    } catch (error) {
      console.error("Failed to log activity:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to log your activity. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const locationValue = form.watch('location');

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a New Activity</DialogTitle>
          <DialogDescription>Fill in the details of your sales activity.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select an activity type" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Client Meeting">Client Meeting</SelectItem>
                        <SelectItem value="Site Visit">Site Visit</SelectItem>
                        <SelectItem value="Sales Presentation">Sales Presentation</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                        <SelectItem value="Travel Time">Travel Time</SelectItem>
                        <SelectItem value="Administrative">Administrative</SelectItem>
                        <SelectItem value="Training">Training</SelectItem>
                        <SelectItem value="Networking">Networking</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField name="title" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g. Q3 Proposal with Reliance" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField
                control={form.control}
                name="associatedEntity"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Associated With (Optional)</FormLabel>
                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value
                                        ? allEntities.find(
                                            (entity) => entity.value === field.value
                                          )?.label
                                        : "Select an entity"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search entity..." />
                                    <CommandEmpty>No entity found.</CommandEmpty>
                                    <CommandList>
                                        <CommandGroup heading="Anchors">
                                            {anchors.map((anchor) => (
                                                <CommandItem
                                                  key={anchor.id}
                                                  value={`anchor:${anchor.id}`}
                                                  onSelect={() => {
                                                    form.setValue("associatedEntity", `anchor:${anchor.id}`);
                                                    setComboboxOpen(false);
                                                  }}
                                                >
                                                  <Check className={cn("mr-2 h-4 w-4", field.value === `anchor:${anchor.id}` ? "opacity-100" : "opacity-0")}/>
                                                  {anchor.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandGroup heading="Dealers">
                                             {dealers.map((dealer) => (
                                                <CommandItem
                                                  key={dealer.id}
                                                  value={`dealer:${dealer.id}`}
                                                  onSelect={() => {
                                                    form.setValue("associatedEntity", `dealer:${dealer.id}`);
                                                    setComboboxOpen(false);
                                                  }}
                                                >
                                                   <Check className={cn("mr-2 h-4 w-4", field.value === `dealer:${dealer.id}` ? "opacity-100" : "opacity-0")}/>
                                                  {dealer.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandGroup heading="Vendors">
                                             {vendors.map((vendor) => (
                                                <CommandItem
                                                  key={vendor.id}
                                                  value={`vendor:${vendor.id}`}
                                                  onSelect={() => {
                                                    form.setValue("associatedEntity", `vendor:${vendor.id}`);
                                                    setComboboxOpen(false);
                                                  }}
                                                >
                                                   <Check className={cn("mr-2 h-4 w-4", field.value === `vendor:${vendor.id}` ? "opacity-100" : "opacity-0")}/>
                                                  {vendor.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )}
                />
            
             <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea placeholder="Add details, outcomes, or next steps..." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-sm font-medium">Attachments & Location</h3>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={handleCaptureLocation} className="w-full">
                        <MapPin className="mr-2 h-4 w-4"/> Capture Location & Time
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCameraOpen(true)} className="w-full">
                        <Camera className="mr-2 h-4 w-4"/> Take Photo
                    </Button>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-2">
                     <Button type="button" variant="outline" asChild className="w-full">
                        <label className="cursor-pointer">
                            <Paperclip className="mr-2 h-4 w-4" /> Attach Files
                            <Input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelection} />
                        </label>
                    </Button>
                 </div>
                 {locationValue && (
                     <div className="text-xs text-muted-foreground">
                         📍 Location & Time captured.
                     </div>
                 )}
                 {imagePreviews.length > 0 && (
                     <div className="grid grid-cols-4 gap-2">
                         {imagePreviews.map((src, index) => (
                             <div key={index} className="relative aspect-square">
                                 <Image src={src} alt={`Preview ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md" />
                             </div>
                         ))}
                     </div>
                 )}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Activity
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <CameraCaptureDialog 
        open={isCameraOpen} 
        onOpenChange={setIsCameraOpen} 
        onCapture={handlePhotoCapture}
    />
    </>
  );
}
