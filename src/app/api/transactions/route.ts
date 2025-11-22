import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
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
    const typeFilter = searchParams.get('type');
    const statusFilter = searchParams.get('status');

    // Build query with user scope
    let whereConditions = [eq(transactions.userId, session.user.id)];

    // Add type filter if provided
    if (typeFilter) {
      const validTypes = ['deposit', 'withdrawal', 'reward'];
      if (!validTypes.includes(typeFilter)) {
        return NextResponse.json({ 
          error: 'Invalid type filter. Must be one of: deposit, withdrawal, reward',
          code: 'INVALID_TYPE_FILTER' 
        }, { status: 400 });
      }
      whereConditions.push(eq(transactions.type, typeFilter));
    }

    // Add status filter if provided
    if (statusFilter) {
      const validStatuses = ['pending', 'completed', 'failed'];
      if (!validStatuses.includes(statusFilter)) {
        return NextResponse.json({ 
          error: 'Invalid status filter. Must be one of: pending, completed, failed',
          code: 'INVALID_STATUS_FILTER' 
        }, { status: 400 });
      }
      whereConditions.push(eq(transactions.status, statusFilter));
    }

    const results = await db.select()
      .from(transactions)
      .where(and(...whereConditions))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

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
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { amount, type, status, description } = body;

    // Validate required fields
    if (amount === undefined || amount === null) {
      return NextResponse.json({ 
        error: "Amount is required",
        code: "MISSING_AMOUNT" 
      }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ 
        error: "Type is required",
        code: "MISSING_TYPE" 
      }, { status: 400 });
    }

    // Validate amount is a positive number
    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ 
        error: "Amount must be a positive number",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    // Validate type
    const validTypes = ['deposit', 'withdrawal', 'reward'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        code: "INVALID_TYPE" 
      }, { status: 400 });
    }

    // Validate status if provided
    const transactionStatus = status || 'pending';
    const validStatuses = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(transactionStatus)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Create transaction with user ID from session
    const newTransaction = await db.insert(transactions)
      .values({
        userId: session.user.id,
        amount: parsedAmount,
        type: type.trim(),
        status: transactionStatus,
        description: description ? description.trim() : null,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newTransaction[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}