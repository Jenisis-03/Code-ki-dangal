import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const solutions = await db.solution.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ solutions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const solution = await db.solution.create({
      data: {
        platform: body.platform,
        contestName: body.contestName,
        link: body.link
      }
    });
    return NextResponse.json({ success: true, solution });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add video' },
      { status: 500 }
    );
  }
} 