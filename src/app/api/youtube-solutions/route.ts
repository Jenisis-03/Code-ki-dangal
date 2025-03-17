import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const solutions = await db.solution.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platform: true,
        contestName: true,
        link: true,
        createdAt: true
      }
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
    
    // Input validation
    if (!body.platform || !body.contestName || !body.link) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // YouTube URL validation
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}$/;
    if (!youtubeRegex.test(body.link)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL format' },
        { status: 400 }
      );
    }

    // Create solution with validation
    const solution = await db.solution.create({
      data: {
        platform: body.platform,
        contestName: body.contestName,
        link: body.link
      }
    });

    return NextResponse.json({ 
      success: true, 
      solution,
      message: 'Solution added successfully'
    });
  } catch (error) {
    console.error('Error adding solution:', error);
    return NextResponse.json(
      { error: 'Failed to add solution' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Solution ID is required' },
        { status: 400 }
      );
    }

    await db.solution.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Solution deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting solution:', error);
    return NextResponse.json(
      { error: 'Failed to delete solution' },
      { status: 500 }
    );
  }
} 