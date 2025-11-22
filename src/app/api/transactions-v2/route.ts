import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactionsV2 } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const VALID_TYPES = ['lock', 'withdrawal', 'early_withdrawal', 'reward_claim'] as const;
const VALID_STATUSES = ['completed', 'pending', 'failed'] as const;

type TransactionType = typeof VALID_TYPES[number];
type TransactionStatus = typeof VALID_STATUSES[number];

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');

    // Validate type filter if provided
    if (typeParam && !VALID_TYPES.includes(typeParam as TransactionType)) {
      return NextResponse.json({ 
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        code: 'INVALID_TYPE'
      }, { status: 400 });
    }

    // Validate status filter if provided
    if (statusParam && !VALID_STATUSES.includes(statusParam as TransactionStatus)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Build query conditions
    const conditions = [eq(transactionsV2.userId, session.user.id)];
    
    if (typeParam) {
      conditions.push(eq(transactionsV2.type, typeParam));
    }
    
    if (statusParam) {
      conditions.push(eq(transactionsV2.status, statusParam));
    }

    // Execute query with filters, sorting, and pagination
    const transactions = await db.select()
      .from(transactionsV2)
      .where(and(...conditions))
      .orderBy(desc(transactionsV2.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(transactions, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      }, { status: 401 });
    }

    const body = await request.json();

    // Security check: Reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: 'User ID cannot be provided in request body',
        code: 'USER_ID_NOT_ALLOWED'
      }, { status: 400 });
    }

    const { 
      type, 
      amount, 
      penalty, 
      status = 'completed', 
      lockDays, 
      savingsId, 
      orderId, 
      description 
    } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json({ 
        error: 'Type is required',
        code: 'MISSING_TYPE'
      }, { status: 400 });
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json({ 
        error: 'Amount is required',
        code: 'MISSING_AMOUNT'
      }, { status: 400 });
    }

    // Validate type
    if (!VALID_TYPES.includes(type as TransactionType)) {
      return NextResponse.json({ 
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        code: 'INVALID_TYPE'
      }, { status: 400 });
    }

    // Validate status
    if (!VALID_STATUSES.includes(status as TransactionStatus)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Validate amount is positive
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be a positive number',
        code: 'INVALID_AMOUNT'
      }, { status: 400 });
    }

    // Validate penalty if provided
    if (penalty !== undefined && penalty !== null && (typeof penalty !== 'number' || penalty < 0)) {
      return NextResponse.json({ 
        error: 'Penalty must be a non-negative number',
        code: 'INVALID_PENALTY'
      }, { status: 400 });
    }

    // Validate lockDays if provided
    if (lockDays !== undefined && lockDays !== null && (typeof lockDays !== 'number' || lockDays < 0)) {
      return NextResponse.json({ 
        error: 'Lock days must be a non-negative number',
        code: 'INVALID_LOCK_DAYS'
      }, { status: 400 });
    }

    // Validate savingsId if provided
    if (savingsId !== undefined && savingsId !== null && (typeof savingsId !== 'number' || savingsId <= 0)) {
      return NextResponse.json({ 
        error: 'Savings ID must be a positive number',
        code: 'INVALID_SAVINGS_ID'
      }, { status: 400 });
    }

    // Validate orderId if provided
    if (orderId !== undefined && orderId !== null && (typeof orderId !== 'number' || orderId <= 0)) {
      return NextResponse.json({ 
        error: 'Order ID must be a positive number',
        code: 'INVALID_ORDER_ID'
      }, { status: 400 });
    }

    const now = new Date();

    // Create transaction with user ID from session
    const newTransaction = await db.insert(transactionsV2)
      .values({
        userId: session.user.id,
        type,
        amount,
        penalty: penalty ?? null,
        status,
        lockDays: lockDays ?? null,
        savingsId: savingsId ?? null,
        orderId: orderId ?? null,
        description: description ?? null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newTransaction[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}