import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { walletTransactions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const VALID_TRANSACTION_TYPES = ['deposit', 'withdrawal', 'goal_allocation', 'goal_refund'] as const;

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Parse and validate limit parameter
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;
    if (limitParam && isNaN(limit)) {
      return NextResponse.json({ 
        error: 'Invalid limit parameter',
        code: 'INVALID_LIMIT' 
      }, { status: 400 });
    }

    // Parse and validate offset parameter
    const offsetParam = searchParams.get('offset');
    const offset = offsetParam ? parseInt(offsetParam) : 0;
    if (offsetParam && (isNaN(offset) || offset < 0)) {
      return NextResponse.json({ 
        error: 'Invalid offset parameter',
        code: 'INVALID_OFFSET' 
      }, { status: 400 });
    }

    // Parse and validate type parameter
    const typeParam = searchParams.get('type');
    if (typeParam && !VALID_TRANSACTION_TYPES.includes(typeParam as any)) {
      return NextResponse.json({ 
        error: `Invalid type parameter. Must be one of: ${VALID_TRANSACTION_TYPES.join(', ')}`,
        code: 'INVALID_TYPE' 
      }, { status: 400 });
    }

    // Build query with user filter
    let query = db.select().from(walletTransactions);

    // Apply filters
    const conditions = [eq(walletTransactions.userId, userId)];
    
    if (typeParam) {
      conditions.push(eq(walletTransactions.type, typeParam));
    }

    query = query.where(and(...conditions));

    // Apply ordering and pagination
    const transactions = await query
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    // Format response
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount,
      type: transaction.type,
      referenceId: transaction.referenceId,
      description: transaction.description,
      createdAt: transaction.createdAt
    }));

    return NextResponse.json(formattedTransactions, { status: 200 });

  } catch (error) {
    console.error('GET wallet transactions error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}