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
      case 'closed': return 'error';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Card hover className="relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
          <p className="text-gray-600">{job.company}</p>
        </div>
        <Badge variant={getStatusColor(job.status)} size="md">
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </Badge>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} />
          <span>{job.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={16} />
          <span>{candidateCount} / {job.maxCandidates} candidates</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <BarChart3 size={16} />
          <span>{job.cutoffPercentage}% minimum score</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Skill Weights</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Technical:</span>
            <span className="font-medium">{job.skillWeights.technical}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Soft Skills:</span>
            <span className="font-medium">{job.skillWeights.soft}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Leadership:</span>
            <span className="font-medium">{job.skillWeights.leadership}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Communication:</span>
            <span className="font-medium">{job.skillWeights.communication}%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={() => onViewCandidates(job.id)}
          className="flex-1"
        >
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