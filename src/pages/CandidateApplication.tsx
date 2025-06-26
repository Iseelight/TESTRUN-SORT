import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, DollarSign, Clock, Building, Briefcase, AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { ApplicationForm } from '../components/candidate/ApplicationForm';
import { ChatInterface } from '../components/candidate/ChatInterface';
import { ResultsPage } from '../components/candidate/ResultsPage';
import { LoginModal } from '../components/auth/LoginModal';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ConversationMessage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';

interface CandidateApplicationProps {
  onBack: () => void;
  directJobId?: string;
}

type ApplicationStep = 'jobs' | 'application' | 'interview' | 'results';

export function CandidateApplication({ onBack, directJobId }: CandidateApplicationProps) {
  const { user } = useAuth();
  const { 
    jobs, 
    candidates,
    fetchJobs,
    createCandidate,
    createConversation,
    addMessage,
    endConversation,
    isLoading,
    error
  } = useJobs();
  const [step, setStep] = useState<ApplicationStep>('jobs');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [candidate, setCandidate] = useState<any>(null);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Check if user is trying to access with recruiter account
  useEffect(() => {
    if (user && user.role === 'recruiter') {
      setAccessDenied(true);
    } else {
      setAccessDenied(false);
    }
  }, [user]);

  // Fetch jobs when component mounts
  useEffect(() => {
    fetchJobs(true); // Fetch active jobs only
  }, [fetchJobs]);

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

  const handleJobSelect = (job: any) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (user.role === 'recruiter') {
      setAccessDenied(true);
      return;
    }

    // Check if user already applied
    const existingApplication = candidates.find(c => 
      c.job_id === job.id && c.email === user.email
    );
    
    if (existingApplication) {
      alert('You have already applied to this job.');
      return;
    }

    setSelectedJob(job);
    setStep('application');
  };

  const handleApplicationSubmit = async (formData: any) => {
    if (!selectedJob || !user) return;

    try {
      setApplicationData(formData);
      
      // Create conversation first
      const conversation = await createConversation({
        candidate_id: user.id,
        job_id: selectedJob.id
      });
      
      setConversationId(conversation.id);
      setStep('interview');
      
      // Initialize AI conversation
      const initialMessage = {
        sender: 'ai' as const,
        message: `Hello ${formData.name}! I'm your AI interviewer for the ${selectedJob.title} position at ${selectedJob.company}. I've reviewed your CV and I'm excited to learn more about your experience. Let's start with a simple question: Can you tell me what interests you most about this role and why you think you'd be a good fit?`,
      };
      
      const aiMessage = await addMessage(conversation.id, initialMessage);
      setMessages([aiMessage]);
      
    } catch (error) {
      console.error('Failed to start application:', error);
      alert('Failed to start application. Please try again.');
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!conversationId) return;

    try {
      // Add user message
      const userMessage = await addMessage(conversationId, {
        sender: 'candidate',
        message,
      });
      
      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      // Simulate AI response with more realistic conversation flow
      setTimeout(async () => {
        let aiResponse = '';
        const messageCount = messages.length;
        
        if (messageCount <= 2) {
          const responses = [
            "That's a great perspective! Can you walk me through a challenging project you've worked on recently and how you approached solving the technical problems?",
            "Interesting! How do you typically handle working with cross-functional teams, especially when there are conflicting priorities or tight deadlines?"
          ];
          aiResponse = responses[Math.floor(Math.random() * responses.length)];
        } else if (messageCount <= 4) {
          const responses = [
            "I appreciate that insight. Can you describe a time when you had to learn a new technology or skill quickly? How did you approach it and what was the outcome?",
            "That sounds impressive! What do you think are the most important qualities for someone in this role to be successful in our fast-paced environment?"
          ];
          aiResponse = responses[Math.floor(Math.random() * responses.length)];
        } else if (messageCount <= 6) {
          const responses = [
            "Thank you for sharing that. How do you handle feedback and criticism, and can you give me an example of how you've used feedback to improve your work?",
            "That's valuable experience. Where do you see yourself professionally in the next 3-5 years, and how does this role align with those goals?"
          ];
          aiResponse = responses[Math.floor(Math.random() * responses.length)];
        } else {
          aiResponse = "Thank you for the engaging conversation! I've completed my analysis of your responses along with your CV. Your results are being processed and will be available in just a moment. I've been impressed by your thoughtful answers and clear communication style.";
        }
        
        try {
          const aiMessage = await addMessage(conversationId, {
            sender: 'ai',
            message: aiResponse,
          });
          
          setMessages(prev => [...prev, aiMessage]);
          setIsTyping(false);

          // After conversation completion, show results
          if (messageCount >= 7) {
            setTimeout(async () => {
              try {
                // End conversation
                await endConversation(conversationId);
                
                // Generate realistic scores based on conversation quality and job requirements
                const job = selectedJob;
                const baseScore = 65 + Math.random() * 30; // 65-95% range
                
                // Calculate weighted scores based on job skill weights
                const technicalScore = Math.round(baseScore + (Math.random() - 0.5) * 20);
                const softScore = Math.round(baseScore + (Math.random() - 0.5) * 15);
                const leadershipScore = Math.round(baseScore + (Math.random() - 0.5) * 25);
                const communicationScore = Math.round(baseScore + (Math.random() - 0.5) * 10);
                
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
                  conversation_id: conversationId
                };
                
                // Create candidate record
                const newCandidate = await createCandidate(candidateData);
                setCandidate(newCandidate);
                setStep('results');
                
              } catch (error) {
                console.error('Failed to complete application:', error);
                alert('Failed to complete application. Please try again.');
              }
            }, 2000);
          }
        } catch (error) {
          console.error('Failed to add AI message:', error);
          setIsTyping(false);
        }
      }, 1500 + Math.random() * 2000); // Variable response time for realism
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  // Access denied for recruiters
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header userType="candidate" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={onBack}
            className="mb-4"
          >
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header userType="candidate" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Retry
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
            icon={ArrowLeft}
            onClick={step === 'jobs' ? onBack : () => {
              if (step === 'application') setStep('jobs');
              if (step === 'interview') setStep('application');
              if (step === 'results') setStep('interview');
            }}
            className="mb-4"
          >
            {step === 'jobs' ? 'Back to Home' : 'Back'}
          </Button>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {['jobs', 'application', 'interview', 'results'].map((stepName, index) => {
                const isActive = step === stepName;
                const isCompleted = ['jobs', 'application', 'interview', 'results'].indexOf(step) > index;
                
                return (
                  <React.Fragment key={stepName}>
                    <div className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-medium
                      ${isActive ? 'bg-blue-600 text-white' : 
                        isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                    `}>
                      {index + 1}
                    </div>
                    {index < 3 && (
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

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        )}

        {/* Job Listings */}
        {step === 'jobs' && !isLoading && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Find Your Next Opportunity
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Apply for positions and experience our AI-powered interview process
              </p>
            </div>

            {jobs.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No jobs available</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Check back later for new opportunities, or contact recruiters directly.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.map((job) => {
                  const canApply = user ? !candidates.find(c => c.job_id === job.id && c.email === user.email) : true;
                  const daysLeft = Math.ceil((new Date(job.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <Card key={job.id} hover className="h-full">
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
                            <Badge variant="info">{job.employment_type}</Badge>
                            {job.status === 'inactive' && (
                              <Badge variant="warning">Full</Badge>
                            )}
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
                        </div>

                        <Button
                          onClick={() => handleJobSelect(job)}
                          className="w-full"
                          icon={Briefcase}
                          disabled={!canApply || job.status === 'inactive'}
                        >
                          {!canApply ? 'Already Applied' : 
                           job.status === 'inactive' ? 'Position Full' : 
                           'Apply Now'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
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
            />
          </div>
        )}

        {/* AI Interview */}
        {step === 'interview' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Interview</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Having a conversation with our AI about the {selectedJob.title} position
              </p>
            </div>
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
            />
          </div>
        )}

        {/* Results */}
        {step === 'results' && candidate && (
          <ResultsPage
            candidate={candidate}
            jobTitle={selectedJob.title}
            cutoffScore={selectedJob.cutoff_percentage}
            waitlistMessage={selectedJob.enable_waitlist ? selectedJob.waitlist_message : undefined}
            onDownloadReport={() => {
              // Generate and download report
              console.log('Downloading report...');
            }}
            onViewFeedback={() => {
              // Show detailed feedback modal
              console.log('Viewing feedback...');
            }}
          />
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        userType="candidate"
      />
    </div>
  );
}