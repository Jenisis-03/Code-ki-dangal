import axios from 'axios';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Contest, ContestDifficulty } from '@/types/contest';
import { enrichContestData } from '@/utils/contest-metadata';
import { apiCache, withCache } from '@/utils/api-cache';

// Initialize dayjs plugins
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);

// Cache TTL configuration (in milliseconds)
const CACHE_CONFIG = {
  // Cache upcoming contests for 15 minutes
  UPCOMING_CONTESTS: 15 * 60 * 1000,
  // Cache past contests for 6 hours
  PAST_CONTESTS: 6 * 60 * 60 * 1000,
};

// API configuration with retry and timeout settings
const API_CONFIG = {
  LEETCODE: {
    GRAPHQL_URL: 'https://leetcode.com/graphql',
    FALLBACK_CONTEST: {
      id: "lc_weekly-contest-388",
      name: "Weekly Contest 388",
      duration: "PT1H30M",
      url: "https://leetcode.com/contest/weekly-contest-388/",
      difficulty: "Medium" as ContestDifficulty
    },
    TIMEOUT: 5000, // 5 seconds timeout
    RETRIES: 2,
  },
  CODEFORCES: {
    API_URL: 'https://codeforces.com/api/contest.list',
    FALLBACK_CONTEST: {
      id: "cf_1234",
      name: "Codeforces Round #123 (Div. 2)",
      duration: "PT2H",
      url: "https://codeforces.com/contest/1234",
      difficulty: "Medium" as ContestDifficulty
    },
    TIMEOUT: 5000,
    RETRIES: 2,
  },
  CODECHEF: {
    API_URL: 'https://www.codechef.com/api/list/contests/all',
    FALLBACK_CONTEST: {
      id: "cc_START123",
      name: "CodeChef Starters 123",
      duration: "PT3H",
      url: "https://www.codechef.com/START123",
      difficulty: "Easy" as ContestDifficulty
    },
    TIMEOUT: 5000,
    RETRIES: 2,
  }
};

/**
 * Utility function to retry API calls with exponential backoff
 */
async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  retries: number = 2,
  delay: number = 1000
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (retries <= 0) throw error;

    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));

    // Retry with one less retry and doubled delay
    return retryApiCall(apiCall, retries - 1, delay * 2);
  }
}

class ContestAPI {
  /**
   * Determine contest difficulty based on name
   */
  private static determineDifficulty(contestName: string): ContestDifficulty {
    const lowerName = contestName.toLowerCase();
    if (lowerName.includes('div 1') || lowerName.includes('expert')) {
      return 'Hard';
    } else if (lowerName.includes('div 2') || lowerName.includes('advanced')) {
      return 'Medium';
    }
    return 'Easy';
  }

