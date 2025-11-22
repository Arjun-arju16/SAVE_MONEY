import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lockedSavings, userGoals, walletTransactions, rewards, goalContributions, products } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

type ActivityType = 'savings' | 'goal' | 'transaction' | 'reward' | 'contribution';

interface SavingsActivity {
  type: 'savings';
  id: number;
  amount: number;
  lockDays: number;
  lockedAt: Date;
  unlockAt: Date;
  status: string;
  timestamp: Date;
}

interface GoalActivity {
  type: 'goal';
  id: number;
  productName: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  timestamp: Date;
  product: {
    name: string;
    imageUrl: string | null;
  };
}

interface TransactionActivity {
  type: 'transaction';
  id: number;
  amount: number;
  transactionType: string;
  description: string | null;
  timestamp: Date;
}

interface RewardActivity {
  type: 'reward';
  id: number;
  rewardType: string;
  rewardName: string;
  rewardDescription: string | null;
  timestamp: Date;
}

interface ContributionActivity {
  type: 'contribution';
  id: number;
  goalId: number;
  amount: number;
  notes: string | null;
  timestamp: Date;
  goal: {
    productName: string;
  };
}

type Activity = SavingsActivity | GoalActivity | TransactionActivity | RewardActivity | ContributionActivity;

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;

    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const activityTypeParam = searchParams.get('activityType');

    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    if (limitParam && isNaN(limit)) {
      return NextResponse.json({ 
        error: 'Invalid limit parameter',
        code: 'INVALID_LIMIT' 
      }, { status: 400 });
    }

    if (offsetParam && isNaN(offset)) {
      return NextResponse.json({ 
        error: 'Invalid offset parameter',
        code: 'INVALID_OFFSET' 
      }, { status: 400 });
    }

    if (activityTypeParam) {
      const validTypes: ActivityType[] = ['savings', 'goal', 'transaction', 'reward', 'contribution'];
      if (!validTypes.includes(activityTypeParam as ActivityType)) {
        return NextResponse.json({ 
          error: 'Invalid activityType. Must be one of: savings, goal, transaction, reward, contribution',
          code: 'INVALID_ACTIVITY_TYPE' 
        }, { status: 400 });
      }
    }

    const activities: Activity[] = [];

    if (!activityTypeParam || activityTypeParam === 'savings') {
      const savingsRecords = await db.select()
        .from(lockedSavings)
        .where(eq(lockedSavings.userId, userId));

      const savingsActivities: SavingsActivity[] = savingsRecords.map(record => ({
        type: 'savings' as const,
        id: record.id,
        amount: record.amount,
        lockDays: record.lockDays,
        lockedAt: record.lockedAt,
        unlockAt: record.unlockAt,
        status: record.status,
        timestamp: record.createdAt
      }));

      activities.push(...savingsActivities);
    }

    if (!activityTypeParam || activityTypeParam === 'goal') {
      const goalsRecords = await db.select({
        id: userGoals.id,
        targetAmount: userGoals.targetAmount,
        currentAmount: userGoals.currentAmount,
        status: userGoals.status,
        createdAt: userGoals.createdAt,
        productName: products.name,
        productImageUrl: products.imageUrl
      })
        .from(userGoals)
        .leftJoin(products, eq(userGoals.productId, products.id))
        .where(eq(userGoals.userId, userId));

      const goalActivities: GoalActivity[] = goalsRecords.map(record => ({
        type: 'goal' as const,
        id: record.id,
        productName: record.productName || 'Unknown Product',
        targetAmount: record.targetAmount,
        currentAmount: record.currentAmount,
        status: record.status,
        timestamp: record.createdAt,
        product: {
          name: record.productName || 'Unknown Product',
          imageUrl: record.productImageUrl
        }
      }));

      activities.push(...goalActivities);
    }

    if (!activityTypeParam || activityTypeParam === 'transaction') {
      const transactionRecords = await db.select()
        .from(walletTransactions)
        .where(eq(walletTransactions.userId, userId));

      const transactionActivities: TransactionActivity[] = transactionRecords.map(record => ({
        type: 'transaction' as const,
        id: record.id,
        amount: record.amount,
        transactionType: record.type,
        description: record.description,
        timestamp: record.createdAt
      }));

      activities.push(...transactionActivities);
    }

    if (!activityTypeParam || activityTypeParam === 'reward') {
      const rewardRecords = await db.select()
        .from(rewards)
        .where(eq(rewards.userId, userId));

      const rewardActivities: RewardActivity[] = rewardRecords.map(record => ({
        type: 'reward' as const,
        id: record.id,
        rewardType: record.rewardType,
        rewardName: record.rewardName,
        rewardDescription: record.rewardDescription,
        timestamp: record.earnedAt
      }));

      activities.push(...rewardActivities);
    }

    if (!activityTypeParam || activityTypeParam === 'contribution') {
      const contributionRecords = await db.select({
        id: goalContributions.id,
        goalId: goalContributions.goalId,
        amount: goalContributions.amount,
        notes: goalContributions.notes,
        contributionDate: goalContributions.contributionDate,
        productName: products.name
      })
        .from(goalContributions)
        .leftJoin(userGoals, eq(goalContributions.goalId, userGoals.id))
        .leftJoin(products, eq(userGoals.productId, products.id))
        .where(eq(goalContributions.userId, userId));

      const contributionActivities: ContributionActivity[] = contributionRecords.map(record => ({
        type: 'contribution' as const,
        id: record.id,
        goalId: record.goalId,
        amount: record.amount,
        notes: record.notes,
        timestamp: record.contributionDate,
        goal: {
          productName: record.productName || 'Unknown Product'
        }
      }));

      activities.push(...contributionActivities);
    }

    const sortedActivities = activities.sort((a, b) => {
      const timeA = a.timestamp.getTime();
      const timeB = b.timestamp.getTime();
      return timeB - timeA;
    });

    const paginatedActivities = sortedActivities.slice(offset, offset + limit);

    return NextResponse.json(paginatedActivities, { status: 200 });

  } catch (error) {
    console.error('GET activities error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}