# 🚀 WebMall Setup Instructions

## ⚠️ CRITICAL: Fix Authentication Issues

You're experiencing bugs because Supabase isn't properly configured. Follow these steps to fix:

### 1. Create `.env.local` File

Create a file called `.env.local` in your project root with these contents:

```env
# SUPABASE CONFIGURATION - REPLACE WITH YOUR VALUES
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
JWT_SECRET=webmall_secret_key_123
```

### 2. Get Your Supabase Values

1. **Go to** [https://supabase.com](https://supabase.com)
2. **Open your project** dashboard
3. **Go to Settings → API**
4. **Copy these values:**
   - Project URL (replace `your-project-id`)
   - API Keys (anon public & service_role secret)
5. **Go to Settings → Database**
6. **Copy the connection string** (replace `[YOUR-PASSWORD]`)

### 3. Database Setup

After creating `.env.local`, run:

```bash
npx prisma db push
```

### 4. Restart Server

```bash
npm run dev
```

### 5. Test Registration

1. **Register** a new user at `/register`
2. **Check Supabase Dashboard** → Authentication → Users
3. **Verify** user appears in database
4. **Login** with registered credentials
5. **Check** that UI updates properly (admin menu appears)

---

## 🎯 Alternative: Use Mock Data Only

If you want to test without Supabase database setup:

1. **Don't create** `.env.local` file
2. **The app will automatically** use mock authentication
3. **Registration/login** will work with in-memory storage
4. **UI will update** after login/registration

---

## ✅ What This Fixes

- ✅ **User registration** saves to Supabase database
- ✅ **Authentication state** updates UI properly
- ✅ **Admin menu** appears after login
- ✅ **Proper email verification** flow
- ✅ **No more "Please wait"** stuck states

---

## 📞 Need Help?

If you need Supabase setup help:
1. Create Supabase account at [supabase.com](https://supabase.com)
2. Create new project
3. Follow instructions above to copy values
4. Users will be saved to real database!

**Current Status:** App ready for either Supabase OR mock data mode.
