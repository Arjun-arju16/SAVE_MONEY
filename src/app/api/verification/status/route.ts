import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { phoneVerification } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
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

    // Query phone_verification table for the authenticated user
    const verificationRecord = await db
      .select()
      .from(phoneVerification)
      .where(eq(phoneVerification.userId, userId))
      .limit(1);

    // No record exists - user has never set up phone verification
    if (verificationRecord.length === 0) {
      return NextResponse.json({
        isVerified: false,
        phoneNumber: null,
        needsVerification: true,
        verificationCount: 0
      }, { status: 200 });
    }

    const record = verificationRecord[0];
    const currentTime = new Date();

    // Calculate if verification is needed
    let needsVerification = false;

    // Case 1: Never verified
    if (!record.isVerified) {
      needsVerification = true;
    }
    // Case 2: Re-verification time has passed
    else if (record.nextVerificationRequired && currentTime >= new Date(record.nextVerificationRequired)) {
      needsVerification = true;
    }
    // Case 3: Verified and still within valid period
    else {
      needsVerification = false;
    }

    // Return full verification status
    return NextResponse.json({
      isVerified: record.isVerified,
      phoneNumber: record.phoneNumber,
      needsVerification,
      verificationCount: record.verificationCount,
      lastVerifiedAt: record.lastVerifiedAt,
      nextVerificationRequired: record.nextVerificationRequired
    }, { status: 200 });

  } catch (error) {
    console.error('GET phone verification status error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}