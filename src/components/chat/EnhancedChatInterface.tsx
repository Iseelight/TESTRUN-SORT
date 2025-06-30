import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, MicOff, Volume2, VolumeX, Loader } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ConversationMessage, FaceDetectionData } from '../../types';

interface EnhancedChatInterfaceProps {
  messages: ConversationMessage[];
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
  enableAudio?: boolean;
  onUserStartResponding?: () => void;
  faceDetectionData?: FaceDetectionData | null;
}

export function EnhancedChatInterface({ 
  messages, 
  onSendMessage, 
  isTyping = false,
  enableAudio = true,
  onUserStartResponding,
  faceDetectionData
}: EnhancedChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  // Auto-play AI messages with text-to-speech
  useEffect(() => {
    if (enableAudio && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'ai' && 'speechSynthesis' in window) {
        playTextToSpeech(lastMessage.message, lastMessage.id);
      }
    }
  }, [messages, enableAudio]);

  // Monitor audio levels during recording
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1);
    setAudioLevel(normalizedLevel);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  };

  const playTextToSpeech = async (text: string, messageId: string) => {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    setIsPlayingAudio(true);
    setCurrentPlayingId(messageId);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Use a professional voice if available
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Natural') ||
      voice.lang.startsWith('en')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setCurrentPlayingId(null);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setCurrentPlayingId(null);
    };
    
    speechSynthesis.speak(utterance);
  };

  const stopTextToSpeech = () => {
    speechSynthesis.cancel();
    setIsPlayingAudio(false);
    setCurrentPlayingId(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio monitoring
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        processAudioRecording();
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      monitorAudioLevel();
      
      // Trigger user start responding
      onUserStartResponding?.();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const processAudioRecording = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsProcessingAudio(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Simulate speech-to-text processing with auto-correction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock speech-to-text with auto-correction
      const mockTranscripts = [
        "I have extensive experience in React development and I'm passionate about creating user-friendly interfaces that provide excellent user experiences.",
        "My background includes working with TypeScript, Node.js, and various cloud platforms like AWS. I've successfully delivered multiple projects from conception to deployment.",
        "I enjoy collaborating with cross-functional teams and have led several successful projects. I believe in agile development methodologies and continuous improvement.",
        "I'm particularly interested in this role because it aligns perfectly with my career goals in frontend development and offers opportunities for growth.",
        "I believe my experience in problem-solving and my ability to adapt quickly to new technologies would be valuable assets to your team.",
        "In my previous role, I implemented several performance optimizations that improved application load times by 40% and enhanced overall user satisfaction.",
        "I'm committed to writing clean, maintainable code and following best practices. I also enjoy mentoring junior developers and sharing knowledge.",
        "My approach to challenges is methodical and collaborative. I believe in understanding requirements thoroughly before implementing solutions."
      ];
      
      const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      
      // Auto-correct common speech recognition errors
      const correctedTranscript = transcript
        .replace(/\bum\b/gi, '')
        .replace(/\buh\b/gi, '')
        .replace(/\ber\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      onSendMessage(correctedTranscript);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to process audio. Please try again.');
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
      onUserStartResponding?.();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    if (e.target.value.length === 1) {
      // User started typing
      onUserStartResponding?.();
    }
  };

  // Check if input should be disabled based on face detection
  const isInputDisabled = faceDetectionData && !faceDetectionData.faceDetected;

  return (
    <Card className="h-[500px] sm:h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Interviewer</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isTyping ? (
                <span className="flex items-center gap-1">
                  <span>Thinking</span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </span>
              ) : 'AI-powered interview assistant'}
            </p>
          </div>
          
          {/* Audio Controls */}
          <div className="flex items-center gap-2">
            {isPlayingAudio && (
              <Button
                variant="ghost"
                size="sm"
                onClick={stopTextToSpeech}
                icon={VolumeX}
                className="text-blue-600"
              >
                Stop Audio
              </Button>
            )}
            
            {/* Input Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setInputMode('text')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  inputMode === 'text' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setInputMode('voice')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  inputMode === 'voice' 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Voice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Face Detection Warning */}
      {isInputDisabled && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">
              Input blocked - Please position your face in the camera view to continue
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              The AI interviewer will start the conversation once you're ready.
            </p>
          </div>
        )}
        
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
              max-w-[85%] sm:max-w-[80%] p-3 rounded-lg relative
              ${message.sender === 'ai' 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                : 'bg-blue-600 text-white'
              }
            `}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
              
              {/* Audio controls for AI messages */}
              {message.sender === 'ai' && enableAudio && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <button
                    onClick={() => {
                      if (currentPlayingId === message.id) {
                        stopTextToSpeech();
                      } else {
                        playTextToSpeech(message.message, message.id);
                      }
                    }}
                    className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-opacity"
                  >
                    {currentPlayingId === message.id ? (
                      <>
                        <VolumeX className="w-3 h-3" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>Play</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {/* Timestamp for candidate messages */}
              {message.sender === 'candidate' && (
                <span className="text-xs opacity-70 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
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

      {/* Input Section */}
      <div className="space-y-3">
        {inputMode === 'text' ? (
          /* Text Input */
          <div className="flex gap-2">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={isInputDisabled ? "Position your face in camera view to type..." : "Type your response..."}
                className={`w-full resize-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] max-h-[120px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                rows={1}
                disabled={isTyping || isInputDisabled}
              />
            </div>
            <Button 
              onClick={handleSend}
              disabled={!inputMessage.trim() || isTyping || isInputDisabled}
              icon={Send}
              className="px-4"
            />
          </div>
        ) : (
          /* Voice Input */
          <div className="space-y-3">
            {/* Audio Level Indicator */}
            {isRecording && (
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">Recording...</span>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${audioLevel * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-red-600 dark:text-red-400">
                  {Math.round(audioLevel * 100)}%
                </span>
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessingAudio && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Processing speech with auto-correction...
                </span>
              </div>
            )}

            {/* Voice Controls */}
            <div className="flex justify-center">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTyping || isProcessingAudio || isInputDisabled}
                variant={isRecording ? "danger" : "primary"}
                size="lg"
                icon={isRecording ? MicOff : Mic}
                className="px-8"
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
            </div>

            {/* Voice Input Instructions */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              {isInputDisabled 
                ? "Position your face in camera view to use voice input"
                : "Click to record your response. Speech will be automatically converted to text with corrections."
              }
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}