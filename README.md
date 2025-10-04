# WebMall – Sri Lankan Fashion Accessories E-Commerce MVP

## 📌 Overview
WebMall is a full-stack e-commerce MVP for Sri Lankan fashion accessories, replacing social media sales with a polished mobile-first web store.

**Tech Stack:**
- **Frontend**: Next.js 13+ + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Next.js API Routes + TypeScript + Prisma
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Hosting**: Vercel (recommended)

## 🚀 Features

### Customer Features
- **Homepage**: Hero section with featured products and categories
- **Product Catalog**: Browse, search, and filter products by category
- **Product Details**: Image galleries, descriptions, and specifications
- **Shopping Cart**: Guest cart (localStorage) + authenticated user sync
- **Authentication**: Modal-based login/register with Supabase Auth
- **Checkout**: Cash on Delivery (COD) payment method
- **Order Management**: View order history and status

### Admin Features
- **Product Management**: CRUD operations for products
- **Order Management**: View and update order statuses
- **Category Management**: Organize products by categories
- **Image Management**: Upload and manage product images

### Design Features
- **Fashion-Inspired Design**: Elegant UI with Playfair Display + Inter fonts
- **Color Palette**: Pastel colors with gold accents (#F7D794, #E8B4CB, #A8E6CF)
- **Mobile-First**: Responsive design optimized for all devices
- **Smooth Animations**: Hover effects and transitions
- **Modern Components**: Card-based layouts with subtle shadows

## 🛠️ Setup Instructions

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/webmall.git
cd webmall
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your Project URL and API keys
4. Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_supabase_postgres_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 3. Database Setup

1. Initialize Prisma:
```bash
npx prisma generate
npx prisma db push
```

2. (Optional) Seed the database:
```bash
npx prisma db seed
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
webmall/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   ├── products/          # Product pages
│   ├── cart/             # Shopping cart
│   ├── checkout/         # Checkout process
│   ├── admin/            # Admin dashboard
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── products/         # Product components
├── contexts/             # React contexts
├── lib/                  # Utility functions
├── prisma/              # Database schema
└── public/              # Static assets
```

## 🔧 Key Technologies

### Frontend
- **Next.js 13+**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Modern UI components
- **Framer Motion**: Animation library

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma**: Type-safe database ORM
- **Supabase**: Backend-as-a-Service platform
- **Zod**: Schema validation

### Design System
- **Fonts**: Playfair Display (headings) + Inter (body)
- **Colors**: Pastel palette with gold accents
- **Components**: Card-based layouts with rounded corners
- **Animations**: Subtle hover effects and transitions

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment
1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 🔒 Environment Variables

Required environment variables for production:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
```

## 📝 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/[slug]` - Get product by slug
- `POST /api/products` - Create product (admin)
- `PUT /api/products/[id]` - Update product (admin)
- `DELETE /api/products/[id]` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/[id]` - Update cart item
- `DELETE /api/cart/[id]` - Remove cart item

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/[id]` - Update order status (admin)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

## 📈 Future Enhancements

### Phase 2 Features
- **Payment Integration**: PayHere, Stripe integration
- **Wishlist**: Save favorite products
- **Product Reviews**: Customer reviews and ratings
- **Advanced Search**: Filters, sorting, faceted search
- **Inventory Management**: Stock tracking and alerts
- **Analytics**: Sales reports and customer insights
- **Email Notifications**: Order confirmations, shipping updates
- **Multi-language**: Sinhala and Tamil support

### Performance Optimizations
- **Image Optimization**: Next.js Image component with Supabase CDN
- **Caching**: Redis for session and cart caching
- **Search**: Elasticsearch or Algolia integration
- **CDN**: Global content delivery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: hello@webmall.lk
- GitHub Issues: [Create an issue](https://github.com/yourusername/webmall/issues)

---

**WebMall** - Empowering Sri Lankan fashion entrepreneurs with beautiful e-commerce solutions.