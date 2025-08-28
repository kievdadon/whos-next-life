import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const CameraCapture = ({ onCapture, isOpen, onClose, title }: CameraCaptureProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera with facing mode:', facingMode);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please ensure camera permissions are granted.",
        variant: "destructive"
      });
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        handleClose();
      }
    }, 'image/jpeg', 0.9);
  }, [onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Start camera when dialog opens
  useState(() => {
    if (isOpen && !isStreaming) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
    }
  });

  // Restart camera when facing mode changes
  useState(() => {
    if (isOpen && isStreaming) {
      startCamera();
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button onClick={startCamera} variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}
          </div>

          {isStreaming && (
            <div className="flex justify-center gap-3">
              <Button onClick={switchCamera} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Switch Camera
              </Button>
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button onClick={handleClose} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};