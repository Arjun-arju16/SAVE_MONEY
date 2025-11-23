import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { phoneVerification } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
    const { phoneNumber } = body;

    // Security check: reject if userId provided in request body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    // Validate phoneNumber is provided
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
      return NextResponse.json(
        {
          error: 'Phone number is required',
          code: 'MISSING_PHONE_NUMBER',
        },
        { status: 400 }
      );
    }

    // Calculate timestamps
    const now = new Date();
    const lastVerifiedAt = now;
    const nextVerificationRequired = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const createdAt = now;
    const updatedAt = now;

    // Check if phone_verification record exists for this user
    const existingRecord = await db
      .select()
      .from(phoneVerification)
      .where(eq(phoneVerification.userId, userId))
      .limit(1);

    if (existingRecord.length > 0) {
      // UPDATE existing record
      const updated = await db
        .update(phoneVerification)
        .set({
          phoneNumber: phoneNumber.trim(),
          isVerified: true,
          lastVerifiedAt,
          nextVerificationRequired,
          updatedAt,
        })
        .where(eq(phoneVerification.userId, userId))
        .returning();

      return NextResponse.json(
        {
          success: true,
          message: 'Phone number linked successfully',
          phoneNumber: updated[0].phoneNumber,
          isVerified: updated[0].isVerified,
          lastVerifiedAt: updated[0].lastVerifiedAt,
          nextVerificationRequired: updated[0].nextVerificationRequired,
        },
        { status: 200 }
      );
    } else {
      // INSERT new record
      const newRecord = await db
        .insert(phoneVerification)
        .values({
          userId,
          phoneNumber: phoneNumber.trim(),
          isVerified: true,
          lastVerifiedAt,
          verificationCount: 0,
          nextVerificationRequired,
          createdAt,
          updatedAt,
        })
        .returning();

      return NextResponse.json(
        {
          success: true,
          message: 'Phone number linked successfully',
          phoneNumber: newRecord[0].phoneNumber,
          isVerified: newRecord[0].isVerified,
          lastVerifiedAt: newRecord[0].lastVerifiedAt,
          nextVerificationRequired: newRecord[0].nextVerificationRequired,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}