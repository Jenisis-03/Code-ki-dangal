// src/app/api/contests/route.ts
import { NextResponse } from "next/server";
import ContestAPI from "@/utils/contestApi";
import { calculateContestMetrics } from "@/utils/contest-metadata";

// Load environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function GET() {
  try {
    const allContests = await ContestAPI.getAllContests();

    return NextResponse.json({
      status: 'success',
      count: allContests.length,
      timestamp: Date.now(),
      data: allContests,
      meta: calculateContestMetrics(allContests)
    }, {
      headers: {
        'Access-Control-Allow-Origin': FRONTEND_URL,
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch contests',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}