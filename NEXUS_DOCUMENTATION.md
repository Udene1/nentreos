# NEntreOS Nexus Integration - System Overview

This document explains the architecture and logic of the Nexus SDK implemented in NEntreOS.

## 🏛️ Architecture: Latency-Zero SDK
The Nexus SDK (`src/lib/nexus`) acts as an intermediary between the NEntreOS monolith and external enterprise engines. It uses an asynchronous synchronization pattern to ensure the app remains fast and responsive.

### Key Logic:
1.  **Optimistic Persistence**: When a user performs an action (e.g., logging a purchase), NEntreOS updates Supabase immediately.
2.  **Transactional Auditing**: Every event is simultaneously logged to the `audit_integration` table with a `pending` status.
3.  **Background Synchronization**: The Nexus SDK handles the communication with external APIs in the background.
4.  **Identity Federation**: Nexus automatically injects `external_user_id` and `user_email` into every sync payload. This allows external apps (ChaseAI, Tax1, Track-It) to link NEntreOS records to their own internal user systems, even if they use different Supabase projects or databases.

## 🧠 Intelligence Split
We have divided AI tasks into two distinct routing paths:

### 1. ChaseAI Public API (Invoice Chasing)
- **Use Case**: Creating invoices, generating debt reminders, and managing customer communication.
- **Security**: Uses **Bearer Token** authentication (`Authorization: Bearer ...`).
- **Endpoint**: Publicly available APIs for invoice-level management.

### 2. ML Microservice (Business Brain)
- **Use Case**: Business-wide insights, profit/loss analysis, and growth forecasting.
- **Security**: **SHA-256 + Salting Handshake**. A cryptographic hash is generated using a shared secret (`AI_SALT`) to verify the request integrity.

## 📊 Integration Map
Nexus is currently integrated into the following components:
- **Purchases**: Captures stock-in events for **Track-It**.
- **Invoices**: Captures sales and tax data for **Tax1** and **ChaseAI**.
- **Inventory Management**: Captures stock adjustments for **Track-It**.
- **Tax Compliance (Payroll, Assets, Expenses)**: Mapped for official **Tax1** engine synchronization.

## 🛠️ Implementation Status
- **ChaseAI**: Ready for Bearer Token plumb-in.
- **Tax1 / Track-At**: Logic mapped and audited; actual API calls are mocked until those services are built.
- **Audit Trail**: Operational and visible in the `audit_integration` database table.

---
*Created for NEntreOS Enterprise Integration Strategy.*
