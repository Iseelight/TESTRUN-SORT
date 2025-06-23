import React, { useState, useEffect } from 'react';
import { Clock, Pause } from 'lucide-react';

interface FloatingTimerProps {
  durationMinutes: number;
  isActive: boolean;
  onTimeUp: () => void;
  startTime?: number;
}

export function FloatingTimer({ 
  durationMinutes, 
  isActive, 
  onTimeUp, 
  startTime = 0
}: FloatingTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (!isActive || !startTime) {
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
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onTimeUp, durationMinutes, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 60) return 'bg-red-500 border-red-600 animate-pulse';
    if (timeLeft <= 120) return 'bg-yellow-500 border-yellow-600';
    return 'bg-green-500 border-green-600';
  };

  if (!startTime) return null;

  return (
    <div className={`
      fixed top-20 left-4 z-40 
      w-20 h-20 rounded-full border-2 
      flex flex-col items-center justify-center
      text-white font-bold text-xs
      shadow-lg backdrop-blur-sm
      ${getTimerColor()}
    `}>
      <div className="flex items-center mb-1">
        {isActive ? <Clock className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
      </div>
      <div className="text-center leading-none">
        <div className="text-xs">{formatTime(timeLeft)}</div>
        {!isActive && (
          <div className="text-xs opacity-75 mt-1">WAITING</div>
        )}
      </div>
    </div>
  );
}