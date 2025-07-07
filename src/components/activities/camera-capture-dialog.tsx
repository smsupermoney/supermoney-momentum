
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
import { Camera, VideoOff, Check, RotateCcw, SwitchCamera } from 'lucide-react';
import Image from 'next/image';

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
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const stopStream = useCallback((stream: MediaStream | null) => {
    stream?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const getStream = async () => {
      if (!open || capturedImage) return;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
        
        if (videoInputs.length === 0) {
          console.log("No video input devices found.");
          setHasCameraPermission(false);
          return;
        }

        const deviceId = videoInputs[currentDeviceIndex % videoInputs.length]?.deviceId;
        const constraints: MediaStreamConstraints = {
          video: deviceId 
            ? { deviceId: { exact: deviceId } } 
            : { facingMode: { ideal: "environment" } }
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        stream = newStream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error("Camera access error:", error);
        setHasCameraPermission(false);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };
    
    getStream();

    return () => {
      stopStream(stream);
    }
  }, [open, capturedImage, currentDeviceIndex, stopStream, toast]);

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
      }
    }
  };
  
  const handleSwitchCamera = () => {
    if (videoDevices.length > 1) {
      setCurrentDeviceIndex(prevIndex => prevIndex + 1);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };
  
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setCapturedImage(null);
      setCurrentDeviceIndex(0);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Take a Photo</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
          {capturedImage ? (
            <Image src={capturedImage} alt="Captured" layout="fill" objectFit="cover" />
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
              <Button variant="outline" onClick={handleRetake}><RotateCcw className="mr-2 h-4 w-4" /> Retake</Button>
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
