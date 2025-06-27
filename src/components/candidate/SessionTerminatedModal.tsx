import React from 'react';
import { AlertTriangle, Camera, Eye, Monitor, Clock } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface SessionTerminatedModalProps {
  isOpen: boolean;
  reason: string;
  violations: Array<{
    type: string;
    timestamp: Date;
    count: number;
    severity: 'warning' | 'critical';
  }>;
  onRetakeSession: () => void;
  onExitSession: () => void;
}

export function SessionTerminatedModal({ 
  isOpen, 
  reason, 
  violations, 
  onRetakeSession, 
  onExitSession 
}: SessionTerminatedModalProps) {
  if (!isOpen) return null;

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'looking_away':
        return <Eye className="w-4 h-4" />;
      case 'face_not_detected':
        return <Camera className="w-4 h-4" />;
      case 'screen_switch':
        return <Monitor className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getViolationDescription = (type: string) => {
    switch (type) {
      case 'looking_away':
        return 'Looking away from screen';
      case 'face_not_detected':
        return 'Face not detected';
      case 'screen_switch':
        return 'Tab/window switching';
      case 'multiple_faces':
        return 'Multiple faces detected';
      default:
        return 'Unknown violation';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white dark:bg-gray-800">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Session Terminated
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your interview session has been ended due to proctoring violations
          </p>
        </div>

        {/* Reason */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">Termination Reason</h3>
          <p className="text-red-700 dark:text-red-300">{reason}</p>
        </div>

        {/* Violations Summary */}
        {violations.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Violations Detected</h3>
            <div className="space-y-3">
              {violations.map((violation, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-gray-500 dark:text-gray-400">
                      {getViolationIcon(violation.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getViolationDescription(violation.type)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{violation.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={violation.severity === 'critical' ? 'destructive' : 'warning'}>
                    {violation.severity === 'critical' ? 'Critical' : 'Warning'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Impact on Your Application
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• This incident will be recorded in your candidate report</li>
            <li>• The recruiter will be notified of the session termination</li>
            <li>• You may retake the session if the job allows it, but this attempt will remain on record</li>
            <li>• Multiple violations may affect your application status</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onRetakeSession}
            className="flex-1"
          >
            <Camera className="mr-2 h-4 w-4" />
            Retake Interview Session
          </Button>
          <Button
            variant="outline"
            onClick={onExitSession}
            className="flex-1"
          >
            Exit and Review Application
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Need Help?</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If you believe this termination was due to technical issues or you need assistance, 
            please contact our support team with your session ID: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">
              {Date.now().toString(36).toUpperCase()}
            </code>
          </p>
        </div>
      </Card>
    </div>
  );
}