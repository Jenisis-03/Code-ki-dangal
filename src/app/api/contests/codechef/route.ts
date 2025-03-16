import { NextResponse } from "next/server";
import axios from "axios";
import dayjs from "dayjs";
import { Contest, ContestStatus } from "@/types/contest";
import { enrichContestData } from "@/utils/contest-metadata";

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
    const contests = await fetchCodeChefContests();
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