import { NextResponse } from "next/server";
import axios from "axios";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Contest, ContestDifficulty } from "@/types/contest";
import { enrichContestData } from "@/utils/contest-metadata";

// Load environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Initialize dayjs plugins
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);

// Interfaces for contest data
interface CodeforcesContest {
  id: number;
  name: string;
  phase: 'BEFORE' | 'CODING' | 'FINISHED';
  durationSeconds: number;
  startTimeSeconds: number;
}

interface LeetCodeContest {
  title: string;
  startTime: number;
  duration: number;
  titleSlug: string;
}

async function fetchLeetCodeContests(): Promise<Contest[]> {
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

  const response = await axios.post('https://leetcode.com/graphql', graphqlQuery, {
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const contests = response.data.data.allContests.map((contest: LeetCodeContest) => {
    const startTime = dayjs.unix(contest.startTime);
    const duration = `PT${Math.floor(contest.duration / 3600)}H${Math.floor((contest.duration % 3600) / 60)}M`;
    const status = dayjs().isAfter(startTime) ? 'Upcoming' : 'Ongoing';

    return enrichContestData({
      id: `lc_${contest.titleSlug}`,
      name: contest.title,
      startTime: startTime.toISOString(),
      duration,
      status,
      url: `https://leetcode.com/contest/${contest.titleSlug}`,
      difficulty: 'Medium' // Adjust as needed
    }, "LeetCode");
  });

  return contests;
}

async function fetchCodeforcesContests(): Promise<Contest[]> {
  const response = await axios.get('https://codeforces.com/api/contest.list');
  if (response.data.status !== 'OK') {
    throw new Error('Failed to fetch Codeforces contests');
  }

  return response.data.result.map((contest: CodeforcesContest) => {
    const startTime = dayjs.unix(contest.startTimeSeconds);
    const duration = `PT${Math.floor(contest.durationSeconds / 3600)}H${Math.floor((contest.durationSeconds % 3600) / 60)}M`;
    const status = dayjs().isAfter(startTime) ? 'Upcoming' : 'Ongoing';

    return enrichContestData({
      id: `cf_${contest.id}`,
      name: contest.name,
      startTime: startTime.toISOString(),
      duration,
      status,
      url: `https://codeforces.com/contest/${contest.id}`,
      difficulty: 'Medium' // Adjust as needed
    }, "Codeforces");
  });
}

async function fetchCodeChefContests(): Promise<Contest[]> {
  const response = await axios.get('https://www.codechef.com/api/list/contests/all');
  if (!response.data.future_contests) {
    throw new Error('Failed to fetch CodeChef contests');
  }

  return response.data.future_contests.map((contest: any) => {
    const startTime = dayjs(contest.contest_start_date);
    const endTime = dayjs(contest.contest_end_date);
    const duration = endTime.diff(startTime, 'minute');

    return enrichContestData({
      id: `cc_${contest.contest_code}`,
      name: contest.contest_name,
      startTime: startTime.toISOString(),
      duration: `PT${Math.floor(duration / 60)}H${duration % 60}M`,
      status: dayjs().isAfter(startTime) ? 'Upcoming' : 'Ongoing',
      url: `https://www.codechef.com/${contest.contest_code}`,
      difficulty: 'Medium' // Adjust as needed
    }, "CodeChef");
  });
}

export async function GET() {
  try {
    const [leetcodeContests, codeforcesContests, codechefContests] = await Promise.all([
      fetchLeetCodeContests(),
      fetchCodeforcesContests(),
      fetchCodeChefContests(),
    ]);

    const allContests = [...leetcodeContests, ...codeforcesContests, ...codechefContests]
      .filter(Boolean)
      .sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)));

    return NextResponse.json({
      status: 'success',
      count: allContests.length,
      data: allContests,
    }, {
      headers: {
        'Access-Control-Allow-Origin': FRONTEND_URL,
        'Access-Control-Allow-Methods': 'GET',
      }
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch contests',
    }, { status: 500 });
  }
} 