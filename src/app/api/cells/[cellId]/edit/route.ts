/**
 * Cell Edit API
 * Spec Reference: 09-bingo-card-editing.md
 */

import { getCurrentUser } from "@/lib/auth";
import { updateCellContent } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


/**
 * PUT /api/cells/[cellId]/edit - Edit a cell's content
 * Spec: 09-bingo-card-editing.md - Persisting a Cell Edit
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
    const body = await request.json().catch(() => ({}));

    const resolutionText = typeof body?.resolutionText === 'string' ? body.resolutionText : '';
    const sourceType = body?.sourceType;
    const sourceUserId = typeof body?.sourceUserId === 'string' ? body.sourceUserId : null;
    const isEmpty = Boolean(body?.isEmpty);

    const validSourceTypes = ['team', 'member_provided', 'personal', 'empty'] as const;
    if (!validSourceTypes.includes(sourceType)) {
      return NextResponse.json(
        { error: 'Invalid sourceType' },
        { status: 400 }
      );
    }

    if (!resolutionText || resolutionText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Resolution text is required' },
        { status: 400 }
      );
    }

    const result = await updateCellContent(cellId, currentUser.id, {
      resolutionText,
      sourceType,
      sourceUserId,
      isEmpty,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update cell content' },
        { status: 400 }
      );
    }

    return NextResponse.json({ cell: result.cell });
  } catch (error) {
    console.error('Edit cell error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}