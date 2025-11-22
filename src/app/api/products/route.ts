import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, and, like, gte, lte, asc, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse pagination parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    
    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;
    const offset = offsetParam ? parseInt(offsetParam) : 0;
    
    // Validate pagination parameters
    if (limitParam && isNaN(limit)) {
      return NextResponse.json({ 
        error: "Invalid limit parameter",
        code: "INVALID_LIMIT" 
      }, { status: 400 });
    }
    
    if (offsetParam && isNaN(offset)) {
      return NextResponse.json({ 
        error: "Invalid offset parameter",
        code: "INVALID_OFFSET" 
      }, { status: 400 });
    }
    
    // Parse filter parameters
    const category = searchParams.get('category');
    const availableParam = searchParams.get('available');
    const search = searchParams.get('search');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    
    // Validate available parameter if provided
    let available: boolean | null = null;
    if (availableParam !== null) {
      if (availableParam === 'true') {
        available = true;
      } else if (availableParam === 'false') {
        available = false;
      } else {
        return NextResponse.json({ 
          error: "Invalid available parameter. Must be 'true' or 'false'",
          code: "INVALID_AVAILABLE" 
        }, { status: 400 });
      }
    }
    
    // Validate and parse price parameters
    let minPrice: number | null = null;
    let maxPrice: number | null = null;
    
    if (minPriceParam !== null) {
      minPrice = parseFloat(minPriceParam);
      if (isNaN(minPrice) || minPrice < 0) {
        return NextResponse.json({ 
          error: "Invalid minPrice parameter. Must be a non-negative number",
          code: "INVALID_MIN_PRICE" 
        }, { status: 400 });
      }
    }
    
    if (maxPriceParam !== null) {
      maxPrice = parseFloat(maxPriceParam);
      if (isNaN(maxPrice) || maxPrice < 0) {
        return NextResponse.json({ 
          error: "Invalid maxPrice parameter. Must be a non-negative number",
          code: "INVALID_MAX_PRICE" 
        }, { status: 400 });
      }
    }
    
    // Validate price range
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return NextResponse.json({ 
        error: "minPrice cannot be greater than maxPrice",
        code: "INVALID_PRICE_RANGE" 
      }, { status: 400 });
    }
    
    // Build where conditions
    const conditions = [];
    
    // Default: show only available products unless explicitly filtered
    if (available === true || availableParam === null) {
      conditions.push(eq(products.available, true));
    } else if (available === false) {
      conditions.push(eq(products.available, false));
    }
    
    // Category filter
    if (category) {
      conditions.push(eq(products.category, category));
    }
    
    // Search filter (case-insensitive LIKE)
    if (search) {
      conditions.push(like(products.name, `%${search}%`));
    }
    
    // Price range filters
    if (minPrice !== null) {
      conditions.push(gte(products.price, minPrice));
    }
    
    if (maxPrice !== null) {
      conditions.push(lte(products.price, maxPrice));
    }
    
    // Build and execute query
    let query = db.select().from(products);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query
      .orderBy(asc(products.id))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json(results, { status: 200 });
    
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}