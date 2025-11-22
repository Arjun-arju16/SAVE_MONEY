import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rewards } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const VALID_REWARD_TYPES = ['badge', 'achievement', 'product'] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const rewardType = searchParams.get('rewardType');

    let query = db
      .select()
      .from(rewards)
      .where(eq(rewards.userId, session.user.id))
      .orderBy(desc(rewards.earnedAt));

    if (rewardType) {
      if (!VALID_REWARD_TYPES.includes(rewardType as any)) {
        return NextResponse.json(
          {
            error: `Invalid rewardType. Must be one of: ${VALID_REWARD_TYPES.join(', ')}`,
            code: 'INVALID_REWARD_TYPE',
          },
          { status: 400 }
        );
      }

      query = db
        .select()
        .from(rewards)
        .where(
          and(
            eq(rewards.userId, session.user.id),
            eq(rewards.rewardType, rewardType)
          )
        )
        .orderBy(desc(rewards.earnedAt));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    const { rewardType, rewardName, rewardDescription } = body;

    if (!rewardType) {
      return NextResponse.json(
        {
          error: 'rewardType is required',
          code: 'MISSING_REWARD_TYPE',
        },
        { status: 400 }
      );
    }

    if (!VALID_REWARD_TYPES.includes(rewardType)) {
      return NextResponse.json(
        {
          error: `Invalid rewardType. Must be one of: ${VALID_REWARD_TYPES.join(', ')}`,
          code: 'INVALID_REWARD_TYPE',
        },
        { status: 400 }
      );
    }

    if (!rewardName) {
      return NextResponse.json(
        {
          error: 'rewardName is required',
          code: 'MISSING_REWARD_NAME',
        },
        { status: 400 }
      );
    }

    if (typeof rewardName !== 'string' || rewardName.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'rewardName must be a non-empty string',
          code: 'INVALID_REWARD_NAME',
        },
        { status: 400 }
      );
    }

    const newReward = await db
      .insert(rewards)
      .values({
        userId: session.user.id,
        rewardType: rewardType.trim(),
        rewardName: rewardName.trim(),
        rewardDescription: rewardDescription
          ? rewardDescription.trim()
          : null,
        earnedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newReward[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}