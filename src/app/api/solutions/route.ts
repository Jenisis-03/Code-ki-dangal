import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// In a real application, you would use a database
const solutions = new Map<string, string>();

export async function GET() {
  try {
    const solutions = await db.solution.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ solutions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch solutions' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate YouTube URL
    const youtubeRegex = /^https?:\/\/(www\.)?youtube\.com\/(watch\?v=|playlist\?list=)[\w-]+/;
    if (!youtubeRegex.test(body.link)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL format' },
        { status: 400 }
      );
    }

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

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Solution ID is required' },
        { status: 400 }
      );
    }

    await db.solution.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete solution' },
      { status: 500 }
    );
  }
}