import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// In a real application, you would use a database
const solutions = new Map<string, string>();

export async function GET() {
  return NextResponse.json(Object.fromEntries(solutions));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await db.solution.create({
      data: {
        platform: body.platform,
        contestName: body.contestName,
        link: body.link
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add solution' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { contestId } = await request.json();
  
  if (!contestId) {
    return NextResponse.json(
      { error: 'Contest ID is required' },
      { status: 400 }
    );
  }

  solutions.delete(contestId);
  return NextResponse.json({ success: true });
}