# RecruitAI - AI-Powered Recruitment Platform

## Overview

RecruitAI is a modern, intelligent recruitment platform that revolutionizes the hiring process by using AI-powered conversations to assess candidates beyond traditional CV screening. The platform provides separate interfaces for recruiters and job seekers, with advanced features including voice recording, dark mode, and comprehensive analytics.

## 🚀 Features

### For Recruiters
- **Authentication**: Google OAuth integration with secure session management
- **Job Management**: Create, edit, and manage job postings with AI-assisted descriptions
- **Candidate Assessment**: AI-powered scoring based on customizable skill weights
- **Advanced Filtering**: Search and filter candidates by various criteria
- **Analytics Dashboard**: Comprehensive insights into hiring metrics
- **Social Sharing**: Generate shareable job links for social media campaigns

### For Job Seekers
- **Job Discovery**: Browse available positions with detailed descriptions
- **AI Interviews**: Intelligent conversational assessments
- **Voice Recording**: Audio responses with speech-to-text conversion
- **Instant Results**: Immediate feedback and scoring
- **Application Tracking**: Monitor application status and progress

### Universal Features
- **Dark Mode**: Complete dark theme support with system preference detection
- **Responsive Design**: Optimized for all device sizes
- **Real-time Updates**: Live data synchronization across the platform
- **Accessibility**: Full keyboard navigation and screen reader support

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS with dark mode support
- **Icons**: Lucide React
- **State Management**: React Context API
- **Build Tool**: Vite
- **Package Manager**: npm

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── LoginModal.tsx          # Authentication modal
│   ├── candidate/
│   │   ├── ApplicationForm.tsx     # Job application form
│   │   ├── ChatInterface.tsx       # AI conversation interface
│   │   ├── ResultsPage.tsx         # Assessment results display
│   │   └── VoiceRecorder.tsx       # Voice recording component
│   ├── layout/
│   │   └── Header.tsx              # Application header
│   ├── recruiter/
│   │   ├── CandidateCard.tsx       # Candidate profile card
│   │   ├── CreateJobModal.tsx      # Job creation form
│   │   ├── FilterPanel.tsx         # Candidate filtering
│   │   └── JobPostingCard.tsx      # Job posting display
│   └── ui/
│       ├── Badge.tsx               # Status badges
│       ├── Button.tsx              # Reusable button component
│       ├── Card.tsx                # Container component
│       └── ProgressBar.tsx         # Progress visualization
├── contexts/
│   ├── AuthContext.tsx             # Authentication state
│   ├── JobContext.tsx              # Job and candidate management
│   └── ThemeContext.tsx            # Dark mode state
├── pages/
│   ├── CandidateApplication.tsx    # Candidate workflow
│   └── RecruiterDashboard.tsx      # Recruiter interface
├── types/
│   └── index.ts                    # TypeScript definitions
├── App.tsx                         # Main application component
├── main.tsx                        # Application entry point
└── index.css                       # Global styles
```

## 🗄 Data Schema

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'recruiter' | 'candidate';
  company?: string;
  createdAt: Date;
}
```

### Job Posting
```typescript
interface JobPosting {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  skillWeights: {
    technical: number;
    soft: number;
    leadership: number;
    communication: number;
  };
  location: string;
  salary?: string;
  employmentType: string;
  cutoffPercentage: number;
  maxCandidates: number;
  status: 'active' | 'closed' | 'draft';
  createdAt: Date;
}
```

### Candidate
```typescript
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  cvFile?: File;
  conversationId?: string;
  scores: {
    overall: number;
    technical: number;
    soft: number;
    leadership: number;
    communication: number;
  };
  status: 'pending' | 'interviewing' | 'completed' | 'selected' | 'rejected';
  appliedAt: Date;
  completedAt?: Date;
  jobId: string;
}
```

### Conversation Message
```typescript
interface ConversationMessage {
  id: string;
  sender: 'ai' | 'candidate';
  message: string;
  timestamp: Date;
  analysis?: {
    sentiment: number;
    confidence: number;
    keyPoints: string[];
  };
}
```

### Conversation
```typescript
interface Conversation {
  id: string;
  candidateId: string;
  jobId: string;
  messages: ConversationMessage[];
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  finalAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}
```

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd recruitai-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🎯 Key Features Implementation

### Authentication System
- Mock Google OAuth implementation ready for real integration
- Persistent session management with localStorage
- Role-based access control for recruiters and candidates
- Secure logout functionality

### AI-Powered Assessments
- Dynamic conversation flow based on job requirements
- Weighted scoring system customizable per job posting
- Real-time performance analysis
- Comprehensive feedback generation

### Voice Recording
- Browser-based audio recording with MediaRecorder API
- Mock speech-to-text conversion (ready for real API integration)
- Audio playback and management
- Visual recording indicators and controls

### Dark Mode
- System preference detection
- Persistent theme selection
- Complete UI coverage including all components
- Smooth transitions between themes

### Job Management
- AI-assisted job description generation
- Customizable skill weight configuration
- Social media sharing capabilities
- Real-time candidate tracking

## 🔮 Future Enhancements

### Technical Integrations
- Real Google OAuth implementation
- Speech-to-text API integration (Google Cloud Speech, Azure Cognitive Services)
- Backend API development with database persistence
- Real-time notifications and messaging

### Advanced Features
- Video interview capabilities
- Advanced analytics and reporting
- Bulk candidate operations
- Email notification system
- Calendar integration for interview scheduling

### AI Improvements
- Natural language processing for better conversation analysis
- Sentiment analysis integration
- Automated candidate ranking
- Bias detection and mitigation

## 📊 Performance Considerations

- **Code Splitting**: Implemented with React.lazy for optimal loading
- **State Management**: Efficient context usage to minimize re-renders
- **Image Optimization**: Lazy loading and responsive images
- **Bundle Size**: Optimized imports and tree shaking

## 🔒 Security Features

- **Input Validation**: Comprehensive form validation
- **XSS Protection**: Sanitized user inputs
- **Authentication**: Secure session management
- **Data Privacy**: Local storage encryption ready

## 📱 Mobile Responsiveness

- **Responsive Design**: Tailwind CSS breakpoints for all screen sizes
- **Touch Interactions**: Optimized for mobile gestures
- **Performance**: Optimized for mobile networks
- **Accessibility**: Mobile screen reader support

## 🧪 Testing Strategy

- **Unit Tests**: Component-level testing with Jest
- **Integration Tests**: User flow testing
- **E2E Tests**: Complete application workflow testing
- **Accessibility Tests**: WCAG compliance verification

## 📈 Analytics & Monitoring

- **User Analytics**: Track user interactions and conversion rates
- **Performance Monitoring**: Real-time performance metrics
- **Error Tracking**: Comprehensive error logging
- **A/B Testing**: Feature flag implementation ready

This documentation provides a comprehensive overview of the RecruitAI platform, its architecture, and implementation details. The platform is designed to be scalable, maintainable, and ready for production deployment with minimal additional configuration.