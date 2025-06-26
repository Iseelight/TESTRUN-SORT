import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Briefcase, BarChart3, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { CandidateCard } from '../components/recruiter/CandidateCard';
import { FilterPanel } from '../components/recruiter/FilterPanel';
import { JobPostingCard } from '../components/recruiter/JobPostingCard';
import { CreateJobModal } from '../components/recruiter/CreateJobModal';
import { LoginModal } from '../components/auth/LoginModal';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';

interface RecruiterDashboardProps {
  onBack: () => void;
}

type DashboardView = 'overview' | 'jobs' | 'candidates' | 'analytics';

export function RecruiterDashboard({ onBack }: RecruiterDashboardProps) {
  const { user } = useAuth();
  const { 
    jobs, 
    candidates, 
    fetchMyJobs,
    fetchCandidatesByJob,
    selectCandidate, 
    rejectCandidate,
    isLoading,
    error
  } = useJobs();
  const [view, setView] = useState<DashboardView>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Check if user is trying to access with candidate account
  useEffect(() => {
    if (user && user.role === 'candidate') {
      setAccessDenied(true);
    } else {
      setAccessDenied(false);
    }
  }, [user]);

  // Fetch recruiter's jobs when user is available
  useEffect(() => {
    if (user && user.role === 'recruiter') {
      fetchMyJobs();
    }
  }, [user, fetchMyJobs]);

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
      await selectCandidate(candidateId);
    } catch (error) {
      console.error('Failed to select candidate:', error);
    }
  };

  const handleRejectCandidate = async (candidateId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    try {
      await rejectCandidate(candidateId, reason || undefined);
    } catch (error) {
      console.error('Failed to reject candidate:', error);
    }
  };

  const handleViewCandidates = async (jobId: string) => {
    setSelectedJob(jobId);
    setView('candidates');
    await fetchCandidatesByJob(jobId);
  };

  const statusCounts = getStatusCounts();

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header userType="recruiter" />
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
                  <div className="text-2xl font-bold text-green-600">{statusCounts.selected}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Selected</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{statusCounts.pending}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pending Review</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{statusCounts.waitlisted}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Waitlisted</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
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
                        <Badge variant={job.status === 'active' ? 'success' : job.status === 'inactive' ? 'warning' : 'error'}>
                          {job.status}
                        </Badge>
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
                  <JobPostingCard
                    key={job.id}
                    job={job}
                    candidateCount={getCandidateCount(job.id)}
                    onViewCandidates={handleViewCandidates}
                    onEditJob={(jobId) => console.log('Edit job:', jobId)}
                  />
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
                      onChange={(e) => setSelectedJob(e.target.value)}
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
                  <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCandidates.map(candidate => (
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