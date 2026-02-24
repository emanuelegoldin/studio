/**
 * Review Vote API
 * Spec Reference: Resolution Review & Proof Workflow - Voting Rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { submitVote } from '@/lib/db';
import type { VoteType } from '@/lib/db/types';

/**
 * POST /api/threads/[threadId]/vote - Submit or update a vote
 * All team members except the completing user can vote
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { threadId } = await params;
    const body = await request.json();
    const { vote } = body;

    // Validate vote
    if (!vote || !['accept', 'deny'].includes(vote)) {
      return NextResponse.json(
        { error: 'Vote must be "accept" or "deny"' },
        { status: 400 }
      );
    }

    const result = await submitVote(threadId, currentUser.id, vote as VoteType);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Return vote and whether the thread was closed
    return NextResponse.json({ 
      vote: result.vote,
      threadClosed: result.threadClosed,
    }, { status: 201 });
  } catch (error) {
    console.error('Submit vote error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
