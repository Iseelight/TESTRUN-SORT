import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, AlertTriangle, Shield, Eye, EyeOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ProctoringInterfaceProps {
  isActive: boolean;
  onViolation: (type: string, count: number) => void;
  onSessionEnd: (reason: string) => void;
  children: React.ReactNode;
}

interface Violation {
  type: 'face_not_detected' | 'looking_away' | 'multiple_faces' | 'screen_switch';
  timestamp: Date;
  severity: 'warning' | 'critical';
}

export function ProctoringInterface({ isActive, onViolation, onSessionEnd, children }: ProctoringInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [warningCount, setWarningCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Face detection using basic computer vision
  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Simple face detection using brightness and movement analysis
    // In production, you'd use a proper face detection library like face-api.js
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let brightPixels = 0;
    let totalPixels = data.length / 4;
    
    // Analyze center region for face-like patterns
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const regionSize = Math.min(canvas.width, canvas.height) * 0.3;
    
    for (let y = centerY - regionSize/2; y < centerY + regionSize/2; y += 4) {
      for (let x = centerX - regionSize/2; x < centerX + regionSize/2; x += 4) {
        const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
        if (index < data.length) {
          const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
          if (brightness > 100 && brightness < 200) {
            brightPixels++;
          }
        }
      }
    }
    
    const faceDetectionThreshold = 0.1;
    const currentFaceDetected = (brightPixels / totalPixels) > faceDetectionThreshold;
    
    // Check if looking away (simplified - checks if face is in center region)
    const lookingAway = !currentFaceDetected || brightPixels < 50;
    
    setFaceDetected(currentFaceDetected);
    setIsLookingAway(lookingAway);
    
    // Handle violations
    if (!currentFaceDetected || lookingAway) {
      handleViolation('looking_away');
    }
  };

  const handleViolation = (type: string) => {
    const newViolation: Violation = {
      type: type as any,
      timestamp: new Date(),
      severity: warningCount >= 1 ? 'critical' : 'warning'
    };
    
    setViolations(prev => [...prev, newViolation]);
    
    if (newViolation.severity === 'warning') {
      setWarningCount(prev => prev + 1);
      onViolation(type, warningCount + 1);
      
      if (warningCount + 1 >= 2) {
        // End session after 2 warnings
        endSession('Multiple violations detected');
      }
    }
  };

  const startProctoring = async () => {
    try {
      // Request camera and screen capture permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Start recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      
      // Start face detection
      detectionIntervalRef.current = setInterval(detectFace, 1000);
      
      // Lock screen (prevent tab switching)
      lockScreen();
      
      setPermissionsGranted(true);
      
    } catch (error) {
      console.error('Failed to start proctoring:', error);
      alert('Camera access is required for the proctored session. Please grant permissions and try again.');
    }
  };

  const stopProctoring = () => {
    // Stop recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Clear detection interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    // Unlock screen
    unlockScreen();
    
    setIsRecording(false);
    setPermissionsGranted(false);
  };

  const lockScreen = () => {
    setScreenLocked(true);
    
    // Prevent tab switching and other navigation
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('screen_switch');
      }
    };
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Leaving this page will end your proctored session.';
      return e.returnValue;
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Alt+Tab, Ctrl+Tab, F11, etc.
      if (
        (e.altKey && e.key === 'Tab') ||
        (e.ctrlKey && e.key === 'Tab') ||
        e.key === 'F11' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // Dev tools
        (e.key === 'F12') // Dev tools
      ) {
        e.preventDefault();
        handleViolation('screen_switch');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);
    
    // Store event listeners for cleanup
    (window as any).proctoringListeners = {
      handleVisibilityChange,
      handleBeforeUnload,
      handleKeyDown
    };
  };

  const unlockScreen = () => {
    setScreenLocked(false);
    
    // Remove event listeners
    const listeners = (window as any).proctoringListeners;
    if (listeners) {
      document.removeEventListener('visibilitychange', listeners.handleVisibilityChange);
      window.removeEventListener('beforeunload', listeners.handleBeforeUnload);
      document.removeEventListener('keydown', listeners.handleKeyDown);
      delete (window as any).proctoringListeners;
    }
  };

  const endSession = (reason: string) => {
    stopProctoring();
    onSessionEnd(reason);
  };

  const getRecordedVideo = (): Blob | null => {
    if (recordedChunksRef.current.length > 0) {
      return new Blob(recordedChunksRef.current, { type: 'video/webm' });
    }
    return null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, []);

  // Auto-start proctoring when active
  useEffect(() => {
    if (isActive && !permissionsGranted) {
      startProctoring();
    } else if (!isActive && permissionsGranted) {
      stopProctoring();
    }
  }, [isActive]);

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Proctoring Overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Proctored Session Active</span>
            </div>
            
            <div className="flex items-center gap-2">
              {isRecording ? (
                <>
                  <div className="w-3 h-3 bg-red-300 rounded-full animate-pulse" />
                  <span className="text-sm">Recording</span>
                </>
              ) : (
                <>
                  <CameraOff className="w-4 h-4" />
                  <span className="text-sm">Camera Off</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {faceDetected ? (
                <>
                  <Eye className="w-4 h-4 text-green-300" />
                  <span className="text-sm">Face Detected</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm">No Face</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm">
              Warnings: {warningCount}/2
            </div>
            
            {violations.length > 0 && (
              <Badge variant="warning">
                {violations.length} Violations
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {isLookingAway && warningCount < 2 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Warning: Looking Away Detected
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please look directly at the camera and stay focused on the screen. 
                You have {2 - warningCount} warning(s) remaining.
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mb-6">
                If you continue looking away, your session will be terminated.
              </p>
              <Button 
                onClick={() => setIsLookingAway(false)}
                className="w-full"
              >
                I Understand - Continue Session
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Camera Preview */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-32 h-24 bg-black rounded-lg border-2 border-white shadow-lg"
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {/* Status indicators */}
          <div className="absolute top-1 left-1 flex gap-1">
            {isRecording && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
            {faceDetected && (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            )}
          </div>
          
          {/* Camera label */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 text-center rounded-b-lg">
            Proctoring Camera
          </div>
        </div>
      </div>

      {/* Screen Lock Indicator */}
      {screenLocked && (
        <div className="fixed bottom-4 left-4 z-40">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700 dark:text-gray-300">Screen Locked</span>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-12">
        {children}
      </div>

      {/* Violations Log (for debugging) */}
      {process.env.NODE_ENV === 'development' && violations.length > 0 && (
        <div className="fixed top-16 right-4 z-40 max-w-sm">
          <Card className="p-3">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Violations Log</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {violations.map((violation, index) => (
                <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                  {violation.timestamp.toLocaleTimeString()}: {violation.type} ({violation.severity})
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}