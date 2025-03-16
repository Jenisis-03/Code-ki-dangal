import { NextResponse } from 'next/server';

// In a real application, you would use a database
const solutions = new Map<string, string>();

export async function GET() {
  return NextResponse.json(Object.fromEntries(solutions));
}

export async function POST(request: Request) {
  const { contestId, youtubeUrl } = await request.json();
  
  if (!contestId || !youtubeUrl) {
    return NextResponse.json(
      { error: 'Contest ID and YouTube URL are required' },
      { status: 400 }
    );
  }

  // Validate YouTube URL format
  const youtubeRegex = /^https?:\/\/(www\.)?youtube\.com\/(watch\?v=|playlist\?list=)[\w-]+/;
  if (!youtubeRegex.test(youtubeUrl)) {
    return NextResponse.json(
      { error: 'Invalid YouTube URL format' },
      { status: 400 }
    );
  }

  solutions.set(contestId, youtubeUrl);
  return NextResponse.json({ success: true });
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