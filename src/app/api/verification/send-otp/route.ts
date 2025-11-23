import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { otpCodes } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    // Validate phoneNumber is provided
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Phone number is required',
          code: 'MISSING_PHONE_NUMBER'
        },
        { status: 400 }
      );
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration time to 5 minutes from now
    const currentTime = new Date();
    const expiresAt = new Date(currentTime.getTime() + 5 * 60 * 1000);
    const createdAt = new Date();

    // Insert new OTP record into database
    const newOtp = await db.insert(otpCodes)
      .values({
        phoneNumber: phoneNumber.trim(),
        otpCode,
        expiresAt,
        isUsed: false,
        createdAt
      })
      .returning();

    // Return success response with OTP (for development/testing only)
    // In production, the OTP would be sent via SMS and NOT returned in response
    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully',
        otp: otpCode,
        expiresAt: expiresAt.toISOString(),
        note: 'OTP code is returned for development/testing purposes only. In production, this would be sent via SMS.'
      },
      { status: 201 }
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