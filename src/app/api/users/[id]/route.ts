import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
        
        if (!currentUser) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const user = await findUserById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ id: user.id, username: user.username });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
