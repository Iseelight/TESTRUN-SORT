export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: "recruiter" | "candidate"
  company?: string
  createdAt: Date
}

export interface JobPosting {
  id: string
  title: string
  company: string
  description: string
  requirements: string[]
  skillWeights: {
    technical: number
    soft: number
    leadership: number
    communication: number
  }
  location: string
  salary?: string
  employmentType: string
  cutoffPercentage: number
  maxCandidates: number
  activeDays: number
  enableWaitlist: boolean
  waitlistDuration: number // in days
  waitlistMessage: string
  status: "active" | "closed" | "draft" | "inactive"
  createdAt: Date
  expiresAt: Date
  recruiterId: string
  selectedCandidates: number
  rejectedCandidates: number
  allowRetake: boolean
}

export interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  location: string
  cvFile?: File
  conversationId?: string
  scores: {
    overall: number
    technical: number
    soft: number
    leadership: number
    communication: number
  }
  status: "pending" | "interviewing" | "completed" | "selected" | "rejected" | "waitlisted"
  appliedAt: Date
  completedAt?: Date
  reviewedAt?: Date
  jobId: string
  feedback?: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    overallAssessment: string
    rejectionReason?: string
    interviewDetails?: {
      date: string
      time: string
      location: string
      interviewer: string
      instructions: string
    }
  }
}

export interface ConversationMessage {
  id: string
  sender: "ai" | "candidate"
  message: string
  timestamp: Date
  analysis?: {
    sentiment: number
    confidence: number
    keyPoints: string[]
  }
}

export interface Conversation {
  id: string
  candidateId: string
  jobId: string
  messages: ConversationMessage[]
  startedAt: Date
  endedAt?: Date
  duration?: number
  finalAnalysis?: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
  }
}

export interface JobApplication {
  id: string
  jobId: string
  candidateId: string
  status: "pending" | "completed" | "selected" | "rejected" | "waitlisted"
  appliedAt: Date
  completedAt?: Date
}

// New types for enhanced assessment system
export interface SecurityAlert {
  id: string
  type: "face_not_detected" | "looking_away" | "multiple_faces" | "tab_switch" | "no_video"
  message: string
  timestamp: Date
  severity: "low" | "medium" | "high"
}

export interface FaceDetectionData {
  faceDetected: boolean
  faceCount: number
  faceCenterX: number
  faceCenterY: number
  faceSize: number
  confidence: number
}

export interface AssessmentConfig {
  duration: number // in minutes
  questions: string[]
  enableFaceDetection: boolean
  enableScreenLock: boolean
  enableAudioRecording: boolean
  maxViolations: number
  allowRetake?: boolean
}

export interface AssessmentResult {
  duration: number
  messagesCount: number
  securityAlertsCount: number
  completedAt: Date
  messages: ConversationMessage[]
  securityAlerts: SecurityAlert[]
  questionsAnswered: number
  totalQuestions: number
  userResponses: string[]
  terminationReason?: string
}