import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userGoals, products } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const statusParam = searchParams.get('status');

    // Validate and set limit (default 50, max 100)
    let limit = 50;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { error: 'Invalid limit parameter', code: 'INVALID_LIMIT' },
          { status: 400 }
        );
      }
      limit = Math.min(parsedLimit, 100);
    }

    // Validate and set offset (default 0)
    let offset = 0;
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { error: 'Invalid offset parameter', code: 'INVALID_OFFSET' },
          { status: 400 }
        );
      }
      offset = parsedOffset;
    }

    // Validate status filter
    const validStatuses = ['active', 'completed', 'cancelled'];
    if (statusParam && !validStatuses.includes(statusParam)) {
      return NextResponse.json(
        {
          error: 'Invalid status filter. Must be one of: active, completed, cancelled',
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Build query with joins
    let query = db
      .select({
        id: userGoals.id,
        userId: userGoals.userId,
        productId: userGoals.productId,
        targetAmount: userGoals.targetAmount,
        currentAmount: userGoals.currentAmount,
        status: userGoals.status,
        createdAt: userGoals.createdAt,
        completedAt: userGoals.completedAt,
        productName: products.name,
        productPrice: products.price,
        productImageUrl: products.imageUrl,
        productCategory: products.category,
        productDescription: products.description,
      })
      .from(userGoals)
      .innerJoin(products, eq(userGoals.productId, products.id));

    // Apply filters
    const conditions = [eq(userGoals.userId, userId)];
    
    if (statusParam) {
      conditions.push(eq(userGoals.status, statusParam));
    }

    query = query.where(and(...conditions));

    // Apply ordering and pagination
    const results = await query
      .orderBy(desc(userGoals.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform results to include progress percentage and nested product object
    const transformedResults = results.map((row) => {
      const progressPercentage = row.targetAmount > 0
        ? Math.round((row.currentAmount / row.targetAmount) * 100)
        : 0;

      return {
        id: row.id,
        userId: row.userId,
        productId: row.productId,
        targetAmount: row.targetAmount,
        currentAmount: row.currentAmount,
        status: row.status,
        createdAt: row.createdAt,
        completedAt: row.completedAt,
        progressPercentage,
        product: {
          id: row.productId,
          name: row.productName,
          price: row.productPrice,
          imageUrl: row.productImageUrl,
          category: row.productCategory,
          description: row.productDescription,
        },
      };
    });

    return NextResponse.json(transformedResults, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}