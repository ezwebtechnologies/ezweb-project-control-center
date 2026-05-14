# EZWeb Project Control Center

Internal **project control center** for MuleSoft and SaaS delivery: clients, projects, tasks, payments, and a dashboard tuned for enterprise program governance. The UI targets a **premium, minimal, futuristic** aesthetic (Linear / Notion / Jira–style) with **dark mode**, glass surfaces, and motion.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | **Next.js 15** (App Router, React Server Components where practical) |
| Language | **TypeScript** |
| Styling | **Tailwind CSS** + design tokens (`app/globals.css`) |
| UI primitives | **shadcn/ui** (Base UI–backed components) |
| Motion | **Framer Motion** |
| Charts | **Recharts** |
| Drag & drop | **@dnd-kit** (kanban) |
| Forms | **react-hook-form** + **Zod** |
| ORM | **Prisma** |
| Database | **PostgreSQL** (e.g. **Neon**) |

---

## Folder structure (high level)

```
app/
  (auth)/           # Auth shell (no admin chrome)
    login/          # Sign-in UI scaffold
  (dashboard)/      # Main app behind admin layout
    dashboard/      # Overview KPIs + deadlines
    clients/        # CRUD + [id] detail
    projects/       # CRUD, archive, lifecycle statuses
    tasks/          # Kanban + list + detail sheet
    payments/       # Filters, tables, revenue chart
    employees/      # Placeholder / future HR
    settings/
  actions/          # Server Actions (mutations)
components/
  admin/            # Shell, sidebar, header, theme toggle
  auth/             # Login form
  clients/          # Clients table + dialogs
  dashboard/      # Dashboard KPIs + deadlines
  payments/         # Payments workspace
  projects/         # Projects table + dialogs
  tasks/            # Kanban, list, task sheet
  ui/               # shadcn components
lib/
  data/             # Aggregations (e.g. dashboard)
  prisma.ts         # Prisma singleton
  validations.ts    # Zod schemas shared with actions
  admin-nav.ts      # Sidebar config
  labels.ts         # Human-readable enums
prisma/
  schema.prisma     # Data model
  seed.ts           # Demo seed data
middleware.ts       # Auth hook placeholder (pass-through today)
```

---

## Setup

### Prerequisites

- **Node.js 20+** (LTS recommended)
- A **Neon** (or any) PostgreSQL database and connection string

### Install

```bash
npm install
```

### Environment variables

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Set **`DATABASE_URL`** to your Neon connection string (include `?sslmode=require` for Neon).

3. Optionally set **`NEXT_PUBLIC_SITE_URL`** for canonical URLs in production (e.g. `https://your-domain.com`).

> **Security:** Never commit real credentials. `.env` and `.env.local` are gitignored. If a database password was ever shared in plain text, **rotate it in the Neon console** and update your local `.env`.

### Prisma & database

Generate the client (also runs on `npm run build`):

```bash
npm run db:generate
```

Push the schema to your database (good for development):

```bash
npm run db:push
```

Seed demo rows (clients, projects, tasks, payments, labels):

```bash
npm run db:seed
```

For production-style migrations:

```bash
npm run db:migrate
```

Inspect data:

```bash
npm run db:studio
```

### Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you are redirected to **`/dashboard`**. Auth UI preview: **`/login`**.

---

## Database architecture

### Design principles

- **UUID** primary keys (`@db.Uuid`) for safer merging and federation.
- **`createdAt` / `updatedAt`** on mutable entities.
- **Soft delete** via nullable **`deletedAt`** (queries in Server Actions filter `deletedAt: null`).
- **Projects** support **`archivedAt`** without deleting history.
- **Tasks** support **labels** (many-to-many), **attachments** (placeholder URLs for future uploads), and **`sortOrder`** per status column for kanban ordering.
- **Payments** link to **Client** and optional **Project**; amounts use `Decimal(14,2)`.

### Entity relationship (overview)

