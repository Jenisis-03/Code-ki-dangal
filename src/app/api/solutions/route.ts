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
      {
        success: false,
        error: 'Failed to fetch solutions',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'FETCH_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // YouTube URL validation
    const youtubeRegex = /^https?:\/\/(www\.)?youtube\.com\/(watch\?v=|playlist\?list=)[\w-]+/;
    if (!youtubeRegex.test(body.link)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid YouTube URL format',
          code: 'INVALID_URL'
        },
        { status: 400 }
      );
    }

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
      {
        success: false,
        error: 'Failed to add solution',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'CREATE_ERROR'
      },
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
        {
          success: false,
          error: 'Solution ID is required',
          code: 'MISSING_ID'
        },
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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete solution',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: 'DELETE_ERROR'
      },
      { status: 500 }
    );
  }
}