import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lockedSavings } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const userId = session.user.id;

    // Query active locked savings for the authenticated user
    const activeSavings = await db
      .select()
      .from(lockedSavings)
      .where(
        and(
          eq(lockedSavings.userId, userId),
          eq(lockedSavings.status, 'active')
        )
      )
      .orderBy(desc(lockedSavings.createdAt));

    // Calculate computed fields for each record
    const now = new Date();
    const enrichedSavings = activeSavings.map((saving) => {
      const unlockDate = new Date(saving.unlockAt);
      const isUnlocked = now >= unlockDate;
      
      // Calculate days remaining (0 if already unlocked)
      const timeDiff = unlockDate.getTime() - now.getTime();
      const daysRemaining = isUnlocked ? 0 : Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

      return {
        id: saving.id,
        amount: saving.amount,
        lockDays: saving.lockDays,
        lockedAt: saving.lockedAt,
        unlockAt: saving.unlockAt,
        status: saving.status,
        createdAt: saving.createdAt,
        isUnlocked,
        daysRemaining
      };
    });

    return NextResponse.json(enrichedSavings, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}