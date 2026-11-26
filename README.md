# 🏫 OrgOS: The Operating System for Student Organizations

> **OrgOS** is an all-in-one operational platform engineered for university student organizations (RSOs, cultural clubs, academic societies, and Greek life), featuring an **AI Historical Knowledge Engine** that eliminates institutional amnesia during officer transitions.

---

## 🌟 The Problem & The Solution

Every year, student leadership turns over, causing **catastrophic institutional amnesia**. Incoming officers start from scratch, repeating costly mistakes, losing vendor contacts, misplacing constitutions and budgets, and scrambling to recreate workflows.

OrgOS solves this by uniting organizational workflows with an intelligent historical vault:

- **Centralized Institutional Memory**: Past meeting minutes, event post-mortems, budgets, and campus reservation playbooks are ingested and permanently accessible.
- **AI Chief of Staff (Copilot)**: Instant conversational Q&A over historical documents with source citation chips and live database tool calling.
- **Role-Based Access Control (RBAC)**: Fine-grained visibility rules (`president`, `exec`, `officer`, `member`) to protect sensitive financial and executive records.
- **Unified Event & Member Management**: Coordinate events, monitor attendance, and maintain an up-to-date member directory.

---

## 🚀 Key Features

### 🧠 1. AI Historical Copilot (`/copilot`)

- **Document Q&A with RAG**: Queries past files using Google Gemini (`gemini-2.5-flash`) and vector search (`pgvector`).
- **Source Citation Chips**: Inspect exact excerpts and source documents behind every generated response.
- **Live Tool Calling**: The Copilot can dynamically inspect the live calendar (`/calendar`) and member roster (`/members`).
- **Role-Aware Security**: RAG vector queries strictly respect the user's role and document visibility boundaries.

### 📁 2. Document Vault & Ingestion Pipeline (`/documents`, `/api/documents/ingest`)

- Supports **PDF**, **DOCX**, **CSV**, and **TXT** files.
- Edge-safe document parsing powered by `unpdf` (Cloudflare Worker compatible), `mammoth`, and `papaparse`.
- Automatic semantic chunking with 768-dimension embeddings generated via Google `text-embedding-004`.

### 🛡️ 3. Multi-Tenant Organization & Granular RBAC (`/roles`, `/members`)

- Strict multi-tenancy: each organization has isolated data, documents, and membership records.
- Configurable roles with permission flags for document viewing, uploading, event management, and AI copilot queries.

### 📅 4. Events & Scheduling (`/calendar`, `/event-form`)

- Plan upcoming meetings, workshops, and major campus events.
- Manage event details, venues, and attendee tracking.

### 🎨 5. Modern UI & Theme System

- Built with Tailwind CSS and Lucide Icons.
- Integrated theme selector supporting multiple dark and light aesthetic palettes.

---

## 🛠️ Tech Stack

