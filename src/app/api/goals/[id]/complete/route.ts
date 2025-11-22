import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userGoals } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid goal ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const goalId = parseInt(id);

    // Query goal by ID
    const goal = await db
      .select()
      .from(userGoals)
      .where(eq(userGoals.id, goalId))
      .limit(1);

    // Verify goal exists
    if (goal.length === 0) {
      return NextResponse.json(
        { error: 'Goal not found', code: 'GOAL_NOT_FOUND' },
        { status: 404 }
      );
    }

    const goalRecord = goal[0];

    // Verify goal belongs to authenticated user (authorization)
    if (goalRecord.userId !== userId) {
      return NextResponse.json(
        {
          error: 'You do not have permission to complete this goal',
          code: 'UNAUTHORIZED_ACCESS',
        },
        { status: 403 }
      );
    }

    // Verify goal status is 'active'
    if (goalRecord.status !== 'active') {
      return NextResponse.json(
        {
          error: `Cannot complete goal with status '${goalRecord.status}'. Only active goals can be completed.`,
          code: 'INVALID_GOAL_STATUS',
        },
        { status: 400 }
      );
    }

    // Verify current_amount >= target_amount (goal must be fully funded)
    if (goalRecord.currentAmount < goalRecord.targetAmount) {
      return NextResponse.json(
        {
          error: 'Goal is not fully funded. Current amount must reach or exceed target amount.',
          code: 'GOAL_NOT_FULLY_FUNDED',
          currentAmount: goalRecord.currentAmount,
          targetAmount: goalRecord.targetAmount,
          remaining: goalRecord.targetAmount - goalRecord.currentAmount,
        },
        { status: 400 }
      );
    }

    // Update goal status to 'completed' and set completed_at
    const updatedGoal = await db
      .update(userGoals)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(and(eq(userGoals.id, goalId), eq(userGoals.userId, userId)))
      .returning();

    if (updatedGoal.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update goal', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    const completed = updatedGoal[0];

    // Return updated goal details
    return NextResponse.json(
      {
        id: completed.id,
        userId: completed.userId,
        productId: completed.productId,
        targetAmount: completed.targetAmount,
        currentAmount: completed.currentAmount,
        status: completed.status,
        createdAt: completed.createdAt,
        completedAt: completed.completedAt,
        message: 'Goal marked as completed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/goals/[id]/complete error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}