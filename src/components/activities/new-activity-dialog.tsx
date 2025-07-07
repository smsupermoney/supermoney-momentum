
'use client';

import { useState, useRef } from 'react';
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
import { Check, ChevronsUpDown, Loader2, MapPin, Paperclip, Camera, Mic, Square } from 'lucide-react';
import type { DailyActivity, DailyActivityType, UserRole } from '@/lib/types';
import Image from 'next/image';
import { CameraCaptureDialog } from './camera-capture-dialog';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { useLanguage } from '@/contexts/language-context';

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
  logForUserId: z.string().optional(),
});

type NewActivityFormValues = z.infer<typeof formSchema>;

interface NewActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const managerRoles: UserRole[] = ['Admin', 'Zonal Sales Manager', 'Regional Sales Manager', 'National Sales Manager'];

export function NewActivityDialog({ open, onOpenChange }: NewActivityDialogProps) {
  const { currentUser, addDailyActivity, anchors, dealers, vendors, visibleUsers, users } = useApp();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isManager = currentUser && managerRoles.includes(currentUser.role);
  
  const form = useForm<NewActivityFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityType: '',
      title: '',
      associatedEntity: '',
      notes: '',
      logForUserId: currentUser?.uid,
    },
  });

  const allEntities = [
      ...anchors.map(a => ({ value: `anchor:${a.id}`, label: `(Anchor) ${a.name}`, group: 'Anchors' })),
      ...dealers.map(d => ({ value: `dealer:${d.id}`, label: `(Dealer) ${d.name}`, group: 'Dealers' })),
      ...vendors.map(v => ({ value: `vendor:${v.id}`, label: `(Vendor) ${v.name}`, group: 'Vendors' })),
  ];

  const handleClose = () => {
    form.reset({
      logForUserId: currentUser?.uid,
      activityType: '',
      title: '',
      associatedEntity: '',
      notes: '',
    });
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
  
  const handleToggleRecording = async () => {
    if (isRecording) {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = reader.result as string;
                    if (base64Audio) {
                        setIsTranscribing(true);
                        try {
                            const langCode = language === 'hi' ? 'hi-IN' : 'en-US';
                            const result = await transcribeAudio({ audioDataUri: base64Audio, language: langCode });
                            const currentNotes = form.getValues('notes');
                            form.setValue('notes', currentNotes ? `${currentNotes}\n${result.transcription}` : result.transcription);
                            toast({ title: 'Transcription Complete', description: 'Voice note has been added to notes.' });
                        } catch (error) {
                            console.error('Transcription error:', error);
                            toast({ variant: 'destructive', title: 'Transcription Failed', description: 'Could not transcribe the audio.' });
                        } finally {
                            setIsTranscribing(false);
                        }
                    }
                };
                 stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast({ variant: 'destructive', title: 'Microphone Access Denied', description: 'Please enable microphone permissions.' });
        }
    }
  };


  const onSubmit = (values: NewActivityFormValues) => {
    const logForUser = users.find(u => u.uid === values.logForUserId) || currentUser;
    if (!logForUser) return;

    setIsSubmitting(true);
    
    try {
      const newActivity: Partial<DailyActivity> = {
        userId: logForUser.uid,
        userName: logForUser.name,
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

      addDailyActivity(newActivity as Omit<DailyActivity, 'id'>);
      toast({ title: 'Activity Logged', description: `Activity for ${logForUser.name} has been logged.` });
      handleClose();

    } catch (error) {
      console.error("Failed to log activity:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to log your activity. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const locationValue = form.watch('location');

  const voiceButtonContent = () => {
    if (isTranscribing) {
      return <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('activities.form.transcribing')}</>;
    }
    if (isRecording) {
      return <><Square className="mr-2 h-4 w-4" />{t('activities.form.stopRecording')}</>;
    }
    return <><Mic className="mr-2 h-4 w-4" />{t('activities.form.recordVoiceNote')}</>;
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('activities.newDialogTitle')}</DialogTitle>
          <DialogDescription>{t('activities.newDialogDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            
            {isManager && (
              <FormField
                control={form.control}
                name="logForUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Log Activity For</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {visibleUsers.map(user => (
                          <SelectItem key={user.uid} value={user.uid}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('activities.form.activityType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t('activities.form.selectActivityType')} /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Client Meeting">Client Meeting</SelectItem>
                        <SelectItem value="Site Visit">Site Visit</SelectItem>
                        <SelectItem value="Sales Presentation">Sales Presentation</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
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
              <FormItem><FormLabel>{t('activities.form.title')}</FormLabel><FormControl><Input placeholder="e.g. Q3 Proposal with Reliance" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField
                control={form.control}
                name="associatedEntity"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>{t('activities.form.associatedWith')}</FormLabel>
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
                                        : t('activities.form.selectEntity')}
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
                                                  value={`(Anchor) ${anchor.name}`}
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
                                                  value={`(Dealer) ${dealer.name}`}
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
                                                  value={`(Vendor) ${vendor.name}`}
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
              <FormItem><FormLabel>{t('activities.form.notes')}</FormLabel><FormControl><Textarea placeholder="Add details, outcomes, or next steps..." {...field} /></FormControl><FormMessage /></FormItem>
            )}/>

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-sm font-medium">{t('activities.form.attachmentsAndLocation')}</h3>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={handleCaptureLocation} className="w-full">
                        <MapPin className="mr-2 h-4 w-4"/> {t('activities.form.captureLocation')}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleToggleRecording} disabled={isTranscribing} className="w-full">
                        {voiceButtonContent()}
                    </Button>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-2">
                     <Button type="button" variant="outline" asChild className="w-full">
                        <label className="cursor-pointer">
                            <Paperclip className="mr-2 h-4 w-4" /> {t('activities.form.attachFiles')}
                            <Input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelection} />
                        </label>
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCameraOpen(true)} className="w-full">
                        <Camera className="mr-2 h-4 w-4"/> {t('activities.form.takePhoto')}
                    </Button>
                 </div>
                 {locationValue && (
                     <div className="text-xs text-muted-foreground">
                         {t('activities.form.locationCaptured')}
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
              <Button type="button" variant="ghost" onClick={handleClose}>{t('dialogs.cancel')}</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('activities.logNew')}
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