  /**
   * Fetch LeetCode contests with caching and retry logic
   */
  static async fetchLeetCodeContests(): Promise<Contest[]> {
    // Use the cache utility
    return apiCache.getOrFetch(
      'leetcode_contests',
      async () => {
        try {
          const graphqlQuery = {
            query: `
              query getContestList {
                allContests {
                  title
                  startTime
                  duration
                  titleSlug
                }
              }
            `
          };

          const response = await retryApiCall(
            () => axios.post(API_CONFIG.LEETCODE.GRAPHQL_URL, graphqlQuery, {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              timeout: API_CONFIG.LEETCODE.TIMEOUT,
            }),
            API_CONFIG.LEETCODE.RETRIES
          );

          const allContests = response.data.data?.allContests;
          if (!Array.isArray(allContests)) {
            throw new Error('Failed to fetch LeetCode contests');
          }

          const currentTime = dayjs();
          return allContests.map(contest => {
            const startTime = dayjs.unix(contest.startTime);
            const endTime = startTime.add(contest.duration, 'second');
            const status = currentTime.isAfter(endTime) ? 'Past' :
                          currentTime.isAfter(startTime) ? 'Ongoing' : 'Upcoming';
            const difficulty: ContestDifficulty = contest.title.toLowerCase().includes('biweekly') ? 'Easy' : 'Medium';

            return enrichContestData({
              id: `lc_${contest.titleSlug}`,
              name: contest.title,
              startTime: startTime.toISOString(),
              duration: `PT${Math.floor(contest.duration / 3600)}H${Math.floor((contest.duration % 3600) / 60)}M`,
              status,
              url: `https://leetcode.com/contest/${contest.titleSlug}`,
              difficulty
            }, "LeetCode");
          });
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching LeetCode contests:', error);
          }

          const currentTime = dayjs();
          const weeklyStart = currentTime.startOf('week').add(6, 'day').hour(10).minute(30);
          return [enrichContestData({
            ...API_CONFIG.LEETCODE.FALLBACK_CONTEST,
            startTime: weeklyStart.toISOString(),
            status: currentTime.isAfter(weeklyStart) ? 'Past' : 'Upcoming',
          }, "LeetCode")];
        }
      },
      CACHE_CONFIG.UPCOMING_CONTESTS
    );
  }

  /**
   * Fetch Codeforces contests with caching and retry logic
   */
  static async fetchCodeforcesContests(): Promise<Contest[]> {
    return apiCache.getOrFetch(
      'codeforces_contests',
      async () => {
        try {
          const response = await retryApiCall(
            () => axios.get(API_CONFIG.CODEFORCES.API_URL, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Contests-API/1.0'
              },
              timeout: API_CONFIG.CODEFORCES.TIMEOUT,
            }),
            API_CONFIG.CODEFORCES.RETRIES
          );

          if (response.data.status !== 'OK') {
            throw new Error('Failed to fetch Codeforces contests');
          }

          const currentTime = dayjs();
          return response.data.result.map((contest: any) => {
            const startTime = dayjs.unix(contest.startTimeSeconds);
            const endTime = startTime.add(contest.durationSeconds, 'second');
            const status = currentTime.isAfter(endTime) ? 'Past' :
                          currentTime.isAfter(startTime) ? 'Ongoing' : 'Upcoming';
            const difficulty: ContestDifficulty = this.determineDifficulty(contest.name);

            return enrichContestData({
              id: `cf_${contest.id}`,
              name: contest.name,
              startTime: startTime.toISOString(),
              duration: `PT${Math.floor(contest.durationSeconds / 3600)}H${Math.floor((contest.durationSeconds % 3600) / 60)}M`,
              status,
              url: `https://codeforces.com/contest/${contest.id}`,
              difficulty
            }, "Codeforces");
          });
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching Codeforces contests:', error);
          }

          return [enrichContestData({
            ...API_CONFIG.CODEFORCES.FALLBACK_CONTEST,
            startTime: dayjs().add(2, 'day').hour(17).minute(35).toISOString(),
            status: 'Upcoming',
          }, "Codeforces")];
        }
      },
      CACHE_CONFIG.UPCOMING_CONTESTS
    );
  }

  /**
   * Fetch CodeChef contests with caching and retry logic
   */
  static async fetchCodeChefContests(): Promise<Contest[]> {
    return apiCache.getOrFetch(
      'codechef_contests',
      async () => {
        try {
          const response = await retryApiCall(
            () => axios.get(API_CONFIG.CODECHEF.API_URL, {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Contests-API/1.0'
              },
              timeout: API_CONFIG.CODECHEF.TIMEOUT,
            }),
            API_CONFIG.CODECHEF.RETRIES
          );

          if (!response.data.future_contests) {
            throw new Error('Failed to fetch CodeChef contests');
          }

          const currentTime = dayjs();
          return response.data.future_contests.map((contest: any) => {
            const startTime = dayjs(contest.contest_start_date);
            const endTime = dayjs(contest.contest_end_date);
            const contestDuration = endTime.diff(startTime, 'minute');
            const difficulty: ContestDifficulty = this.determineDifficulty(contest.contest_name);

            return enrichContestData({
              id: `cc_${contest.contest_code}`,
              name: contest.contest_name,
              startTime: startTime.toISOString(),
              duration: `PT${Math.floor(contestDuration / 60)}H${contestDuration % 60}M`,
              status: currentTime.isAfter(startTime) ? 'Ongoing' : 'Upcoming',
              url: `https://www.codechef.com/${contest.contest_code}`,
              difficulty
            }, "CodeChef");
          });
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching CodeChef contests:', error);
          }

          return [enrichContestData({
            ...API_CONFIG.CODECHEF.FALLBACK_CONTEST,
            startTime: dayjs().add(3, 'day').hour(14).minute(30).toISOString(),
            status: 'Upcoming',
          }, "CodeChef")];
        }
      },
      CACHE_CONFIG.UPCOMING_CONTESTS
    );
  }

  /**
   * Get all contests with optimized caching strategy
   */
  static getAllContests = withCache(
    async (): Promise<Contest[]> => {
      try {
        const [leetcodeContests, codeforcesContests, codechefContests] = await Promise.all([
          this.fetchLeetCodeContests(),
          this.fetchCodeforcesContests(),
          this.fetchCodeChefContests(),
        ]);

        return [...leetcodeContests, ...codeforcesContests, ...codechefContests]
          .filter(Boolean)
          .sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)));
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error fetching all contests:', error);
        }
        throw error;
      }
    },
    'all_contests',
    CACHE_CONFIG.UPCOMING_CONTESTS
  );
}

export default ContestAPI;
