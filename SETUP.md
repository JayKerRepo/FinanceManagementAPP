# Finance Management App - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

#### Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created

#### Get API Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public key**

#### Create Environment File
Create a `.env` file in your project root:
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Database

#### Run Migrations
In your Supabase dashboard:
1. Go to **SQL Editor**
2. Run each migration file in order:

```sql
-- Run these in order:
-- 1. 20251016030054_create_users_and_profiles.sql
-- 2. 20251016030132_create_accounts_and_transactions.sql  
-- 3. 20251016030204_create_budgets_and_categories.sql
-- 4. 20251016044816_add_comprehensive_features_schema.sql
```

### 4. Test Your Setup

#### Start Development Server
```bash
npm run dev
```

#### Access Debug Page
Navigate to `http://localhost:5173/debug` to:
- Test Supabase connection
- Verify database access
- Test authentication flow
- Run diagnostics

### 5. Verify End-to-End Flow

#### Test Authentication
1. Go to `/debug` page
2. Use the "Auth Flow Test" tab
3. Test sign up with a test email
4. Check your email for verification link
5. Test sign in after verification

#### Test App Flow
1. Sign up/Sign in
2. Complete onboarding flow
3. Access main dashboard
4. Test expense entry
5. Verify data persistence

## 🔧 Troubleshooting

### Common Issues

#### "Missing Supabase environment variables"
- Check your `.env` file exists and has correct values
- Restart your development server after creating `.env`

#### "Database connection failed"
- Verify your Supabase project is active
- Check that migrations were run successfully
- Ensure RLS policies are properly set up

#### "Authentication service error"
- Check your Supabase project settings
- Verify email confirmation is configured
- Check Supabase logs for detailed errors

#### "Module not found" errors
- Run `npm install` to install dependencies
- Clear node_modules and reinstall if needed:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### Debug Tools

#### Supabase Diagnostics
- Tests environment variables
- Verifies database connection
- Checks authentication service
- Validates client initialization

#### Auth Flow Test
- Tests sign up process
- Tests sign in process
- Verifies user state management
- Checks profile data loading

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── AuthPage.tsx    # Sign in/up UI
│   ├── DashboardMock.tsx # Main dashboard
│   ├── DebugPage.tsx   # Debug & diagnostics
│   └── ...
├── contexts/           # React contexts
│   ├── AuthContext.tsx # Authentication state
│   └── BusinessContext.tsx # Business state
├── lib/               # Utilities
│   ├── supabase.ts    # Supabase client
│   └── database.types.ts # TypeScript types
└── ...
```

## 🎯 Next Steps

After successful setup:
1. Customize your business settings
2. Add real expense data
3. Test all features end-to-end
4. Deploy to production

## 📞 Support

If you encounter issues:
1. Check the debug page at `/debug`
2. Review Supabase logs
3. Check browser console for errors
4. Verify all environment variables are set


