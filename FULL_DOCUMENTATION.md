# NEntreOS - Technical Architecture & File Documentation

NEntreOS is a unified Operating System for Nigerian SMEs, designed to bridge the gap between inventory tracking, financial compliance, and automated debt recovery. This document provides an exhaustive, file-by-file breakdown of the system.

---

## 1. High-Level Architecture

NEntreOS follows a **Decentralized UI, Centralized Data** pattern.
- **Frontend**: Next.js 15 (App Router) + Material UI (MUI).
- **Backend**: Supabase (PostgreSQL + Auth + Real-time).
- **AI Engine**: A hybrid system combining a **Next.js LLM Layer** (Groq/OpenAI) and a **Railway-deployed ML Microservice**.
- **Payment Layer**: Paystack API (Webhook-driven automation).

---

## 2. Directory Breakdown

### 📂 `src/lib/` - The Core Engine
This directory contains the business logic, third-party integrations, and utility wrappers.

- **[ai.ts](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/lib/ai.ts)**: The primary AI coordinator. It routes prompts to Groq/Gemini/OpenAI and makes HTTP calls to the external ML microservice on Railway for behavioral predictions.
- **[paystack.ts](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/lib/paystack.ts)**: Handles Paystack transaction verification and initialization.
- **[supabase-client.ts](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/lib/supabase-client.ts)**: Initializes the Supabase client for client-side interactions (Real-time subscriptions).
- **[supabase-server.ts](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/lib/supabase-server.ts)**: Server-side Supabase client for SSR and API routes.
- **[validations.ts](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/lib/validations.ts)**: Contains all Zod schemas used for form validation (Invoices, Sales, Items).
- **[valuation.ts](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/lib/valuation.ts)**: Implements FIFO and Weighted Average Costing logic for inventory valuation.
- **[utils.ts](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/lib/utils.ts)**: Generic helpers for currency formatting (₦), date parsing, and CSV downloads.

---

### 📂 `src/app/` - The Routing Layer
Uses Next.js App Router for layout-driven navigation.

- **[layout.tsx](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/app/layout.tsx)**: The root layout. Links the PWA manifest, configures MUI fonts, and registers the **Service Worker**.
- **[(protected)/layout.tsx](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/app/(protected)/layout.tsx)**: Wraps all authenticated pages. Implements the **Sidebar Navigation** and filters menu items based on the user's **RBAC Role**.
- **[(protected)/dashboard/page.tsx](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/app/(protected)/dashboard/page.tsx)**: The main Business Hub. Aggregates data from `sales`, `items`, and `invoices` tables.
- **[invoice/[id]/page.tsx](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/app/invoice/[id]/page.tsx)**: A **PUBLIC** route. This is the page clients see when they click a payment link in an AI reminder.

---

### 📂 `src/components/` - The UI Building Blocks
Reusable MUI components that handle local state and user interaction.

- **[AIAdvisor.tsx](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/components/AIAdvisor.tsx)**: The proactive AI widget. Analyzes low stock and cashflow levels to give live business advice.
- **[InvoiceDialog.tsx](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/components/InvoiceDialog.tsx)**: Multi-step modal for creating/editing invoices. Includes item selection and automatic inventory lookups.
- **[BarcodeScanner.tsx](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/components/BarcodeScanner.tsx)**: Browser-based camera integration (QuaggaJS) for scanning physical barcodes on items.
- **[SWRegistration.tsx](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/components/SWRegistration.tsx)**: Handles the silent registration of the PWA Service Worker.

---

### 📂 `src/hooks/` - Custom Hooks
Contains the reactive logic shared across components.

- **[useRole.ts](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/hooks/useRole.ts)**: The source of truth for permissions. Fetches the active user's profile and determines if they are an `Owner`, `Manager`, or `Staff`. Provides `isManager` and `isOwner` shorthand.

---

### 📂 `src/app/api/webhooks/` - Serverless Automation
Background processes that react to external triggers.

- **[paystack/route.ts](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/src/app/api/webhooks/paystack/route.ts)**: The most critical automation file. When it receives a `charge.success` event, it executes a database transaction to:
    1. Mark the invoice as PAID.
    2. Subtract items from inventory.
    3. Log the sale for tax reporting.

---

### 📂 `public/` - Static Assets & PWA
- **[manifest.json](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/public/manifest.json)**: PWA configuration for mobile installability.
- **[sw.js](file:///C:/Users/HP/.gemini/antigravity/scratch/naija-startup-os/public/sw.js)**: The Service Worker script. Implements caching to ensure the POS Counter loads fast on spotty 3G/4G connections.

---

## 3. Data Flow Example: A Payment Journey

1.  **Generation**: An owner creates an invoice in `InvoiceDialog.tsx`.
2.  **Notification**: `lib/ai.ts` generates a reminder. The client receives a link to `app/invoice/[id]/page.tsx`.
3.  **Payment**: The client pays via the Paystack Popup on the public page.
4.  **Verification**: Paystack hits `api/webhooks/paystack/route.ts`.
5.  **Completion**: The webhook updates the database. The **Dashboard** (using real-time subscriptions) updates its KPIs instantly without the owner needing to refresh.

---

## 4. Security & RBAC
Permissions are enforced at two levels:
1.  **UI Level**: `useRole` hook hides buttons (e.g., "Add Stock") or pages (e.g., "Reports") from Staff.
2.  **Database Level**: Supabase **Row Level Security (RLS)** (configured in the Supabase Dashboard) ensuring users can only see data belonging to their `organization_id`.

---

This documentation covers the skeletal structure of NEntreOS. For deep logic on specific algorithms (like FIFO costing), refer to the individual files linked above.
