'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Contest, ContestStatus } from '@/types/contest';
import { cn } from '@/lib/utils';

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContestStatus | 'all'>('all');

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const response = await fetch('/api/contests');
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        setContests(data.data);
      } else {
        console.error('Invalid response format:', data);
        setContests([]);
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
      setContests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ContestStatus) => {
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'past':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'LeetCode':
        return 'bg-yellow-100 text-yellow-800';
      case 'Codeforces':
        return 'bg-blue-100 text-blue-800';
      case 'CodeChef':
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const formatDuration = (duration: string) => {
    const matches = duration.match(/PT(\d+)H(\d+)M/);
    if (!matches) return duration;
    const [, hours, minutes] = matches;
    return `${hours}h ${minutes}m`;
  };

  const filteredContests = filter === 'all' 
    ? contests 
    : contests.filter(contest => contest.status.toLowerCase() === filter.toLowerCase());

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Coding Contests</h1>
        
        <div className="flex gap-2">
          {['all', 'upcoming', 'ongoing', 'past'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as ContestStatus | 'all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === status 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredContests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No contests found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredContests.map((contest) => (
            <Card key={contest.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{contest.name}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className={cn(getPlatformColor(contest.platform))}>
                      {contest.platform}
                    </Badge>
                    {contest.difficulty && (
                      <Badge variant="outline" className={cn(getDifficultyColor(contest.difficulty))}>
                        {contest.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(contest.status)}>
                  {contest.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Starts:</span>{' '}
                  {formatDate(contest.startTime)}
                </p>
                <p>
                  <span className="font-medium">Duration:</span>{' '}
                  {formatDuration(contest.duration)}
                </p>
              </div>
              
              <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Join Contest
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}