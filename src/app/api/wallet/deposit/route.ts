import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { wallet, walletTransactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { amount, description } = body;

    // Validate amount
    if (amount === undefined || amount === null) {
      return NextResponse.json({ 
        error: "Amount is required",
        code: "MISSING_AMOUNT" 
      }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ 
        error: "Amount must be a positive number greater than 0",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    // Check if wallet exists for user
    const existingWallet = await db.select()
      .from(wallet)
      .where(eq(wallet.userId, userId))
      .limit(1);

    let userWallet;
    const currentTimestamp = new Date();

    if (existingWallet.length === 0) {
      // Create new wallet with balance 0
      const newWallet = await db.insert(wallet)
        .values({
          userId,
          balance: 0,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp
        })
        .returning();
      
      userWallet = newWallet[0];
    } else {
      userWallet = existingWallet[0];
    }

    // Calculate new balance
    const newBalance = userWallet.balance + amount;

    // Update wallet balance and updatedAt
    const updatedWallet = await db.update(wallet)
      .set({
        balance: newBalance,
        updatedAt: currentTimestamp
      })
      .where(eq(wallet.userId, userId))
      .returning();

    // Create wallet transaction record
    const transaction = await db.insert(walletTransactions)
      .values({
        userId,
        amount,
        type: 'deposit',
        referenceId: null,
        description: description || null,
        createdAt: currentTimestamp
      })
      .returning();

    // Return updated balance and transaction details
    return NextResponse.json({
      balance: updatedWallet[0].balance,
      transaction: {
        id: transaction[0].id,
        amount: transaction[0].amount,
        type: transaction[0].type,
        description: transaction[0].description,
        createdAt: transaction[0].createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}