import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Send, Bot, Volume2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { FloatingVideoMonitor } from "./FloatingVideoMonitor";
import type { ConversationMessage, FaceDetectionData } from "../../types";
import { v4 as uuidv4 } from "uuid";

interface AssessmentConfig {
  duration: number
  questions: string[]
  enableFaceDetection: boolean
  enableScreenLock: boolean
  enableAudioRecording: boolean
  maxViolations: number
  allowRetake: boolean
}

interface AssessmentInterfaceProps {
  config: AssessmentConfig
  onAssessmentComplete: (result: any) => void
  onTerminate?: () => void
}

export const AssessmentInterface: React.FC<AssessmentInterfaceProps> = ({
  config,
  onAssessmentComplete,
  onTerminate,
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentStartTime] = useState(Date.now());
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(10 * 60); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [faceDetectionData, setFaceDetectionData] = useState<FaceDetectionData | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [waitingForUserResponse, setWaitingForUserResponse] = useState(false);
  const [userHasResponded, setUserHasResponded] = useState(false);
  const [isAssessmentTerminated, setIsAssessmentTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState<"completed" | "violation" | "timeout" | null>(null);
  const [showTerminationLoader, setShowTerminationLoader] = useState(false);
  const [questionTimeoutRef, setQuestionTimeoutRef] = useState<NodeJS.Timeout | null>(null);
  const [assessmentInitialized, setAssessmentInitialized] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (timerActive && timeRemaining > 0 && !isAssessmentTerminated) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up!
            endAssessment("timeout");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerActive, timeRemaining, isAssessmentTerminated]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [inputMessage]);

  // Initialize assessment with first question - FIXED: Only run once
  useEffect(() => {
    if (isAssessmentTerminated || assessmentInitialized) return;

    setAssessmentInitialized(true);

    setTimeout(() => {
      const initialMessage: ConversationMessage = {
        id: uuidv4(),
        sender: "ai",
        message:
          "Welcome to your AI assessment! I'll be asking you questions over the next 10 minutes. Please ensure you remain visible on camera throughout the assessment. Let's begin with the first question.",
        timestamp: new Date(),
      };

      setMessages([initialMessage]);

      speakText(initialMessage.message, () => {
        setTimeout(() => {
          askQuestion(0);
        }, 1000);
      });
    }, 1000);

    initializeAudio();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (questionTimeoutRef) {
        clearTimeout(questionTimeoutRef);
      }
    };
  }, []); // Empty dependency array to run only once

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
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

      initializeSpeechRecognition();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const initializeSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimText += transcript;
          }
        }

        if (interimText) {
          setInterimTranscript(interimText);

          const interimMessage: ConversationMessage = {
            id: "interim-message",
            sender: "candidate",
            message: interimText,
            timestamp: new Date(),
            isInterim: true,
          };

          setMessages((prev) => {
            const filtered = prev.filter((msg) => msg.id !== "interim-message");
            return [...filtered, interimMessage];
          });
        }

        if (finalTranscript) {
          handleSendMessage(finalTranscript);
          stopRecording();
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      speechRecognitionRef.current = recognition;
    }
  };

  const speakText = (text: string, onComplete?: () => void) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsAISpeaking(true);
      setIsMicMuted(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) => voice.name.includes("Google") || voice.name.includes("Microsoft") || voice.name.includes("Natural"),
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        setIsAISpeaking(false);
        if (onComplete) {
          onComplete();
        }
      };

      utterance.onerror = () => {
        setIsAISpeaking(false);
        if (onComplete) {
          onComplete();
        }
      };

      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      setIsAISpeaking(false);
      if (onComplete) {
        onComplete();
      }
    }
  };

  const askQuestion = (questionIndex: number) => {
    if (isAssessmentTerminated || waitingForUserResponse) return;

    if (questionIndex >= config.questions.length) {
      endAssessment("completed");
      return;
    }

    // Start timer when first question is asked
    if (questionIndex === 0 && !timerActive) {
      setTimerStartTime(Date.now());
      setTimerActive(true);
    }

    setCurrentQuestionIndex(questionIndex);
    const question = config.questions[questionIndex];

    const questionMessage: ConversationMessage = {
      id: uuidv4(),
      sender: "ai",
      message: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, questionMessage]);
    setWaitingForUserResponse(false);
    setUserHasResponded(false);

    speakText(question, () => {
      setWaitingForUserResponse(true);
      setIsMicMuted(false);

      // Set 30-second timeout for auto-advance
      const timeout = setTimeout(() => {
        if (!userHasResponded && !isAssessmentTerminated) {
          // Auto-advance to next question if user hasn't responded
          const nextQuestionIndex = questionIndex + 1;
          if (nextQuestionIndex < config.questions.length) {
            askQuestion(nextQuestionIndex);
          } else {
            endAssessment("completed");
          }
        }
      }, 30000); // 30 seconds

      setQuestionTimeoutRef(timeout);
    });
  };

  const toggleMicrophone = () => {
    if (isAISpeaking || isAssessmentTerminated) {
      return;
    }

    if (isRecording) {
      // Currently recording, stop it
      stopRecording();
      setIsMicMuted(true);
    } else {
      // Not recording, start it
      startRecording();
      setIsMicMuted(false);
    }
  };

  const startRecording = () => {
    if (isAssessmentTerminated) return;

    if (!speechRecognitionRef.current) {
      initializeSpeechRecognition();
    }

    if (speechRecognitionRef.current && !isAISpeaking) {
      setIsRecording(true);
      setInterimTranscript("");
      speechRecognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const processAudioRecording = async () => {
    if (audioChunksRef.current.length === 0 || isAssessmentTerminated) return;

    try {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockTranscripts = [
        "I have over 5 years of experience in React development and I'm passionate about creating user-friendly interfaces.",
        "My background includes working with TypeScript, Node.js, and various cloud platforms like AWS.",
        "I enjoy collaborating with cross-functional teams and have led several successful projects from conception to deployment.",
        "I'm particularly interested in this role because it aligns with my career goals in frontend development.",
        "I believe my experience in agile development and problem-solving skills would be valuable to your team.",
      ];

      let transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];

      transcript = transcript
        .replace(/\bum\b|\buh\b|\ber\b|\blike\b|\byou know\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      handleSendMessage(transcript);
    } catch (error) {
      console.error("Error processing audio:", error);
    }
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim() || isAssessmentTerminated) return;

    // Clear question timeout since user is responding
    if (questionTimeoutRef) {
      clearTimeout(questionTimeoutRef);
      setQuestionTimeoutRef(null);
    }

    // Remove interim message
    setMessages((prev) => prev.filter((msg) => msg.id !== "interim-message"));

    // Add user message
    const userMessage: ConversationMessage = {
      id: uuidv4(),
      sender: "candidate",
      message: message,
      timestamp: new Date(),
      audioBlob: new Blob(audioChunksRef.current, { type: "audio/webm" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setWaitingForUserResponse(false);
    setUserHasResponded(true);

    // Update questions answered count
    setQuestionsAnswered((prev) => prev + 1);

    // Clear audio chunks for next recording
    audioChunksRef.current = [];

    // Simulate AI thinking
    setIsTyping(true);

    // AI acknowledgment and automatic progression
    setTimeout(() => {
      setIsTyping(false);

      const nextQuestionIndex = currentQuestionIndex + 1;
      if (nextQuestionIndex < config.questions.length) {
        setUserHasResponded(false);
        setWaitingForUserResponse(false);
        setTimeout(() => askQuestion(nextQuestionIndex), 500);
      } else {
        endAssessment("completed");
      }
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const handleSecurityAlert = (alert: any) => {
    if (isAssessmentTerminated) return;

    setSecurityAlerts((prev) => [...prev, alert]);

    if (alert.severity === "high" || securityAlerts.length >= config.maxViolations) {
      endAssessment("violation");
    }
  };

  const handleFaceDetectionUpdate = (data: FaceDetectionData) => {
    setFaceDetectionData(data);
  };

  const handleFaceAwayViolation = useCallback(() => {
    if (isAssessmentTerminated) return;

    console.log("Face away violation detected - terminating assessment");

    const faceAwayAlert = {
      id: Date.now().toString(),
      type: "face_not_detected",
      message: "Face not detected for extended period",
      timestamp: new Date(),
      severity: "high",
    };

    setSecurityAlerts((prev) => [...prev, faceAwayAlert]);
    endAssessment("violation");
  }, [isAssessmentTerminated]);

  const endAssessment = (reason: "completed" | "violation" | "timeout") => {
    if (isAssessmentTerminated) return;

    console.log("Ending assessment with reason:", reason);

    setIsAssessmentTerminated(true);
    setTerminationReason(reason);
    setTimerActive(false);

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Stop any ongoing speech
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Stop media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Calculate score based on questions answered
    const finalQuestionsAnswered = reason === "completed" ? config.questions.length : questionsAnswered;
    const scorePercentage = Math.round((finalQuestionsAnswered / config.questions.length) * 100);
    const passed = scorePercentage >= 60; // 60% passing threshold

    const assessmentResult = {
      questionsAnswered: finalQuestionsAnswered,
      totalQuestions: config.questions.length,
      duration: Math.floor((Date.now() - assessmentStartTime) / 1000 / 60),
      securityAlertsCount: securityAlerts.length,
      securityAlerts,
      messages,
      terminationReason:
        reason === "violation"
          ? "Session terminated due to security violations"
          : reason === "timeout"
            ? "Session terminated due to time limit exceeded"
            : null,
      status: reason === "completed" ? "completed" : "terminated",
      score: scorePercentage,
      passed: reason === "completed" ? true : passed,
      timeRemaining: reason === "timeout" ? 0 : timeRemaining,
    };

    // Show termination loader
    setShowTerminationLoader(true);

    // Different completion messages based on reason
    let completionMessage = "";

    switch (reason) {
      case "completed":
        completionMessage =
          "Congratulations! You have successfully completed the assessment. Your responses have been recorded and will be analyzed.";
        break;
      case "violation":
        completionMessage =
          "The assessment has been terminated due to security violations. You looked away from the camera for too long.";
        break;
      case "timeout":
        completionMessage = `Time's up! The assessment has been terminated due to time limit exceeded. You answered ${finalQuestionsAnswered} out of ${config.questions.length} questions.`;
        break;
    }

    const finalMessage: ConversationMessage = {
      id: uuidv4(),
      sender: "ai",
      message: completionMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, finalMessage]);

    // Speak completion message and then proceed to results
    speakText(completionMessage, () => {
      // Show loader for 3 seconds, then proceed to results
      setTimeout(() => {
        setShowTerminationLoader(false);
        onAssessmentComplete(assessmentResult);
        if (onTerminate) {
          onTerminate();
        }
      }, 3000);
    });
  };

  // Show termination loader
  if (showTerminationLoader) {
    const getLoaderContent = () => {
      switch (terminationReason) {
        case "completed":
          return {
            title: "Assessment Completed",
            message: "Congratulations! You have successfully completed your assessment.",
            bgColor: "from-green-50 to-green-100",
            headerColor: "from-green-600 to-green-700",
            iconColor: "text-green-600",
            icon: "✓",
          };
        case "violation":
          return {
            title: "Assessment Terminated",
            message: "Your assessment was terminated due to security violations.",
            bgColor: "from-red-50 to-red-100",
            headerColor: "from-red-600 to-red-700",
            iconColor: "text-red-600",
            icon: "⚠",
          };
        case "timeout":
          return {
            title: "Time Limit Exceeded",
            message: "Your assessment was terminated because the time limit was reached.",
            bgColor: "from-orange-50 to-orange-100",
            headerColor: "from-orange-600 to-orange-700",
            iconColor: "text-orange-600",
            icon: "⏰",
          };
        default:
          return {
            title: "Processing",
            message: "Please wait...",
            bgColor: "from-blue-50 to-blue-100",
            headerColor: "from-blue-600 to-blue-700",
            iconColor: "text-blue-600",
            icon: "⏳",
          };
      }
    };

    const loaderContent = getLoaderContent();

    return (
      <div
        className={`min-h-screen bg-gradient-to-br ${loaderContent.bgColor} dark:from-gray-900 dark:to-gray-800 p-4 w-full flex items-center justify-center`}
      >
        <Card className="max-w-md mx-auto">
          <CardHeader className={`bg-gradient-to-r ${loaderContent.headerColor} text-white`}>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{loaderContent.icon}</span>
              {loaderContent.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-center">{loaderContent.message}</p>
            <div className="flex flex-col items-center space-y-3">
              <div
                className={`w-8 h-8 border-4 ${loaderContent.iconColor.replace("text-", "border-")} border-t-transparent rounded-full animate-spin`}
              ></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Redirecting to results...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 w-full">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Interview</h1>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                Question {currentQuestionIndex + 1} of {config.questions.length}
              </Badge>
              {/* Timer */}
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  timeRemaining <= 300
                    ? "bg-red-100 text-red-700"
                    : timeRemaining <= 600
                      ? "bg-orange-100 text-orange-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-2">
            <div className="flex flex-col h-[500px] sm:h-[600px] rounded-lg overflow-hidden shadow-lg">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Interviewer</h3>
                    <p className="text-sm text-white/70">
                      {isAISpeaking ? (
                        <span className="flex items-center gap-1">
                          <Volume2 className="w-4 h-4" />
                          <span>Speaking</span>
                        </span>
                      ) : isTyping ? (
                        <span className="flex items-center gap-1">
                          <span>typing</span>
                          <div className="flex space-x-1">
                            <div
                              className="w-1 h-1 bg-white/70 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-white/70 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-white/70 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                        </span>
                      ) : waitingForUserResponse ? (
                        <span>Waiting for your response</span>
                      ) : (
                        "Processing..."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100 dark:bg-gray-800">
                {messages.map((message) => (
                  <div
                    key={message.id === "interim-message" ? "interim-message" : message.id}
                    className={`flex ${message.sender === "candidate" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-lg relative ${
                        message.sender === "ai"
                          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-tr-lg rounded-br-lg rounded-bl-lg"
                          : message.isInterim
                            ? "bg-blue-100 dark:bg-blue-900/30 text-gray-900 dark:text-white rounded-tl-lg rounded-br-lg rounded-bl-lg"
                            : "bg-blue-600 text-white rounded-tl-lg rounded-br-lg rounded-bl-lg"
                      }`}
                    >
                      {/* Message triangle */}
                      {message.sender === "ai" && (
                        <div className="absolute -left-2 top-0 w-0 h-0 border-t-8 border-r-8 border-b-0 border-l-0 border-white dark:border-gray-700"></div>
                      )}
                      {message.sender === "candidate" && !message.isInterim && (
                        <div className="absolute -right-2 top-0 w-0 h-0 border-t-8 border-l-8 border-b-0 border-r-0 border-blue-600"></div>
                      )}

                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.message}
                        {message.isInterim && <span className="ml-1 animate-pulse">|</span>}
                      </p>

                      {/* Audio playback for messages with audio */}
                      {message.audioBlob && (
                        <div className="mt-2 pt-2 border-t border-white/20">
                          <button
                            onClick={() => {
                              if (message.audioBlob) {
                                const audioUrl = URL.createObjectURL(message.audioBlob);
                                const audio = new Audio(audioUrl);
                                audio.play();
                              }
                            }}
                            className={`flex items-center space-x-1 text-xs ${
                              message.sender === "candidate"
                                ? "text-white/80 hover:text-white"
                                : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            } transition-opacity`}
                          >
                            <Volume2 className="h-3 w-3" />
                            <span>Play Audio</span>
                          </button>
                        </div>
                      )}
                      <div className="mt-1 text-xs opacity-70 text-right">
                        {message.isInterim
                          ? "Speaking..."
                          : new Date(message.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg rounded-tl-none">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-white dark:bg-gray-700 p-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={toggleMicrophone}
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    className="rounded-full"
                    disabled={isTyping || isAISpeaking || !waitingForUserResponse || isAssessmentTerminated}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>

                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={waitingForUserResponse ? "Type your response..." : "Waiting for AI to finish..."}
                      className="w-full resize-none px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] max-h-[120px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={1}
                      disabled={
                        isTyping || isRecording || isAISpeaking || !waitingForUserResponse || isAssessmentTerminated
                      }
                    />
                  </div>

                  <Button
                    onClick={() => handleSendMessage(inputMessage)}
                    disabled={
                      !inputMessage.trim() ||
                      isTyping ||
                      isAISpeaking ||
                      !waitingForUserResponse ||
                      isAssessmentTerminated
                    }
                    className="px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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

                {isAISpeaking && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                    <Volume2 className="w-4 h-4" />
                    <span className="text-sm font-medium">AI is speaking... Please wait</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Timer Card */}
            <Card>
              <CardHeader
                className={`${
                  timeRemaining <= 300
                    ? "bg-gradient-to-r from-red-600 to-red-700"
                    : timeRemaining <= 600
                      ? "bg-gradient-to-r from-orange-600 to-orange-700"
                      : "bg-gradient-to-r from-blue-600 to-purple-600"
                } text-white`}
              >
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time Remaining
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div
                    className={`text-3xl font-mono font-bold ${
                      timeRemaining <= 300 ? "text-red-600" : timeRemaining <= 600 ? "text-orange-600" : "text-blue-600"
                    }`}
                  >
                    {formatTime(timeRemaining)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {timeRemaining <= 300 ? "Hurry up!" : timeRemaining <= 600 ? "Time running low" : "Keep going!"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Question</span>
                    <span>
                      {currentQuestionIndex + 1} / {config.questions.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(questionsAnswered / config.questions.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Questions Answered: {questionsAnswered}</span>
                    <span>{Math.round((questionsAnswered / config.questions.length) * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Monitor */}
            <FloatingVideoMonitor
              isActive={!isAssessmentTerminated}
              onSecurityAlert={handleSecurityAlert}
              onFaceDetectionUpdate={handleFaceDetectionUpdate}
              onFaceAwayViolation={handleFaceAwayViolation}
              hideTerminationModal={true}
            />

            {/* Instructions */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="text-sm">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pt-4">
                <p>• Click the microphone icon to start/stop recording</p>
                <p>• Or type your response in the text box</p>
                <p>• Keep your face visible to the camera</p>
                <p>• Questions advance automatically after your response</p>
                <p>• Complete all questions within 10 minutes</p>
              </CardContent>
            </Card>

            {/* Audio Status */}
            {(isRecording || interimTranscript || isAISpeaking) && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <CardTitle className="text-sm">Audio Status</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {isRecording && (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <div className="w-3 h-3 bg-red-600 dark:bg-red-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Recording in progress</span>
                      </div>
                    )}

                    {isAISpeaking && (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Volume2 className="w-4 h-4" />
                        <span className="text-sm font-medium">AI is speaking</span>
                      </div>
                    )}

                    {interimTranscript && (
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {interimTranscript}
                          <span className="animate-pulse">|</span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Status */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="text-sm">Security Status</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Face Detection</span>
                    <Badge variant={faceDetectionData?.faceDetected ? "default" : "destructive"}>
                      {faceDetectionData?.faceDetected ? "Detected" : "Not Detected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Security Alerts</span>
                    <Badge variant={securityAlerts.length > 0 ? "destructive" : "default"}>
                      {securityAlerts.length} Alerts
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};