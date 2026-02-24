/**
 * Review Thread API
 * Spec Reference: Resolution Review & Proof Workflow - Review Thread
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getThreadById } from '@/lib/db';

/**
 * GET /api/threads/[threadId] - Get thread details with messages, files, and votes
 */
export async function GET(
  _request: NextRequest,
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

    const result = await getThreadById(threadId, currentUser.id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Thread not found' ? 404 : 403 }
      );
    }
    
    return NextResponse.json({ thread: result.thread });
  } catch (error) {
    console.error('Get thread error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
