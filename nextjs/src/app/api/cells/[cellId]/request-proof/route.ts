/**
 * Request Proof API
 * Spec Reference: Resolution Review & Proof Workflow - Request Proof
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requestProof } from '@/lib/db';

/**
 * POST /api/cells/[cellId]/request-proof - Request proof for a completed cell
 * Creates a review thread for the cell
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ cellId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { cellId } = await params;

    const result = await requestProof(cellId, currentUser.id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ thread: result.thread }, { status: 201 });
  } catch (error) {
    console.error('Request proof error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
