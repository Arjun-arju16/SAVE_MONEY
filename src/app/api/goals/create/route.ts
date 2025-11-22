import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userGoals, products } from '@/db/schema';
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
    const { productId, targetAmount } = body;

    // Security check: Reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        {
          error: 'Product ID is required',
          code: 'MISSING_PRODUCT_ID',
        },
        { status: 400 }
      );
    }

    if (!targetAmount) {
      return NextResponse.json(
        {
          error: 'Target amount is required',
          code: 'MISSING_TARGET_AMOUNT',
        },
        { status: 400 }
      );
    }

    // Validate productId is a valid integer
    const parsedProductId = parseInt(productId);
    if (isNaN(parsedProductId)) {
      return NextResponse.json(
        {
          error: 'Product ID must be a valid integer',
          code: 'INVALID_PRODUCT_ID',
        },
        { status: 400 }
      );
    }

    // Validate targetAmount is a positive number
    const parsedTargetAmount = parseInt(targetAmount);
    if (isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) {
      return NextResponse.json(
        {
          error: 'Target amount must be a positive number greater than 0',
          code: 'INVALID_TARGET_AMOUNT',
        },
        { status: 400 }
      );
    }

    // Validate product exists
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, parsedProductId))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json(
        {
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Validate product is available
    if (!product[0].available) {
      return NextResponse.json(
        {
          error: 'Product is not available',
          code: 'PRODUCT_NOT_AVAILABLE',
        },
        { status: 400 }
      );
    }

    // Create new user goal
    const newGoal = await db
      .insert(userGoals)
      .values({
        userId,
        productId: parsedProductId,
        targetAmount: parsedTargetAmount,
        currentAmount: 0,
        status: 'active',
        createdAt: new Date(),
        completedAt: null,
      })
      .returning();

    // Return created goal with product details
    return NextResponse.json(
      {
        id: newGoal[0].id,
        userId: newGoal[0].userId,
        productId: newGoal[0].productId,
        targetAmount: newGoal[0].targetAmount,
        currentAmount: newGoal[0].currentAmount,
        status: newGoal[0].status,
        createdAt: newGoal[0].createdAt,
        completedAt: newGoal[0].completedAt,
        product: {
          name: product[0].name,
          imageUrl: product[0].imageUrl,
          price: product[0].price,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}