"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Camera, CameraOff, Eye, EyeOff, Minimize2, Maximize2, AlertTriangle, User } from "lucide-react"
import type { FaceDetectionData, SecurityAlert } from "../types"

interface FloatingVideoMonitorProps {
  onSecurityAlert: (alert: SecurityAlert) => void
  onFaceDetectionUpdate: (data: FaceDetectionData) => void
  isActive: boolean
  onFaceAwayViolation: () => void
}

export function FloatingVideoMonitor({
  onSecurityAlert,
  onFaceDetectionUpdate,
  isActive,
  onFaceAwayViolation,
}: FloatingVideoMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const previousFrameRef = useRef<ImageData | null>(null)
  const baselineRef = useRef<{
    avgBrightness: number
    motionThreshold: number
    established: boolean
  }>({ avgBrightness: 0, motionThreshold: 0, established: false })

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [faceDetectionData, setFaceDetectionData] = useState<FaceDetectionData>({
    faceDetected: false,
    faceCount: 0,
    faceCenterX: 0,
    faceCenterY: 0,
    faceSize: 0,
    confidence: 0,
  })
  const [lastFaceDetectionTime, setLastFaceDetectionTime] = useState<number>(Date.now())
  const [faceAwayCount, setFaceAwayCount] = useState(0)
  const [lastAlertTime, setLastAlertTime] = useState<number>(0)
  const [isCurrentlyAway, setIsCurrentlyAway] = useState(false)
  const [awayStartTime, setAwayStartTime] = useState<number>(0)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0)

  // Create alert tone function
  const playAlertTone = useCallback(() => {
    const now = Date.now()
    if (now - lastAlertTime > 3000) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }

        const audioContext = audioContextRef.current
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.type = "sine"

        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)

        setLastAlertTime(now)
      } catch (error) {
        console.error("Error playing alert tone:", error)
      }
    }
  }, [lastAlertTime])

  const generateSecurityAlert = useCallback(
    (type: SecurityAlert["type"], message: string, severity: SecurityAlert["severity"]) => {
      const alert: SecurityAlert = {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date(),
        severity,
      }
      onSecurityAlert(alert)
    },
    [onSecurityAlert],
  )

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: "user",
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      })

      streamRef.current = mediaStream
      setStream(mediaStream)
      setIsVideoEnabled(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error)
          }
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      generateSecurityAlert("no_video", "Camera access denied or unavailable", "high")
    }
  }

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null)
    setIsVideoEnabled(false)

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
  }

  // Function to ensure video is playing
  const ensureVideoPlaying = useCallback(() => {
    if (videoRef.current && streamRef.current && isVideoEnabled && !isMinimized) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current
      }

      if (videoRef.current.paused) {
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error)
        })
      }
    }
  }, [isVideoEnabled, isMinimized])

  // Enhanced face detection with persistent alerts
  const detectFaces = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isVideoEnabled || videoRef.current.videoWidth === 0) {
      return
    }

    // Ensure video is playing before detection
    ensureVideoPlaying()

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Define face region (center oval area where face should be)
      const centerX = canvas.width / 2
      const centerY = canvas.height * 0.4
      const radiusX = canvas.width * 0.25
      const radiusY = canvas.height * 0.3

      let totalBrightness = 0
      let pixelCount = 0
      let skinPixels = 0
      let darkPixels = 0
      let motionPixels = 0

      // Analyze face region
      for (let y = Math.max(0, centerY - radiusY); y <= Math.min(canvas.height - 1, centerY + radiusY); y += 2) {
        for (let x = Math.max(0, centerX - radiusX); x <= Math.min(canvas.width - 1, centerX + radiusX); x += 2) {
          // Check if pixel is within oval
          const dx = (x - centerX) / radiusX
          const dy = (y - centerY) / radiusY
          if (dx * dx + dy * dy <= 1) {
            const pixelIndex = (Math.floor(y) * canvas.width + Math.floor(x)) * 4
            const r = data[pixelIndex]
            const g = data[pixelIndex + 1]
            const b = data[pixelIndex + 2]
            const brightness = (r + g + b) / 3

            totalBrightness += brightness
            pixelCount++

            // Detect skin-like colors (more flexible range)
            if (
              r > 60 &&
              g > 40 &&
              b > 20 &&
              r > g &&
              r > b &&
              r - g > 10 &&
              r - b > 15 &&
              brightness > 70 &&
              brightness < 200
            ) {
              skinPixels++
            }

            // Count dark pixels (for hair, eyes, shadows)
            if (brightness < 80) {
              darkPixels++
            }

            // Motion detection compared to previous frame
            if (previousFrameRef.current) {
              const prevPixelIndex = pixelIndex
              const prevR = previousFrameRef.current.data[prevPixelIndex]
              const prevG = previousFrameRef.current.data[prevPixelIndex + 1]
              const prevB = previousFrameRef.current.data[prevPixelIndex + 2]
              const prevBrightness = (prevR + prevG + prevB) / 3

              if (Math.abs(brightness - prevBrightness) > 15) {
                motionPixels++
              }
            }
          }
        }
      }

      const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0
      const skinRatio = pixelCount > 0 ? skinPixels / pixelCount : 0
      const darkRatio = pixelCount > 0 ? darkPixels / pixelCount : 0
      const motionRatio = pixelCount > 0 ? motionPixels / pixelCount : 0

      // Establish baseline on first few frames
      if (!baselineRef.current.established && pixelCount > 0) {
        if (avgBrightness > 30) {
          // Only establish baseline if there's reasonable lighting
          baselineRef.current.avgBrightness = avgBrightness
          baselineRef.current.motionThreshold = 0.02 // 2% motion threshold
          baselineRef.current.established = true
        }
      }

      // Store current frame for next comparison
      previousFrameRef.current = imageData

      // Enhanced detection logic
      let faceDetected = false
      let confidence = 0

      if (baselineRef.current.established) {
        // Multiple criteria for face detection
        const hasReasonableBrightness = avgBrightness > 40 && avgBrightness < 220
        const hasSkinTone = skinRatio > 0.08 // At least 8% skin-like pixels
        const hasContrast = darkRatio > 0.1 && darkRatio < 0.7 // Some dark areas but not too many
        const hasHumanMotion = motionRatio > 0.01 && motionRatio < 0.3 // Some motion but not chaotic
        const brightnessInRange = Math.abs(avgBrightness - baselineRef.current.avgBrightness) < 80

        // Count positive criteria
        const criteria = [
          hasReasonableBrightness,
          hasSkinTone,
          hasContrast,
          hasHumanMotion || !previousFrameRef.current, // Allow for first frame
          brightnessInRange,
        ]

        const positiveCount = criteria.filter(Boolean).length

        // Face detected if at least 3 out of 5 criteria are met
        faceDetected = positiveCount >= 3
        confidence = positiveCount / 5

        // Boost confidence if skin tone is very good
        if (skinRatio > 0.15) {
          confidence = Math.min(0.95, confidence + 0.2)
        }

        // Reduce confidence if brightness is very different from baseline
        if (Math.abs(avgBrightness - baselineRef.current.avgBrightness) > 50) {
          confidence *= 0.7
        }

        // Special case: if brightness drops significantly (person moved away), definitely no face
        if (avgBrightness < baselineRef.current.avgBrightness * 0.3) {
          faceDetected = false
          confidence = 0.1
        }

        // Special case: if very uniform (solid color background), no face
        if (skinRatio < 0.02 && darkRatio < 0.05) {
          faceDetected = false
          confidence = 0.1
        }
      } else {
        // Before baseline is established, use simple detection
        const hasBasicFeatures = avgBrightness > 60 && skinRatio > 0.05 && darkRatio > 0.05
        faceDetected = hasBasicFeatures
        confidence = hasBasicFeatures ? 0.6 : 0.2
      }

      const detectionData: FaceDetectionData = {
        faceDetected,
        faceCount: faceDetected ? 1 : 0,
        faceCenterX: centerX,
        faceCenterY: centerY,
        faceSize: faceDetected ? radiusX * 2 : 0,
        confidence: Math.round(confidence * 100) / 100,
      }

      setFaceDetectionData(detectionData)
      onFaceDetectionUpdate(detectionData)

      // Enhanced security monitoring with persistent alerts and countdown - Updated to 30 seconds
      const currentTime = Date.now()

      if (!faceDetected) {
        // If this is the first time face is not detected, mark start time
        if (!isCurrentlyAway) {
          setIsCurrentlyAway(true)
          setAwayStartTime(currentTime)
          playAlertTone()
        }

        // Calculate countdown - how many seconds left until violation (30 seconds)
        const timeAway = currentTime - awayStartTime
        const secondsLeft = Math.max(0, 30 - Math.floor(timeAway / 1000))
        setCountdownSeconds(secondsLeft)

        // Alert after 30 seconds without face
        if (timeAway >= 30000) {
          const newCount = faceAwayCount + 1
          setFaceAwayCount(newCount)

          playAlertTone()

          generateSecurityAlert(
            "face_not_detected",
            `Face not detected for 30 seconds (${newCount}/2) - Please position yourself in the camera view`,
            newCount >= 2 ? "high" : "medium",
          )

          if (newCount >= 2) {
            onFaceAwayViolation()
            return // Exit early as assessment is terminated
          }

          // Reset for next potential violation
          setAwayStartTime(currentTime) // Reset timer for next 30-second period
        }
      } else {
        // Face is detected - ONLY clear away status when face is actually detected
        if (isCurrentlyAway) {
          setIsCurrentlyAway(false)
          setAwayStartTime(0)
          setCountdownSeconds(0)
        }
        setLastFaceDetectionTime(currentTime)
      }
    } catch (error) {
      console.error("Face detection error:", error)
    }
  }, [
    isVideoEnabled,
    onFaceDetectionUpdate,
    generateSecurityAlert,
    lastFaceDetectionTime,
    faceAwayCount,
    onFaceAwayViolation,
    playAlertTone,
    ensureVideoPlaying,
    isCurrentlyAway,
    awayStartTime,
  ])

  // Handle visibility change and ensure video continues playing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive && streamRef.current && videoRef.current) {
        ensureVideoPlaying()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [isActive, ensureVideoPlaying])

  const handleToggleMinimize = () => {
    const newMinimized = !isMinimized
    setIsMinimized(newMinimized)

    // When maximizing, ensure video resumes properly
    if (!newMinimized && videoRef.current && streamRef.current) {
      // Use multiple attempts to ensure video resumes
      const resumeVideo = () => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current
          videoRef.current.play().catch((error) => {
            console.error("Error resuming video:", error)
            // Retry after a short delay
            setTimeout(resumeVideo, 100)
          })
        }
      }

      // Immediate attempt
      setTimeout(resumeVideo, 50)
      // Backup attempt
      setTimeout(resumeVideo, 200)
      // Final attempt
      setTimeout(resumeVideo, 500)
    }
  }

  // Ensure video is always playing when not minimized
  useEffect(() => {
    if (!isMinimized && isVideoEnabled && streamRef.current && videoRef.current) {
      const checkVideoInterval = setInterval(() => {
        ensureVideoPlaying()
      }, 2000) // Check every 2 seconds

      return () => clearInterval(checkVideoInterval)
    }
  }, [isMinimized, isVideoEnabled, ensureVideoPlaying])

  useEffect(() => {
    if (isActive) {
      startVideo()
    } else {
      stopVideo()
    }

    return () => stopVideo()
  }, [isActive])

  useEffect(() => {
    if (!isVideoEnabled || !isActive) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
      return
    }

    // Run face detection every 1 second
    detectionIntervalRef.current = setInterval(detectFaces, 1000)

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
        detectionIntervalRef.current = null
      }
    }
  }, [detectFaces, isVideoEnabled, isActive])

  if (!isActive) return null

  return (
    <div
      className={`
      fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300
      ${isMinimized ? "w-16 h-16" : "w-64 h-48"}
    `}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 flex items-center justify-between text-xs z-10">
        <span className="font-medium">Face Monitor</span>
        <div className="flex items-center space-x-1">
          {faceAwayCount > 0 && (
            <div className="flex items-center bg-red-500/20 px-1 rounded">
              <AlertTriangle className="w-3 h-3 mr-1" />
              <span>{faceAwayCount}/2</span>
            </div>
          )}
          <button onClick={handleToggleMinimize} className="hover:bg-white/20 rounded p-1 transition-colors">
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Video Feed with Guide */}
          <div className="relative mt-6">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-40 object-cover bg-gray-900"
              style={{ transform: "scaleX(-1)" }}
              onPause={() => {
                // Auto-resume if video gets paused unexpectedly
                if (isVideoEnabled && !isMinimized && streamRef.current) {
                  setTimeout(() => ensureVideoPlaying(), 100)
                }
              }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Face Guide Overlay - Always visible */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`
                  w-32 h-40 border-4 rounded-full transition-all duration-500
                  ${
                    faceDetectionData.faceDetected
                      ? "border-green-400 border-solid opacity-40"
                      : "border-red-400 border-dashed opacity-90 animate-pulse"
                  }
                `}
                style={{ marginTop: "24px" }}
              >
                <div className="flex items-center justify-center h-full">
                  <User
                    className={`w-16 h-16 ${
                      faceDetectionData.faceDetected ? "text-green-400 opacity-50" : "text-red-400 opacity-80"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Status Text */}
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <div
                className={`
                inline-block px-3 py-1 rounded-full text-xs font-bold
                ${faceDetectionData.faceDetected ? "bg-green-500 text-white" : "bg-red-500 text-white animate-pulse"}
              `}
              >
                {faceDetectionData.faceDetected ? "Face Aligned ✓" : "Align Your Face"}
              </div>
            </div>

            {/* Persistent Alert Banner when face is away */}
            {!faceDetectionData.faceDetected && (
              <div className="absolute top-6 left-0 right-0 bg-red-500/90 text-white text-center py-1 animate-pulse">
                <div className="text-xs font-bold">⚠️ RETURN TO CAMERA VIEW ⚠️</div>
                {countdownSeconds > 0 && <div className="text-xs font-bold">{countdownSeconds}s remaining</div>}
              </div>
            )}

            {/* Status Indicators */}
            <div className="absolute bottom-2 left-2 flex space-x-1">
              <div
                className={`
                flex items-center px-2 py-1 rounded text-xs font-medium
                ${isVideoEnabled ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"}
              `}
              >
                {isVideoEnabled ? <Camera className="w-3 h-3 mr-1" /> : <CameraOff className="w-3 h-3 mr-1" />}
                {isVideoEnabled ? "ON" : "OFF"}
              </div>

              {isVideoEnabled && (
                <div
                  className={`
                  flex items-center px-2 py-1 rounded text-xs font-medium transition-colors
                  ${
                    faceDetectionData.faceDetected
                      ? "bg-green-500/90 text-white"
                      : "bg-red-500/90 text-white animate-pulse"
                  }
                `}
                >
                  {faceDetectionData.faceDetected ? (
                    <Eye className="w-3 h-3 mr-1" />
                  ) : (
                    <EyeOff className="w-3 h-3 mr-1" />
                  )}
                  {faceDetectionData.faceDetected ? "DETECTED" : "NOT DETECTED"}
                </div>
              )}
            </div>

            {/* Confidence and Countdown */}
            {isVideoEnabled && (
              <div className="absolute top-2 right-2 flex flex-col space-y-1">
                <div
                  className={`
                  px-2 py-1 rounded text-xs font-medium transition-colors
                  ${
                    faceDetectionData.confidence > 0.7
                      ? "bg-green-500/90 text-white"
                      : faceDetectionData.confidence > 0.4
                        ? "bg-yellow-500/90 text-black"
                        : "bg-red-500/90 text-white"
                  }
                `}
                >
                  {Math.round(faceDetectionData.confidence * 100)}%
                </div>

                {/* Countdown when face not detected */}
                {!faceDetectionData.faceDetected && countdownSeconds > 0 && (
                  <div className="bg-orange-500/90 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                    {countdownSeconds}s
                  </div>
                )}
              </div>
            )}

            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 mt-6">
                <div className="text-center text-white">
                  <CameraOff className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                  <p className="text-xs">Camera Off</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {isMinimized && (
        <div className="w-full h-full flex items-center justify-center">
          <div
            className={`
            w-8 h-8 rounded-full flex items-center justify-center relative transition-colors
            ${
              faceDetectionData.faceDetected && isVideoEnabled
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white animate-pulse"
            }
          `}
          >
            {faceAwayCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                {faceAwayCount}
              </div>
            )}
            {isVideoEnabled ? (
              faceDetectionData.faceDetected ? (
                <Eye className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )
            ) : (
              <CameraOff className="w-4 h-4" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
