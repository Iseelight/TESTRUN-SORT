import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { VoiceRecorder } from './VoiceRecorder';
import { ConversationMessage } from '../../types';

interface ChatInterfaceProps {
  messages: ConversationMessage[];
  onSendMessage: (message: string) => void;
  isTyping?: boolean;
}

export function ChatInterface({ messages, onSendMessage, isTyping = false }: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <Card className="h-[500px] sm:h-[600px] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
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
              ) : 'Ready to chat'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">The AI interviewer will start the conversation once you're ready.</p>
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
            {showVoiceRecorder ? 'Hide Voice Recorder' : 'Use Voice Recording'}
          </Button>
        </div>
      </div>
    </Card>
  );
}