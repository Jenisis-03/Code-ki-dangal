import { NextResponse } from "next/server";
import axios from "axios";
import dayjs from "dayjs";
import { Contest, ContestStatus } from "@/types/contest";
import { enrichContestData } from "@/utils/contest-metadata";

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface CodeforcesContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds: number;
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

export async function GET() {
  try {
    const contests = await fetchCodeforcesContests();
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