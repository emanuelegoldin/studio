/**
 * Undo Complete API
 * Spec Reference: Resolution Review & Proof Workflow - Undo Completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { undoCompletion } from '@/lib/db';

/**
 * POST /api/cells/[cellId]/undo-complete - Undo mistaken completion
 * Reverts cell to pending state and closes any open review thread
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

    const result = await undoCompletion(cellId, currentUser.id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ cell: result.cell });
  } catch (error) {
    console.error('Undo complete error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
