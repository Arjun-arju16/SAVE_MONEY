import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lockedSavings, transactionsV2 } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { amount, lockDays } = body;

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    // Validation: Check required fields
    if (amount === undefined || amount === null) {
      return NextResponse.json(
        {
          error: 'Amount is required',
          code: 'MISSING_AMOUNT',
        },
        { status: 400 }
      );
    }

    if (lockDays === undefined || lockDays === null) {
      return NextResponse.json(
        {
          error: 'Lock days is required',
          code: 'MISSING_LOCK_DAYS',
        },
        { status: 400 }
      );
    }

    // Validation: Check amount is positive number
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        {
          error: 'Amount must be a positive number',
          code: 'INVALID_AMOUNT',
        },
        { status: 400 }
      );
    }

    // Validation: Check lockDays is integer between 1 and 365
    const parsedLockDays = parseInt(lockDays);
    if (isNaN(parsedLockDays) || parsedLockDays < 1 || parsedLockDays > 365) {
      return NextResponse.json(
        {
          error: 'Lock days must be an integer between 1 and 365',
          code: 'INVALID_LOCK_DAYS',
        },
        { status: 400 }
      );
    }

    // Business logic: Calculate timestamps
    const lockedAt = new Date();
    const unlockAt = new Date(Date.now() + parsedLockDays * 24 * 60 * 60 * 1000);
    const createdAt = new Date();

    // Insert into locked_savings
    const newLockedSaving = await db
      .insert(lockedSavings)
      .values({
        userId,
        amount: parsedAmount,
        lockDays: parsedLockDays,
        lockedAt,
        unlockAt,
        status: 'active',
        createdAt,
      })
      .returning();

    // Create transaction record for the lock action
    await db.insert(transactionsV2).values({
      userId,
      type: 'lock',
      amount: parsedAmount,
      status: 'completed',
      lockDays: parsedLockDays,
      savingsId: newLockedSaving[0].id,
      description: `Locked ${parsedAmount} for ${parsedLockDays} days`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Return created record with 201 status
    return NextResponse.json(newLockedSaving[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/locked-savings error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}