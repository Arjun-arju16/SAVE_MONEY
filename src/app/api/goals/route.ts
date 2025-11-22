import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { goals } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const status = searchParams.get('status');

    let query = db.select()
      .from(goals)
      .where(eq(goals.userId, session.user.id))
      .orderBy(desc(goals.createdAt))
      .limit(limit)
      .offset(offset);

    if (status) {
      query = db.select()
        .from(goals)
        .where(and(
          eq(goals.userId, session.user.id),
          eq(goals.status, status)
        ))
        .orderBy(desc(goals.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const results = await query;
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { productName, productImage, targetAmount, dailyTarget, currentAmount } = body;

    if (!productName || productName.trim() === '') {
      return NextResponse.json({ 
        error: "Product name is required",
        code: "MISSING_PRODUCT_NAME" 
      }, { status: 400 });
    }

    if (targetAmount === undefined || targetAmount === null) {
      return NextResponse.json({ 
        error: "Target amount is required",
        code: "MISSING_TARGET_AMOUNT" 
      }, { status: 400 });
    }

    if (dailyTarget === undefined || dailyTarget === null) {
      return NextResponse.json({ 
        error: "Daily target is required",
        code: "MISSING_DAILY_TARGET" 
      }, { status: 400 });
    }

    const parsedTargetAmount = Number(targetAmount);
    const parsedDailyTarget = Number(dailyTarget);

    if (isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) {
      return NextResponse.json({ 
        error: "Target amount must be a positive number",
        code: "INVALID_TARGET_AMOUNT" 
      }, { status: 400 });
    }

    if (isNaN(parsedDailyTarget) || parsedDailyTarget <= 0) {
      return NextResponse.json({ 
        error: "Daily target must be a positive number",
        code: "INVALID_DAILY_TARGET" 
      }, { status: 400 });
    }

    const newGoal = await db.insert(goals).values({
      userId: session.user.id,
      productName: productName.trim(),
      productImage: productImage?.trim() || null,
      targetAmount: parsedTargetAmount,
      currentAmount: currentAmount !== undefined && currentAmount !== null ? Number(currentAmount) : 0,
      dailyTarget: parsedDailyTarget,
      status: 'active',
      createdAt: new Date(),
      completedAt: null
    }).returning();

    return NextResponse.json(newGoal[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const existingGoal = await db.select()
      .from(goals)
      .where(and(
        eq(goals.id, parseInt(id)),
        eq(goals.userId, session.user.id)
      ))
      .limit(1);

    if (existingGoal.length === 0) {
      const anyGoal = await db.select()
        .from(goals)
        .where(eq(goals.id, parseInt(id)))
        .limit(1);

      if (anyGoal.length === 0) {
        return NextResponse.json({ 
          error: 'Goal not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        error: 'You do not have permission to update this goal',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const { currentAmount, status, completedAt } = body;
    const updates: any = {};

    if (currentAmount !== undefined && currentAmount !== null) {
      const parsedAmount = Number(currentAmount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        return NextResponse.json({ 
          error: "Current amount must be a non-negative number",
          code: "INVALID_CURRENT_AMOUNT" 
        }, { status: 400 });
      }
      updates.currentAmount = parsedAmount;
    }

    if (status !== undefined) {
      const validStatuses = ['active', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          error: "Status must be one of: active, completed, cancelled",
          code: "INVALID_STATUS" 
        }, { status: 400 });
      }
      updates.status = status;

      if (status === 'completed') {
        updates.completedAt = new Date();
      }
    }

    if (completedAt !== undefined) {
      updates.completedAt = completedAt ? new Date(completedAt) : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingGoal[0], { status: 200 });
    }

    const updated = await db.update(goals)
      .set(updates)
      .where(and(
        eq(goals.id, parseInt(id)),
        eq(goals.userId, session.user.id)
      ))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update goal',
        code: 'UPDATE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingGoal = await db.select()
      .from(goals)
      .where(and(
        eq(goals.id, parseInt(id)),
        eq(goals.userId, session.user.id)
      ))
      .limit(1);

    if (existingGoal.length === 0) {
      const anyGoal = await db.select()
        .from(goals)
        .where(eq(goals.id, parseInt(id)))
        .limit(1);

      if (anyGoal.length === 0) {
        return NextResponse.json({ 
          error: 'Goal not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        error: 'You do not have permission to delete this goal',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const deleted = await db.delete(goals)
      .where(and(
        eq(goals.id, parseInt(id)),
        eq(goals.userId, session.user.id)
      ))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete goal',
        code: 'DELETE_FAILED' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Goal deleted successfully',
      deleted: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}