// src/app/api/contests/route.ts

import { NextResponse } from "next/server";
import axios from "axios";
import dayjs from "dayjs";
import { Contest, ContestStatus } from "@/types/contest";
import { enrichContestData } from "@/utils/contest-metadata";

// Load environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface LeetCodeContest {
  title: string;
  startTime: number;
  duration: number;
  titleSlug: string;
}

interface CodeforcesContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds: number;
}

interface KontestsCodeChefContest {
  name: string;
  url: string;
  start_time: string;
  end_time: string;
  duration: string;
  site: string;
  in_24_hours: string;
  status: string;
}

async function fetchLeetCodeContests(): Promise<Contest[]> {
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

    const response = await axios.post('https://leetcode.com/graphql', graphqlQuery, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Contests-API/1.0'
      }
    });

    const allContests = response.data.data?.allContests;
    if (!Array.isArray(allContests)) {
      throw new Error('LeetCode API response is not an array');
    }

    const currentTime = dayjs();
    return allContests.map((contest: LeetCodeContest) => {
      const startTime = dayjs.unix(contest.startTime);
      const endTime = startTime.add(contest.duration, 'second');
      let status: ContestStatus;

      if (currentTime.isAfter(endTime)) {
        status = 'Past';
      } else if (currentTime.isAfter(startTime)) {
        status = 'Ongoing';
      } else {
        status = 'Upcoming';
      }

      return enrichContestData({
        id: `lc_${contest.titleSlug}`,
        name: contest.title,
        startTime: startTime.toISOString(),
        duration: `PT${Math.floor(contest.duration / 3600)}H${Math.floor((contest.duration % 3600) / 60)}M`,
        status,
        url: `https://leetcode.com/contest/${contest.titleSlug}`,
        difficulty: contest.title.toLowerCase().includes('biweekly') ? 'Easy' : 'Medium'
      }, "LeetCode");
    });
  } catch (error) {
    console.error('Error fetching LeetCode contests:', error);
    return [];
  }
}

async function fetchCodeforcesContests(): Promise<Contest[]> {
  try {
    const response = await axios.get('https://codeforces.com/api/contest.list', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Contests-API/1.0'
      }
    });

    if (response.data.status !== 'OK' || !response.data.result) {
      throw new Error('Codeforces API response is invalid');
    }

    const currentTime = dayjs();
    const contests = response.data.result as CodeforcesContest[];
    
    return contests.map(contest => {
      const startTime = dayjs.unix(contest.startTimeSeconds);
      const endTime = startTime.add(contest.durationSeconds, 'second');
      let status: ContestStatus;

      if (currentTime.isAfter(endTime)) {
        status = 'Past';
      } else if (currentTime.isAfter(startTime)) {
        status = 'Ongoing';
      } else {
        status = 'Upcoming';
      }

      return enrichContestData({
        id: `cf_${contest.id}`,
        name: contest.name,
        startTime: startTime.toISOString(),
        duration: `PT${Math.floor(contest.durationSeconds / 3600)}H${Math.floor((contest.durationSeconds % 3600) / 60)}M`,
        status,
        url: `https://codeforces.com/contest/${contest.id}`,
        difficulty: contest.name.toLowerCase().includes('div. 1') ? 'Hard' : 
                   contest.name.toLowerCase().includes('div. 2') ? 'Medium' : 'Easy'
      }, "Codeforces");
    });
  } catch (error) {
    console.error('Error fetching Codeforces contests:', error);
    return [];
  }
}

async function fetchCodeChefContests(): Promise<Contest[]> {
  try {
    const response = await axios.get('https://kontests.net/api/v1/code_chef', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Contests-API/1.0'
      }
    });

    if (!Array.isArray(response.data)) {
      throw new Error('CodeChef Kontests API response is not an array');
    }

    const currentTime = dayjs();
    return response.data.map((contest: KontestsCodeChefContest) => {
      const startTime = dayjs(contest.start_time);
      const endTime = dayjs(contest.end_time);
      const durationMinutes = endTime.diff(startTime, 'minute');
      let status: ContestStatus;

      if (currentTime.isAfter(endTime)) {
        status = 'Past';
      } else if (currentTime.isAfter(startTime)) {
        status = 'Ongoing';
      } else {
        status = 'Upcoming';
      }

      const contestCode = contest.url.split('/').pop() || '';
      return enrichContestData({
        id: `cc_${contestCode}`,
        name: contest.name,
        startTime: startTime.toISOString(),
        duration: `PT${Math.floor(durationMinutes / 60)}H${durationMinutes % 60}M`,
        status,
        url: contest.url,
        difficulty: contestCode.toLowerCase().includes('ltime') ? 'Medium' :
                   contestCode.toLowerCase().includes('start') ? 'Easy' : 'Hard'
      }, "CodeChef");
    });
  } catch (error) {
    console.error('Error fetching CodeChef contests:', error);
    return [];
  }
}

export async function GET() {
  try {
    // Fetch contests from all platforms
    const [leetcodeContests, codeforcesContests, codechefContests] = await Promise.all([
      fetchLeetCodeContests(),
      fetchCodeforcesContests(),
      fetchCodeChefContests(),
    ]);

    // Combine all contests and filter out null values
    const allContests = [
      ...leetcodeContests,
      ...codeforcesContests,
      ...codechefContests,
    ].filter(Boolean);

    // Sort contests by start time
    allContests.sort((a, b) => {
      const timeA = dayjs(a.startTime);
      const timeB = dayjs(b.startTime);
      return timeA.isBefore(timeB) ? -1 : 1;
    });

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      data: allContests,
    }, {
      headers: {
        'Access-Control-Allow-Origin': FRONTEND_URL,
        'Access-Control-Allow-Methods': 'GET'
      }
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch contests',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': FRONTEND_URL,
        'Access-Control-Allow-Methods': 'GET'
      }
    });
  }
}