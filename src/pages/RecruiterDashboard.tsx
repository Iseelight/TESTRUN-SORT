import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Briefcase, BarChart3, CheckCircle, XCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { CandidateCard } from '../components/recruiter/CandidateCard';
import { FilterPanel } from '../components/recruiter/FilterPanel';
import { JobPostingCard } from '../components/recruiter/JobPostingCard';
import { CreateJobModal } from '../components/recruiter/CreateJobModal';
import { LoginModal } from '../components/auth/LoginModal';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';

interface RecruiterDashboardProps {
  onBack: () => void;
}

type DashboardView = 'overview' | 'jobs' | 'candidates' | 'analytics';

// Mock data for testing without backend
const MOCK_JOBS = [
  {
    id: 'job_1',
    title: 'Senior Frontend Developer',
    company: 'SortFast Inc.',
    description: 'We are looking for an experienced Frontend Developer...',
    requirements: ['5+ years React', 'TypeScript', 'Modern CSS'],
    location: 'San Francisco, CA',
    employment_type: 'Full-time',
    salary_min: 120000,
    salary_max: 180000,
    salary_currency: 'USD',
    skillWeights: { technical: 40, soft: 25, leadership: 20, communication: 15 },
    cutoffPercentage: 75,
    maxCandidates: 50,
    status: 'active',
    total_applications: 12,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'job_2',
    title: 'Product Manager',
    company: 'SortFast Inc.',
    description: 'Join our product team to drive strategy and execution...',
    requirements: ['3+ years product management', 'Technical background', 'Data-driven'],
    location: 'Remote',
    employment_type: 'Full-time',
    salary_min: 100000,
    salary_max: 150000,
    salary_currency: 'USD',
    skillWeights: { technical: 25, soft: 30, leadership: 30, communication: 15 },
    cutoffPercentage: 70,
    maxCandidates: 30,
    status: 'active',
    total_applications: 8,
    expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 'job_3',
    title: 'UX/UI Designer',
    company: 'SortFast Inc.',
    description: 'We are seeking a talented UX/UI Designer...',
    requirements: ['Portfolio', 'Figma', 'User-centered design'],
    location: 'New York, NY',
    employment_type: 'Full-time',
    salary_min: 90000,
    salary_max: 130000,
    salary_currency: 'USD',
    skillWeights: { technical: 35, soft: 25, leadership: 15, communication: 25 },
    cutoffPercentage: 70,
    maxCandidates: 25,
    status: 'active',
    total_applications: 5,
    expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString()
  }
];

const MOCK_CANDIDATES = [
  {
    id: 'candidate_1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    scores: { overall: 85, technical: 88, soft: 82, leadership: 80, communication: 90 },
    status: 'pending',
    applied_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    job_id: 'job_1'
  },
  {
    id: 'candidate_2',
    name: 'Emily Johnson',
    email: 'emily.johnson@example.com',
    phone: '+1 (555) 987-6543',
    location: 'New York, NY',
    scores: { overall: 92, technical: 95, soft: 90, leadership: 88, communication: 94 },
    status: 'selected',
    applied_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    job_id: 'job_1'
  },
  {
    id: 'candidate_3',
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    phone: '+1 (555) 456-7890',
    location: 'Remote',
    scores: { overall: 78, technical: 82, soft: 75, leadership: 70, communication: 85 },
    status: 'rejected',
    applied_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    job_id: 'job_2'
  },
  {
    id: 'candidate_4',
    name: 'Sarah Williams',
    email: 'sarah.williams@example.com',
    phone: '+1 (555) 234-5678',
    location: 'Chicago, IL',
    scores: { overall: 88, technical: 85, soft: 92, leadership: 90, communication: 86 },
    status: 'pending',
    applied_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    job_id: 'job_2'
  },
  {
    id: 'candidate_5',
    name: 'David Rodriguez',
    email: 'david.rodriguez@example.com',
    phone: '+1 (555) 876-5432',
    location: 'Austin, TX',
    scores: { overall: 81, technical: 84, soft: 78, leadership: 75, communication: 88 },
    status: 'waitlisted',
    applied_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    job_id: 'job_3'
  }
];

