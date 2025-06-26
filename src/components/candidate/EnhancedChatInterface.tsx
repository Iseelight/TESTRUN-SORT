import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Camera, Mic, MicOff, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { VoiceRecorder } from './VoiceRecorder';
import { EnhancedProctoringInterface } from './EnhancedProctoringInterface';
import { ConversationMessage } from '../../types';

interface EnhancedChatInterfaceProps {
  messages: ConversationMessage[];
  onSendMessage: (message: string) => void;
  onSessionEnd: (reason: string, violations: any[]) => void;
  isTyping?: boolean;
  isProctoredSession?: boolean;
}

interface SessionViolation {
  type: string;
  timestamp: Date;
  count: number;
  severity: 'warning' | 'critical';
}

export function EnhancedChatInterface({ 
  messages, 
  onSendMessage, 
  onSessionEnd,
  isTyping = false,
  isProctoredSession = true
}: EnhancedChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [sessionViolations, setSessionViolations] = useState<SessionViolation[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Start session when first message is sent
  useEffect(() => {
    if (messages.length > 0 && !sessionStarted && isProctoredSession) {
      setSessionStarted(true);
      setSessionActive(true);
    }
  }, [messages.length, sessionStarted, isProctoredSession]);

  // Text-to-Speech for AI messages
  useEffect(() => {
    if (isAudioEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'ai' && 'speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        // Create new utterance
        const utterance = new SpeechSynthesisUtterance(lastMessage.message);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Use a professional voice if available
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Microsoft') ||
          voice.lang.startsWith('en')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        // Speak the message
        speechSynthesis.speak(utterance);
      }
    }
  }, [messages, isAudioEnabled]);

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceRecording = (transcript: string) => {
    onSendMessage(transcript);
    setShowVoiceRecorder(false);
  };

  const handleViolation = (type: string, count: number) => {
    const violation: SessionViolation = {
      type,
      timestamp: new Date(),
      count,
      severity: count >= 2 ? 'critical' : 'warning'
    };
    
    setSessionViolations(prev => [...prev, violation]);
    
    // Show warning notification
    if (count === 1) {
      // First warning - already handled by ProctoringInterface
    } else if (count === 2) {
      // Second warning - session will be terminated
      setTimeout(() => {
        handleSessionEnd('Multiple proctoring violations detected');
      }, 3000);
    }
  };

  const handleSessionEnd = (reason: string) => {
    setSessionActive(false);
    
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    onSessionEnd(reason, sessionViolations);
  };

  const startProctoredSession = () => {
    setSessionStarted(true);
    setSessionActive(true);
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    
    // Stop current speech if disabling
    if (isAudioEnabled && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  // Pre-session setup for proctored interviews
  if (isProctoredSession && !sessionStarted) {
    return (
      <Card className="h-[500px] sm:h-[600px] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Camera className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Proctored Interview Session
            </h3>
            <div className="space-y-4 text-left">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Important Guidelines
                    </h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      <li>• Keep your face visible to the camera at all times</li>
                      <li>• Do not look away from the screen for extended periods</li>
                      <li>• Do not switch tabs or applications during the session</li>
                      <li>• Ensure you're in a quiet, well-lit environment</li>
                      <li>• You will receive 2 warnings before session termination</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Enhanced Features
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• AI questions will be spoken aloud automatically</li>
                  <li>• Real-time face detection and eye tracking</li>
                  <li>• Audio level monitoring for microphone quality</li>
                  <li>• Screen activity and tab switching detection</li>
                  <li>• Complete session recording for review</li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={startProctoredSession}
              className="w-full mt-6"
            >
              <Camera className="mr-2 h-4 w-4" />
              Start Proctored Session
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const chatContent = (
    <Card className="h-[500px] sm:h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Recruiter</h3>
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
              ) : isProctoredSession ? 'Proctored Session Active' : 'Ready to chat'}
            </p>
          </div>
          
          {/* Audio Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudio}
            className={isAudioEnabled ? 'text-green-600' : 'text-gray-400'}
          >
            {isAudioEnabled ? <Mic className="mr-2 h-4 w-4" /> : <MicOff className="mr-2 h-4 w-4" />}
            {isAudioEnabled ? 'Audio On' : 'Audio Off'}
          </Button>
          
          {isProctoredSession && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">MONITORED</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {isProctoredSession 
                ? 'Your proctored interview will begin once you send your first message.'
                : 'The AI interviewer will start the conversation once you\'re ready.'
              }
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

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <div className="mb-4">
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecording}
            isDisabled={isTyping}
          />
        </div>
      )}

      {/* Input */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              className="w-full resize-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] max-h-[120px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={1}
              disabled={isTyping}
            />
          </div>
          <Button 
            onClick={handleSend}
            disabled={!inputMessage.trim() || isTyping}
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            disabled={isTyping}
          >
            {showVoiceRecorder ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
            {showVoiceRecorder ? 'Hide Voice Recorder' : 'Use Voice Recording'}
          </Button>
        </div>
      </div>
    </Card>
  );

  // Wrap with proctoring interface if it's a proctored session
  if (isProctoredSession && sessionActive) {
    return (
      <EnhancedProctoringInterface
        isActive={sessionActive}
        onViolation={handleViolation}
        onSessionEnd={handleSessionEnd}
      >
        {chatContent}
      </EnhancedProctoringInterface>
    );
  }

  return chatContent;
}