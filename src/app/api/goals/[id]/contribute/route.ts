import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userGoals, wallet, goalContributions, walletTransactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Validate goal ID parameter
    const goalId = params.id;
    if (!goalId || isNaN(parseInt(goalId))) {
      return NextResponse.json(
        { error: 'Valid goal ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { amount, notes } = body;

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

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          error: 'Amount must be a positive number greater than 0',
          code: 'INVALID_AMOUNT',
        },
        { status: 400 }
      );
    }

    // Query goal and verify it exists
    const goalResult = await db
      .select()
      .from(userGoals)
      .where(eq(userGoals.id, parseInt(goalId)))
      .limit(1);

    if (goalResult.length === 0) {
      return NextResponse.json(
        { error: 'Goal not found', code: 'GOAL_NOT_FOUND' },
        { status: 404 }
      );
    }

    const goal = goalResult[0];

    // Verify goal belongs to authenticated user (authorization)
    if (goal.userId !== userId) {
      return NextResponse.json(
        {
          error: 'You do not have permission to contribute to this goal',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Verify goal status is 'active'
    if (goal.status !== 'active') {
      return NextResponse.json(
        {
          error: 'Cannot contribute to a goal that is not active',
          code: 'GOAL_NOT_ACTIVE',
        },
        { status: 400 }
      );
    }

    // Query user's wallet
    let userWalletResult = await db
      .select()
      .from(wallet)
      .where(eq(wallet.userId, userId))
      .limit(1);

    let userWallet;

    // Auto-create wallet if it doesn't exist
    if (userWalletResult.length === 0) {
      const newWallet = await db
        .insert(wallet)
        .values({
          userId,
          balance: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      userWallet = newWallet[0];
    } else {
      userWallet = userWalletResult[0];
    }

    // Validate wallet has sufficient balance
    if (userWallet.balance < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient wallet balance',
          code: 'INSUFFICIENT_BALANCE',
          available: userWallet.balance,
          required: amount,
        },
        { status: 400 }
      );
    }

    // Execute transaction atomically
    const result = await db.transaction(async (tx) => {
      // Deduct amount from wallet balance
      const updatedWalletResult = await tx
        .update(wallet)
        .set({
          balance: userWallet.balance - amount,
          updatedAt: new Date(),
        })
        .where(eq(wallet.userId, userId))
        .returning();

      const updatedWallet = updatedWalletResult[0];

      // Calculate new current amount
      const newCurrentAmount = goal.currentAmount + amount;

      // Check if goal is completed after contribution
      const goalCompleted = newCurrentAmount >= goal.targetAmount;
      const goalStatus = goalCompleted ? 'completed' : 'active';
      const completedAt = goalCompleted ? new Date() : null;

      // Update goal's current_amount and status
      const updatedGoalResult = await tx
        .update(userGoals)
        .set({
          currentAmount: newCurrentAmount,
          status: goalStatus,
          completedAt: completedAt,
        })
        .where(eq(userGoals.id, parseInt(goalId)))
        .returning();

      const updatedGoal = updatedGoalResult[0];

      // Create goal_contribution record
      const contributionResult = await tx
        .insert(goalContributions)
        .values({
          goalId: parseInt(goalId),
          userId,
          amount,
          contributionDate: new Date(),
          notes: notes || null,
        })
        .returning();

      const contribution = contributionResult[0];

      // Create wallet_transaction record
      await tx.insert(walletTransactions).values({
        userId,
        amount: -amount,
        type: 'goal_allocation',
        referenceId: contribution.id,
        description: `Contribution to goal #${goalId}${notes ? `: ${notes}` : ''}`,
        createdAt: new Date(),
      });

      return {
        goal: updatedGoal,
        contribution,
        wallet: updatedWallet,
        goalCompleted,
      };
    });

    // Return success response
    return NextResponse.json(
      {
        goal: {
          id: result.goal.id,
          currentAmount: result.goal.currentAmount,
          targetAmount: result.goal.targetAmount,
          status: result.goal.status,
          completedAt: result.goal.completedAt,
        },
        contribution: {
          id: result.contribution.id,
          amount: result.contribution.amount,
          contributionDate: result.contribution.contributionDate,
          notes: result.contribution.notes,
        },
        wallet: {
          balance: result.wallet.balance,
        },
        goalCompleted: result.goalCompleted,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST goal contribution error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}