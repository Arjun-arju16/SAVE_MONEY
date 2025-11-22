import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lockedSavings, transactionsV2, wallet, walletTransactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { savingsId } = body;

    // Validate savingsId
    if (!savingsId) {
      return NextResponse.json(
        { error: 'Savings ID is required', code: 'MISSING_SAVINGS_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(savingsId))) {
      return NextResponse.json(
        { error: 'Valid savings ID is required', code: 'INVALID_SAVINGS_ID' },
        { status: 400 }
      );
    }

    const savingsIdInt = parseInt(savingsId);

    // Query the locked_savings record
    const savingsRecord = await db
      .select()
      .from(lockedSavings)
      .where(eq(lockedSavings.id, savingsIdInt))
      .limit(1);

    // Check if record exists
    if (savingsRecord.length === 0) {
      return NextResponse.json(
        { error: 'Savings record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const savings = savingsRecord[0];

    // Authorization check - verify userId matches
    if (savings.userId !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to withdraw this savings record', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check if already withdrawn
    if (savings.status === 'withdrawn' || savings.status === 'early_withdrawal') {
      return NextResponse.json(
        { error: 'This savings has already been withdrawn', code: 'ALREADY_WITHDRAWN' },
        { status: 400 }
      );
    }

    // Verify status is active
    if (savings.status !== 'active') {
      return NextResponse.json(
        { error: 'Savings record is not active', code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Business logic - withdrawal calculation
    const now = new Date();
    const unlockAt = new Date(savings.unlockAt);
    const isEarlyWithdrawal = now < unlockAt;

    let finalAmount: number;
    let penalty: number;
    let newStatus: string;
    let message: string;
    let transactionType: 'withdrawal' | 'early_withdrawal';

    if (isEarlyWithdrawal) {
      // Early withdrawal with 10% penalty
      penalty = savings.amount * 0.10;
      finalAmount = savings.amount - penalty;
      newStatus = 'early_withdrawal';
      transactionType = 'early_withdrawal';
      message = `Early withdrawal processed with 10% penalty. You received ₹${finalAmount.toFixed(2)} to your wallet from your original ₹${savings.amount.toFixed(2)}.`;
    } else {
      // Normal withdrawal (unlocked)
      penalty = 0;
      finalAmount = savings.amount;
      newStatus = 'withdrawn';
      transactionType = 'withdrawal';
      message = `Withdrawal processed successfully. You received ₹${finalAmount.toFixed(2)} to your wallet.`;
    }

    // Execute all operations in a transaction
    const result = await db.transaction(async (tx) => {
      // Update the savings record with new status
      const updated = await tx
        .update(lockedSavings)
        .set({
          status: newStatus,
        })
        .where(
          and(
            eq(lockedSavings.id, savingsIdInt),
            eq(lockedSavings.userId, userId)
          )
        )
        .returning();

      if (updated.length === 0) {
        throw new Error('Failed to update savings record');
      }

      // Create transaction record for the withdrawal
      await tx.insert(transactionsV2).values({
        userId,
        type: transactionType,
        amount: finalAmount,
        penalty: penalty > 0 ? penalty : null,
        status: 'completed',
        savingsId: savingsIdInt,
        description: isEarlyWithdrawal 
          ? `Early withdrawal with 10% penalty (₹${penalty.toFixed(2)})`
          : `Withdrawal of unlocked savings`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Get or create wallet
      let userWallet = await tx
        .select()
        .from(wallet)
        .where(eq(wallet.userId, userId))
        .limit(1);

      if (userWallet.length === 0) {
        // Create wallet if doesn't exist
        const newWallet = await tx
          .insert(wallet)
          .values({
            userId,
            balance: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        userWallet = newWallet;
      }

      // Update wallet balance - add withdrawn amount
      const newBalance = userWallet[0].balance + finalAmount;
      await tx
        .update(wallet)
        .set({
          balance: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(wallet.userId, userId));

      // Create wallet transaction record
      await tx.insert(walletTransactions).values({
        userId,
        amount: finalAmount,
        type: 'deposit',
        referenceId: savingsIdInt,
        description: isEarlyWithdrawal
          ? `Deposit from early withdrawal (penalty: ₹${penalty.toFixed(2)})`
          : `Deposit from unlocked savings withdrawal`,
        createdAt: new Date(),
      });

      return { updated: updated[0], newBalance };
    });

    // Return withdrawal details
    return NextResponse.json(
      {
        savingsId: savingsIdInt,
        originalAmount: savings.amount,
        withdrawnAmount: finalAmount,
        penalty: penalty,
        isEarlyWithdrawal: isEarlyWithdrawal,
        status: newStatus,
        walletBalance: result.newBalance,
        message: message
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST withdrawal error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}