import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { phoneVerification, otpCodes } from '@/db/schema';
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

    // Get user's existing phone verification record
    const phoneRecord = await db
      .select()
      .from(phoneVerification)
      .where(eq(phoneVerification.userId, userId))
      .limit(1);

    if (phoneRecord.length === 0) {
      return NextResponse.json(
        { 
          error: 'No phone number linked to your account', 
          code: 'NO_PHONE_FOUND' 
        },
        { status: 404 }
      );
    }

    const userPhone = phoneRecord[0];
    const phoneNumber = userPhone.phoneNumber;

    // Generate 6-digit OTP code
    const otpCode = (Math.floor(Math.random() * 900000) + 100000).toString();

    // Calculate OTP expiration (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const createdAt = new Date();

    // Insert new OTP into otp_codes table
    await db.insert(otpCodes).values({
      phoneNumber: phoneNumber,
      otpCode: otpCode,
      expiresAt: expiresAt,
      isUsed: false,
      createdAt: createdAt,
    });

    // Update phone verification record: increment verification_count and update updatedAt
    const updatedPhone = await db
      .update(phoneVerification)
      .set({
        verificationCount: userPhone.verificationCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(phoneVerification.userId, userId))
      .returning();

    // Mask phone number for privacy (show only last 4 digits)
    const maskedPhone = phoneNumber.slice(-4).padStart(phoneNumber.length, '*');

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent to your verified phone number',
        phoneNumber: maskedPhone,
        otp: otpCode,
        expiresAt: expiresAt.toISOString(),
        verificationCount: updatedPhone[0].verificationCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}