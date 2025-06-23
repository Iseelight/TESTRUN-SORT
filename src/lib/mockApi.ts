// Mock API service for testing without backend
export const mockAPI = {
  // Authentication
  login: async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    // Mock successful login
    return {
      access_token: 'mock_access_token_' + Date.now(),
      refresh_token: 'mock_refresh_token_' + Date.now(),
      token_type: 'bearer'
    };
  },

  register: async (userData: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: 'user_' + Date.now(),
      ...userData,
      is_active: true,
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  googleAuth: async (token: string, role: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      access_token: 'mock_google_access_token_' + Date.now(),
      refresh_token: 'mock_google_refresh_token_' + Date.now(),
      token_type: 'bearer'
    };
  },

  // Users
  getMe: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const storedUser = localStorage.getItem('recruitai_user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    
    // Return mock user if no stored user
    return {
      id: 'user_' + Date.now(),
      name: 'Test User',
      email: 'test@example.com',
      role: 'candidate',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  updateMe: async (userData: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const currentUser = JSON.parse(localStorage.getItem('recruitai_user') || '{}');
    const updatedUser = { ...currentUser, ...userData, updated_at: new Date().toISOString() };
    
    localStorage.setItem('recruitai_user', JSON.stringify(updatedUser));
    return updatedUser;
  },

  // Jobs
  getJobs: async (activeOnly = true) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: 'job_1',
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        description: 'We are looking for an experienced Frontend Developer...',
        requirements: ['5+ years React', 'TypeScript', 'Modern CSS'],
        location: 'San Francisco, CA',
        employment_type: 'Full-time',
        salary_min: 120000,
        salary_max: 180000,
        salary_currency: 'USD',
        skill_weights: { technical: 40, soft: 25, leadership: 20, communication: 15 },
        cutoff_percentage: 75,
        max_candidates: 50,
        status: 'active',
        total_applications: 12,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      }
    ];
  },

  // Conversations
  createConversation: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: 'conv_' + Date.now(),
      ...data,
      messages: [],
      started_at: new Date().toISOString(),
      proctoring_enabled: true
    };
  },

  addMessage: async (conversationId: string, messageData: any) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      id: 'msg_' + Date.now(),
      conversation_id: conversationId,
      ...messageData,
      timestamp: new Date().toISOString()
    };
  },

  // Candidates
  createCandidate: async (candidateData: any) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id: 'candidate_' + Date.now(),
      ...candidateData,
      applied_at: new Date().toISOString()
    };
  }
};