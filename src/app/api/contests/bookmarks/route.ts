import { NextResponse } from 'next/server';

// In a real application, you would use a database
let bookmarkedContests = new Set<string>();

export async function GET() {
  return NextResponse.json(Array.from(bookmarkedContests));
}

export async function POST(request: Request) {
  const { contestId } = await request.json();
  
  if (!contestId) {
    return NextResponse.json({ error: 'Contest ID is required' }, { status: 400 });
  }

  bookmarkedContests.add(contestId);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { contestId } = await request.json();
  
  if (!contestId) {
    return NextResponse.json({ error: 'Contest ID is required' }, { status: 400 });
  }

  bookmarkedContests.delete(contestId);
  return NextResponse.json({ success: true });
} 