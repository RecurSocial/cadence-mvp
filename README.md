# Cadence MVP - Weeks 1-4 Foundation

This is the **Weeks 1-4 build** of Cadence: Foundation + Admin Dashboards.

## What's Built

### Database Schema (Supabase)
- ✅ Organizations
- ✅ Users
- ✅ Services (with category, product, supplier, duration, price)
- ✅ Practitioners (with role and approval level)
- ✅ Vendors (with co-op budget, events URL, RSS feed)
- ✅ Practitioner Certifications (many-to-many linking practitioners to services)

### API Routes
- ✅ `/api/services` - CRUD for services
- ✅ `/api/practitioners` - CRUD for practitioners
- ✅ `/api/vendors` - CRUD for vendors
- ✅ `/api/certifications` - CRUD for certifications

### Frontend Components
- ✅ `/dashboard` - Main dashboard with tabs
- ✅ Services Dashboard - Add, edit, delete services by category
- ✅ Practitioners Dashboard - Add, edit, deactivate staff (grouped by role)
- ✅ Vendors Dashboard - Add, edit, deactivate vendors with co-op tracking

### Utility Functions
- ✅ `src/lib/supabase/queries.ts` - Multi-dimensional query functions for Office Dashboard

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase Database
Copy the SQL from `database.sql` and run it in your Supabase project:
1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor" → "New Query"
4. Paste the contents of `database.sql`
5. Click "Run"

### 3. Environment Variables
The `.env.local` file is already configured with your credentials.

### 4. Run Locally
```bash
npm run dev
```

Navigate to: `http://localhost:3000/dashboard`

---

## Project Status

**Session Time:** ~3 hours  
**Date:** April 8, 2026  
**Status:** ✅ Foundation Complete (Weeks 1-4)

**Next Phase:** Office Dashboard Queries (Weeks 5-8)
