/**
 * Cell Duplicate Report API
 * Spec Reference: 05-bingo-card-generation.md - Duplicate Handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { reportDuplicate, getCellById } from '@/lib/db';

/**
 * POST /api/cells/[cellId]/duplicate - Report a duplicate resolution
 * Spec: 05-bingo-card-generation.md - If a generated card contains duplicate resolution texts
 */
export async function POST(
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
    const { replacementText } = body;

    // Report duplicate
    // Spec: 05-bingo-card-generation.md - The card owner OR the member who provided can report
    const result = await reportDuplicate(cellId, currentUser.id, replacementText);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    // Get updated cell
    const updatedCell = await getCellById(cellId);
    
    return NextResponse.json({ 
      message: 'Duplicate reported successfully',
      cell: updatedCell,
    });
  } catch (error) {
    console.error('Report duplicate error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
