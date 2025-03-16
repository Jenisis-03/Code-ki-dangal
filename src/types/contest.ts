export type Platform = 'Codeforces' | 'CodeChef' | 'LeetCode';

export type ContestStatus = 'Upcoming' | 'Ongoing' | 'Past';

export type ContestDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Contest {
  id: string;
  name: string;
  platform: Platform;
  url: string;
  startTime: string;
  duration: string;
  status: ContestStatus;
  difficulty: ContestDifficulty;
  isBookmarked: boolean;
  solutionLink?: string;
  registrationUrl?: string;
  description?: string;
  participantCount?: number;
  rating?: {
    from?: number;
    to?: number;
  };
}

export interface ContestFilters {
  platforms: Platform[];
  status: ContestStatus | 'all';
  search: string;
  difficulty?: Contest['difficulty'];
  ratingRange?: {
    min?: number;
    max?: number;
  };
}

export interface ContestMeta {
  total: number;
  platforms: {
    Codeforces: number;
    CodeChef: number;
    LeetCode: number;
  };
  status: {
    Upcoming: number;
    Ongoing: number;
    Past: number;
  };
  difficulty?: Record<NonNullable<Contest['difficulty']>, number>;
  lastUpdated: number;
  nextUpdate: number;
}

export interface ContestResponse {
  success: boolean;
  timestamp: number;
  data: Contest[];
  meta?: ContestMeta;
  error?: string;
  details?: string;
  rateLimit?: {
    remaining: number;
    reset: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
  timestamp: number;
  code?: string;
} 