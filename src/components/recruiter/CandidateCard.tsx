import React from 'react';
import { MapPin, Clock, FileText, MessageCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ProgressBar } from '../ui/ProgressBar';
import { Candidate } from '../../types';

interface CandidateCardProps {
  candidate: Candidate;
  onViewProfile: (candidateId: string) => void;
  onViewConversation: (candidateId: string) => void;
}

export function CandidateCard({ candidate, onViewProfile, onViewConversation }: CandidateCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selected': return 'success';
      case 'rejected': return 'error';
      case 'completed': return 'info';
      case 'interviewing': return 'warning';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  return (
    <Card hover className="relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{candidate.name}</h3>
          <p className="text-gray-600">{candidate.email}</p>
        </div>
        <Badge variant={getStatusColor(candidate.status)} size="md">
          {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
        </Badge>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} />
          <span>{candidate.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>Applied {new Date(candidate.appliedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-900">Overall Score</h4>
          <span className="text-lg font-bold text-gray-900">{candidate.scores.overall}%</span>
        </div>
        <ProgressBar 
          value={candidate.scores.overall} 
          color={getScoreColor(candidate.scores.overall)}
        />
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Skill Breakdown</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Technical</span>
            <span className="text-xs font-medium">{candidate.scores.technical}%</span>
          </div>
          <ProgressBar value={candidate.scores.technical} color="blue" />
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Soft Skills</span>
            <span className="text-xs font-medium">{candidate.scores.soft}%</span>
          </div>
          <ProgressBar value={candidate.scores.soft} color="purple" />
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Leadership</span>
            <span className="text-xs font-medium">{candidate.scores.leadership}%</span>
          </div>
          <ProgressBar value={candidate.scores.leadership} color="green" />
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Communication</span>
            <span className="text-xs font-medium">{candidate.scores.communication}%</span>
          </div>
          <ProgressBar value={candidate.scores.communication} color="yellow" />
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          size="sm"
          onClick={() => onViewProfile(candidate.id)}
          className="flex-1"
          icon={FileText}
        >
          Profile
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onViewConversation(candidate.id)}
          icon={MessageCircle}
        >
          Chat
        </Button>
      </div>
    </Card>
  );
}