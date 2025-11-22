import { db } from '@/db';
import { products } from '@/db/schema';

async function main() {
    const sampleProducts = [
        {
            name: 'iPhone 15 Pro',
            category: 'Electronics',
            price: 99900,
            imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',
            description: 'Latest iPhone with A17 Pro chip, titanium design, and advanced camera system',
            available: true,
        },
        {
            name: 'AirPods Pro (2nd generation)',
            category: 'Electronics',
            price: 24900,
            imageUrl: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500',
            description: 'Active Noise Cancellation, Adaptive Transparency, and personalized Spatial Audio',
            available: true,
        },
        {
            name: 'Nike Air Jordan 1',
            category: 'Footwear',
            price: 17000,
            imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=500',
            description: 'Iconic basketball sneakers with premium leather and classic colorway',
            available: true,
        },
        {
            name: 'MacBook Pro 14"',
            category: 'Electronics',
            price: 199900,
            imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
            description: 'M3 Pro chip, 14-inch Liquid Retina XDR display, up to 18 hours battery life',
            available: true,
        },
        {
            name: 'Sony WH-1000XM5',
            category: 'Electronics',
            price: 39900,
            imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500',
            description: 'Industry-leading noise canceling wireless headphones with premium sound quality',
            available: true,
        },
        {
            name: 'Apple Watch Series 9',
            category: 'Electronics',
            price: 42900,
            imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500',
            description: 'Advanced health and fitness tracking, always-on Retina display, crash detection',
            available: true,
        },
        {
            name: 'iPad Pro 12.9"',
            category: 'Electronics',
            price: 109900,
            imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500',
            description: 'M2 chip, Liquid Retina XDR display, works with Apple Pencil and Magic Keyboard',
            available: true,
        },
        {
            name: 'Samsung 65" QLED 4K TV',
            category: 'Electronics',
            price: 129900,
            imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500',
            description: 'Quantum Dot technology, 4K resolution, smart TV with built-in streaming apps',
            available: true,
        }
    ];

    await db.insert(products).values(sampleProducts);
    
    console.log('✅ Products seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});