import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jobsAPI, candidatesAPI, applicationsAPI, conversationsAPI } from '../lib/api';
import { useAuth } from './AuthContext';

interface JobContextType {
  jobs: any[];
  candidates: any[];
  applications: any[];
  conversations: any[];
  isLoading: boolean;
  error: string | null;
  
  // Job operations
  fetchJobs: (activeOnly?: boolean) => Promise<void>;
  fetchMyJobs: () => Promise<void>;
  createJob: (jobData: any) => Promise<any>;
  updateJob: (jobId: string, jobData: any) => Promise<any>;
  deleteJob: (jobId: string) => Promise<void>;
  generateJobDescription: (title: string, requirements: string[]) => Promise<string>;
  getShareLink: (jobId: string) => Promise<string>;
  
  // Candidate operations
  fetchCandidatesByJob: (jobId: string, filters?: any) => Promise<void>;
  createCandidate: (candidateData: any) => Promise<any>;
  updateCandidate: (candidateId: string, candidateData: any) => Promise<any>;
  selectCandidate: (candidateId: string) => Promise<void>;
  rejectCandidate: (candidateId: string, reason?: string) => Promise<void>;
  
  // Application operations
  createApplication: (applicationData: any) => Promise<any>;
  fetchMyApplications: () => Promise<void>;
  
  // Conversation operations
  createConversation: (conversationData: any) => Promise<any>;
  addMessage: (conversationId: string, messageData: any) => Promise<any>;
  endConversation: (conversationId: string) => Promise<any>;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Job operations
  const fetchJobs = async (activeOnly = true) => {
    setIsLoading(true);
    setError(null);
    try {
      const jobsData = await jobsAPI.getJobs(activeOnly);
      setJobs(jobsData);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyJobs = async () => {
    if (!user || user.role !== 'recruiter') return;
    
    setIsLoading(true);
    setError(null);
    try {
      const jobsData = await jobsAPI.getMyJobs();
      setJobs(jobsData);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch your jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const createJob = async (jobData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const newJob = await jobsAPI.createJob(jobData);
      setJobs(prev => [...prev, newJob]);
      return newJob;
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create job');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateJob = async (jobId: string, jobData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedJob = await jobsAPI.updateJob(jobId, jobData);
      setJobs(prev => prev.map(job => job.id === jobId ? updatedJob : job));
      return updatedJob;
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update job');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteJob = async (jobId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await jobsAPI.deleteJob(jobId);
      setJobs(prev => prev.filter(job => job.id !== jobId));
      setCandidates(prev => prev.filter(candidate => candidate.job_id !== jobId));
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to delete job');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateJobDescription = async (title: string, requirements: string[]) => {
    try {
      return await jobsAPI.generateDescription(title, requirements);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to generate job description');
    }
  };

  const getShareLink = async (jobId: string) => {
    try {
      return await jobsAPI.getShareLink(jobId);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to get share link');
    }
  };

  // Candidate operations
  const fetchCandidatesByJob = async (jobId: string, filters: any = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const candidatesData = await candidatesAPI.getCandidatesByJob(
        jobId,
        filters.skip || 0,
        filters.limit || 100,
        filters.status,
        filters.minScore || 0
      );
      setCandidates(candidatesData);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const createCandidate = async (candidateData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const newCandidate = await candidatesAPI.createCandidate(candidateData);
      setCandidates(prev => [...prev, newCandidate]);
      return newCandidate;
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create candidate');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCandidate = async (candidateId: string, candidateData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedCandidate = await candidatesAPI.updateCandidate(candidateId, candidateData);
      setCandidates(prev => prev.map(candidate => 
        candidate.id === candidateId ? updatedCandidate : candidate
      ));
      return updatedCandidate;
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update candidate');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const selectCandidate = async (candidateId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await candidatesAPI.selectCandidate(candidateId);
      // Refresh candidates list
      const candidate = candidates.find(c => c.id === candidateId);
      if (candidate) {
        await fetchCandidatesByJob(candidate.job_id);
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to select candidate');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectCandidate = async (candidateId: string, reason?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await candidatesAPI.rejectCandidate(candidateId, reason);
      // Refresh candidates list
      const candidate = candidates.find(c => c.id === candidateId);
      if (candidate) {
        await fetchCandidatesByJob(candidate.job_id);
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to reject candidate');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Application operations
  const createApplication = async (applicationData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const newApplication = await applicationsAPI.createApplication(applicationData);
      setApplications(prev => [...prev, newApplication]);
      return newApplication;
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create application');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    if (!user || user.role !== 'candidate') return;
    
    setIsLoading(true);
    setError(null);
    try {
      const applicationsData = await candidatesAPI.getMyApplications();
      setApplications(applicationsData);
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  // Conversation operations
  const createConversation = async (conversationData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const newConversation = await conversationsAPI.createConversation(conversationData);
      setConversations(prev => [...prev, newConversation]);
      return newConversation;
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to create conversation');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = async (conversationId: string, messageData: any) => {
    try {
      const newMessage = await conversationsAPI.addMessage(conversationId, messageData);
      // Update conversation in state
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, messages: [...(conv.messages || []), newMessage] }
          : conv
      ));
      return newMessage;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to add message');
    }
  };

  const endConversation = async (conversationId: string) => {
    try {
      const updatedConversation = await conversationsAPI.endConversation(conversationId);
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? updatedConversation : conv
      ));
      return updatedConversation;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to end conversation');
    }
  };

  return (
    <JobContext.Provider value={{
      jobs,
      candidates,
      applications,
      conversations,
      isLoading,
      error,
      fetchJobs,
      fetchMyJobs,
      createJob,
      updateJob,
      deleteJob,
      generateJobDescription,
      getShareLink,
      fetchCandidatesByJob,
      createCandidate,
      updateCandidate,
      selectCandidate,
      rejectCandidate,
      createApplication,
      fetchMyApplications,
      createConversation,
      addMessage,
      endConversation,
    }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
}