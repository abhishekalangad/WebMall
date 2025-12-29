# 🛍️ WebMall – Sri Lankan Fashion Accessories E-Commerce

A modern, full-stack e-commerce platform for Sri Lankan fashion accessories, built with Next.js 13, TypeScript, Prisma, and Supabase.

![WebMall](public/hero/img1.png)

## ✨ Features

### Customer Features
- 🏠 **Beautiful Homepage** with hero section and featured products
- 📦 **Product Catalog** with search, filters, and categories
- 🛒 **Shopping Cart** with persistent storage and guest/user sync
- ❤️ **Wishlist** to save favorite products
- 🔐 **Authentication** with Supabase Auth
- 💳 **Checkout** with Cash on Delivery (COD)
- 📱 **Order Tracking** and history
- 📱 **Mobile-First Design** - fully responsive

### Admin Features
- 📊 **Admin Dashboard** for managing the store
- ➕ **Product Management** - Create, edit, delete products
- 📋 **Order Management** - View and update order statuses
- 🏷️ **Category Management** - Organize products
- 🖼️ **Image Management** - Upload product images

### Design & UX
- 🎨 **Fashion-Inspired Design** with elegant UI
- 🌈 **Pastel Color Palette** with gold accents
- ✨ **Smooth Animations** and transitions
- 🎯 **Error Boundaries** for graceful error handling
- 🔄 **Loading States** and skeletons
- ♿ **Accessible** components

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works great!)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/webmall.git
cd webmall
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for your project to be ready (takes ~2 minutes)
3. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key
4. Go to **Settings → Database** and copy:
   - Connection string (URI format)

### 3. Configure Environment Variables

```bash
# Copy the example file
copy .env.local.example .env.local

# Edit .env.local and fill in your Supabase credentials
```

Your `.env.local` should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
JWT_SECRET=your-secure-random-string-min-32-chars
```

### 4. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with sample data (optional)
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the WebMall homepage! 🎉

## 📁 Project Structure

```
webmall/
├── app/                    # Next.js 13 App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── products/     # Product CRUD
│   │   ├── orders/       # Order management
│   │   └── categories/   # Category management
│   ├── admin/            # Admin dashboard pages
│   ├── products/         # Product pages
│   ├── cart/             # Shopping cart
│   ├── checkout/         # Checkout flow
│   └── login/            # Auth pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Auth components
│   ├── layout/           # Header, Footer
│   └── products/         # Product components
├── contexts/             # React Context providers
│   ├── AuthContext.tsx   # Authentication state
│   ├── CartContext.tsx   # Shopping cart state
│   └── WishlistContext.tsx # Wishlist state
├── lib/                  # Utility functions
│   ├── prisma.ts         # Prisma client
│   ├── supabase.ts       # Supabase client
│   └── auth.ts           # Auth helpers
├── prisma/              # Database
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data
└── public/              # Static assets
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 13** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **Framer Motion** - Smooth animations

### Backend
- **Next.js API Routes** - Serverless endpoints
- **Prisma** - Type-safe database ORM
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Storage
- **Zod** - Schema validation

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server

# Database
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Push schema to database
npx prisma db seed   # Seed database with sample data
npx prisma studio    # Open Prisma Studio (database GUI)

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Check TypeScript types
```

## 🔐 Default Credentials

After seeding the database, you can log in with:

**Admin Account:**
- Email: `admin@webmall.lk`
- Password: Set up through Supabase Auth

**Test Customers:**
- Email: `customer@webmall.lk`
- Password: Set up through Supabase Auth

## 🎨 Design System

### Colors
- **Primary**: Pink to Yellow gradient (`from-pink-300 to-yellow-300`)
- **Secondary**: Green to Blue gradient
- **Accent**: Gold (#F7D794)

### Fonts
- **Headings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)

### Components
- Card-based layouts with rounded corners
- Subtle shadows and hover effects
- Smooth transitions (300ms)

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard
4. Deploy! 🚀

### Environment Variables for Production

Make sure to add all variables from `.env.local` to your Vercel project settings.

## 📊 Database Schema

### Main Models
- **User** - Customer and admin accounts
- **Product** - Product catalog
- **Category** - Product categories
- **Order** - Customer orders
- **Cart** - Shopping carts
- **ProductImage** - Product images
- **ProductVariant** - Product variations

See `prisma/schema.prisma` for full schema.

## 🔧 Configuration

### Image Optimization

Images are optimized by Next.js. To configure allowed domains:

```javascript
// next.config.js
images: {
  domains: ['images.pexels.com', 'your-domain.com'],
}
```

### Payment Integration

Currently supports Cash on Delivery (COD). To add payment gateways:

1. Install payment SDK (Stripe, PayHere, etc.)
2. Add payment routes in `app/api/payments/`
3. Update checkout flow in `app/checkout/page.tsx`

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if DATABASE_URL is correct
npx prisma db pull

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Supabase Auth Issues

1. Check if environment variables are set correctly
2. Verify Supabase project is active
3. Check Supabase Auth settings in dashboard

## 📈 Future Enhancements

- [ ] Payment gateway integration (PayHere, Stripe)
- [ ] Product reviews and ratings
- [ ] Advanced search with filters
- [ ] Inventory management
- [ ] Email notifications
- [ ] Multi-language support (Sinhala, Tamil)
- [ ] Wishlist sharing
- [ ] Product recommendations
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- 📧 Email: webmalll.ik@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/webmall/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/webmall/discussions)

---

**Made with ❤️ for Sri Lankan fashion entrepreneurs**

🌟 Star this repo if you find it helpful!