```mermaid
erDiagram
  Client ||--o{ Project : has
  Client ||--o{ Task : optional
  Client ||--o{ Payment : receives
  Project ||--o{ Task : scopes
  Project ||--o{ Payment : optional
  Task ||--o{ TaskLabel : tagged
  Label ||--o{ TaskLabel : applied
  Task ||--o{ TaskAttachment : files
  User ||--o{ "" : future-auth

  Client {
    uuid id PK
    string name
    string companyName
    string email
    string phone
    text address
    text notes
    datetime deletedAt
  }

  Project {
    uuid id PK
    uuid clientId FK
    string name
    enum status
    enum priority
    datetime deadline
    int progress
    string_array tags
    datetime archivedAt
    datetime deletedAt
  }

  Task {
    uuid id PK
    uuid projectId FK
    uuid clientId FK
    enum status
    enum priority
    datetime dueDate
    int sortOrder
    datetime deletedAt
  }

  Payment {
    uuid id PK
    uuid clientId FK
    uuid projectId FK
    decimal amount
    enum status
    string invoiceNumber
    datetime paymentDate
    datetime dueDate
    datetime deletedAt
  }

  Label {
    uuid id PK
    string name
    string color
    datetime deletedAt
  }

  Employee {
    uuid id PK
    string name
    datetime deletedAt
  }

  User {
    uuid id PK
    string email UK
    string passwordHash
    datetime deletedAt
  }
```

### Tables (summary)

| Table | Purpose |
|--------|---------|
| **User** | Placeholder for future auth (email, optional `passwordHash`, soft delete). |
| **Client** | Customer / account: contact, company, address, notes. |
| **Project** | Delivery unit: lifecycle **status** (Lead → … → Delivered), priority, deadline, progress %, tags, archive. |
| **Task** | Internal work: status (Todo / In progress / Review / Done), priority, optional project & client, due date, sort order. |
| **Label** / **TaskLabel** | Notion-style labels on tasks. |
| **TaskAttachment** | Placeholder rows until file storage is wired. |
| **Payment** | Revenue row: amount, status, invoice #, dates, optional project. |
| **Employee** | Reserved for directory / HR (module UI is empty today). |

### Project lifecycle statuses (Salesforce-aligned)

| Prisma enum | UI label |
|-------------|----------|
| `LEAD` | Lead |
| `DISCUSSIONS` | Discussions |
| `QUOTE_FINALIZED` | Quote finalized |
| `DEVELOPMENT` | Development |
| `CLIENT_TESTING` | Client testing |
| `DELIVERED` | Delivered |

### Task statuses

`TODO` · `IN_PROGRESS` · `REVIEW` · `DONE`

### Payment statuses

`PAID` · `PENDING` · `OVERDUE` · `PARTIAL`

---

## Authentication (current state)

- **`/login`**: polished **UI only** (no credential verification).
- **`middleware.ts`**: **no-op** with comments showing where to enforce sessions (e.g. redirect unauthenticated users away from `/(dashboard)` routes).
- **`User`** model in Prisma is ready for **NextAuth**, custom JWT, or IdP integration.

---

## Future roadmap

1. **Auth** — NextAuth (or Clerk/WorkOS), protected routes, role-based access.
2. **File uploads** — S3-compatible storage for task attachments and invoices.
3. **Employees** — CRUD, org chart, manager relationships, SCIM/IdP sync.
4. **Notifications** — In-app + email for deadlines and payment aging.
5. **Audit log** — Immutable history for compliance.
6. **API layer** — Optional REST/GraphQL for integrations.
7. **Testing** — Playwright E2E, Prisma integration tests in CI.

---

## Deployment

### Vercel (typical)

1. Create a Neon (or other Postgres) database; copy **`DATABASE_URL`**.
2. Connect the Git repo to **Vercel**.
3. Set environment variables in the Vercel project:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SITE_URL` (production URL)
4. Build command: **`npm run build`** (includes `prisma generate`).
5. Run migrations against production (`prisma migrate deploy`) from CI or locally with production `DATABASE_URL`.

### Post-deploy

- Run **`prisma migrate deploy`** (if using migrations) or a one-time **`prisma db push`** only if you accept schema push without migration history.
- Optionally run **`npm run db:seed`** on a **non-production** database only.

---

## Scripts reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Next dev (Turbopack) |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema to DB (dev) |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

---

## License

Private / internal — adjust as appropriate for your organization.
