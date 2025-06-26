import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

interface VoiceRecorderProps {
  onRecordingComplete: (transcript: string) => void;
  isDisabled?: boolean;
}

export function VoiceRecorder({ onRecordingComplete, isDisabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl('');
    setIsPlaying(false);
    setRecordingTime(0);
  };

  const processRecording = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    
    // Simulate speech-to-text processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock transcript - in a real app, this would use a speech-to-text API
    const mockTranscripts = [
      "I have over 5 years of experience in React development and I'm passionate about creating user-friendly interfaces.",
      "My background includes working with TypeScript, Node.js, and various cloud platforms like AWS.",
      "I enjoy collaborating with cross-functional teams and have led several successful projects from conception to deployment.",
      "I'm particularly interested in this role because it aligns with my career goals in frontend development.",
      "I believe my experience in agile development and problem-solving skills would be valuable to your team."
    ];
    
    const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
    
    setIsProcessing(false);
    onRecordingComplete(transcript);
    deleteRecording();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Voice Recording</h4>
        {isRecording && (
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!isRecording && !audioBlob && (
          <Button
            onClick={startRecording}
            disabled={isDisabled}
            variant="outline"
            size="sm"
            icon={Mic}
          >
            Start Recording
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={stopRecording}
            variant="danger"
            size="sm"
            icon={MicOff}
          >
            Stop Recording
          </Button>
        )}

        {audioBlob && !isRecording && (
          <>
            <Button
              onClick={playAudio}
              variant="outline"
              size="sm"
              icon={isPlaying ? Pause : Play}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            
            <Button
              onClick={processRecording}
              size="sm"
              loading={isProcessing}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Send'}
            </Button>
            
            <Button
              onClick={deleteRecording}
              variant="outline"
              size="sm"
              icon={Trash2}
            >
              Delete
            </Button>
          </>
        )}
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {isProcessing && (
        <div className="text-sm text-blue-600 dark:text-blue-400">
          Converting speech to text...
        </div>
      )}
    </div>
  );
}