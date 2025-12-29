import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Create categories
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { slug: 'jewelry' },
            update: {},
            create: {
                name: 'Jewelry',
                slug: 'jewelry',
                description: 'Beautiful handcrafted jewelry including earrings, necklaces, bracelets, and rings',
                image: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg'
            }
        }),
        prisma.category.upsert({
            where: { slug: 'bags' },
            update: {},
            create: {
                name: 'Bags',
                slug: 'bags',
                description: 'Stylish handbags, crossbody bags, and wallets for every occasion',
                image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg'
            }
        }),
        prisma.category.upsert({
            where: { slug: 'phone-covers' },
            update: {},
            create: {
                name: 'Phone Covers',
                slug: 'phone-covers',
                description: 'Protective and stylish phone cases for all major brands',
                image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg'
            }
        }),
        prisma.category.upsert({
            where: { slug: 'accessories' },
            update: {},
            create: {
                name: 'Accessories',
                slug: 'accessories',
                description: 'Fashion accessories including scarves, sunglasses, and watches',
                image: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg'
            }
        })
    ])

    console.log('✅ Categories created')

    // Create products
    const products = [
        {
            name: 'Pearl & Gold Earrings',
            slug: 'pearl-gold-earrings',
            description: 'Elegant pearl earrings with gold accents. Perfect for special occasions and everyday wear.',
            price: 3500,
            categorySlug: 'jewelry',
            stock: 25,
            images: [
                { url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Pearl earrings', position: 0 }
            ]
        },
        {
            name: 'Leather Crossbody Bag',
            slug: 'leather-crossbody-bag',
            description: 'Premium leather crossbody bag with adjustable strap. Spacious interior with multiple compartments.',
            price: 8900,
            categorySlug: 'bags',
            stock: 15,
            images: [
                { url: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg', alt: 'Leather bag', position: 0 }
            ]
        },
        {
            name: 'Crystal Bracelet Set',
            slug: 'crystal-bracelet-set',
            description: 'Set of 3 crystal bracelets in rose gold, silver, and gold tones.',
            price: 2800,
            categorySlug: 'jewelry',
            stock: 30,
            images: [
                { url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Crystal bracelet', position: 0 }
            ]
        },
        {
            name: 'Silk Phone Cover',
            slug: 'silk-phone-cover',
            description: 'Luxurious silk-textured phone cover with shock absorption. Available for iPhone and Samsung.',
            price: 1200,
            categorySlug: 'phone-covers',
            stock: 50,
            images: [
                { url: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg', alt: 'Phone cover', position: 0 }
            ]
        },
        {
            name: 'Gold Chain Necklace',
            slug: 'gold-chain-necklace',
            description: 'Delicate gold chain necklace with adjustable length. Hypoallergenic and tarnish-resistant.',
            price: 6200,
            categorySlug: 'jewelry',
            stock: 20,
            images: [
                { url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Gold necklace', position: 0 }
            ]
        },
        {
            name: 'Designer Wallet',
            slug: 'designer-wallet',
            description: 'Compact designer wallet with RFID protection. Multiple card slots and coin compartment.',
            price: 4500,
            categorySlug: 'accessories',
            stock: 35,
            images: [
                { url: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg', alt: 'Wallet', position: 0 }
            ]
        },
        {
            name: 'Bamboo Phone Case',
            slug: 'bamboo-phone-case',
            description: 'Eco-friendly bamboo phone case. Natural wood grain pattern, each piece is unique.',
            price: 1800,
            categorySlug: 'phone-covers',
            stock: 40,
            images: [
                { url: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg', alt: 'Bamboo phone case', position: 0 }
            ]
        },
        {
            name: 'Silk Scarf',
            slug: 'silk-scarf',
            description: '100% pure silk scarf with hand-rolled edges. Multiple color options available.',
            price: 3200,
            categorySlug: 'accessories',
            stock: 28,
            images: [
                { url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Silk scarf', position: 0 }
            ]
        },
        {
            name: 'Diamond Ring',
            slug: 'diamond-ring',
            description: 'Stunning diamond ring with 18k gold band. Certified diamond with excellent cut.',
            price: 15000,
            categorySlug: 'jewelry',
            stock: 5,
            images: [
                { url: 'https://images.pexels.com/photos/1454428/pexels-photo-1454428.jpeg', alt: 'Diamond ring', position: 0 }
            ]
        },
        {
            name: 'Leather Handbag',
            slug: 'leather-handbag',
            description: 'Spacious leather handbag with gold hardware. Perfect for work or weekend outings.',
            price: 12000,
            categorySlug: 'bags',
            stock: 12,
            images: [
                { url: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg', alt: 'Leather handbag', position: 0 }
            ]
        }
    ]

    for (const product of products) {
        const category = categories.find(c => c.slug === product.categorySlug)
        if (!category) continue

        await prisma.product.upsert({
            where: { slug: product.slug },
            update: {},
            create: {
                name: product.name,
                slug: product.slug,
                description: product.description,
                price: product.price,
                currency: 'LKR',
                categoryId: category.id,
                status: 'active',
                stock: product.stock,
                images: {
                    create: product.images
                }
            }
        })
    }

    console.log('✅ Products created')

    // Create admin user
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@webmall.lk' },
        update: {},
        create: {
            supabaseId: 'admin-mock-id',
            email: 'admin@webmall.lk',
            name: 'Admin User',
            role: 'admin'
        }
    })

    console.log('✅ Admin user created')

    console.log('🎉 Database seeded successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
