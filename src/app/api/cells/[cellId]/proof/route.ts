/**
 * Cell Proof API
 * Spec Reference: 07-proof-and-approval.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  uploadProof, 
  getProofsForCell, 
  reviewProof,
  getProofById,
} from '@/lib/db';
import type { ReviewDecision } from '@/lib/db/types';

/**
 * GET /api/cells/[cellId]/proof - Get proofs for a cell
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

    const proofs = await getProofsForCell(cellId);
    
    return NextResponse.json({ proofs });
  } catch (error) {
    console.error('Get proofs error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cells/[cellId]/proof - Upload proof for a cell
 * Spec: 07-proof-and-approval.md - A user can attach proof to a specific resolution cell
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
    const { fileUrl, comment } = body;

    // Upload proof
    // Spec: 07-proof-and-approval.md - Only the card owner can upload proof
    const result = await uploadProof(cellId, currentUser.id, fileUrl, comment);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ proof: result.proof }, { status: 201 });
  } catch (error) {
    console.error('Upload proof error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cells/[cellId]/proof - Review a proof (approve/decline)
 * Spec: 07-proof-and-approval.md - A reviewer can approve or decline with a comment
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
    const { proofId, decision, comment } = body;

    if (!proofId) {
      return NextResponse.json(
        { error: 'Proof ID is required' },
        { status: 400 }
      );
    }

    // Validate decision
    if (!decision || !['approved', 'declined'].includes(decision)) {
      return NextResponse.json(
        { error: 'Decision must be "approved" or "declined"' },
        { status: 400 }
      );
    }

    // Review proof
    // Spec: 07-proof-and-approval.md - Only team members (excluding owner) can approve/decline
    const result = await reviewProof(
      proofId, 
      currentUser.id, 
      decision as ReviewDecision, 
      comment
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    // Get updated proof
    const updatedProof = await getProofById(proofId);
    
    return NextResponse.json({ 
      review: result.review,
      proof: updatedProof,
    });
  } catch (error) {
    console.error('Review proof error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
