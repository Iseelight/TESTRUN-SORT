import React, { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX, Loader } from 'lucide-react';

interface AudioPlayerProps {
  text: string;
  autoPlay?: boolean;
  onPlaybackComplete?: () => void;
}

export function AudioPlayer({ text, autoPlay = false, onPlaybackComplete }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const synthesizeSpeech = async (text: string): Promise<string> => {
    // Using Web Speech API for text-to-speech
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Text-to-speech not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      // Try to use a more natural voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.name.includes('Natural')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        onPlaybackComplete?.();
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        reject(new Error('Speech synthesis failed'));
      };

      speechSynthesis.speak(utterance);
      resolve('speech-synthesis');
    });
  };

  const playAudio = async () => {
    if (isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);
      await synthesizeSpeech(text);
    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoPlay && text) {
      playAudio();
    }

    return () => {
      speechSynthesis.cancel();
    };
  }, [text, autoPlay]);

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      speechSynthesis.getVoices();
    };

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={playAudio}
        disabled={isLoading}
        className={`
          flex items-center justify-center w-8 h-8 rounded-full transition-colors
          ${isPlaying 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>
      
      <span className="text-xs text-gray-500">
        {isLoading ? 'Loading...' : isPlaying ? 'Playing' : 'Click to play'}
      </span>
    </div>
  );
}