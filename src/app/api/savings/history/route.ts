import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lockedSavings } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const statusParam = searchParams.get('status');
    const limit = Math.min(
      parseInt(searchParams.get('limit') ?? '50'),
      100
    );
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Validate status parameter if provided
    const validStatuses = ['active', 'withdrawn', 'early_withdrawal'];
    if (statusParam && !validStatuses.includes(statusParam)) {
      return NextResponse.json(
        { 
          error: 'Invalid status parameter. Must be one of: active, withdrawn, early_withdrawal',
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    // Build query conditions
    const conditions = [eq(lockedSavings.userId, userId)];
    
    if (statusParam) {
      conditions.push(eq(lockedSavings.status, statusParam));
    }

    // Fetch savings records
    const savings = await db
      .select()
      .from(lockedSavings)
      .where(and(...conditions))
      .orderBy(desc(lockedSavings.createdAt))
      .limit(limit)
      .offset(offset);

    // Calculate computed fields and statistics
    const currentTime = new Date();
    let totalSavings = 0;
    let totalWithdrawn = 0;
    let totalPenalties = 0;

    const enrichedSavings = savings.map((record) => {
      const unlockAtDate = new Date(record.unlockAt);
      const lockedAtDate = new Date(record.lockedAt);
      const isUnlocked = currentTime >= unlockAtDate;
      
      // Calculate days locked
      const timeDiff = currentTime.getTime() - lockedAtDate.getTime();
      const daysLocked = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      // Calculate final amount based on status
      let finalAmount = record.amount;
      let penalty = 0;

      if (record.status === 'early_withdrawal') {
        penalty = record.amount * 0.1;
        finalAmount = record.amount - penalty;
        totalPenalties += penalty;
      }

      // Update statistics
      if (record.status === 'active') {
        totalSavings += record.amount;
      } else if (record.status === 'withdrawn' || record.status === 'early_withdrawal') {
        totalWithdrawn += finalAmount;
      }

      return {
        id: record.id,
        userId: record.userId,
        amount: record.amount,
        lockDays: record.lockDays,
        lockedAt: record.lockedAt,
        unlockAt: record.unlockAt,
        status: record.status,
        createdAt: record.createdAt,
        isUnlocked,
        daysLocked,
        finalAmount,
      };
    });

    // Prepare response with summary statistics
    return NextResponse.json({
      savings: enrichedSavings,
      summary: {
        totalSavings,
        totalWithdrawn,
        totalPenalties,
      },
      pagination: {
        limit,
        offset,
        count: enrichedSavings.length,
      },
    });

  } catch (error) {
    console.error('GET locked_savings error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}