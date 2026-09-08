# FinSight — Personal Financial Intelligence & Decision Simulation Platform

> **FinSight** is a production-grade personal financial intelligence and decision-simulation platform designed to help users track cashflow, manage accounts, monitor category budgets, track savings goals, compute emergency runway, detect spending patterns, and—most importantly—simulate hypothetical financial decisions (*"What happens to my money if I make this decision?"*).

---

## 1. Project Overview

Traditional finance apps focus exclusively on **retrospective reporting**—showing what already happened to your money. **FinSight** shifts the paradigm towards **prospective financial intelligence**. Its flagship **Financial Decision Simulator** enables users to model hypothetical life choices—such as purchasing an ₹80,000 laptop, facing a ₹5,000/month rent hike, experiencing a salary drop, or boosting index fund investments—and visually compare the projected $N$-month net worth trajectory against their actual baseline.

---

## 2. Platform Features

- 🔐 **Supabase Authentication & Row Level Security (RLS)**: Protected route architecture, email/password signup, session persistence, and strict database isolation where users can only access their own records (`auth.uid() = user_id`).
- 💳 **Account & Transaction Ledgers**: Real-time multi-account balance tracking (Checking, Savings, Credit, Investment), dynamic categorization, search, filtering, sorting, and pagination.
- 📊 **Deterministic Financial Analytics**: Real-time net worth tracking, monthly cashflow metrics, savings rate (%), category distribution, Month-over-Month (MoM) spending change, and custom responsive SVG bar charts.
- 🎯 **Category Budgets**: Monthly category spending limits with visual progress bars, over-budget status alerts (`On Track`, `Warning`, `Exceeded`), and live transaction joins.
- 🏆 **Financial Goals & Contribution Ledger**: Milestone savings targets with dynamic `Required Monthly Contribution (₹/mo)` calculations and an immutable deposit contribution ledger.
- 🚀 **Financial Decision Simulator (Flagship Feature)**: Deterministic simulation engine modeling one-time capital events and recurring monthly cashflow shifts across 3 to 36 months, rendering side-by-side trajectory comparison charts and net worth deltas.
- 🛡️ **Emergency Financial Runway Simulator**: Answers *"How long could my liquid savings support essential expenses if my income stopped?"* by modeling month-by-month cash depletion under zero-income assumptions with essential vs. discretionary spend toggles.
- 🔍 **Money Leak & Spending Pattern Detector**: Deterministic pattern analysis flagging recurring subscription commitments, unusually large single expenses ($> 2.5\times$ average), and category spending surges using objective, non-judgmental financial language.
- 🤖 **Optional Fact-Grounded AI Assistant**: Server-side Express integration calling Google Gemini API to generate natural language explanations grounded strictly in pre-calculated application facts JSON (zero math hallucinations).

---

## 3. Tech Stack

### Frontend Client (`client/`)
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Vanilla CSS tokens & Tailwind CSS with curated dark mode aesthetics
- **Icons**: Lucide React
- **State & Router**: Custom light React Context providers (`AuthContext`, `ToastContext`), SPA client router

### Backend Server (`server/`)
- **Runtime**: Node.js, Express.js (TypeScript CommonJS target)
- **Security & CORS**: Express CORS middleware, `dotenv` environment isolation
- **AI Integration**: Google Gemini API via server-side HTTPS fetch calls with 8s `AbortController` timeout

### Database & Auth (`Supabase`)
- **Database**: PostgreSQL with UUID primary keys, foreign keys, triggers, and indexes
- **Security**: Supabase Row Level Security (RLS) policies enforcing `auth.uid() = user_id`

---

## 4. Architecture Diagram

```mermaid
flowchart TD
    subgraph Client (React 18 + Vite + Tailwind CSS)
        UI[App UI Layout / Pages]
        AS[AuthContext & ProtectRoute]
        FE[financialCalculations & simulationEngine]
    end

    subgraph Backend (Node.js Express Server)
        API[Express App /api/insights/explain]
        AIS[aiService.ts Fact-Grounding Engine]
    end

    subgraph Data & Cloud Services
        SB[(Supabase PostgreSQL + RLS)]
        GEM[(Google Gemini API Cloud)]
    end

    UI -->|Auth & Database Queries| SB
    UI -->|Pre-calculated Facts JSON| API
    API --> AIS
    AIS -->|HTTPS Secret Key| GEM
```

---

## 5. Database Schema & ERD

```sql
-- Core PostgreSQL Tables
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash')),
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency TEXT DEFAULT 'INR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')),
    icon TEXT,
    color TEXT
);

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC(14, 2) NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')),
    description TEXT NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period TEXT CHECK (period IN ('monthly', 'yearly')),
    total_limit NUMERIC(14, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

CREATE TABLE public.financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(14, 2) NOT NULL,
    current_amount NUMERIC(14, 2) DEFAULT 0.00,
    target_date DATE NOT NULL,
    category TEXT
);

CREATE TABLE public.goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.financial_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) NOT NULL,
    note TEXT,
    date DATE NOT NULL
);
```

---

## 6. Security Model

1. **Row Level Security (RLS)**: RLS is unconditionally enabled on all user-owned PostgreSQL tables. Every query automatically evaluates `auth.uid() = user_id`.
2. **API Key Isolation**: Secrets like `GEMINI_API_KEY` are hosted exclusively on the Node/Express backend. The React client application never handles API secrets.
3. **Deterministic Financial Math**: Financial calculations are executed using 100% pure mathematical algorithms, eliminating LLM arithmetic hallucinations.

---

## 7. Environment Variables

### Frontend Client (`client/.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SERVER_URL=http://localhost:5000
```

### Backend Server (`server/.env`)
```env
PORT=5000
GEMINI_API_KEY=your-google-gemini-api-key
NODE_ENV=production
```

---

## 8. Local Setup & Production Deployment

### Local Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/finsight.git
   cd finsight
   ```
2. Setup and run Backend Server:
   ```bash
   cd server
   npm install
   npm run dev
   ```
3. Setup and run Frontend Client:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
4. Access application at `http://localhost:5173`.

### Production Deployment Instructions
1. **Supabase Database**: Execute [`supabase/schema.sql`](file:///c:/Users/aadig/OneDrive/Desktop/Finsight/supabase/schema.sql) in your Supabase SQL Editor to provision tables, triggers, and RLS policies.
2. **Backend Express Deployment (Render / Railway / Heroku)**:
   - Deploy `server/` directory.
   - Set environment variables: `PORT=5000`, `GEMINI_API_KEY=xxx`, `NODE_ENV=production`.
   - Build command: `npm run build` (`tsc`).
   - Start command: `npm start` (`node dist/index.js`).
3. **Frontend React Deployment (Vercel / Netlify / Firebase App Hosting)**:
   - Deploy `client/` directory.
   - Set environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SERVER_URL`.
   - Build command: `npm run build` (`tsc && vite build`).

---

## 9. Future Improvements

- 🔄 **Bank Sync Integration (Plaid / AA API)**: Automated account balance syncing via Account Aggregator APIs.
- 📱 **Mobile Native Application**: React Native / Expo cross-platform mobile client sharing `simulationEngine.ts` logic.
- 📈 **Investment Portfolio Tracking**: Real-time equity and index fund performance integration.
