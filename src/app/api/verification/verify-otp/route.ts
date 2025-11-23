import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { otpCodes } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otpCode } = body;

    // Validate required fields
    if (!phoneNumber || !otpCode) {
      return NextResponse.json(
        { 
          error: 'Phone number and OTP code are required',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate OTP code format (6 digits)
    if (typeof otpCode !== 'string' || !/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired OTP code',
          code: 'INVALID_OTP'
        },
        { status: 400 }
      );
    }

    // Validate phone number is not empty
    if (typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Phone number and OTP code are required',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    const currentTime = new Date();

    // Query for valid OTP: matching phone and code, not used, not expired
    const validOtps = await db.select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phoneNumber, phoneNumber),
          eq(otpCodes.otpCode, otpCode),
          eq(otpCodes.isUsed, false),
          gt(otpCodes.expiresAt, currentTime)
        )
      )
      .orderBy(otpCodes.createdAt)
      .limit(1);

    // If no valid OTP found, return error
    if (validOtps.length === 0) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired OTP code',
          code: 'INVALID_OTP'
        },
        { status: 400 }
      );
    }

    const validOtp = validOtps[0];

    // Mark OTP as used
    await db.update(otpCodes)
      .set({
        isUsed: true
      })
      .where(eq(otpCodes.id, validOtp.id));

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully',
        verified: true,
        phoneNumber: phoneNumber
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}