import React, { useState } from 'react';
import { X, Wand2, Share2, Copy, Check, Info, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useJobs } from '../../contexts/JobContext';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JOB_TITLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Product Manager',
  'UX Designer',
  'UI Designer',
  'Data Scientist',
  'DevOps Engineer',
  'Marketing Manager',
  'Sales Representative',
  'Business Analyst',
  'Project Manager',
  'Quality Assurance Engineer',
  'Mobile Developer',
  'Software Architect',
  'Other'
];

const LOCATIONS = [
  'Remote',
  'New York, NY',
  'San Francisco, CA',
  'Los Angeles, CA',
  'Chicago, IL',
  'Austin, TX',
  'Seattle, WA',
  'Boston, MA',
  'Denver, CO',
  'Miami, FL',
  'London, UK',
  'Toronto, Canada',
  'Other'
];

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship'
];

export function CreateJobModal({ isOpen, onClose }: CreateJobModalProps) {
  const { createJob, generateJobDescription, getShareLink, isLoading } = useJobs();
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [jobLink, setJobLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    customTitle: '',
    company: 'SortFast Inc.',
    location: '',
    customLocation: '',
    employment_type: 'Full-time',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    requirements: [''],
    description: '',
    skill_weights: {
      technical: 40,
      soft: 25,
      leadership: 20,
      communication: 15
    },
    cutoff_percentage: 70,
    max_candidates: 50,
    active_days: 30,
    enable_waitlist: false,
    waitlist_duration: 7,
    waitlist_message: 'You have successfully passed our assessment benchmark and demonstrated the qualifications we are looking for in this role. Due to the high volume of qualified applicants, you have been placed on our priority waitlist. Interview qualification results will be announced within the next 7 days. We appreciate your patience and will keep you updated on your application status.',
    suggested_questions: [''],
    allow_retake: true
  });

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillWeightChange = (skill: string, value: number) => {
    const newWeights = { ...formData.skill_weights, [skill]: value };
    
    // Ensure weights add up to 100
    const total = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0);
    if (total <= 100) {
      setFormData(prev => ({ ...prev, skill_weights: newWeights }));
    }
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    setFormData(prev => ({ ...prev, requirements: newRequirements }));
  };

  const removeRequirement = (index: number) => {
    if (formData.requirements.length > 1) {
      const newRequirements = formData.requirements.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, requirements: newRequirements }));
    }
  };

  const addSuggestedQuestion = () => {
    setFormData(prev => ({
      ...prev,
      suggested_questions: [...prev.suggested_questions, '']
    }));
  };

  const updateSuggestedQuestion = (index: number, value: string) => {
    const newQuestions = [...formData.suggested_questions];
    newQuestions[index] = value;
    setFormData(prev => ({ ...prev, suggested_questions: newQuestions }));
  };

  const removeSuggestedQuestion = (index: number) => {
    if (formData.suggested_questions.length > 1) {
      const newQuestions = formData.suggested_questions.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, suggested_questions: newQuestions }));
    }
  };

  const handleGenerateDescription = async () => {
    const jobTitle = formData.title === 'Other' ? formData.customTitle : formData.title;
    const requirements = formData.requirements.filter(req => req.trim() !== '');
    
    if (!jobTitle || requirements.length === 0) {
      alert('Please enter a job title and at least one requirement to generate a description.');
      return;
    }
    
    setIsGeneratingDescription(true);
    try {
      const description = await generateJobDescription(jobTitle, requirements);
      setFormData(prev => ({ ...prev, description }));
      
      // Generate suggested interview questions based on job requirements
      const generatedQuestions = [
        `Can you explain your experience with ${requirements[0]}?`,
        `How have you applied ${requirements.length > 1 ? requirements[1] : requirements[0]} in your previous roles?`,
        `What challenges have you faced when working with ${jobTitle.toLowerCase()} projects?`,
        `How do you stay updated with the latest trends in ${jobTitle.toLowerCase()}?`,
        `Can you describe a situation where you had to learn ${requirements.length > 2 ? requirements[2] : requirements[0]} quickly?`
      ];
      
      setSuggestedQuestions(generatedQuestions);
      
    } catch (error) {
      console.error('Failed to generate description:', error);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const jobTitle = formData.title === 'Other' ? formData.customTitle : formData.title;
    const jobLocation = formData.location === 'Other' ? formData.customLocation : formData.location;
    const requirements = formData.requirements.filter(req => req.trim() !== '');
    
    if (requirements.length === 0) {
      alert('Please add at least one job requirement.');
      return;
    }
    
    const jobData = {
      title: jobTitle,
      company: formData.company,
      location: jobLocation,
      employment_type: formData.employment_type,
      salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
      salary_currency: formData.salary_currency,
      description: formData.description,
      requirements,
      skill_weights: formData.skill_weights,
      cutoff_percentage: formData.cutoff_percentage,
      max_candidates: formData.max_candidates,
      active_days: formData.active_days,
      enable_waitlist: formData.enable_waitlist,
      waitlist_duration: formData.waitlist_duration,
      waitlist_message: formData.waitlist_message,
      suggested_questions: formData.suggested_questions.filter(q => q.trim() !== ''),
      allow_retake: formData.allow_retake
    };
    
    try {
      await createJob(jobData);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        customTitle: '',
        company: 'SortFast Inc.',
        location: '',
        customLocation: '',
        employment_type: 'Full-time',
        salary_min: '',
        salary_max: '',
        salary_currency: 'USD',
        description: '',
        requirements: [''],
        skill_weights: {
          technical: 40,
          soft: 25,
          leadership: 20,
          communication: 15
        },
        cutoff_percentage: 70,
        max_candidates: 50,
        active_days: 30,
        enable_waitlist: false,
        waitlist_duration: 7,
        waitlist_message: 'You have successfully passed our assessment benchmark and demonstrated the qualifications we are looking for in this role. Due to the high volume of qualified applicants, you have been placed on our priority waitlist. Interview qualification results will be announced within the next 7 days. We appreciate your patience and will keep you updated on your application status.',
        suggested_questions: [''],
        allow_retake: true
      });
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const handleShare = async () => {
    try {
      const mockJobId = 'job-' + Date.now();
      const link = await getShareLink(mockJobId);
      setJobLink(link);
    } catch (error) {
      console.error('Failed to get share link:', error);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(jobLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const totalWeight = Object.values(formData.skill_weights).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl relative my-8 bg-white dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
        >
          <X size={20} />
        </button>

        <div className="mb-6 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create New Job</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Fill out the details below to create a new job posting
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-0">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Job Title *
              </label>
              <select
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select a job title</option>
                {JOB_TITLES.map(title => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
              {formData.title === 'Other' && (
                <input
                  type="text"
                  value={formData.customTitle}
                  onChange={(e) => handleInputChange('customTitle', e.target.value)}
                  placeholder="Enter custom job title"
                  className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location *
              </label>
              <select
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select location</option>
                {LOCATIONS.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              {formData.location === 'Other' && (
                <input
                  type="text"
                  value={formData.customLocation}
                  onChange={(e) => handleInputChange('customLocation', e.target.value)}
                  placeholder="Enter custom location"
                  className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employment Type
              </label>
              <select
                value={formData.employment_type}
                onChange={(e) => handleInputChange('employment_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {EMPLOYMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary Range */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Salary
              </label>
              <input
                type="number"
                value={formData.salary_min}
                onChange={(e) => handleInputChange('salary_min', e.target.value)}
                placeholder="80000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Salary
              </label>
              <input
                type="number"
                value={formData.salary_max}
                onChange={(e) => handleInputChange('salary_max', e.target.value)}
                placeholder="120000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                value={formData.salary_currency}
                onChange={(e) => handleInputChange('salary_currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
          </div>

          {/* Requirements - Moved before job description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Requirements *
            </label>
            <div className="space-y-2">
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    placeholder="Enter a requirement"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required={index === 0}
                  />
                  {formData.requirements.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRequirement(index)}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRequirement}
              >
                Add Requirement
              </Button>
            </div>
          </div>

          {/* Job Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Job Description *
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                loading={isGeneratingDescription}
                disabled={!formData.title || (formData.title === 'Other' && !formData.customTitle) || formData.requirements.filter(r => r.trim()).length === 0}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                AI Generate
              </Button>
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              required
            />
          </div>

          {/* Suggested Interview Questions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Suggested Interview Questions (Optional)
              </label>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Info size={14} className="mr-1" />
                <span>AI will focus on these areas</span>
              </div>
            </div>
            
            {suggestedQuestions.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">AI Suggested Questions</h4>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newQuestions = [...formData.suggested_questions];
                          newQuestions[0] = question;
                          setFormData(prev => ({ ...prev, suggested_questions: newQuestions }));
                        }}
                        className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-700"
                      >
                        Add
                      </button>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              {formData.suggested_questions.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => updateSuggestedQuestion(index, e.target.value)}
                    placeholder="Enter a suggested interview question"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {formData.suggested_questions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSuggestedQuestion(index)}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSuggestedQuestion}
              >
                Add Question
              </Button>
            </div>
          </div>

          {/* Skill Weights */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Skill Assessment Weights ({totalWeight}% total)
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(formData.skill_weights).map(([skill, weight]) => (
                <div key={skill}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {skill === 'soft' ? 'Soft Skills' : skill}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{weight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weight}
                    onChange={(e) => handleSkillWeightChange(skill, Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
            {totalWeight !== 100 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                Weights should add up to 100% (currently {totalWeight}%)
              </p>
            )}
          </div>

          {/* Job Settings */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.cutoff_percentage}
                onChange={(e) => handleInputChange('cutoff_percentage', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Candidates
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_candidates}
                onChange={(e) => handleInputChange('max_candidates', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Active Days
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.active_days}
                onChange={(e) => handleInputChange('active_days', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Assessment Settings */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Assessment Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allowRetake"
                  checked={formData.allow_retake}
                  onChange={(e) => handleInputChange('allow_retake', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="allowRetake" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allow candidates to retake assessment if terminated
                </label>
                <div className="group relative">
                  <Info size={16} className="text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    If enabled, candidates can retry the assessment once if it was terminated due to violations
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Waitlist Settings */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="enableWaitlist"
                checked={formData.enable_waitlist}
                onChange={(e) => handleInputChange('enable_waitlist', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="enableWaitlist" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Waitlist System
              </label>
              <div className="group relative">
                <Info size={16} className="text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Allows qualified candidates to be waitlisted when max capacity is reached
                </div>
              </div>
            </div>

            {formData.enable_waitlist && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Waitlist Duration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.waitlist_duration}
                    onChange={(e) => handleInputChange('waitlist_duration', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Waitlist Message
                  </label>
                  <textarea
                    value={formData.waitlist_message}
                    onChange={(e) => handleInputChange('waitlist_message', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Message shown to waitlisted candidates..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Share Link */}
          {jobLink && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Job Link</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 break-all">{jobLink}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                >
                  {linkCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {linkCopied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={totalWeight !== 100 || !formData.title || !formData.description || formData.requirements.filter(r => r.trim()).length === 0}
              loading={isLoading}
            >
              Create Job
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Generate Link
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}