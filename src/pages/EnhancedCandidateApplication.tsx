import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, DollarSign, Clock, Building, Briefcase, AlertCircle, Camera, Shield, FileText, Search } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { ApplicationForm } from '../components/candidate/ApplicationForm';
import { AssessmentInterface } from '../components/assessment/AssessmentInterface';
import { ResultsPage } from '../components/candidate/ResultsPage';
import { SessionTerminatedModal } from '../components/candidate/SessionTerminatedModal';
import { LoginModal } from '../components/auth/LoginModal';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AssessmentConfig, AssessmentResult } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { MockBackendService } from '../components/candidate/MockBackendService';

interface EnhancedCandidateApplicationProps {
  onBack: () => void;
  directJobId?: string;
}

type ApplicationStep = 'jobs' | 'application' | 'cv-analysis' | 'assessment' | 'results' | 'terminated';

// Mock jobs data for testing without backend
const MOCK_JOBS = [
  {
    id: 'job_1',
    title: 'Senior Frontend Developer',
    company: 'SortFast Inc.',
    description: 'We are looking for an experienced Frontend Developer to join our dynamic team. You will be responsible for creating engaging user interfaces and ensuring excellent user experiences across our web applications.',
    requirements: [
      '5+ years of React experience',
      'TypeScript proficiency',
      'Modern CSS frameworks',
      'API integration experience',
      'Agile development experience'
    ],
    location: 'San Francisco, CA',
    employment_type: 'Full-time',
    salary_min: 120000,
    salary_max: 180000,
    salary_currency: 'USD',
    skill_weights: {
      technical: 40,
      soft: 25,
      leadership: 20,
      communication: 15
    },
    cutoff_percentage: 75,
    max_candidates: 50,
    status: 'active',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    enable_waitlist: true,
    waitlist_message: 'You have successfully passed our assessment benchmark and demonstrated the qualifications we are looking for in this role. Due to the high volume of qualified applicants, you have been placed on our priority waitlist.',
    allow_retake: true
  },
  {
    id: 'job_2',
    title: 'Product Manager',
    company: 'SortFast',
    description: 'Join our product team to drive strategy and execution for our cutting-edge SaaS platform. You will work closely with engineering, design, and business stakeholders.',
    requirements: [
      '3+ years product management experience',
      'Technical background preferred',
      'Data-driven decision making',
      'Stakeholder management',
      'Agile/Scrum experience'
    ],
    location: 'Remote',
    employment_type: 'Full-time',
    salary_min: 100000,
    salary_max: 150000,
    salary_currency: 'USD',
    skill_weights: {
      technical: 25,
      soft: 30,
      leadership: 30,
      communication: 15
    },
    cutoff_percentage: 70,
    max_candidates: 30,
    status: 'active',
    expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    enable_waitlist: false,
    waitlist_message: '',
    allow_retake: false
  },
  {
    id: 'job_3',
    title: 'UX/UI Designer',
    company: 'SortFast',
    description: 'We are seeking a talented UX/UI Designer to create beautiful, intuitive interfaces for our products. You will work closely with product managers and developers.',
    requirements: [
      'Portfolio demonstrating UI/UX skills',
      'Experience with Figma or similar tools',
      'Understanding of user-centered design principles',
      'Ability to create wireframes and prototypes',
      'Experience with design systems'
    ],
    location: 'New York, NY',
    employment_type: 'Full-time',
    salary_min: 90000,
    salary_max: 130000,
    salary_currency: 'USD',
    skill_weights: {
      technical: 35,
      soft: 25,
      leadership: 15,
      communication: 25
    },
    cutoff_percentage: 70,
    max_candidates: 25,
    status: 'active',
    expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    enable_waitlist: true,
    waitlist_message: 'You have been placed on our waitlist due to high volume of qualified applicants.',
    allow_retake: true
  }
];

