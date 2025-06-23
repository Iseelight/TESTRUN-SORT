import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Play, Pause } from 'lucide-react';

interface AssessmentTimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
  onWarning?: (minutesLeft: number) => void;
  isActive: boolean;
  startTime?: number;
}

export function AssessmentTimer({ 
  durationMinutes, 
  onTimeUp, 
  onWarning, 
  isActive,
  startTime = 0
}: AssessmentTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [hasWarned, setHasWarned] = useState(false);

  useEffect(() => {
    if (!isActive || !startTime) {
      setTimeLeft(durationMinutes * 60);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, (durationMinutes * 60 * 1000) - elapsed);
      const remainingSeconds = Math.ceil(remaining / 1000);
      
      setTimeLeft(remainingSeconds);
      
      if (remainingSeconds <= 0) {
        onTimeUp();
        return;
      }

      // Single warning at 1 minute left
      const minutesLeft = Math.ceil(remainingSeconds / 60);
      if (minutesLeft === 1 && !hasWarned && isActive) {
        setHasWarned(true);
        onWarning?.(minutesLeft);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onTimeUp, onWarning, hasWarned, isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const minutesLeft = Math.ceil(timeLeft / 60);
    if (minutesLeft <= 1) return 'text-red-600 bg-red-50 border-red-200';
    if (minutesLeft <= 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getProgressPercentage = () => {
    return ((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100;
  };

  return (
    <div className="space-y-3">
      {/* Timer Display */}
      <div className={`
        flex items-center justify-center px-4 py-3 rounded-lg border-2 font-mono text-2xl font-bold
        ${getTimerColor()}
      `}>
        <div className="flex items-center">
          {isActive ? <Clock className="w-6 h-6 mr-2" /> : <Pause className="w-6 h-6 mr-2" />}
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Timer Status */}
      {!isActive && (
        <div className="flex items-center justify-center text-center p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <Pause className="w-4 h-4 text-orange-600 mr-2" />
          <span className="text-sm text-orange-800 font-medium">
            Timer starts when you begin responding
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${
            timeLeft <= 60 ? 'bg-red-500' : 
            timeLeft <= 120 ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {/* Warning Message - Only shows once at 1 minute */}
      {timeLeft <= 60 && timeLeft > 0 && isActive && (
        <div className="flex items-center justify-center text-center p-3 bg-red-50 border border-red-200 rounded-lg animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
          <span className="text-sm text-red-800 font-medium">
            Final minute - Please complete your current response
          </span>
        </div>
      )}
    </div>
  );
}