| Layer                | Technology                                                                            | Details                                                                 |
| :------------------- | :------------------------------------------------------------------------------------ | :---------------------------------------------------------------------- |
| **Framework**        | [Next.js 14](https://nextjs.org/) (App Router)                                        | React 18, TypeScript, Server Actions & Route Handlers                   |
| **Database & Auth**  | [Supabase](https://supabase.com/)                                                     | Managed PostgreSQL, Row-Level Security (RLS), Supabase Auth & Storage   |
| **Vector Search**    | [pgvector](https://github.com/pgvector/pgvector)                                      | Native PostgreSQL vector extension hosted directly in Supabase          |
| **AI / LLM**         | [Google Gemini 2.5 Flash](https://aistudio.google.com/)                               | High-speed LLM with large context window & tool calling                 |
| **Embeddings**       | [Google `text-embedding-004`](https://ai.google.dev/)                                 | 768-dimensional embeddings via `@ai-sdk/google`                         |
| **AI Orchestration** | [Vercel AI SDK](https://sdk.vercel.ai/)                                               | `ai`, `@ai-sdk/google`, `useChat` streaming hooks                       |
| **File Parsing**     | `unpdf`, `mammoth`, `papaparse`                                                       | Edge & serverless-compatible text extraction for PDF, DOCX, and CSV     |
| **Deployment**       | [Cloudflare Workers](https://workers.cloudflare.com/) / [Vercel](https://vercel.com/) | OpenNext Cloudflare adapter (`@opennextjs/cloudflare`, `wrangler.toml`) |
| **Styling**          | [Tailwind CSS](https://tailwindcss.com/)                                              | Responsive design with custom design tokens                             |

---

## 📂 Project Structure

```text
├── src/
│   ├── app/
│   │   ├── (auth)/             # Authentication routes (login, signup, account)
│   │   ├── api/
│   │   │   ├── copilot/chat/   # Streaming AI chat endpoint with RAG & tool calling
│   │   │   ├── documents/ingest/ # Document text extraction & vector embedding pipeline
│   │   │   └── health/         # System health check
│   │   ├── calendar/           # Event calendar view
│   │   ├── copilot/            # AI Copilot chat interface
│   │   ├── documents/          # Document Vault & upload interface
│   │   ├── event-form/         # Event creation & editing
│   │   ├── members/            # Organization member roster
│   │   ├── register-org/       # Organization onboarding flow
│   │   ├── roles/              # Role management & permissions editor
│   │   ├── layout.tsx          # Root layout with ThemeProvider & Sidebar
│   │   └── page.tsx            # Main dashboard view
│   ├── components/             # Reusable UI components (Sidebar, ThemeSelector, UserDropdown)
│   └── lib/
│       ├── ai/                 # Parser, chunker, Gemini config, and RBAC helpers
│       ├── supabase/           # Browser, server, and middleware Supabase clients
│       └── roles.ts            # Permission definitions & access control helpers
├── supabase/
│   └── migrations/             # PostgreSQL database schemas, triggers, RLS policies, & pgvector RPC
├── wrangler.toml               # Cloudflare Workers deployment configuration
├── open-next.config.ts         # OpenNext configuration for Cloudflare
└── package.json
```

---

## ⚡ Getting Started

### 1. Prerequisites

- **Node.js**: `v18.17.0` or higher (see `.nvmrc`)
- **Package Manager**: `npm` (or `pnpm`)
- **Supabase Account**: A free Supabase project with PostgreSQL
- **Google AI Studio Key**: A free Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Clone and Install Dependencies

```bash
git clone <repo-url>
cd app
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Populate the required credentials in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=<your-google-ai-studio-key>
```

### 4. Set Up Supabase Database

Apply the SQL migrations located in `supabase/migrations/` in sequential order using the Supabase Dashboard SQL Editor or Supabase CLI:

1. `001_core_schema.sql` — Core tables (`organizations`, `profiles`, `memberships`, `roles`, `events`, `documents`)
2. `002_auth_trigger.sql` — Triggers to sync Supabase Auth users to `profiles`
3. `003_row_level_security.sql` — Row-Level Security policies for multi-tenancy
4. `004_ai_copilot_rag.sql` — `pgvector` extension setup, `document_chunks` table, and `match_org_document_chunks` RPC function

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command                | Description                                                        |
| :--------------------- | :----------------------------------------------------------------- |
| `npm run dev`          | Starts the Next.js development server on port 3000                 |
| `npm run build`        | Compiles the production build for standard Next.js deployment      |
| `npm run start`        | Runs the compiled Next.js production build                         |
| `npm run lint`         | Runs ESLint to check for code quality and errors                   |
| `npm run build:worker` | Builds the Cloudflare Worker bundle using `@opennextjs/cloudflare` |

---

## ☁️ Deployment

### Option A: Cloudflare Workers (via OpenNext)

OrgOS includes native support for Cloudflare Workers via OpenNext:

```bash
npm run build:worker
npx wrangler deploy
```

### Option B: Vercel / Node Server

Deploy to [Vercel](https://vercel.com/) by importing the Git repository and providing the environment variables listed in `.env.example`.
