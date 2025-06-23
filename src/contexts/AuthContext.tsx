import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockAPI } from '../lib/mockApi';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'recruiter' | 'candidate';
  company?: string;
  phone?: string;
  location?: string;
  bio?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    role: 'recruiter' | 'candidate';
    company?: string;
    phone?: string;
    location?: string;
    bio?: string;
  }) => Promise<void>;
  loginWithGoogle: (role: 'recruiter' | 'candidate') => Promise<void>;
  logout: () => void;
  updateProfile: (userData: any) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('recruitai_user');
    const token = localStorage.getItem('recruitai_access_token');
    
    if (storedUser && token) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Validate token by fetching current user
        mockAPI.getMe()
          .then(currentUser => {
            setUser(currentUser);
            localStorage.setItem('recruitai_user', JSON.stringify(currentUser));
          })
          .catch(() => {
            // Token is invalid, clear storage
            localStorage.removeItem('recruitai_access_token');
            localStorage.removeItem('recruitai_refresh_token');
            localStorage.removeItem('recruitai_user');
            setUser(null);
          });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('recruitai_user');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mockAPI.login(email, password);
      const { access_token, refresh_token } = response;
      
      // Store tokens
      localStorage.setItem('recruitai_access_token', access_token);
      localStorage.setItem('recruitai_refresh_token', refresh_token);
      
      // Get user data
      const userData = await mockAPI.getMe();
      setUser(userData);
      localStorage.setItem('recruitai_user', JSON.stringify(userData));
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    role: 'recruiter' | 'candidate';
    company?: string;
    phone?: string;
    location?: string;
    bio?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newUser = await mockAPI.register(userData);
      
      // Auto-login after registration
      await login(userData.email, userData.password);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (role: 'recruiter' | 'candidate') => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock Google OAuth flow
      const mockGoogleToken = 'mock_google_token_' + Date.now() + '_' + Math.random();
      
      const response = await mockAPI.googleAuth(mockGoogleToken, role);
      const { access_token, refresh_token } = response;
      
      // Store tokens
      localStorage.setItem('recruitai_access_token', access_token);
      localStorage.setItem('recruitai_refresh_token', refresh_token);
      
      // Create mock user data
      const userData = {
        id: 'user_' + Date.now(),
        name: 'Google User',
        email: 'user@gmail.com',
        role,
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setUser(userData);
      localStorage.setItem('recruitai_user', JSON.stringify(userData));
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Google login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedUser = await mockAPI.updateMe(userData);
      setUser(updatedUser);
      localStorage.setItem('recruitai_user', JSON.stringify(updatedUser));
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('recruitai_access_token');
    localStorage.removeItem('recruitai_refresh_token');
    localStorage.removeItem('recruitai_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      loginWithGoogle, 
      logout, 
      updateProfile, 
      isLoading, 
      error 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}