import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ordersV2, products } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const VALID_STATUSES = ['pending', 'processing', 'completed', 'cancelled'] as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const statusFilter = searchParams.get('status');

    if (statusFilter && !VALID_STATUSES.includes(statusFilter as any)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    let query = db.select().from(ordersV2)
      .where(eq(ordersV2.userId, session.user.id))
      .orderBy(desc(ordersV2.createdAt));

    if (statusFilter) {
      query = db.select().from(ordersV2)
        .where(and(
          eq(ordersV2.userId, session.user.id),
          eq(ordersV2.status, statusFilter)
        ))
        .orderBy(desc(ordersV2.createdAt));
    }

    const orders = await query.limit(limit).offset(offset);

    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const { productId, productName, productPrice, quantity, shippingAddress } = body;

    if (!productId) {
      return NextResponse.json({ 
        error: "Product ID is required",
        code: "MISSING_PRODUCT_ID" 
      }, { status: 400 });
    }

    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      return NextResponse.json({ 
        error: "Product name is required",
        code: "MISSING_PRODUCT_NAME" 
      }, { status: 400 });
    }

    if (!productPrice || typeof productPrice !== 'number' || productPrice <= 0) {
      return NextResponse.json({ 
        error: "Product price must be a positive number",
        code: "INVALID_PRODUCT_PRICE" 
      }, { status: 400 });
    }

    if (!quantity || typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json({ 
        error: "Quantity must be a positive integer (minimum 1)",
        code: "INVALID_QUANTITY" 
      }, { status: 400 });
    }

    const product = await db.select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND' 
      }, { status: 404 });
    }

    const totalAmount = productPrice * quantity;
    const now = new Date();

    const newOrder = await db.insert(ordersV2).values({
      userId: session.user.id,
      productId,
      productName: productName.trim(),
      productPrice,
      quantity,
      totalAmount,
      status: 'pending',
      shippingAddress: shippingAddress ? shippingAddress.trim() : null,
      createdAt: now,
      updatedAt: now
    }).returning();

    return NextResponse.json(newOrder[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}