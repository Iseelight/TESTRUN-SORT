import React from 'react';
import { MapPin, Users, Clock, BarChart3 } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { JobPosting } from '../../types';

interface JobPostingCardProps {
  job: JobPosting;
  candidateCount: number;
  onViewCandidates: (jobId: string) => void;
  onEditJob: (jobId: string) => void;
}

export function JobPostingCard({ job, candidateCount, onViewCandidates, onEditJob }: JobPostingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'closed': return 'destructive';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Card className="relative bg-white dark:bg-gray-800">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{job.title}</h3>
          <p className="text-gray-600 dark:text-gray-400">{job.company}</p>
        </div>
        <Badge variant={getStatusColor(job.status)}>
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </Badge>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <MapPin size={16} />
          <span>{job.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users size={16} />
          <span>{candidateCount} / {job.maxCandidates} candidates</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <BarChart3 size={16} />
          <span>{job.cutoffPercentage}% minimum score</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock size={16} />
          <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Skill Weights</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Technical:</span>
            <span className="font-medium text-gray-900 dark:text-white">{job.skillWeights.technical}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Soft Skills:</span>
            <span className="font-medium text-gray-900 dark:text-white">{job.skillWeights.soft}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Leadership:</span>
            <span className="font-medium text-gray-900 dark:text-white">{job.skillWeights.leadership}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Communication:</span>
            <span className="font-medium text-gray-900 dark:text-white">{job.skillWeights.communication}%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={() => onViewCandidates(job.id)}
          className="flex-1"
        >
          <Users className="mr-2 h-4 w-4" />
          View Candidates
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onEditJob(job.id)}
        >
          Edit
        </Button>
      </div>
    </Card>
  );
}