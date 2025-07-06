'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Camera, VideoOff, Check, SwitchCamera } from 'lucide-react';

interface CameraCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageDataUrl: string) => void;
}

export function CameraCaptureDialog({ open, onOpenChange, onCapture }: CameraCaptureDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);
  
  const getStream = useCallback(async () => {
      // Stop any previous stream before starting a new one
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        
        setVideoDevices(videoInputs);
        const deviceId = videoInputs.length > 0 ? videoInputs[currentDeviceIndex].deviceId : undefined;

        const constraints: MediaStreamConstraints = {
          video: deviceId 
            ? { deviceId: { exact: deviceId } } 
            : { facingMode: { ideal: "environment" } } // Prefer back camera if available
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        setStream(mediaStream);
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions.',
        });
      }
  }, [currentDeviceIndex, stream, toast]);

  useEffect(() => {
    if (open && !capturedImage) {
        getStream();
    }
    if (!open) {
        stopStream();
    }
  }, [open, capturedImage, getStream, stopStream]);


  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
        stopStream();
      }
    }
  };
  
  const handleSwitchCamera = () => {
    if (videoDevices.length > 1) {
      setCurrentDeviceIndex((prevIndex) => (prevIndex + 1) % videoDevices.length);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onOpenChange(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // The useEffect will call getStream() since capturedImage is now null
  };
  
  const handleClose = () => {
    stopStream();
    setCurrentDeviceIndex(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Take a Photo</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
          {capturedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capturedImage} alt="Captured" className="h-full w-full object-cover" />
          ) : (
            <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
          )}

          {!capturedImage && videoDevices.length > 1 && (
            <Button
                size="icon"
                variant="outline"
                className="absolute bottom-2 right-2 rounded-full bg-background/50 hover:bg-background/80"
                onClick={handleSwitchCamera}
            >
                <SwitchCamera className="h-5 w-5" />
                <span className="sr-only">Switch Camera</span>
            </Button>
          )}
          
          {!hasCameraPermission && !capturedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4 text-center">
              <VideoOff className="h-12 w-12 text-destructive" />
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access to use this feature.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <DialogFooter>
          {capturedImage ? (
            <>
              <Button variant="outline" onClick={handleRetake}>Retake Photo</Button>
              <Button onClick={handleConfirm}><Check className="mr-2 h-4 w-4" /> Use Photo</Button>
            </>
          ) : (
            <>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCapture} disabled={!hasCameraPermission}>
                <Camera className="mr-2 h-4 w-4" /> Capture
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
