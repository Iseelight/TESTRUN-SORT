import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Mic, MicOff, Send, Bot, User } from 'lucide-react';
import { FloatingVideoMonitor } from './FloatingVideoMonitor';
import { ConversationMessage } from '../../types';
import { v4 as uuidv4 } from 'uuid';

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
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentStartTime] = useState(Date.now());
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [faceDetectionData, setFaceDetectionData] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  // Initialize assessment with first question
  useEffect(() => {
    // Add initial AI message with first question
    setTimeout(() => {
      const initialMessage: ConversationMessage = {
        id: uuidv4(),
        sender: 'ai',
        message: config.questions[0],
        timestamp: new Date()
      };
      setMessages([initialMessage]);
    }, 1000);
    
    // Initialize audio
    initializeAudio();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [config.questions]);

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
        processAudioRecording();
      };
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      // Continue without showing error modal
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    if (!mediaRecorderRef.current) {
      // Try to initialize audio again
      initializeAudio().then(() => {
        if (mediaRecorderRef.current) {
          startRecordingInternal();
        }
      });
      return;
    }
    
    startRecordingInternal();
  };

  const startRecordingInternal = () => {
    try {
      audioChunksRef.current = [];
      mediaRecorderRef.current?.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioRecording = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: 'audio/webm' 
      });
      
      // Simulate speech-to-text processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock transcript with auto-correction
      const mockTranscripts = [
        "I have over 5 years of experience in React development and I'm passionate about creating user-friendly interfaces.",
        "My background includes working with TypeScript, Node.js, and various cloud platforms like AWS.",
        "I enjoy collaborating with cross-functional teams and have led several successful projects from conception to deployment.",
        "I'm particularly interested in this role because it aligns with my career goals in frontend development.",
        "I believe my experience in agile development and problem-solving skills would be valuable to your team."
      ];
      
      // Select a random transcript
      let transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      
      // Apply auto-correction
      transcript = transcript
        .replace(/\bum\b|\buh\b|\ber\b|\blike\b|\byou know\b/gi, '') // Remove filler words
        .replace(/\s+/g, ' ') // Remove extra spaces
        .trim();
      
      // Add user message
      handleSendMessage(transcript);
      
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ConversationMessage = {
      id: uuidv4(),
      sender: 'candidate',
      message: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Simulate AI thinking
    setIsTyping(true);
    
    // Determine if we should move to the next question or end the assessment
    setTimeout(() => {
      setIsTyping(false);
      
      const nextQuestionIndex = currentQuestionIndex + 1;
      
      if (nextQuestionIndex < config.questions.length) {
        // Send next question
        const aiMessage: ConversationMessage = {
          id: uuidv4(),
          sender: 'ai',
          message: config.questions[nextQuestionIndex],
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setCurrentQuestionIndex(nextQuestionIndex);
      } else {
        // End assessment
        const finalMessage: ConversationMessage = {
          id: uuidv4(),
          sender: 'ai',
          message: "Thank you for completing the assessment. Your responses have been recorded and will be analyzed. The results will be available shortly.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, finalMessage]);
        
        // Complete assessment after a short delay
        setTimeout(() => {
          const assessmentResult = {
            questionsAnswered: config.questions.length,
            totalQuestions: config.questions.length,
            duration: Math.floor((Date.now() - assessmentStartTime) / 1000 / 60),
            securityAlertsCount: securityAlerts.length,
            securityAlerts,
            messages,
            terminationReason: null
          };
          
          onAssessmentComplete(assessmentResult);
        }, 2000);
      }
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const handleSecurityAlert = (alert: any) => {
    setSecurityAlerts(prev => [...prev, alert]);
    
    // Check if we need to terminate the assessment
    if (alert.severity === 'high' || securityAlerts.length >= config.maxViolations) {
      const assessmentResult = {
        questionsAnswered: currentQuestionIndex,
        totalQuestions: config.questions.length,
        duration: Math.floor((Date.now() - assessmentStartTime) / 1000 / 60),
        securityAlertsCount: securityAlerts.length + 1,
        securityAlerts: [...securityAlerts, alert],
        messages,
        terminationReason: 'Session terminated due to security violations'
      };
      
      onAssessmentComplete(assessmentResult);
    }
  };

  const handleFaceDetectionUpdate = (data: any) => {
    setFaceDetectionData(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 w-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Interview</h1>
            <Badge variant="outline" className="text-sm">
              Question {currentQuestionIndex + 1} of {config.questions.length}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-2">
            <Card className="h-[500px] sm:h-[600px] flex flex-col w-full">
              {/* Chat Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">AI Interviewer</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isTyping ? (
                        <span className="flex items-center gap-1">
                          <span>Typing</span>
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </span>
                      ) : 'Ready to chat'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === 'candidate' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${message.sender === 'ai' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                        : 'bg-gray-600 dark:bg-gray-500'
                      }
                    `}>
                      {message.sender === 'ai' ? (
                        <Bot className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`
                      max-w-[85%] sm:max-w-[80%] p-3 rounded-lg
                      ${message.sender === 'ai' 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                        : 'bg-blue-600 text-white'
                      }
                    `}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Button
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "outline"}
                    className="px-3"
                    disabled={isTyping}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your response..."
                      className="w-full resize-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] max-h-[120px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={1}
                      disabled={isTyping || isRecording}
                    />
                  </div>
                  <Button 
                    onClick={() => handleSendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isTyping || isRecording}
                    className="px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {isRecording && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-red-600">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Recording...</span>
                  </div>
                )}
              </div>
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
                    <span>{currentQuestionIndex} / {config.questions.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(currentQuestionIndex / config.questions.length) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Monitor */}
            <FloatingVideoMonitor 
              isActive={true}
              onSecurityAlert={handleSecurityAlert}
              onFaceDetectionUpdate={handleFaceDetectionUpdate}
              onFaceAwayViolation={() => {
                const result = {
                  questionsAnswered: currentQuestionIndex,
                  totalQuestions: config.questions.length,
                  duration: Math.floor((Date.now() - assessmentStartTime) / 1000 / 60),
                  securityAlertsCount: 2,
                  securityAlerts: [
                    {
                      id: Date.now().toString(),
                      type: 'face_not_detected',
                      message: 'Face not detected for 30 seconds (2/2)',
                      timestamp: new Date(),
                      severity: 'high'
                    }
                  ],
                  messages,
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
              <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>• Click the microphone icon to toggle recording</p>
                <p>• Or type your response in the text box</p>
                <p>• Keep your face visible to the camera</p>
                <p>• Answer all questions to complete the assessment</p>
                <p>• Stay focused on the screen during the assessment</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};