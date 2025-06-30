import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('recruitai_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('recruitai_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;
          localStorage.setItem('recruitai_access_token', access_token);
          localStorage.setItem('recruitai_refresh_token', refresh_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('recruitai_access_token');
        localStorage.removeItem('recruitai_refresh_token');
        localStorage.removeItem('recruitai_user');
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    company?: string;
    phone?: string;
    location?: string;
    bio?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  googleAuth: async (token: string, role: string) => {
    const response = await api.post('/auth/google', { token, role });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  testToken: async () => {
    const response = await api.post('/auth/test-token');
    return response.data;
  },
};

// Jobs API
export const jobsAPI = {
  getJobs: async (activeOnly = true, skip = 0, limit = 100) => {
    const response = await api.get('/jobs/', {
      params: { active_only: activeOnly, skip, limit },
    });
    return response.data;
  },

  getMyJobs: async (skip = 0, limit = 100) => {
    const response = await api.get('/jobs/my-jobs', {
      params: { skip, limit },
    });
    return response.data;
  },

  getJob: async (jobId: string) => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data;
  },

  createJob: async (jobData: any) => {
    const response = await api.post('/jobs/', jobData);
    return response.data;
  },

  updateJob: async (jobId: string, jobData: any) => {
    const response = await api.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  deleteJob: async (jobId: string) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },

  generateDescription: async (title: string, requirements: string[] = []) => {
    const response = await api.post('/jobs/generate-description', {
      title,
      requirements,
    });
    return response.data.description;
  },

  getShareLink: async (jobId: string) => {
    const response = await api.get(`/jobs/${jobId}/share-link`);
    return response.data.share_link;
  },
};

// Candidates API
export const candidatesAPI = {
  createCandidate: async (candidateData: any) => {
    const response = await api.post('/candidates/', candidateData);
    return response.data;
  },

  getCandidatesByJob: async (
    jobId: string,
    skip = 0,
    limit = 100,
    status?: string,
    minScore = 0
  ) => {
    const response = await api.get(`/candidates/job/${jobId}`, {
      params: { skip, limit, status, min_score: minScore },
    });
    return response.data;
  },

  getCandidate: async (candidateId: string) => {
    const response = await api.get(`/candidates/${candidateId}`);
    return response.data;
  },

  updateCandidate: async (candidateId: string, candidateData: any) => {
    const response = await api.put(`/candidates/${candidateId}`, candidateData);
    return response.data;
  },

  selectCandidate: async (candidateId: string) => {
    const response = await api.post(`/candidates/${candidateId}/select`);
    return response.data;
  },

  rejectCandidate: async (candidateId: string, reason?: string) => {
    const response = await api.post(`/candidates/${candidateId}/reject`, { reason });
    return response.data;
  },

  uploadCV: async (candidateId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/candidates/${candidateId}/upload-cv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyApplications: async (skip = 0, limit = 100) => {
    const response = await api.get('/applications/my-applications', {
      params: { skip, limit },
    });
    return response.data;
  },
};

// Conversations API
export const conversationsAPI = {
  createConversation: async (conversationData: any) => {
    const response = await api.post('/conversations/', conversationData);
    return response.data;
  },

  getConversation: async (conversationId: string) => {
    const response = await api.get(`/conversations/${conversationId}`);
    return response.data;
  },

  addMessage: async (conversationId: string, messageData: any) => {
    const response = await api.post(`/conversations/${conversationId}/messages`, messageData);
    return response.data;
  },

  uploadAudio: async (conversationId: string, audioFile: File) => {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    const response = await api.post(`/conversations/${conversationId}/audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  endConversation: async (conversationId: string) => {
    const response = await api.post(`/conversations/${conversationId}/end`);
    return response.data;
  },
};

// Applications API
export const applicationsAPI = {
  createApplication: async (applicationData: any) => {
    const response = await api.post('/applications/', applicationData);
    return response.data;
  },

  getApplication: async (applicationId: string) => {
    const response = await api.get(`/applications/${applicationId}`);
    return response.data;
  },

  getApplicationsByJob: async (
    jobId: string,
    skip = 0,
    limit = 100,
    status?: string
  ) => {
    const response = await api.get(`/applications/job/${jobId}`, {
      params: { skip, limit, status },
    });
    return response.data;
  },

  updateApplication: async (applicationId: string, applicationData: any) => {
    const response = await api.put(`/applications/${applicationId}`, applicationData);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateMe: async (userData: any) => {
    const response = await api.put('/users/me', userData);
    return response.data;
  },

  getUserProfile: async (userId: string) => {
    const response = await api.get(`/users/profile/${userId}`);
    return response.data;
  },
};

export default api;