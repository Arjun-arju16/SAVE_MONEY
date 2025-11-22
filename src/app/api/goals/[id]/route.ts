import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userGoals, products, goalContributions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const goalId = params.id;

    // Validate ID parameter
    if (!goalId || isNaN(parseInt(goalId))) {
      return NextResponse.json(
        { error: 'Valid goal ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const parsedGoalId = parseInt(goalId);

    // Query goal with product details
    const goalResult = await db
      .select({
        goal: userGoals,
        product: products,
      })
      .from(userGoals)
      .leftJoin(products, eq(userGoals.productId, products.id))
      .where(eq(userGoals.id, parsedGoalId))
      .limit(1);

    // Check if goal exists
    if (goalResult.length === 0) {
      return NextResponse.json(
        { error: 'Goal not found', code: 'GOAL_NOT_FOUND' },
        { status: 404 }
      );
    }

    const { goal, product } = goalResult[0];

    // Authorization check - verify goal belongs to authenticated user
    if (goal.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Query all contributions for this goal
    const contributions = await db
      .select({
        id: goalContributions.id,
        amount: goalContributions.amount,
        contributionDate: goalContributions.contributionDate,
        notes: goalContributions.notes,
      })
      .from(goalContributions)
      .where(eq(goalContributions.goalId, parsedGoalId))
      .orderBy(desc(goalContributions.contributionDate));

    // Calculate progress percentage
    const progressPercentage = goal.targetAmount > 0
      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
      : 0;

    // Build response
    const response = {
      id: goal.id,
      userId: goal.userId,
      productId: goal.productId,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      status: goal.status,
      createdAt: goal.createdAt,
      completedAt: goal.completedAt,
      progressPercentage,
      product: product
        ? {
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
          }
        : null,
      contributions: contributions.map((contrib) => ({
        id: contrib.id,
        amount: contrib.amount,
        contributionDate: contrib.contributionDate,
        notes: contrib.notes,
      })),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('GET goal error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}