import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, products } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const orderStatus = searchParams.get('orderStatus');

    let query = db.select({
      id: orders.id,
      userId: orders.userId,
      productId: orders.productId,
      amountPaid: orders.amountPaid,
      orderStatus: orders.orderStatus,
      orderedAt: orders.orderedAt,
      deliveredAt: orders.deliveredAt,
      productName: products.name,
      productImageUrl: products.imageUrl,
    })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.orderedAt))
    .limit(limit)
    .offset(offset);

    if (orderStatus) {
      query = db.select({
        id: orders.id,
        userId: orders.userId,
        productId: orders.productId,
        amountPaid: orders.amountPaid,
        orderStatus: orders.orderStatus,
        orderedAt: orders.orderedAt,
        deliveredAt: orders.deliveredAt,
        productName: products.name,
        productImageUrl: products.imageUrl,
      })
      .from(orders)
      .leftJoin(products, eq(orders.productId, products.id))
      .where(
        and(
          eq(orders.userId, session.user.id),
          eq(orders.orderStatus, orderStatus)
        )
      )
      .orderBy(desc(orders.orderedAt))
      .limit(limit)
      .offset(offset);
    }

    const results = await query;

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    const requestBody = await request.json();
    const { productId, amountPaid, orderStatus } = requestBody;

    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ 
        error: "Product ID is required",
        code: "MISSING_PRODUCT_ID" 
      }, { status: 400 });
    }

    if (!amountPaid && amountPaid !== 0) {
      return NextResponse.json({ 
        error: "Amount paid is required",
        code: "MISSING_AMOUNT_PAID" 
      }, { status: 400 });
    }

    if (typeof amountPaid !== 'number' || amountPaid <= 0) {
      return NextResponse.json({ 
        error: "Amount paid must be a positive number",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    const product = await db.select()
      .from(products)
      .where(eq(products.id, parseInt(productId)))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ 
        error: "Product not found",
        code: "PRODUCT_NOT_FOUND" 
      }, { status: 404 });
    }

    if (!product[0].available) {
      return NextResponse.json({ 
        error: "Product is not available for order",
        code: "PRODUCT_NOT_AVAILABLE" 
      }, { status: 400 });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered'];
    const finalOrderStatus = orderStatus && validStatuses.includes(orderStatus) 
      ? orderStatus 
      : 'pending';

    const newOrder = await db.insert(orders).values({
      userId: session.user.id,
      productId: parseInt(productId),
      amountPaid: amountPaid,
      orderStatus: finalOrderStatus,
      orderedAt: new Date(),
      deliveredAt: null,
    }).returning();

    const orderWithProduct = await db.select({
      id: orders.id,
      userId: orders.userId,
      productId: orders.productId,
      amountPaid: orders.amountPaid,
      orderStatus: orders.orderStatus,
      orderedAt: orders.orderedAt,
      deliveredAt: orders.deliveredAt,
      productName: products.name,
      productImageUrl: products.imageUrl,
    })
    .from(orders)
    .leftJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, newOrder[0].id))
    .limit(1);

    return NextResponse.json(orderWithProduct[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}