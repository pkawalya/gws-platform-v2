# GWS Platform V2

Land surveying and property management platform built for Uganda and East Africa.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL (Prisma v7 ORM) |
| UI | shadcn/ui + Tailwind CSS 4 |
| Charts | Recharts |
| Maps | Leaflet + React Leaflet |
| Icons | Lucide React |
| Auth | NextAuth.js (ready to wire) |
| State | Zustand (available) |

## Features

### Core Modules
- **Dashboard** — KPI metrics, revenue charts, project pipeline, activity feed
- **Clients** — Full CRM with inline editing, financial summary, location map
- **Survey Projects** — Project lifecycle tracking with approval workflows
- **Finance** — Invoicing, quotations, payment tracking, UGX currency support
- **Approvals** — Multi-step approval chains with approve/defer/reject actions
- **Workflows** — Dynamic workflow builder with configurable steps and triggers

### Operations
- **Spatial OS** — Interactive map with layers and annotations
- **Field Sync** — Mobile data collection sync with conflict tracking
- **Document Vault** — Secure document storage with verification
- **Communications** — SMS, email, and WhatsApp messaging with delivery tracking

### Intelligence
- **AI & Insights** — Model management, prompt templates, call logging
- **Audit Trail** — Domain event tracking with full payload history
- **Reports** — Multi-dimensional reporting engine

### System
- **Organizations** — Multi-tenant with branch management
- **Roles & Permissions** — Dynamic role-based access control
- **Settings** — Profile, organization, database, appearance, notifications, regional
- **Database Configuration** — Connect to any PostgreSQL database from the UI

## Project Structure

```
├── prisma/
│   └── schema.prisma          # 20-model database schema
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main application shell
│   │   ├── layout.tsx         # Root layout
│   │   └── api/               # 14+ API route handlers
│   ├── components/
│   │   ├── platform/          # Module pages & detail views
│   │   ├── dashboard/         # Dashboard widgets
│   │   └── ui/                # shadcn/ui primitives
│   └── lib/
│       ├── db.ts              # Dynamic database connection
│       ├── utils.ts           # Utility helpers
│       └── serialize.ts       # BigInt/Decimal serialization
├── micro-server.py            # Lightweight Python API server
├── db-config.json             # Database connection template
├── .env                       # Environment variables template
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (any provider)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/pkawalya/gws-platform-v2.git
cd gws-platform-v2

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Configure your database
# Option 1: Edit .env with your DATABASE_URL
# Option 2: Use the Settings > Database UI after starting the app

# Push schema to database
npx prisma db push

# Build for production
npm run build

# Start the server
npm start
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Database Configuration

The platform supports connecting to any PostgreSQL database through three methods (in priority order):

1. **Settings UI** — Navigate to Settings > Database tab, enter your connection details or URL, and click Save
2. **Environment Variable** — Set `DATABASE_URL` in your `.env` file
3. **Default Fallback** — Built-in connection for initial setup

### Supported Providers

Quick-connect templates are available for:

- Prisma Postgres
- Neon Serverless
- Supabase
- Railway
- AWS RDS
- Local PostgreSQL

### Example Connection URLs

```bash
# Standard PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database

# With SSL
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Neon
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/database?sslmode=require

# Local development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gws_platform
```

## Database Schema

20 models covering the full domain:

| Domain | Models |
|--------|--------|
| Multi-Tenancy | Organization, Branch |
| Clients | Client, SurveyProject, ApprovalStep, ClientProjectProgress |
| Financial | Invoice, Quotation |
| Documents | ClientDocument |
| Communications | Communication |
| Workflows | WorkflowDefinition, WorkflowStep, WorkflowInstance, WorkflowTransition |
| Spatial | SpatialLayer, MapAnnotation |
| Field Sync | FieldObservation, FieldSyncEvent |
| Events | DomainEvent |
| AI | AiModelVersion, AiPromptTemplate, AiCallLog |
| Users | User, Role, Permission, UserRole, RolePermission |

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/dashboard` | GET | Dashboard metrics |
| `/api/clients` | GET, POST | Client management |
| `/api/projects` | GET, POST | Survey project management |
| `/api/workflows` | GET, POST | Workflow definitions |
| `/api/workflow-instances` | GET, POST | Workflow execution |
| `/api/invoices` | GET | Invoice management |
| `/api/finance` | GET | Financial overview |
| `/api/approvals` | GET | Approval tracking |
| `/api/documents` | GET | Document vault |
| `/api/communications` | GET | Messaging |
| `/api/spatial` | GET | Spatial layers |
| `/api/field-sync` | GET | Field sync events |
| `/api/ai` | GET | AI model management |
| `/api/users` | GET, POST | User management |
| `/api/roles` | GET, POST | Role management |
| `/api/permissions` | GET | Permission listing |
| `/api/database` | GET, POST | Database configuration |
| `/api/organizations` | GET | Organization listing |
| `/api/reports` | GET | Report generation |
| `/api/events` | GET | Domain events |

## License

Proprietary — All rights reserved.
