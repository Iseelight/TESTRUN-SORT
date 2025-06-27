import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Trash2 } from 'lucide-react';
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
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize audio automatically
    startAudio();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [audioUrl]);

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio monitoring
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      // Continue without showing error
    }
  };

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

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      // If we don't have a stream yet, try to get one
      if (!streamRef.current) {
        await startAudio();
      }
      
      if (!streamRef.current) {
        console.error('No audio stream available');
        return;
      }
      
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop audio level monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        setAudioLevel(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start audio level monitoring
      monitorAudioLevel();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
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

      {/* Audio Level Meter */}
      {isRecording && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div 
            className="bg-red-500 h-2 rounded-full transition-all duration-100"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          onClick={toggleRecording}
          disabled={isDisabled || isProcessing}
          variant={isRecording ? "destructive" : "outline"}
          size="sm"
        >
          {isRecording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>

        {audioBlob && !isRecording && (
          <>
            <Button
              onClick={playAudio}
              variant="outline"
              size="sm"
            >
              {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
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
            >
              <Trash2 className="mr-2 h-4 w-4" />
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
          Converting speech to text with auto-correction...
        </div>
      )}
    </div>
  );
}