export function EnhancedCandidateApplication({ onBack, directJobId }: EnhancedCandidateApplicationProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<ApplicationStep>('jobs');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [candidate, setCandidate] = useState<any>(null);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [sessionTerminated, setSessionTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [sessionViolations, setSessionViolations] = useState<any[]>([]);
  const [jobs] = useState(MOCK_JOBS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cvAnalysisProgress, setCvAnalysisProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 6;

  const mockBackend = MockBackendService.getInstance();

  // Assessment configuration
  const assessmentConfig: AssessmentConfig = {
    duration: 5, // 5 minutes
    questions: [
      "Tell me about yourself and why you're interested in this position.",
      "What are your greatest strengths and how do they relate to this role?",
      "Describe a challenging project you've worked on and how you overcame obstacles.",
      "How do you handle working under pressure or tight deadlines?",
      "Tell me about a time when you had to work with a difficult team member.",
      "What motivates you in your work, and how do you stay current with industry trends?",
      "Describe a situation where you had to learn something new quickly.",
      "How do you prioritize tasks when you have multiple competing deadlines?",
      "Tell me about a mistake you made and how you handled it.",
      "What are your career goals for the next five years?"
    ],
    enableFaceDetection: true,
    enableScreenLock: true,
    enableAudioRecording: true,
    maxViolations: 2,
    allowRetake: true
  };

  // Check if user is trying to access with recruiter account
  useEffect(() => {
    if (user && user.role === 'recruiter') {
      setAccessDenied(true);
    } else {
      setAccessDenied(false);
    }
  }, [user]);

  // Handle direct job application from URL
  useEffect(() => {
    if (directJobId && jobs.length > 0) {
      const job = jobs.find(j => j.id === directJobId);
      if (job) {
        if (!user) {
          setShowLoginModal(true);
        } else if (user.role === 'candidate') {
          setSelectedJob(job);
          setStep('application');
        }
      }
    }
  }, [directJobId, jobs, user]);

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.requirements.some(req => req.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const handleJobSelect = (job: any) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (user.role === 'recruiter') {
      setAccessDenied(true);
      return;
    }

    setSelectedJob(job);
    setStep('application');
  };

  const handleApplicationSubmit = async (formData: any) => {
    if (!selectedJob || !user) return;

    try {
      setIsSubmitting(true);
      setApplicationData(formData);
      setStep('cv-analysis');
      
      // Simulate CV analysis with progress
      setCvAnalysisProgress(0);
      const analysisSteps = [
        { progress: 20, message: 'Uploading CV...' },
        { progress: 40, message: 'Extracting text content...' },
        { progress: 60, message: 'Analyzing skills and experience...' },
        { progress: 80, message: 'Matching with job requirements...' },
        { progress: 100, message: 'Analysis complete! Setting up assessment...' }
      ];

      for (const step of analysisSteps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCvAnalysisProgress(step.progress);
      }

      // Move to assessment
      setStep('assessment');
      
    } catch (error) {
      console.error('Failed to start application:', error);
      alert('Failed to start application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssessmentComplete = async (assessmentResult: AssessmentResult) => {
    if (!selectedJob || !applicationData) return;

    try {
      // Check if assessment was terminated
      const wasTerminated = !!assessmentResult.terminationReason;
      
      if (wasTerminated) {
        setSessionTerminated(true);
        setTerminationReason(assessmentResult.terminationReason || 'Assessment terminated due to security violations');
        setSessionViolations(assessmentResult.securityAlerts.map(alert => ({
          type: alert.type,
          timestamp: alert.timestamp,
          count: 1,
          severity: alert.severity === 'high' ? 'critical' : 'warning'
        })));
        return;
      }
      
      // Generate realistic scores based on assessment performance
      const job = selectedJob;
      const baseScore = 70 + Math.random() * 25; // 70-95% range
      
      // Factor in assessment performance
      const completionBonus = (assessmentResult.questionsAnswered / assessmentResult.totalQuestions) * 10;
      const timeBonus = assessmentResult.duration < (assessmentConfig.duration * 0.8) ? 5 : 0;
      const securityPenalty = assessmentResult.securityAlertsCount * 5;
      
      const adjustedScore = Math.max(0, Math.min(100, baseScore + completionBonus + timeBonus - securityPenalty));
      
      // Calculate weighted scores based on job skill weights
      const technicalScore = Math.round(Math.max(0, Math.min(100, adjustedScore + (Math.random() - 0.3) * 15)));
      const softScore = Math.round(Math.max(0, Math.min(100, adjustedScore + (Math.random() - 0.2) * 12)));
      const leadershipScore = Math.round(Math.max(0, Math.min(100, adjustedScore + (Math.random() - 0.4) * 20)));
      const communicationScore = Math.round(Math.max(0, Math.min(100, adjustedScore + (Math.random() - 0.1) * 8)));
      
      // Calculate overall score using job's skill weights
      const overallScore = Math.round(
        (technicalScore * job.skill_weights.technical +
         softScore * job.skill_weights.soft +
         leadershipScore * job.skill_weights.leadership +
         communicationScore * job.skill_weights.communication) / 100
      );
      
      // Determine initial status based on score and job settings
      let initialStatus = 'pending';
      
      if (overallScore < job.cutoff_percentage) {
        initialStatus = 'rejected';
      }

      // Generate enhanced feedback
      const feedback = {
        strengths: [
          'Excellent technical knowledge and problem-solving approach',
          'Clear and professional communication throughout the assessment',
          'Strong adherence to assessment guidelines and security requirements',
          'Demonstrated leadership potential and team collaboration skills',
          'Maintained proper camera presence and focus during entire session',
          'No security violations detected - exemplary professional conduct'
        ],
        weaknesses: [
          'Could provide more specific metrics and quantifiable results in examples',
          'Consider elaborating on experience with system design and architecture'
        ],
        recommendations: [
          'Continue developing expertise in emerging frontend technologies',
          'Practice presenting technical concepts with more concrete business impact examples',
          'Consider gaining additional experience in system design and scalability',
          'Excellent assessment performance - maintain this level of professionalism'
        ],
        overallAssessment: `Outstanding candidate with excellent technical skills and professional demeanor. Performed exceptionally well in the secure assessment environment with ${assessmentResult.securityAlertsCount} security alerts detected. Demonstrated strong technical knowledge, clear communication, and maintained excellent focus throughout the monitored session. ${overallScore >= job.cutoff_percentage ? 'Significantly exceeds the minimum requirements for this position and shows exceptional potential for success in our team.' : 'Shows strong potential despite falling slightly below the minimum score threshold.'} The comprehensive monitoring data confirms authentic and professional assessment conduct.`
      };

      const candidateData = {
        name: applicationData.name,
        email: applicationData.email,
        phone: applicationData.phone,
        location: applicationData.location,
        job_id: selectedJob.id,
        scores: {
          overall: overallScore,
          technical: technicalScore,
          soft: softScore,
          leadership: leadershipScore,
          communication: communicationScore
        },
        status: initialStatus,
        feedback,
        assessment_result: assessmentResult,
        cv_analysis: {
          skills_match: 85,
          experience_level: 'Senior',
          key_strengths: ['React', 'TypeScript', 'Team Leadership'],
          technical_assessment: 'Strong match for role requirements'
        }
      };
      
      // Create candidate record
      const newCandidate = await mockBackend.createCandidate(candidateData);
      setCandidate(newCandidate);
      setStep('results');
      
    } catch (error) {
      console.error('Failed to complete application:', error);
      alert('Failed to complete application. Please try again.');
    }
  };

  const handleRetakeSession = () => {
    // Check if job allows retakes
    if (selectedJob && selectedJob.allow_retake) {
      // Reset session state
      setSessionTerminated(false);
      setSessionViolations([]);
      setTerminationReason('');
      // Skip directly to assessment without refilling the form
      setStep('assessment');
    } else {
      // If retakes not allowed, go back to jobs
      setSessionTerminated(false);
      setStep('jobs');
    }
  };

  const handleExitSession = () => {
    setSessionTerminated(false);
    setStep('jobs');
  };

  // Access denied for recruiters
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header userType="candidate" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Recruiters cannot apply for jobs. Please use a candidate account to apply for positions.
              </p>
              <Button onClick={onBack}>
                Return to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header userType="candidate" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={step === 'jobs' ? onBack : () => {
              if (step === 'application') setStep('jobs');
              if (step === 'cv-analysis') setStep('application');
              if (step === 'results') setStep('assessment');
            }}
            className="mb-4"
            disabled={step === 'assessment'} // Prevent going back during assessment
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {step === 'jobs' ? 'Back to Home' : step === 'assessment' ? 'Assessment Active' : 'Back'}
          </Button>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {['jobs', 'application', 'cv-analysis', 'assessment', 'results'].map((stepName, index) => {
                const isActive = step === stepName;
                const isCompleted = ['jobs', 'application', 'cv-analysis', 'assessment', 'results'].indexOf(step) > index;
                
                return (
                  <React.Fragment key={stepName}>
                    <div className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-medium
                      ${isActive ? 'bg-blue-600 text-white' : 
                        isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                    `}>
                      {stepName === 'jobs' && <Briefcase size={16} />}
                      {stepName === 'application' && <FileText size={16} />}
                      {stepName === 'cv-analysis' && <FileText size={16} />}
                      {stepName === 'assessment' && <Camera size={16} />}
                      {stepName === 'results' && <Shield size={16} />}
                    </div>
                    {index < 4 && (
                      <div className={`
                        w-8 sm:w-16 h-0.5
                        ${isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}
                      `} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Job Listings */}
        {step === 'jobs' && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Find Your Next Opportunity
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Apply for positions and experience our enhanced AI-powered assessment with comprehensive monitoring
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md mx-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  placeholder="Search jobs by title, company, location..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentJobs.map((job) => {
                const daysLeft = Math.ceil((new Date(job.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Card key={job.id} className="h-full bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{job.title}</h3>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                            <Building size={16} />
                            <span>{job.company}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge variant="default">{job.employment_type}</Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Shield size={12} />
                            Secure Assessment
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6 flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin size={16} />
                          <span>{job.location}</span>
                        </div>
                        
                        {(job.salary_min || job.salary_max) && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <DollarSign size={16} />
                            <span>
                              {job.salary_min && job.salary_max 
                                ? `${job.salary_currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                                : job.salary_min 
                                  ? `From ${job.salary_currency} ${job.salary_min.toLocaleString()}`
                                  : `Up to ${job.salary_currency} ${job.salary_max.toLocaleString()}`
                              }
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock size={16} />
                          <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Expires soon'}</span>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                          {job.description.substring(0, 150)}...
                        </p>

                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Requirements:</h4>
                          <ul className="space-y-1">
                            {job.requirements.slice(0, 3).map((req: string, index: number) => (
                              <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                {req}
                              </li>
                            ))}
                            {job.requirements.length > 3 && (
                              <li className="text-xs text-gray-500 dark:text-gray-500">
                                +{job.requirements.length - 3} more requirements
                              </li>
                            )}
                          </ul>
                        </div>

                        {/* Assessment Notice */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Secure AI Assessment</span>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            5-minute monitored assessment with face detection, screen lock, and audio recording.
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleJobSelect(job)}
                        className="w-full"
                      >
                        <Briefcase className="mr-2 h-4 w-4" />
                        Apply Now
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No jobs found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Try adjusting your search terms or check back later for new opportunities.
                </p>
                <Button onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Application Form */}
        {step === 'application' && selectedJob && (
          <div className="max-w-2xl mx-auto">
            <ApplicationForm
              jobTitle={selectedJob.title}
              onSubmit={handleApplicationSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* CV Analysis */}
        {step === 'cv-analysis' && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white dark:bg-gray-800">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Analyzing Your CV
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Our AI is analyzing your CV and matching it with the job requirements. 
                  This will help personalize your assessment experience.
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${cvAnalysisProgress}%` }}
                  />
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  {cvAnalysisProgress}% Complete
                </p>

                {cvAnalysisProgress === 100 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      Analysis Complete!
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your CV shows an 85% match with the job requirements. 
                      Preparing your personalized secure assessment...
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* AI Assessment */}
        {step === 'assessment' && (
          <AssessmentInterface
            config={{
              ...assessmentConfig,
              allowRetake: selectedJob?.allow_retake || false
            }}
            onAssessmentComplete={handleAssessmentComplete}
          />
        )}

        {/* Results */}
        {step === 'results' && candidate && (
          <ResultsPage
            candidate={candidate}
            jobTitle={selectedJob.title}
            cutoffScore={selectedJob.cutoff_percentage}
            waitlistMessage={selectedJob.enable_waitlist ? selectedJob.waitlist_message : undefined}
            onDownloadReport={() => {
              console.log('Downloading comprehensive report with assessment data...');
            }}
            onViewFeedback={() => {
              console.log('Viewing detailed feedback with assessment analysis...');
            }}
          />
        )}
      </div>

      {/* Session Terminated Modal */}
      <SessionTerminatedModal
        isOpen={sessionTerminated}
        reason={terminationReason}
        violations={sessionViolations}
        onRetakeSession={handleRetakeSession}
        onExitSession={handleExitSession}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        userType="candidate"
      />
    </div>
  );
}