import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ordersV2 } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate ID
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Query order
    const order = await db
      .select()
      .from(ordersV2)
      .where(eq(ordersV2.id, parseInt(id)))
      .limit(1);

    // Check if order exists
    if (order.length === 0) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization check - verify order belongs to user
    if (order[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this order', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    return NextResponse.json(order[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate ID
    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    // Query order to verify existence and ownership
    const existingOrder = await db
      .select()
      .from(ordersV2)
      .where(eq(ordersV2.id, parseInt(id)))
      .limit(1);

    // Check if order exists
    if (existingOrder.length === 0) {
      return NextResponse.json(
        { error: 'Order not found', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization check - verify order belongs to user
    if (existingOrder[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this order', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Extract allowed fields
    const { status, trackingNumber } = body;

    // Validate status if provided
    const allowedStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Build update object
    const updates: {
      status?: string;
      trackingNumber?: string;
      completedAt?: Date | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (status !== undefined) {
      updates.status = status;
      // Set completedAt if status changed to 'completed'
      if (status === 'completed') {
        updates.completedAt = new Date();
      }
    }

    if (trackingNumber !== undefined) {
      updates.trackingNumber = trackingNumber;
    }

    // Update order
    const updatedOrder = await db
      .update(ordersV2)
      .set(updates)
      .where(eq(ordersV2.id, parseInt(id)))
      .returning();

    if (updatedOrder.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update order', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedOrder[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}