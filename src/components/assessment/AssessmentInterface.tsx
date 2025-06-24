"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Mic,
  MicOff,
  Settings,
  Shield,
  User,
  AlertTriangle,
  Volume2,
  Send,
  Wifi,
  WifiOff,
  CheckCircle,
} from "lucide-react"
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from "../ui/badge"
import { Textarea } from "../ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Progress } from "../ui/progress"
import { FloatingVideoMonitor } from './FloatingVideoMonitor';
import type { FaceDetectionData, SecurityAlert } from '../../types';

interface Message {
  id: string
  sender: "ai" | "candidate"
  content: string
  timestamp: Date
  transcribed?: boolean
}

interface AssessmentConfig {
  duration: number
  totalQuestions: number
}

export function AssessmentInterface() {
  // Audio States
  const [isMuted, setIsMuted] = useState(true) // Start muted
  const [audioLevel, setAudioLevel] = useState(0)

  // Assessment States
  const [isAssessmentActive, setIsAssessmentActive] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isAITyping, setIsAITyping] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(5 * 60) // 5 minutes
  const [timerStarted, setTimerStarted] = useState(false)
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([])

  // Live Transcription States
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [finalTranscript, setFinalTranscript] = useState("")
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false)

  // UI States
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connected")
  const [autoScroll, setAutoScroll] = useState(true)

  // Face detection states
  const [faceDetectionData, setFaceDetectionData] = useState<FaceDetectionData>({
    faceDetected: false,
    faceCount: 0,
    faceCenterX: 0,
    faceCenterY: 0,
    faceSize: 0,
    confidence: 0,
  })
  const [faceWarningCount, setFaceWarningCount] = useState(0)
  const [showFaceWarning, setShowFaceWarning] = useState(false)
  const [isAssessmentTerminated, setIsAssessmentTerminated] = useState(false)
  const [isAIReading, setIsAIReading] = useState(false)
  const [canUserRespond, setCanUserRespond] = useState(false)

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isStoppingRecognitionRef = useRef(false)
  const shouldRestartRecognitionRef = useRef(false)

  const config: AssessmentConfig = {
    duration: 5,
    totalQuestions: 10,
  }

  const interviewQuestions = [
    "Tell me about yourself and why you're interested in this position.",
    "What are your greatest strengths and how do they relate to this role?",
    "Describe a challenging project you've worked on and how you overcame obstacles.",
    "How do you handle working under pressure or tight deadlines?",
    "Tell me about a time when you had to work with a difficult team member.",
    "What motivates you in your work, and how do you stay current with industry trends?",
    "Describe a situation where you had to learn something new quickly.",
    "How do you prioritize tasks when you have multiple competing deadlines?",
    "Tell me about a mistake you made and how you handled it.",
    "What are your career goals for the next five years?",
  ]

  // Handle security alerts from face detection
  const handleSecurityAlert = useCallback((alert: SecurityAlert) => {
    setSecurityAlerts((prev) => [...prev, alert])
    console.log("Security Alert:", alert)
  }, [])

  // Handle face detection updates
  const handleFaceDetectionUpdate = useCallback((data: FaceDetectionData) => {
    setFaceDetectionData(data)
  }, [])

  // Handle face away violation
  const handleFaceAwayViolation = useCallback(() => {
    const newCount = faceWarningCount + 1
    setFaceWarningCount(newCount)

    console.log(`Face away violation ${newCount}/2`)

    if (newCount >= 2) {
      setIsAssessmentTerminated(true)
      setIsAssessmentActive(false)
      alert("Assessment terminated: You have been away from the camera for more than 30 seconds twice.")
    } else {
      setShowFaceWarning(true)
      setTimeout(() => {
        setShowFaceWarning(false)
      }, 5000)
    }
  }, [faceWarningCount])

  // Initialize microphone
  useEffect(() => {
    let analyser: AnalyserNode | null = null

    const initializeAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })

        streamRef.current = stream

        audioContextRef.current = new AudioContext()
        analyser = audioContextRef.current.createAnalyser()
        const microphone = audioContextRef.current.createMediaStreamSource(stream)
        microphone.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const updateAudioLevel = () => {
          if (analyser && !isMuted) {
            analyser.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length
            setAudioLevel(average)
          } else {
            setAudioLevel(0)
          }
          requestAnimationFrame(updateAudioLevel)
        }
        updateAudioLevel()

        const audioTracks = stream.getAudioTracks()
        audioTracks.forEach((track) => {
          track.enabled = false
        })

        setConnectionStatus("connected")
      } catch (error) {
        console.error("Error accessing microphone:", error)
        setConnectionStatus("disconnected")
      }
    }

    initializeAudio()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (analyser) {
        analyser.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [isMuted])

  // Safe speech recognition stop function
  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current && !isStoppingRecognitionRef.current) {
      try {
        isStoppingRecognitionRef.current = true
        shouldRestartRecognitionRef.current = false
        setIsTranscribing(false)
        setLiveTranscript("")

        recognitionRef.current.stop()

        setTimeout(() => {
          isStoppingRecognitionRef.current = false
        }, 1000)
      } catch (error) {
        console.error("Error stopping speech recognition:", error)
        isStoppingRecognitionRef.current = false
        setIsTranscribing(false)
        setLiveTranscript("")
      }
    }
  }, [])

  // Safe speech recognition start function
  const startSpeechRecognition = useCallback(() => {
    if (recognitionRef.current && !isStoppingRecognitionRef.current && !isTranscribing) {
      try {
        // Check if recognition is already running by checking its state
        if (recognitionRef.current.continuous !== undefined) {
          // Additional safety check - only start if we're sure it's not running
          shouldRestartRecognitionRef.current = true
          recognitionRef.current.start()
          console.log("Starting speech recognition...")
        }
      } catch (error) {
        // If we get the "already started" error, just log it and set the state correctly
        if (error.message.includes("already started") || error.name === "InvalidStateError") {
          console.log("Speech recognition already running, setting state correctly")
          setIsTranscribing(true)
          shouldRestartRecognitionRef.current = true
        } else {
          console.error("Error starting speech recognition:", error)
          setIsTranscribing(false)
        }
      }
    }
  }, [isTranscribing])

  // Initialize speech recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      setSpeechRecognitionSupported(true)
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "en-US"
      recognitionRef.current.maxAlternatives = 1

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started")
        if (shouldRestartRecognitionRef.current) {
          setIsTranscribing(true)
        }
      }

      recognitionRef.current.onresult = (event: any) => {
        if (!shouldRestartRecognitionRef.current) return

        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " "
          } else {
            interimTranscript += transcript
          }
        }

        setLiveTranscript(interimTranscript)

        if (finalTranscript.trim()) {
          setFinalTranscript(finalTranscript.trim())
          setInputText((prev) => {
            const newText = prev + (prev ? " " : "") + finalTranscript.trim()
            return newText
          })

          setTimeout(() => {
            setFinalTranscript("")
          }, 3000)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.log("Speech recognition error:", event.error)

        if (isStoppingRecognitionRef.current) {
          return
        }

        switch (event.error) {
          case "aborted":
            console.log("Speech recognition was aborted")
            setIsTranscribing(false)
            setLiveTranscript("")
            return
          case "network":
            console.log("Network error - will retry")
            break
          case "not-allowed":
            console.log("Microphone access denied")
            setIsTranscribing(false)
            setLiveTranscript("")
            shouldRestartRecognitionRef.current = false
            return
          case "no-speech":
            console.log("No speech detected")
            return
          default:
            console.log("Other speech recognition error:", event.error)
            setIsTranscribing(false)
            setLiveTranscript("")
            shouldRestartRecognitionRef.current = false
            return
        }
      }

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended")

        if (isStoppingRecognitionRef.current) {
          return
        }

        // Add a small delay and additional state check before restarting
        if (
          shouldRestartRecognitionRef.current &&
          isAssessmentActive &&
          !isAssessmentTerminated &&
          !isAIReading &&
          canUserRespond
        ) {
          console.log("Auto-restarting speech recognition...")
          setTimeout(() => {
            if (shouldRestartRecognitionRef.current && !isStoppingRecognitionRef.current && !isTranscribing) {
              startSpeechRecognition()
            }
          }, 500)
        } else {
          setIsTranscribing(false)
          setLiveTranscript("")
        }
      }
    } else {
      console.log("Speech recognition not supported in this browser")
      setSpeechRecognitionSupported(false)
    }
  }, [isAssessmentActive, isAssessmentTerminated, isAIReading, canUserRespond, startSpeechRecognition])

  // Timer countdown - Only starts after timer is enabled
  useEffect(() => {
    if (isAssessmentActive && timerStarted && timeRemaining > 0 && !isAssessmentTerminated) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer ended - terminate assessment
            setIsAssessmentTerminated(true)
            setIsAssessmentActive(false)
            alert("Assessment terminated: Time limit reached.")
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isAssessmentActive, timerStarted, timeRemaining, isAssessmentTerminated])

  // Enhanced auto-scroll with manual override detection
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, autoScroll])

  // Detect manual scrolling to disable auto-scroll
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
      setAutoScroll(isAtBottom)
    }
  }, [])

  // Text-to-Speech for AI questions with enhanced control
  const speakText = (text: string, isFirstQuestion = false) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onstart = () => {
        setIsAIReading(true)
        setCanUserRespond(false)
        stopSpeechRecognition()
      }

      utterance.onend = () => {
        setIsAIReading(false)
        setCanUserRespond(true)

        // Start timer only after first question is read
        if (isFirstQuestion) {
          setTimerStarted(true)
          console.log("Timer started after first question")
        }

        if (isMuted) {
          setIsMuted(false)
          if (streamRef.current) {
            const audioTracks = streamRef.current.getAudioTracks()
            audioTracks.forEach((track) => {
              track.enabled = true
            })
          }
        }
      }

      utterance.onerror = () => {
        setIsAIReading(false)
        setCanUserRespond(true)
        if (isFirstQuestion) {
          setTimerStarted(true)
        }
      }

      speechSynthesis.speak(utterance)
    }
  }

  const toggleMute = () => {
    if (isAIReading) return

    setIsMuted(!isMuted)
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = isMuted
      })
    }
  }

  const toggleTranscription = () => {
    if (isAIReading || !speechRecognitionSupported) return

    if (isTranscribing) {
      stopSpeechRecognition()
    } else {
      if (canUserRespond && !isAIReading) {
        startSpeechRecognition()
      }
    }
  }

  const startAssessment = () => {
    setIsAssessmentActive(true)
    setFaceWarningCount(0)
    setIsAssessmentTerminated(false)
    setTimerStarted(false) // Timer will start after first question

    const welcomeMessage: Message = {
      id: "1",
      sender: "ai",
      content: `Welcome to your AI interview assessment. I'm your AI interviewer today. We have ${config.duration} minutes for ${config.totalQuestions} questions. 

Please ensure your camera and microphone are working properly. Keep your face aligned with the silhouette guide. You can respond using voice (which will be transcribed automatically) or by typing your responses.

I will read each question aloud. Please wait for me to finish before responding. The timer will start after I finish reading the first question.

Let's begin with our first question: ${interviewQuestions[0]}`,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])

    setTimeout(() => {
      speakText(welcomeMessage.content, true) // Mark as first question
    }, 1000)
  }

  const sendMessage = async () => {
    // Check if face is detected before allowing submission
    if (!faceDetectionData.faceDetected) {
      alert("Please align your face with the camera before submitting your answer.")
      return
    }

    if (!inputText.trim() || !canUserRespond) return

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "candidate",
      content: inputText,
      timestamp: new Date(),
      transcribed: finalTranscript.length > 0,
    }

    setMessages((prev) => [...prev, userMessage])

    const currentInput = inputText
    setInputText("")
    setFinalTranscript("")
    setIsAITyping(true)
    setCanUserRespond(false)

    setIsMuted(true)
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = false
      })
    }

    stopSpeechRecognition()

    console.log("User sent message:", currentInput)

    setTimeout(() => {
      const nextQuestion = currentQuestion + 1
      let aiResponse = ""

      if (nextQuestion < interviewQuestions.length) {
        aiResponse = `Thank you for that response. Let's move on to question ${nextQuestion + 1}: ${interviewQuestions[nextQuestion]}`
        setCurrentQuestion(nextQuestion)
      } else {
        aiResponse =
          "Thank you for completing all the questions. Your assessment is now complete. We'll review your responses and get back to you soon."
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        content: aiResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsAITyping(false)

      console.log("AI sent message:", aiResponse)
      speakText(aiResponse)
    }, 2000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getTimerColor = (seconds: number) => {
    if (seconds <= 60) return "bg-red-600 border-red-500"
    if (seconds <= 120) return "bg-orange-600 border-orange-500"
    return "bg-black border-gray-600"
  }

  const getProgressPercentage = () => {
    return ((currentQuestion + 1) / config.totalQuestions) * 100
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col relative">
      {/* Floating Video Monitor */}
      <FloatingVideoMonitor
        onSecurityAlert={handleSecurityAlert}
        onFaceDetectionUpdate={handleFaceDetectionUpdate}
        isActive={isAssessmentActive}
        onFaceAwayViolation={handleFaceAwayViolation}
      />

      {/* Face Detection Warning Modal */}
      {showFaceWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md mx-4 border-red-500 bg-red-50 dark:bg-red-900">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Warning: Face Detection Violation!
              </h3>
              <p className="text-red-700 dark:text-red-300">
                You were away from the camera for more than 30 seconds. This is warning {faceWarningCount} of 2.
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Assessment will be terminated after 2 warnings. Please keep your face visible at all times.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Timer Countdown - Only shows when timer has started */}
      {isAssessmentActive && !isAssessmentTerminated && timerStarted && (
        <div
          className={`fixed top-4 left-4 bg-opacity-90 text-white px-3 py-2 rounded-lg shadow-lg z-50 border transition-colors duration-300 ${getTimerColor(timeRemaining)}`}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${timeRemaining <= 60 ? "bg-white" : "bg-red-500"}`} />
            <div className="text-sm font-mono font-bold">{formatTime(timeRemaining)}</div>
          </div>
          <div className="text-xs text-gray-200 text-center mt-1">{timeRemaining <= 60 ? "URGENT!" : "Time Left"}</div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback className="bg-blue-500 text-white">AI</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">AI Interview Assessment</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === "connected"
                        ? "bg-green-500"
                        : connectionStatus === "connecting"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="capitalize">{connectionStatus}</span>
                  {connectionStatus === "connected" && <Wifi className="w-4 h-4" />}
                  {connectionStatus === "disconnected" && <WifiOff className="w-4 h-4" />}
                  {isAIReading && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 ml-2">
                      <Volume2 className="w-3 h-3 mr-1" />
                      AI Reading
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAssessmentActive && (
              <>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  Question {currentQuestion + 1}/{config.totalQuestions}
                </Badge>
                {timerStarted && (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {formatTime(timeRemaining)}
                  </Badge>
                )}
                {faceWarningCount > 0 && <Badge variant="destructive">Warnings: {faceWarningCount}/2</Badge>}
              </>
            )}
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isAssessmentActive && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(getProgressPercentage())}% Complete</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-20" onScroll={handleScroll}>
          {!isAssessmentActive ? (
            <div className="flex items-center justify-center h-full">
              <Card className="p-8 text-center max-w-md">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
                    <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Ready to Begin Your Assessment?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    This is a secure AI-powered interview assessment. Make sure your camera and microphone are working
                    properly. Keep your face aligned with the silhouette guide.
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <p>• Duration: {config.duration} minutes</p>
                    <p>• Questions: {config.totalQuestions}</p>
                    <p>• AI will read questions aloud through your speakers</p>
                    <p>• You can respond by voice or text</p>
                    <p>• Face detection: 30 seconds away = 1 warning</p>
                    <p>• Assessment terminates after 2 warnings</p>
                    <p>• Timer starts after first question is read</p>
                    {!speechRecognitionSupported && (
                      <p className="text-orange-600">• Voice transcription not supported in this browser</p>
                    )}
                  </div>
                  <Button onClick={startAssessment} className="w-full" disabled={isAssessmentTerminated}>
                    <Shield className="w-4 h-4 mr-2" />
                    Start Secure Assessment
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "candidate" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender === "candidate"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span
                        className={`text-xs ${
                          message.sender === "candidate" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {message.transcribed && (
                        <Badge variant="outline" className="text-xs ml-2">
                          <Mic className="w-2 h-2 mr-1" />
                          Voice
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isAITyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Auto-scroll indicator */}
        {!autoScroll && (
          <div className="absolute bottom-32 right-8 z-10">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAutoScroll(true)
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
              }}
              className="rounded-full shadow-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <span className="text-xs">Scroll to bottom</span>
            </Button>
          </div>
        )}

        {/* Live Transcription Display */}
        {isTranscribing && !isAIReading && speechRecognitionSupported && (
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 border-t border-blue-200 dark:border-blue-700">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">
                      Live Transcription Active
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800">
                    <Mic className="w-3 h-3 mr-1" />
                    Listening...
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleTranscription}
                  className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800"
                >
                  Stop
                </Button>
              </div>

              {liveTranscript && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Speaking now:</p>
                      <p className="text-gray-800 dark:text-gray-200 italic text-sm leading-relaxed">
                        {liveTranscript}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {finalTranscript && (
                <div className="bg-green-50 dark:bg-green-900 rounded-lg p-3 border border-green-200 dark:border-green-600">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-green-700 dark:text-green-300 mb-1">Transcribed and added to input:</p>
                      <p className="text-green-800 dark:text-green-200 text-sm leading-relaxed">{finalTranscript}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center space-x-4">
                <span>💡 Speak clearly for better accuracy</span>
                <span>🎯 Pause briefly between sentences</span>
                <span>✨ Text will appear automatically in the input field</span>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        {isAssessmentActive && !isAssessmentTerminated && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {/* Face detection warning for input */}
            {!faceDetectionData.faceDetected && (
              <div className="mb-3 p-2 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Please align your face with the camera to submit your answer.</span>
                </div>
              </div>
            )}

            <div className="flex items-end space-x-3">
              {/* Audio Controls */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={isMuted ? "destructive" : "secondary"}
                  onClick={toggleMute}
                  className="rounded-full w-10 h-10 p-0"
                  disabled={isAIReading}
                  title={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                <Button
                  size="sm"
                  variant={isTranscribing ? "default" : "outline"}
                  onClick={toggleTranscription}
                  className={`rounded-full w-10 h-10 p-0 transition-all duration-200 ${
                    isTranscribing
                      ? "bg-red-500 hover:bg-red-600 border-red-500 shadow-lg"
                      : "hover:bg-blue-50 dark:hover:bg-blue-900"
                  }`}
                  disabled={isAIReading || !canUserRespond || !speechRecognitionSupported}
                  title={
                    !speechRecognitionSupported
                      ? "Voice transcription not supported"
                      : isTranscribing
                        ? "Stop voice transcription"
                        : "Start voice transcription"
                  }
                >
                  {isTranscribing ? (
                    <div className="relative">
                      <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-4 h-4 border-2 border-white rounded-full animate-ping" />
                    </div>
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Text Input */}
              <div className="flex-1">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isAIReading
                      ? "Please wait for AI to finish reading..."
                      : !canUserRespond
                        ? "Wait for AI to finish, then you can respond..."
                        : !faceDetectionData.faceDetected
                          ? "Align your face with the camera to respond..."
                          : "Type your response or use voice input..."
                  }
                  className="min-h-[44px] max-h-32 resize-none rounded-2xl border-gray-300 dark:border-gray-600"
                  disabled={isAIReading || !canUserRespond}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
              </div>

              {/* Send Button */}
              <Button
                onClick={sendMessage}
                disabled={!inputText.trim() || isAIReading || !canUserRespond || !faceDetectionData.faceDetected}
                className="rounded-full w-10 h-10 p-0"
                title={!faceDetectionData.faceDetected ? "Face must be aligned to submit" : "Send message"}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Input Hints */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                {isAIReading ? (
                  <span className="text-blue-600 dark:text-blue-400 flex items-center">
                    <Volume2 className="w-3 h-3 mr-1 animate-pulse" />
                    AI is reading the question...
                  </span>
                ) : !canUserRespond ? (
                  <span className="text-orange-600 dark:text-orange-400">
                    Wait for AI to finish, then you can respond
                  </span>
                ) : !faceDetectionData.faceDetected ? (
                  <span className="text-red-600 dark:text-red-400">Face must be aligned to submit answer</span>
                ) : (
                  <>
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    {isTranscribing && speechRecognitionSupported && (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center bg-blue-50 dark:bg-blue-900 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                        <Mic className="w-3 h-3 mr-1" />
                        Voice transcription active
                      </span>
                    )}
                  </>
                )}
              </div>
              <span>{inputText.length}/1000</span>
            </div>
          </div>
        )}

        {/* Assessment Terminated Message */}
        {isAssessmentTerminated && (
          <div className="p-4 bg-red-50 dark:bg-red-900 border-t border-red-200 dark:border-red-700">
            <div className="text-center text-red-800 dark:text-red-200">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-semibold">Assessment Terminated</h3>
              <p className="text-sm">
                Assessment ended due to{" "}
                {timeRemaining === 0 ? "time limit reached" : "repeated face detection failures (2 warnings)"}.
              </p>
              {timeRemaining !== 0 && (
                <p className="text-xs mt-1">You were away from the camera for more than 30 seconds twice.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}