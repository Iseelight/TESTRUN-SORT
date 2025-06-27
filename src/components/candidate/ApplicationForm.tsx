import React, { useState } from 'react';
import { Upload, FileText, User, Mail, Phone, MapPin } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface ApplicationFormProps {
  jobTitle: string;
  onSubmit: (formData: any) => void;
  isSubmitting?: boolean;
}

export function ApplicationForm({ jobTitle, onSubmit, isSubmitting = false }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    cvFile: null as File | null
  });

  const [dragActive, setDragActive] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setFormData(prev => ({ ...prev, cvFile: files[0] }));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData(prev => ({ ...prev, cvFile: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Apply for {jobTitle}</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please fill out your information and upload your CV. After submission, your CV will be analyzed and you'll proceed to the AI proctored interview.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User size={16} className="inline mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter your full name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail size={16} className="inline mr-1" />
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone size={16} className="inline mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter your phone number"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Location *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="City, Country"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* CV Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <FileText size={16} className="inline mr-1" />
            Upload CV/Resume *
          </label>
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isSubmitting}
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {formData.cvFile ? (
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.cvFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isSubmitting ? 'Analyzing CV...' : 'Click to replace'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOC, DOCX up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Proctoring Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Important: Proctored Interview Notice
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• After CV submission, you'll enter a proctored interview session</li>
            <li>• Your screen will be locked during the interview</li>
            <li>• Camera and microphone will be continuously monitored</li>
            <li>• Looking away from the camera twice will end the session</li>
            <li>• Switching tabs or applications will terminate the interview</li>
            <li>• Ensure you're in a quiet, well-lit environment</li>
          </ul>
        </div>

        <Button 
          type="submit" 
          size="lg" 
          className="w-full"
          disabled={!formData.name || !formData.email || !formData.location || !formData.cvFile || isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Analyzing CV & Setting Up Interview...' : 'Submit Application'}
        </Button>
      </form>
    </Card>
  );
}