export function RecruiterDashboard({ onBack }: RecruiterDashboardProps) {
  const { user } = useAuth();
  const [view, setView] = useState<DashboardView>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Check if user is trying to access with candidate account
  useEffect(() => {
    if (user && user.role === 'candidate') {
      setAccessDenied(true);
    } else {
      setAccessDenied(false);
    }
  }, [user]);

  // Check for expired jobs and update their status
  useEffect(() => {
    const now = new Date();
    const updatedJobs = jobs.map(job => {
      const expiryDate = new Date(job.expires_at);
      if (expiryDate < now && job.status === 'active') {
        return { ...job, status: 'inactive' };
      }
      return job;
    });
    
    if (JSON.stringify(updatedJobs) !== JSON.stringify(jobs)) {
      setJobs(updatedJobs);
    }
  }, [jobs]);

  // Show login modal if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
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
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Authentication Required</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please sign in to access the recruiter dashboard.
              </p>
              <Button onClick={() => setShowLoginModal(true)}>
                Sign In as Recruiter
              </Button>
            </div>
          </Card>
        </div>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          userType="recruiter"
        />
      </div>
    );
  }

  // Access denied for candidates
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header userType="recruiter" />
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
                Candidates cannot access the recruiter dashboard. Please use a recruiter account to manage job postings.
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

  // Filter candidates based on criteria
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesScore = candidate.scores?.overall >= minScore;
    const matchesLocation = !selectedLocation || candidate.location?.includes(selectedLocation);
    const matchesStatus = !selectedStatus || candidate.status === selectedStatus;
    const matchesJob = !selectedJob || candidate.job_id === selectedJob;

    return matchesSearch && matchesScore && matchesLocation && matchesStatus && matchesJob;
  });

  // Pagination for candidates
  const indexOfLastCandidate = currentPage * itemsPerPage;
  const indexOfFirstCandidate = indexOfLastCandidate - itemsPerPage;
  const currentCandidates = filteredCandidates.slice(indexOfFirstCandidate, indexOfLastCandidate);
  const totalCandidatePages = Math.ceil(filteredCandidates.length / itemsPerPage);

  const resetFilters = () => {
    setSearchTerm('');
    setMinScore(0);
    setSelectedLocation('');
    setSelectedStatus('');
    setSelectedJob('');
  };

  const getCandidateCount = (jobId: string) => {
    return candidates.filter(candidate => candidate.job_id === jobId).length;
  };

  const getStatusCounts = () => {
    const counts = {
      total: candidates.length,
      selected: candidates.filter(c => c.status === 'selected').length,
      pending: candidates.filter(c => c.status === 'pending').length,
      waitlisted: candidates.filter(c => c.status === 'waitlisted').length,
      rejected: candidates.filter(c => c.status === 'rejected').length
    };
    return counts;
  };

  const handleSelectCandidate = async (candidateId: string) => {
    try {
      // Update candidate status in mock data
      setCandidates(prev => prev.map(c => 
        c.id === candidateId ? {...c, status: 'selected'} : c
      ));
    } catch (error) {
      console.error('Failed to select candidate:', error);
    }
  };

  const handleRejectCandidate = async (candidateId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    try {
      // Update candidate status in mock data
      setCandidates(prev => prev.map(c => 
        c.id === candidateId ? {...c, status: 'rejected'} : c
      ));
    } catch (error) {
      console.error('Failed to reject candidate:', error);
    }
  };

  const handleViewCandidates = async (jobId: string) => {
    setSelectedJob(jobId);
    setView('candidates');
    // Reset pagination when changing job filter
    setCurrentPage(1);
  };

  const handleCreateJob = (jobData: any) => {
    const newJob = {
      id: 'job_' + Date.now(),
      ...jobData,
      status: 'active',
      total_applications: 0,
      expires_at: new Date(Date.now() + jobData.active_days * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    };
    
    setJobs(prev => [...prev, newJob]);
  };

  const handleRemoveJob = (jobId: string) => {
    // Remove job and its candidates
    setJobs(prev => prev.filter(job => job.id !== jobId));
    setCandidates(prev => prev.filter(candidate => candidate.job_id !== jobId));
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header userType="recruiter" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="mb-4 sm:mb-0">
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Recruiter Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {user.name}</p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'jobs', label: 'Jobs', icon: Briefcase },
              { key: 'candidates', label: 'Candidates', icon: Users },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key as DashboardView)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${view === key 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        )}

        {/* Overview */}
        {view === 'overview' && !isLoading && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{statusCounts.total}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Candidates</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{statusCounts.selected}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Selected</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statusCounts.pending}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pending Review</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statusCounts.waitlisted}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Waitlisted</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{statusCounts.rejected}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            {jobs.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No jobs posted yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first job posting to start receiving applications.
                  </p>
                  <Button onClick={() => setShowCreateJobModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Job
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Job Postings</h2>
                  <div className="space-y-4">
                    {jobs.slice(0, 3).map(job => (
                      <div key={job.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{job.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{getCandidateCount(job.id)} candidates</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={job.status === 'active' ? 'success' : job.status === 'inactive' ? 'warning' : 'error'}>
                            {job.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveJob(job.id)}
                            className="p-1"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setView('jobs')}
                  >
                    View All Jobs
                  </Button>
                </Card>

                <Card>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Candidates</h2>
                  <div className="space-y-4">
                    {candidates.slice(0, 3).map(candidate => (
                      <div key={candidate.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{candidate.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Score: {candidate.scores?.overall || 0}%</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            candidate.status === 'selected' ? 'success' : 
                            candidate.status === 'rejected' ? 'error' : 
                            candidate.status === 'waitlisted' ? 'warning' : 'info'
                          }>
                            {candidate.status}
                          </Badge>
                          {candidate.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleSelectCandidate(candidate.id)}
                                className="px-2 py-1"
                              >
                                <CheckCircle size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectCandidate(candidate.id)}
                                className="px-2 py-1"
                              >
                                <XCircle size={14} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setView('candidates')}
                  >
                    View All Candidates
                  </Button>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Jobs View */}
        {view === 'jobs' && !isLoading && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">Your Job Postings</h2>
              <Button onClick={() => setShowCreateJobModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Job
              </Button>
            </div>

            {jobs.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No jobs posted yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create your first job posting to start receiving applications.
                  </p>
                  <Button onClick={() => setShowCreateJobModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Job
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.map(job => (
                  <div key={job.id} className="relative">
                    <JobPostingCard
                      job={job}
                      candidateCount={getCandidateCount(job.id)}
                      onViewCandidates={handleViewCandidates}
                      onEditJob={(jobId) => console.log('Edit job:', jobId)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveJob(job.id)}
                      className="absolute top-4 right-4 p-1"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Candidates View */}
        {view === 'candidates' && !isLoading && (
          <div>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Filters Sidebar */}
              <div className="lg:w-80 space-y-6">
                <FilterPanel
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  minScore={minScore}
                  onMinScoreChange={setMinScore}
                  selectedLocation={selectedLocation}
                  onLocationChange={setSelectedLocation}
                  selectedStatus={selectedStatus}
                  onStatusChange={setSelectedStatus}
                  onReset={resetFilters}
                />

                {/* Job Filter */}
                {jobs.length > 0 && (
                  <Card>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Filter by Job</h4>
                    <select
                      value={selectedJob}
                      onChange={(e) => {
                        setSelectedJob(e.target.value);
                        setCurrentPage(1); // Reset pagination when changing filter
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">All Jobs</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>{job.title}</option>
                      ))}
                    </select>
                  </Card>
                )}
              </div>

              {/* Candidates Grid */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
                    Your Candidates ({filteredCandidates.length})
                  </h2>
                  
                  {/* Quick Actions */}
                  {filteredCandidates.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Export</Button>
                      <Button variant="outline" size="sm">Bulk Actions</Button>
                    </div>
                  )}
                </div>

                {filteredCandidates.length === 0 ? (
                  <Card>
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {candidates.length === 0 ? 'No candidates yet' : 'No candidates found'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {candidates.length === 0 
                          ? 'Candidates will appear here once they apply to your job postings.'
                          : 'Try adjusting your filters to see more results.'
                        }
                      </p>
                      {candidates.length > 0 && (
                        <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
                      )}
                    </div>
                  </Card>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {currentCandidates.map(candidate => (
                        <div key={candidate.id} className="relative">
                          <CandidateCard
                            candidate={candidate}
                            onViewProfile={(candidateId) => console.log('View profile:', candidateId)}
                            onViewConversation={(candidateId) => console.log('View conversation:', candidateId)}
                          />
                          {candidate.status === 'pending' && (
                            <div className="absolute top-4 right-4 flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSelectCandidate(candidate.id)}
                                className="px-3 py-1"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Select
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectCandidate(candidate.id)}
                                className="px-3 py-1"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalCandidatePages > 1 && (
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
                          
                          {Array.from({ length: totalCandidatePages }, (_, i) => i + 1).map(page => (
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
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalCandidatePages))}
                            disabled={currentPage === totalCandidatePages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={showCreateJobModal}
        onClose={() => setShowCreateJobModal(false)}
      />
    </div>
  );
}