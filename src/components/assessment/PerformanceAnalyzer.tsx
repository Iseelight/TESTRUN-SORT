import React from 'react';
import { TrendingUp, Clock, MessageCircle, Target } from 'lucide-react';
import { ConversationMessage } from '../../types';

interface PerformanceAnalyzerProps {
  messages: ConversationMessage[];
  currentQuestionIndex: number;
  totalQuestions: number;
  timeElapsed: number;
  totalTime: number;
}

export function PerformanceAnalyzer({ 
  messages, 
  currentQuestionIndex, 
  totalQuestions, 
  timeElapsed, 
  totalTime 
}: PerformanceAnalyzerProps) {
  const candidateMessages = messages.filter(m => m.sender === 'candidate');
  const averageResponseLength = candidateMessages.length > 0 
    ? candidateMessages.reduce((sum, msg) => sum + msg.message.length, 0) / candidateMessages.length 
    : 0;
  
  const timePerQuestion = candidateMessages.length > 0 ? timeElapsed / candidateMessages.length : 0;
  const progressPercentage = (currentQuestionIndex / totalQuestions) * 100;
  const timeUsedPercentage = (timeElapsed / totalTime) * 100;

  const getPerformanceColor = (value: number, thresholds: { good: number; fair: number }) => {
    if (value >= thresholds.good) return 'text-green-600 dark:text-green-400';
    if (value >= thresholds.fair) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Analysis</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Progress */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Progress</span>
          </div>
          <div className="text-lg font-bold text-blue-600">{Math.round(progressPercentage)}%</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentQuestionIndex} of {totalQuestions} questions
          </div>
        </div>

        {/* Time Usage */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Time Used</span>
          </div>
          <div className={`text-lg font-bold ${getPerformanceColor(100 - timeUsedPercentage, { good: 50, fair: 25 })}`}>
            {Math.round(timeUsedPercentage)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(timeElapsed)} elapsed
          </div>
        </div>

        {/* Response Count */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Responses</span>
          </div>
          <div className="text-lg font-bold text-green-600">{candidateMessages.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total messages sent
          </div>
        </div>

        {/* Response Quality */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Avg Length</span>
          </div>
          <div className={`text-lg font-bold ${getPerformanceColor(averageResponseLength, { good: 100, fair: 50 })}`}>
            {Math.round(averageResponseLength)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Characters per response
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Performance Insights</h4>
        <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
          {timePerQuestion > 0 && (
            <p>• Average time per response: {formatTime(Math.round(timePerQuestion))}</p>
          )}
          {averageResponseLength > 0 && (
            <p>• Response detail level: {
              averageResponseLength > 150 ? 'Detailed' :
              averageResponseLength > 75 ? 'Moderate' : 'Brief'
            }</p>
          )}
          {progressPercentage > 0 && (
            <p>• Interview pace: {
              timeUsedPercentage < progressPercentage ? 'Efficient' :
              timeUsedPercentage > progressPercentage * 1.5 ? 'Slow' : 'Steady'
            }</p>
          )}
        </div>
      </div>
    </div>
  );
}