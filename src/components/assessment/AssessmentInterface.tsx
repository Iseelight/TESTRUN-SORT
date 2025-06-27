import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Mic, MicOff, Play, Pause, RotateCcw, AlertTriangle, Settings } from 'lucide-react';
import { AssessmentTimer } from './AssessmentTimer';
import { FloatingVideoMonitor } from './FloatingVideoMonitor';

interface Question {
  id: string;
  text: string;
  timeLimit: number;
  type: 'audio' | 'video';
}

interface AssessmentInterfaceProps {
  questions: Question[];
  onComplete: (responses: any[]) => void;
  onTerminate?: () => void;
}

export const AssessmentInterface: React.FC<AssessmentInterfaceProps> = ({
  questions,
  onComplete,
  onTerminate
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  const checkMicrophonePermission = async () => {
    try {
      // Check if permissions API is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(permission.state);
        
        // Listen for permission changes
        permission.onchange = () => {
          setPermissionStatus(permission.state);
          if (permission.state === 'granted') {
            setMicrophoneError(null);
            initializeAudio();
          }
        };
      } else {
        // Fallback: try to access microphone directly
        await initializeAudio();
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      setPermissionStatus('denied');
      setMicrophoneError('Unable to check microphone permissions');
    }
  };

  const initializeAudio = async () => {
    try {
      setMicrophoneError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      setPermissionStatus('granted');
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        });
        setAudioBlob(audioBlob);
        audioChunksRef.current = [];
      };
      
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      setPermissionStatus('denied');
      
      if (error.name === 'NotAllowedError') {
        setMicrophoneError('Microphone access denied. Please allow microphone access in your browser settings and refresh the page.');
      } else if (error.name === 'NotFoundError') {
        setMicrophoneError('No microphone found. Please connect a microphone and refresh the page.');
      } else if (error.name === 'NotReadableError') {
        setMicrophoneError('Microphone is being used by another application. Please close other applications and refresh the page.');
      } else {
        setMicrophoneError(`Microphone error: ${error.message || 'Unknown error occurred'}`);
      }
    }
  };

  const requestMicrophonePermission = async () => {
    setMicrophoneError(null);
    setPermissionStatus('checking');
    await initializeAudio();
  };

  const openBrowserSettings = () => {
    // Provide instructions for different browsers
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    
    if (userAgent.includes('chrome')) {
      instructions = 'Click the camera/microphone icon in the address bar, or go to Settings > Privacy and security > Site Settings > Microphone';
    } else if (userAgent.includes('firefox')) {
      instructions = 'Click the microphone icon in the address bar, or go to Preferences > Privacy & Security > Permissions > Microphone';
    } else if (userAgent.includes('safari')) {
      instructions = 'Go to Safari > Preferences > Websites > Microphone';
    } else {
      instructions = 'Check your browser settings for microphone permissions';
    }
    
    alert(`To enable microphone access:\n\n${instructions}\n\nThen refresh this page.`);
  };

  useEffect(() => {
    checkMicrophonePermission();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (currentQuestion) {
      setTimeRemaining(currentQuestion.timeLimit);
      setAudioBlob(null);
      setIsRecording(false);
      setIsPaused(false);
    }
  }, [currentQuestion]);

  const startRecording = useCallback(() => {
    if (!mediaRecorderRef.current || permissionStatus !== 'granted') {
      setMicrophoneError('Microphone not available. Please check permissions.');
      return;
    }

    try {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      setAudioBlob(null);
    } catch (error) {
      console.error('Error starting recording:', error);
      setMicrophoneError('Failed to start recording. Please try again.');
    }
  }, [permissionStatus]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  }, [isRecording, isPaused]);

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const retakeRecording = () => {
    setAudioBlob(null);
    setIsRecording(false);
    setIsPaused(false);
    stopPlayback();
  };

  const submitResponse = () => {
    const response = {
      questionId: currentQuestion.id,
      audioBlob: audioBlob,
      timestamp: new Date().toISOString(),
      duration: audioBlob ? 0 : 0 // You might want to calculate actual duration
    };

    const newResponses = [...responses, response];
    setResponses(newResponses);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onComplete(newResponses);
    }
  };

  const handleTimeUp = () => {
    if (isRecording) {
      stopRecording();
    }
    // Auto-submit when time is up
    setTimeout(() => {
      submitResponse();
    }, 1000);
  };

  if (permissionStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking microphone permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (permissionStatus === 'denied' || microphoneError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Microphone Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {microphoneError || 'This assessment requires microphone access to record your responses.'}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                To continue with the assessment, please:
              </p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Allow microphone access when prompted</li>
                <li>Check your browser's site settings</li>
                <li>Ensure your microphone is connected and working</li>
                <li>Refresh the page after granting permissions</li>
              </ol>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={requestMicrophonePermission} className="flex-1">
                <Mic className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={openBrowserSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Help
              </Button>
            </div>
            
            {onTerminate && (
              <Button variant="outline" onClick={onTerminate} className="w-full">
                Exit Assessment
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Voice Assessment</h1>
            <Badge variant="outline" className="text-sm">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          
          <AssessmentTimer
            timeLimit={currentQuestion?.timeLimit || 0}
            onTimeUp={handleTimeUp}
            isActive={true}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-800 leading-relaxed">
                    {currentQuestion?.text}
                  </p>
                </div>

                {/* Recording Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    {!isRecording && !audioBlob && (
                      <Button
                        onClick={startRecording}
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 text-white px-8"
                      >
                        <Mic className="h-5 w-5 mr-2" />
                        Start Recording
                      </Button>
                    )}

                    {isRecording && (
                      <div className="flex gap-2">
                        <Button
                          onClick={pauseRecording}
                          variant="outline"
                          size="lg"
                        >
                          {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                          {isPaused ? 'Resume' : 'Pause'}
                        </Button>
                        <Button
                          onClick={stopRecording}
                          size="lg"
                          className="bg-gray-600 hover:bg-gray-700"
                        >
                          <MicOff className="h-5 w-5 mr-2" />
                          Stop Recording
                        </Button>
                      </div>
                    )}

                    {audioBlob && !isRecording && (
                      <div className="flex gap-2">
                        <Button
                          onClick={isPlaying ? stopPlayback : playRecording}
                          variant="outline"
                          size="lg"
                        >
                          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                          {isPlaying ? 'Stop' : 'Play'}
                        </Button>
                        <Button
                          onClick={retakeRecording}
                          variant="outline"
                          size="lg"
                        >
                          <RotateCcw className="h-5 w-5 mr-2" />
                          Retake
                        </Button>
                        <Button
                          onClick={submitResponse}
                          size="lg"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Submit Response
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Recording Status */}
                  {isRecording && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 text-red-600">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="font-medium">
                          {isPaused ? 'Recording Paused' : 'Recording...'}
                        </span>
                      </div>
                    </div>
                  )}

                  {audioBlob && (
                    <div className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Recording Complete
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span>{currentQuestionIndex} / {questions.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(currentQuestionIndex / questions.length) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Monitor */}
            <FloatingVideoMonitor />

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• Click "Start Recording" to begin</p>
                <p>• You can pause and resume recording</p>
                <p>• Listen to your response before submitting</p>
                <p>• You can retake your response if needed</p>
                <p>• Submit before time runs out</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};