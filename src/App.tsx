import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { EnhancedCandidateApplication } from './pages/EnhancedCandidateApplication';
import { LoginModal } from './components/auth/LoginModal';
import { Button } from './components/ui/button';
import { Header } from './components/layout/Header';
import { Brain, Users, Briefcase, Camera, Shield, Eye } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { JobProvider } from './contexts/JobContext';

type AppMode = 'home' | 'recruiter' | 'candidate';

// Component for handling direct job application links
function JobApplicationPage() {
  const { jobId } = useParams();
  
  return (
    <EnhancedCandidateApplication 
      onBack={() => window.location.href = '/'} 
      directJobId={jobId}
    />
  );
}

function HomePage() {
  const [mode, setMode] = useState<AppMode>('home');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUserType, setLoginUserType] = useState<'recruiter' | 'candidate'>('recruiter');

  const handleUserTypeSelect = (userType: 'recruiter' | 'candidate') => {
    setLoginUserType(userType);
    setShowLoginModal(true);
  };

  if (mode === 'recruiter') {
    return <RecruiterDashboard onBack={() => setMode('home')} />;
  }

  if (mode === 'candidate') {
    return <EnhancedCandidateApplication onBack={() => setMode('home')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-20">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Revolutionize Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Hiring Process
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            Move beyond keyword-based ATS systems. Our AI conducts intelligent conversations with candidates to discover true talent, with advanced proctoring to ensure interview integrity.
          </p>
          <div className="flex justify-center gap-4 mb-12">
            <Button size="lg" onClick={() => setMode('recruiter')}>
              <Users className="mr-2 h-5 w-5" />
              I'm a Recruiter
            </Button>
            <Button size="lg" variant="outline" onClick={() => setMode('candidate')}>
              <Briefcase className="mr-2 h-5 w-5" />
              I'm Looking for Jobs
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Conversations</h3>
            <p className="text-gray-600 dark:text-gray-400">Intelligent interviews based on job descriptions that reveal true candidate capabilities beyond CV keywords.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Proctored Interviews</h3>
            <p className="text-gray-600 dark:text-gray-400">Advanced monitoring with face detection, screen locking, and violation tracking to ensure interview integrity.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Security & Compliance</h3>
            <p className="text-gray-600 dark:text-gray-400">Comprehensive session recording, violation tracking, and detailed reports for complete audit trails.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Face Detection</h3>
            <p className="text-gray-600 dark:text-gray-400">Real-time face tracking with warnings for looking away and automatic session termination after violations.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Screen Locking</h3>
            <p className="text-gray-600 dark:text-gray-400">Prevents tab switching and application changes during interviews with comprehensive monitoring.</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Voice & Video Recording</h3>
            <p className="text-gray-600 dark:text-gray-400">Complete session recording with audio transcription and video analysis for comprehensive candidate evaluation.</p>
          </div>
        </div>

        {/* Proctoring Features Highlight */}
        <div className="bg-gradient-to-r from-red-600 to-purple-600 rounded-2xl p-8 text-center text-white mb-16">
          <h2 className="text-3xl font-bold mb-4">Advanced Proctoring Technology</h2>
          <p className="text-xl mb-6 opacity-90">
            Ensure interview integrity with cutting-edge monitoring and security features
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/10 rounded-lg p-4">
              <Camera className="w-8 h-8 mb-3" />
              <h4 className="font-semibold mb-2">Real-time Monitoring</h4>
              <p className="text-sm opacity-90">Continuous face detection and behavior analysis</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <Shield className="w-8 h-8 mb-3" />
              <h4 className="font-semibold mb-2">Violation Tracking</h4>
              <p className="text-sm opacity-90">Automated warnings and session termination</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <Eye className="w-8 h-8 mb-3" />
              <h4 className="font-semibold mb-2">Detailed Reports</h4>
              <p className="text-sm opacity-90">Comprehensive audit trails and incident logs</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Hiring?</h2>
          <p className="text-xl mb-6 opacity-90">
            Experience the future of recruitment with AI-powered interviews and advanced proctoring technology.
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setMode('recruiter')}
            >
              <Users className="mr-2 h-5 w-5" />
              Start as Recruiter
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setMode('candidate')}
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Briefcase className="mr-2 h-5 w-5" />
              Apply for Jobs
            </Button>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        userType={loginUserType}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <JobProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/jobs/:jobId" element={<JobApplicationPage />} />
            </Routes>
          </Router>
        </JobProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;