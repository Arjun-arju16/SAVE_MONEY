import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { wallet } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Authentication check using better-auth
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Query wallet by userId
    const existingWallet = await db
      .select()
      .from(wallet)
      .where(eq(wallet.userId, userId))
      .limit(1);

    // If wallet doesn't exist, auto-create one with balance=0
    if (existingWallet.length === 0) {
      const currentTimestamp = new Date();
      
      const newWallet = await db
        .insert(wallet)
        .values({
          userId: userId,
          balance: 0,
          createdAt: currentTimestamp,
          updatedAt: currentTimestamp,
        })
        .returning();

      return NextResponse.json(newWallet[0], { status: 200 });
    }

    // Return existing wallet
    return NextResponse.json(existingWallet[0], { status: 200 });
  } catch (error) {
    console.error('GET wallet error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}