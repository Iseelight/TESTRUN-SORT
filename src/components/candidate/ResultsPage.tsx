import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Award, MessageCircle, Download, Eye, Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ProgressBar } from '../ui/ProgressBar';
import { Candidate } from '../../types';

interface ResultsPageProps {
  candidate: Candidate;
  jobTitle: string;
  cutoffScore: number;
  waitlistMessage?: string;
  onDownloadReport: () => void;
  onViewFeedback: () => void;
}

export function ResultsPage({ 
  candidate, 
  jobTitle, 
  cutoffScore,
  waitlistMessage,
  onDownloadReport, 
  onViewFeedback 
}: ResultsPageProps) {
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const isPassed = candidate.scores.overall >= cutoffScore;
  const isSelected = candidate.status === 'selected';
  const isWaitlisted = candidate.status === 'waitlisted';
  const isRejected = candidate.status === 'rejected';

  const getStatusInfo = () => {
    if (isSelected) {
      return {
        icon: <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />,
        title: 'Congratulations! You\'re Selected',
        subtitle: 'You have been selected for the next round',
        badgeVariant: 'success' as const,
        badgeText: 'Selected for Interview'
      };
    } else if (isWaitlisted) {
      return {
        icon: <Clock className="w-16 h-16 text-yellow-600 mx-auto" />,
        title: 'You\'re on the Waitlist',
        subtitle: 'You passed the assessment and are on our priority list',
        badgeVariant: 'warning' as const,
        badgeText: 'Waitlisted'
      };
    } else if (isRejected) {
      return {
        icon: <XCircle className="w-16 h-16 text-red-600 mx-auto" />,
        title: 'Application Not Selected',
        subtitle: 'Thank you for your interest in this position',
        badgeVariant: 'destructive' as const,
        badgeText: 'Not Selected'
      };
    } else if (isPassed) {
      return {
        icon: <Clock className="w-16 h-16 text-blue-600 mx-auto" />,
        title: 'Assessment Completed',
        subtitle: 'Your application is under review',
        badgeVariant: 'default' as const,
        badgeText: 'Under Review'
      };
    } else {
      return {
        icon: <XCircle className="w-16 h-16 text-red-600 mx-auto" />,
        title: 'Assessment Complete',
        subtitle: 'Unfortunately, you did not meet the minimum requirements',
        badgeVariant: 'destructive' as const,
        badgeText: 'Below Threshold'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-white dark:bg-gray-800">
        <div className="text-center">
          <div className="mb-4">
            {statusInfo.icon}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {statusInfo.title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            Application for {jobTitle}
          </p>
          
          <Badge 
            variant={statusInfo.badgeVariant}
            size="md"
          >
            {statusInfo.badgeText}
          </Badge>

          <p className="text-gray-600 dark:text-gray-400 mt-4">
            {statusInfo.subtitle}
          </p>
        </div>
      </Card>

      {/* Waitlist Message */}
      {isWaitlisted && waitlistMessage && (
        <Card className="bg-white dark:bg-gray-800">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Waitlist Information
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 leading-relaxed">
              {waitlistMessage}
            </p>
          </div>
        </Card>
      )}

      {/* Overall Score */}
      <Card className="bg-white dark:bg-gray-800">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Overall Score</h2>
          <div className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            {candidate.scores.overall}%
          </div>
          <ProgressBar 
            value={candidate.scores.overall} 
            color={candidate.scores.overall >= cutoffScore ? 'green' : 'red'}
            className="max-w-md mx-auto"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Minimum required: {cutoffScore}%
          </p>
        </div>
      </Card>

      {/* Detailed Scores */}
      <Card className="bg-white dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Skill Assessment</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Technical Skills</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{candidate.scores.technical}%</span>
              </div>
              <ProgressBar value={candidate.scores.technical} color="blue" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Soft Skills</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{candidate.scores.soft}%</span>
              </div>
              <ProgressBar value={candidate.scores.soft} color="purple" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Leadership</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{candidate.scores.leadership}%</span>
              </div>
              <ProgressBar value={candidate.scores.leadership} color="green" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Communication</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{candidate.scores.communication}%</span>
              </div>
              <ProgressBar value={candidate.scores.communication} color="yellow" />
            </div>
          </div>
        </div>
      </Card>

      {/* Interview Details */}
      {isSelected && candidate.feedback?.interviewDetails && (
        <Card className="bg-white dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Interview Details</h3>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Schedule</h4>
                <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>Date: {candidate.feedback.interviewDetails.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>Time: {candidate.feedback.interviewDetails.time}</span>
                  </div>
                  <div>Location: {candidate.feedback.interviewDetails.location}</div>
                  <div>Interviewer: {candidate.feedback.interviewDetails.interviewer}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Instructions</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {candidate.feedback.interviewDetails.instructions}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Feedback Section */}
      {candidate.feedback && (
        <Card className="bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Assessment Feedback</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {showDetailedFeedback ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {candidate.feedback.overallAssessment}
            </p>
          </div>

          {showDetailedFeedback && (
            <div className="space-y-6">
              {/* Strengths */}
              {candidate.feedback.strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 dark:text-green-300 mb-3">Strengths</h4>
                  <ul className="space-y-2">
                    {candidate.feedback.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {candidate.feedback.weaknesses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-3">Areas for Improvement</h4>
                  <ul className="space-y-2">
                    {candidate.feedback.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {candidate.feedback.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {candidate.feedback.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rejection Reason */}
              {candidate.feedback.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">Feedback Summary</h4>
                  <p className="text-red-600 dark:text-red-400">
                    {candidate.feedback.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Actions */}
      <Card className="bg-white dark:bg-gray-800">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Next Steps</h3>
        
        <div className="flex flex-wrap gap-3">
          <Button onClick={onDownloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button variant="outline" onClick={onViewFeedback}>
            <MessageCircle className="mr-2 h-4 w-4" />
            View Detailed Feedback
          </Button>
          {candidate.feedback && (
            <Button variant="outline">
              <Award className="mr-2 h-4 w-4" />
              Share Results
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}