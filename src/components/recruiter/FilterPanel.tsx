import React from 'react';
import { Search, Filter, MapPin, BarChart3 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  minScore: number;
  onMinScoreChange: (score: number) => void;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
}

export function FilterPanel({
  searchTerm,
  onSearchChange,
  minScore,
  onMinScoreChange,
  selectedLocation,
  onLocationChange,
  selectedStatus,
  onStatusChange,
  onReset
}: FilterPanelProps) {
  return (
    <Card className="bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={18} />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Candidates
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Name, email, skills..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Minimum Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Minimum Score: {minScore}%
          </label>
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => onMinScoreChange(Number(e.target.value))}
              className="flex-1"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Locations</option>
              <option value="New York">New York</option>
              <option value="San Francisco">San Francisco</option>
              <option value="London">London</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="interviewing">Interviewing</option>
            <option value="completed">Completed</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <Button variant="outline" onClick={onReset} className="w-full">
          Reset Filters
        </Button>
      </div>
    </Card>
  );
}