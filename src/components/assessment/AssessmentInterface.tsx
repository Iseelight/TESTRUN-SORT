import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Mic, MicOff, Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { AssessmentTimer } from './AssessmentTimer';
import { FloatingVideoMonitor } from './FloatingVideoMonitor';

interface Question {
  id: string;
  text: string;
  timeLimit: number;
  type: 'audio' | 'video';
}

interface AssessmentConfig {
  duration: number;
  questions: string[];
  enableFaceDetection: boolean;
  enableScreenLock: boolean;
  enableAudioRecording: boolean;
  maxViolations: number;
  allowRetake: boolean;
}

interface AssessmentInterfaceProps {
  config: AssessmentConfig;
  onAssessmentComplete: (result: any) => void;
  onTerminate?: () => void;
}

export const AssessmentInterface: React.FC<AssessmentInterfaceProps> = ({
  config,
  onAssessmentComplete,
  onTerminate
}) => {
  // Transform string questions into Question objects
  const questions: Question[] = config.questions.map((questionText, index) => ({
    id: `question_${index + 1}`,
    text: questionText,
    timeLimit: Math.floor(config.duration * 60 / config.questions.length), // Distribute time evenly
    type: 'audio' as const
  }));

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    // Initialize audio automatically without permission checks
    initializeAudio();
    
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

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
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
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      // Continue without showing error modal
    }
  };

  const startRecording = useCallback(() => {
    if (!mediaRecorderRef.current) {
      // Try to initialize audio again if not available
      initializeAudio().then(() => {
        if (mediaRecorderRef.current) {
          startRecordingInternal();
        }
      });
      return;
    }

    startRecordingInternal();
  }, []);

  const startRecordingInternal = () => {
    try {
      audioChunksRef.current = [];
      mediaRecorderRef.current?.start();
      setIsRecording(true);
      setIsPaused(false);
      setAudioBlob(null);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

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
      // Complete assessment
      const assessmentResult = {
        questionsAnswered: newResponses.length,
        totalQuestions: questions.length,
        duration: config.duration,
        securityAlertsCount: 0,
        securityAlerts: [],
        responses: newResponses,
        terminationReason: null
      };
      onAssessmentComplete(assessmentResult);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Voice Assessment</h1>
            <Badge variant="outline" className="text-sm">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          
          <AssessmentTimer
            durationMinutes={currentQuestion?.timeLimit / 60 || 0}
            onTimeUp={handleTimeUp}
            isActive={true}
            startTime={Date.now()}
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
            <FloatingVideoMonitor 
              isActive={true}
              onSecurityAlert={(alert) => console.log('Security alert:', alert)}
              onFaceDetectionUpdate={(data) => console.log('Face detection update:', data)}
              onFaceAwayViolation={() => {
                const result = {
                  questionsAnswered: responses.length,
                  totalQuestions: questions.length,
                  duration: config.duration,
                  securityAlertsCount: 2,
                  securityAlerts: [
                    {
                      id: Date.now().toString(),
                      type: 'face_not_detected',
                      message: 'Face not detected for 30 seconds',
                      timestamp: new Date(),
                      severity: 'high'
                    }
                  ],
                  responses,
                  terminationReason: 'Session terminated: Looked away from camera twice'
                };
                onAssessmentComplete(result);
              }}
            />

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