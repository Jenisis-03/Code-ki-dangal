import { NextResponse } from "next/server";
import axios from "axios";
import dayjs from "dayjs";
import { Contest, ContestStatus } from "@/types/contest";
import { enrichContestData } from "@/utils/contest-metadata";

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface LeetCodeContest {
  title: string;
  startTime: number;
  duration: number;
  titleSlug: string;
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

export async function GET() {
  try {
    const contests = await fetchLeetCodeContests();
    return NextResponse.json({
      success: true,
      count: contests.length,
      data: contests
    }, {
      headers: {
        'Access-Control-Allow-Origin': FRONTEND_URL,
        'Access-Control-Allow-Methods': 'GET'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch contests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': FRONTEND_URL,
        'Access-Control-Allow-Methods': 'GET'
      }
    });
  }
} 