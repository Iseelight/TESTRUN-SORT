import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, AlertTriangle, Shield, Eye, EyeOff, Mic, MicOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface EnhancedProctoringInterfaceProps {
  isActive: boolean;
  onViolation: (type: string, count: number) => void;
  onSessionEnd: (reason: string) => void;
  children: React.ReactNode;
}

interface Violation {
  type: 'face_not_detected' | 'looking_away' | 'multiple_faces' | 'screen_switch' | 'audio_issue';
  timestamp: Date;
  severity: 'warning' | 'critical';
}

export function EnhancedProctoringInterface({ 
  isActive, 
  onViolation, 
  onSessionEnd, 
  children 
}: EnhancedProctoringInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [warningCount, setWarningCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [videoQuality, setVideoQuality] = useState<'good' | 'poor' | 'disconnected'>('good');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [consecutiveLookAwayTime, setConsecutiveLookAwayTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioDataRef = useRef<Uint8Array | null>(null);
  const lookAwayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const baselineRef = useRef<{
    avgBrightness: number;
    motionThreshold: number;
    established: boolean;
  }>({ avgBrightness: 0, motionThreshold: 0, established: false });
  const previousFrameRef = useRef<ImageData | null>(null);

  // Enhanced face detection with improved accuracy
  const detectFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !permissionsGranted) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Analyze center region for face-like patterns
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const regionSize = Math.min(canvas.width, canvas.height) * 0.4;
      
      let skinPixels = 0;
      let totalPixels = 0;
      let brightPixels = 0;
      let faceRegionPixels = 0;
      let motionPixels = 0;
      
      // Sample pixels in face region with enhanced detection
      for (let y = centerY - regionSize/2; y < centerY + regionSize/2; y += 2) {
        for (let x = centerX - regionSize/2; x < centerX + regionSize/2; x += 2) {
          if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
            if (index < data.length - 2) {
              const r = data[index];
              const g = data[index + 1];
              const b = data[index + 2];
              
              // Enhanced skin tone detection algorithm
              const isSkin = (r > 95 && g > 40 && b > 20) &&
                           (Math.max(r, g, b) - Math.min(r, g, b) > 15) &&
                           (Math.abs(r - g) > 15) && (r > g) && (r > b);
              
              // Face region detection (eyes, nose area)
              const isFaceRegion = (r > 80 && g > 60 && b > 50) && 
                                 (r < 220 && g < 200 && b < 180);
              
              if (isSkin) skinPixels++;
              if (isFaceRegion) faceRegionPixels++;
              
              const brightness = (r + g + b) / 3;
              if (brightness > 80 && brightness < 220) brightPixels++;
              
              // Motion detection
              if (previousFrameRef.current) {
                const prevR = previousFrameRef.current.data[index];
                const prevG = previousFrameRef.current.data[index + 1];
                const prevB = previousFrameRef.current.data[index + 2];
                const prevBrightness = (prevR + prevG + prevB) / 3;
                
                if (Math.abs(brightness - prevBrightness) > 15) {
                  motionPixels++;
                }
              }
              
              totalPixels++;
            }
          }
        }
      }
      
      // Store current frame for next comparison
      previousFrameRef.current = imageData;
      
      const skinRatio = totalPixels > 0 ? skinPixels / totalPixels : 0;
      const brightRatio = totalPixels > 0 ? brightPixels / totalPixels : 0;
      const faceRatio = totalPixels > 0 ? faceRegionPixels / totalPixels : 0;
      const motionRatio = totalPixels > 0 ? motionPixels / totalPixels : 0;
      
      // Establish baseline on first few frames
      if (!baselineRef.current.established && totalPixels > 0) {
        const avgBrightness = brightPixels > 0 ? brightPixels / totalPixels * 255 : 0;
        if (avgBrightness > 30) {
          baselineRef.current.avgBrightness = avgBrightness;
          baselineRef.current.motionThreshold = 0.02;
          baselineRef.current.established = true;
        }
      }
      
      // Enhanced face detection thresholds with multiple criteria
      const faceDetectionThreshold = 0.12;
      const brightnessThreshold = 0.25;
      const faceRegionThreshold = 0.08;
      
      const currentFaceDetected = skinRatio > faceDetectionThreshold && 
                                brightRatio > brightnessThreshold && 
                                faceRatio > faceRegionThreshold;
      
      const lookingAway = !currentFaceDetected || skinRatio < 0.06;
      
      setFaceDetected(currentFaceDetected);
      
      // Update video quality based on detection confidence
      if (currentFaceDetected && skinRatio > 0.2) {
        setVideoQuality('good');
      } else if (currentFaceDetected) {
        setVideoQuality('poor');
      } else {
        setVideoQuality('disconnected');
      }
      
      // Handle looking away with consecutive tracking
      if (lookingAway) {
        if (!isLookingAway) {
          setIsLookingAway(true);
          setConsecutiveLookAwayTime(0);
          
          // Start timeout for consecutive look away time
          lookAwayTimeoutRef.current = setInterval(() => {
            setConsecutiveLookAwayTime(prev => {
              const newTime = prev + 1;
              
              // If looking away for more than 15 seconds, count as violation
              if (newTime >= 15) {
                handleLookAwayViolation();
                return 0;
              }
              
              return newTime;
            });
          }, 1000);
        }
      } else {
        if (isLookingAway) {
          setIsLookingAway(false);
          setConsecutiveLookAwayTime(0);
          
          if (lookAwayTimeoutRef.current) {
            clearInterval(lookAwayTimeoutRef.current);
            lookAwayTimeoutRef.current = null;
          }
        }
      }
      
    } catch (error) {
      console.error('Face detection error:', error);
      setVideoQuality('poor');
    }
  }, [permissionsGranted, isLookingAway]);

  // Handle look away violations with counting
  const handleLookAwayViolation = useCallback(() => {
    const newCount = warningCount + 1;
    setWarningCount(newCount);
    
    const violation: Violation = {
      type: 'looking_away',
      timestamp: new Date(),
      severity: newCount >= 2 ? 'critical' : 'warning'
    };
    
    setViolations(prev => [...prev, violation]);
    onViolation('looking_away', newCount);
    
    // Clear the timeout
    if (lookAwayTimeoutRef.current) {
      clearInterval(lookAwayTimeoutRef.current);
      lookAwayTimeoutRef.current = null;
    }
    
    // End session after 2 violations
    if (newCount >= 2) {
      setTimeout(() => {
        endSession('Session terminated: Looked away from camera twice');
      }, 1000);
    }
  }, [warningCount, onViolation]);

  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !audioDataRef.current) return;

    analyserRef.current.getByteFrequencyData(audioDataRef.current);
    
    let sum = 0;
    for (let i = 0; i < audioDataRef.current.length; i++) {
      sum += audioDataRef.current[i];
    }
    
    const average = sum / audioDataRef.current.length;
    const normalizedLevel = Math.min(average / 128, 1);
    
    setAudioLevel(normalizedLevel);
  }, []);

  const startProctoring = useCallback(async () => {
    try {
      // Automatically request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      setSessionStartTime(new Date());
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      // Set up audio monitoring
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        source.connect(analyserRef.current);
        audioDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
        
        // Start audio monitoring
        const audioMonitorInterval = setInterval(monitorAudioLevel, 100);
        (audioContextRef.current as any).monitorInterval = audioMonitorInterval;
      } catch (audioError) {
        console.warn('Audio monitoring setup failed:', audioError);
      }
      
      // Start recording with enhanced settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
          ? 'video/webm;codecs=vp9,opus' 
          : 'video/webm'
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
      
      // Start enhanced face detection with higher frequency
      detectionIntervalRef.current = setInterval(detectFace, 500); // Check every 500ms for better detection
      
      // Lock screen immediately
      lockScreen();
      
      setPermissionsGranted(true);
      
    } catch (error) {
      console.error('Failed to start proctoring:', error);
      // Continue without camera/microphone if user denies access
      setPermissionsGranted(true);
      lockScreen();
    }
  }, [detectFace, monitorAudioLevel]);

  const stopProctoring = useCallback(() => {
    // Stop recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Clean up audio monitoring
    if (audioContextRef.current) {
      if ((audioContextRef.current as any).monitorInterval) {
        clearInterval((audioContextRef.current as any).monitorInterval);
      }
      audioContextRef.current.close();
    }
    
    // Clear detection interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    // Clear look away timeout
    if (lookAwayTimeoutRef.current) {
      clearInterval(lookAwayTimeoutRef.current);
    }
    
    // Unlock screen
    unlockScreen();
    
    setIsRecording(false);
    setPermissionsGranted(false);
    setAudioLevel(0);
    setVideoQuality('disconnected');
    setWarningCount(0);
    setConsecutiveLookAwayTime(0);
    setSessionStartTime(null);
  }, [isRecording]);

  const lockScreen = useCallback(() => {
    setScreenLocked(true);
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        endSession('Session terminated: Tab/window switching detected');
      }
    };
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Leaving this page will end your proctored session.';
      return e.returnValue;
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent various shortcuts that could be used to cheat
      if (
        (e.altKey && e.key === 'Tab') ||
        (e.ctrlKey && e.key === 'Tab') ||
        e.key === 'F11' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.key === 'F12') ||
        (e.ctrlKey && e.key === 'r') ||
        (e.ctrlKey && e.key === 'R') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.metaKey && e.key === 'Tab') || // Mac Command+Tab
        (e.metaKey && e.key === 'r') || // Mac Command+R
        e.key === 'Escape'
      ) {
        e.preventDefault();
        endSession('Session terminated: Attempted to use restricted shortcuts');
      }
    };
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    const handleFocus = () => {
      if (document.hidden) {
        endSession('Session terminated: Window lost focus');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('blur', handleFocus);
    
    // Store event listeners for cleanup
    (window as any).proctoringListeners = {
      handleVisibilityChange,
      handleBeforeUnload,
      handleKeyDown,
      handleContextMenu,
      handleFocus
    };
  }, []);

  const unlockScreen = useCallback(() => {
    setScreenLocked(false);
    
    const listeners = (window as any).proctoringListeners;
    if (listeners) {
      document.removeEventListener('visibilitychange', listeners.handleVisibilityChange);
      window.removeEventListener('beforeunload', listeners.handleBeforeUnload);
      document.removeEventListener('keydown', listeners.handleKeyDown);
      document.removeEventListener('contextmenu', listeners.handleContextMenu);
      window.removeEventListener('blur', listeners.handleFocus);
      delete (window as any).proctoringListeners;
    }
  }, []);

  const endSession = useCallback((reason: string) => {
    stopProctoring();
    onSessionEnd(reason);
  }, [stopProctoring, onSessionEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProctoring();
    };
  }, [stopProctoring]);

  // Auto-start proctoring when active
  useEffect(() => {
    if (isActive && !permissionsGranted) {
      startProctoring();
    } else if (!isActive && permissionsGranted) {
      stopProctoring();
    }
  }, [isActive, permissionsGranted, startProctoring, stopProctoring]);

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Enhanced Proctoring Overlay */}
      {permissionsGranted && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span className="font-medium">PROCTORED SESSION ACTIVE</span>
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

              <div className="flex items-center gap-2">
                {audioLevel > 0.1 ? (
                  <>
                    <Mic className="w-4 h-4 text-green-300" />
                    <span className="text-sm">Audio OK</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm">Low Audio</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm">
                Look Away Violations: {warningCount}/2
              </div>
              
              {sessionStartTime && (
                <div className="text-sm">
                  Session: {Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60)}m
                </div>
              )}
              
              {violations.length > 0 && (
                <Badge variant="warning">
                  {violations.length} Violations
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal for Looking Away */}
      {isLookingAway && warningCount < 2 && permissionsGranted && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Warning: Looking Away Detected
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please look directly at the camera and stay focused on the screen. 
                You have {2 - warningCount} violation(s) remaining.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Looking away for {consecutiveLookAwayTime} seconds. 
                  Session will be terminated after 2 violations.
                </p>
              </div>
              <Button 
                onClick={() => {
                  setIsLookingAway(false);
                  setConsecutiveLookAwayTime(0);
                  if (lookAwayTimeoutRef.current) {
                    clearInterval(lookAwayTimeoutRef.current);
                    lookAwayTimeoutRef.current = null;
                  }
                }}
                className="w-full"
              >
                I'm Back - Continue Session
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Enhanced Camera Preview */}
      {permissionsGranted && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="relative">
            <video
              ref={videoRef}
              className="w-48 h-36 bg-black rounded-lg border-2 border-white shadow-lg"
              muted
              playsInline
              autoPlay
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Enhanced Status indicators */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isRecording && (
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
              {faceDetected && (
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              )}
              <div className={`w-3 h-3 rounded-full ${
                videoQuality === 'good' ? 'bg-green-500' :
                videoQuality === 'poor' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
            
            {/* Look away counter */}
            <div className="absolute top-2 right-2">
              <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {warningCount}/2
              </div>
            </div>
            
            {/* Audio level indicator */}
            <div className="absolute bottom-2 left-2 right-2">
              <div className="w-full h-1 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </div>
            
            {/* Camera label */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 text-center rounded-b-lg">
              Proctoring Camera - Screen Locked
            </div>
          </div>
        </div>
      )}

      {/* Screen Lock Indicator */}
      {screenLocked && (
        <div className="fixed bottom-4 left-4 z-40">
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-red-600" />
              <span className="text-gray-700 dark:text-gray-300">Screen Locked - Interview Active</span>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className={permissionsGranted ? "pt-12" : ""}>
        {children}
      </div>
    </div>
  );
}