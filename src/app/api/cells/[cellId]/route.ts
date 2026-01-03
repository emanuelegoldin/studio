/**
 * Bingo Cell API
 * Spec Reference: 06-bingo-gameplay.md - Card State
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateCellState, getCellById } from '@/lib/db';
import type { CellState } from '@/lib/db/types';

/**
 * GET /api/cells/[cellId] - Get cell details
 */
export async function GET(
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

    const cell = await getCellById(cellId);
    
    if (!cell) {
      return NextResponse.json(
        { error: 'Cell not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ cell });
  } catch (error) {
    console.error('Get cell error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cells/[cellId] - Update cell state
 * Spec: 06-bingo-gameplay.md - Toggle between to_complete and completed
 */
export async function PUT(
  request: NextRequest,
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
    const body = await request.json();
    const { state } = body;

    // Validate state
    if (!state || !['to_complete', 'completed'].includes(state)) {
      return NextResponse.json(
        { error: 'Invalid state. Must be "to_complete" or "completed"' },
        { status: 400 }
      );
    }

    // Update cell state
    // Spec: 06-bingo-gameplay.md - Only the card owner can change their card's cell states
    const result = await updateCellState(cellId, currentUser.id, state as CellState);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ cell: result.cell });
  } catch (error) {
    console.error('Update cell error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
