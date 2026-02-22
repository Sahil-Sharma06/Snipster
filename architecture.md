# Snipster — Architecture

## Overview

Snipster is a full-stack code snippet manager built with **Next.js 16** (App Router), **MongoDB** (via Prisma), and **Clerk** for authentication. Users can create, organize, and share code snippets with the community. The application follows a standard Next.js project structure with server components, API routes, and client-side interactivity.

---

## Tech Stack

| Layer            | Technology                                                  |
| ---------------- | ----------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, React 19, Turbopack)                |
| Language         | TypeScript 5                                                |
| Database         | MongoDB (via Prisma ORM 5)                                  |
| Authentication   | Clerk (`@clerk/nextjs`) + Svix webhooks                     |
| Styling          | Tailwind CSS 4, `tw-animate-css`                            |
| UI Components    | shadcn/ui (New York style), Radix UI primitives, Lucide icons |
| Forms            | React Hook Form + Zod validation                            |
| Code Highlighting| `react-syntax-highlighter` (Prism, VSC Dark Plus theme)     |
| Rich Text        | TipTap (starter-kit + code-block-lowlight)                  |
| File Uploads     | Cloudinary                                                  |
| State Management | Zustand                                                     |
| Notifications    | Sonner (toast)                                               |
| Utilities        | date-fns, slugify, clsx, tailwind-merge                     |
| Linting          | ESLint (next/core-web-vitals + typescript)                   |
| Formatting       | Prettier + prettier-plugin-tailwindcss                       |

---

## Project Structure

```
snipster/
├── prisma/
│   └── schema.prisma            # Database models & relations
├── prisma.config.ts             # Prisma 7 config (migration URL)
├── lib/
│   └── utils.ts                 # Legacy cn() utility (root-level)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout (ClerkProvider)
│   │   ├── page.tsx             # Landing page / authenticated dashboard
│   │   ├── globals.css          # Tailwind theme & CSS variables
│   │   ├── sign-in/             # Clerk sign-in page
│   │   ├── sign-up/             # Clerk sign-up page
│   │   ├── (dashboard)/         # Route group — authenticated pages
│   │   │   ├── layout.tsx       # Dashboard shell (header + sidebar + content)
│   │   │   ├── page.tsx         # Dashboard home (stats, recent snippets)
│   │   │   ├── feed/
│   │   │   │   └── page.tsx     # Public snippet feed
│   │   │   └── snippets/
│   │   │       ├── new/
│   │   │       │   └── page.tsx # Create snippet page
│   │   │       └── [id]/
│   │   │           ├── page.tsx # View snippet detail
│   │   │           └── edit/
│   │   │               └── page.tsx # Edit snippet page
│   │   └── api/
│   │       ├── snippets/
│   │       │   ├── route.ts     # GET (list) + POST (create)
│   │       │   └── [id]/
│   │       │       └── route.ts # GET + PATCH + DELETE
│   │       └── webhooks/
│   │           └── clerk/
│   │               └── route.ts # Clerk user sync webhook
│   ├── components/
│   │   ├── features/
│   │   │   └── snippet-actions.tsx  # Edit/Delete actions for snippet author
│   │   ├── forms/
│   │   │   ├── create-snippet-form.tsx
│   │   │   └── edit-snippet-form.tsx
│   │   ├── layouts/
│   │   │   ├── dashboard-header.tsx # Top navigation bar
│   │   │   └── dashboard-nav.tsx    # Sidebar navigation
│   │   ├── providers/
│   │   │   └── session-provider.tsx # ClerkProvider wrapper
│   │   ├── shared/
│   │   │   └── code-block.tsx       # Syntax-highlighted code viewer
│   │   └── ui/                      # shadcn/ui primitives
│   │       ├── alert.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── field.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sonner.tsx
│   │       ├── tabs.tsx
│   │       └── textarea.tsx
│   ├── lib/
│   │   ├── auth/
│   │   │   └── current-user.ts     # Auth helpers (getCurrentUser, requireUser)
│   │   ├── constants/
│   │   │   └── languages.ts        # Supported language list
│   │   ├── db/
│   │   │   └── prisma.ts           # Singleton PrismaClient
│   │   ├── utils/
│   │   │   └── cn.ts               # clsx + tailwind-merge helper
│   │   ├── utils.ts                # Re-exports cn()
│   │   └── validations/
│   │       └── snippet.ts          # Zod schema for snippet CRUD
│   └── proxy.ts                    # Clerk middleware (route protection)
├── components.json                 # shadcn/ui configuration
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── package.json
└── .prettierrc
```

---

## Data Model (MongoDB via Prisma)

```
┌──────────┐      ┌──────────┐      ┌────────────┐
│   User   │──1:N─│ Snippet  │──N:M─│ Collection │
│          │      │          │      │            │
│ clerkId  │      │ title    │      │ name       │
│ email    │      │ code     │      │ description│
│ name     │      │ language │      │ isPublic   │
│ username │      │ tags[]   │      └────────────┘
│ image    │      │ isPublic │           │
│ bio      │      │ authorId │      CollectionSnippet
│ urls...  │      └──────────┘      (join table)
└──────────┘           │
     │                 │
     │    ┌────────────┼────────────┐
     │    │            │            │
 ┌───┴──┐  ┌───┴──┐  ┌───┴────┐  ┌──┴───┐
 │ Blog │  │ Like │  │Comment │  │Bookmark│
 │      │  │      │  │        │  │        │
 │ slug │  │userId│  │ userId │  │ userId │
 │content│  │snip? │  │ snip?  │  │ snip?  │
 │ tags  │  │blog? │  │ blog?  │  │ blog?  │
 └──────┘  └──────┘  └────────┘  └────────┘

 ┌────────┐
 │ Follow │  (self-referencing User → User)
 │        │
 │follower│
 │following│
 └────────┘
```

### Key Models

| Model              | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| **User**           | Synced from Clerk; owns snippets, blogs, collections |
| **Snippet**        | Core entity — code snippet with language & tags    |
| **Blog**           | Blog posts with rich content, slugs, and read time |
| **Collection**     | Named groups of snippets                           |
| **CollectionSnippet** | Many-to-many join between Collection ↔ Snippet  |
| **Comment**        | Polymorphic — can belong to a Snippet or Blog      |
| **Like**           | Polymorphic — unique per user per snippet/blog     |
| **Bookmark**       | Polymorphic — unique per user per snippet/blog     |
| **Follow**         | Self-referential follower/following relationship   |

All IDs use MongoDB ObjectId. Cascade deletes are configured on all foreign keys.

---

## Authentication Flow

```
                    ┌─────────┐
                    │  Clerk  │
                    │ (hosted)│
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Sign-in/up       Middleware         Webhooks
   /sign-in/**      src/proxy.ts      /api/webhooks/clerk
   /sign-up/**      (route protection) (user.created/updated/deleted)
        │                │                │
        ▼                ▼                ▼
   ClerkProvider    auth.protect()    prisma.user.create/update/delete
   (root layout)   (non-public       (keeps DB in sync with Clerk)
                    routes)
```

1. **Root Layout** wraps the app in `<ClerkProvider>`.
2. **Middleware** (`src/proxy.ts`) uses `clerkMiddleware` to protect all routes except `/`, `/sign-in`, and `/sign-up`.
3. **Webhooks** (`/api/webhooks/clerk`) receive Svix-signed events from Clerk to sync user records to MongoDB.
4. **Auth Helpers** (`src/lib/auth/current-user.ts`) provide `getCurrentUser()` and `requireUser()` — these look up the Clerk user in the local DB and auto-create the record if missing.

---

## API Routes

### `GET /api/snippets`
Lists public snippets with pagination and optional filters.

| Parameter  | Type   | Default | Description             |
| ---------- | ------ | ------- | ----------------------- |
| `limit`    | number | 20      | Items per page (max 100)|
| `page`     | number | 1       | Page number             |
| `language` | string | —       | Filter by language      |
| `authorId` | string | —       | Filter by author        |

### `POST /api/snippets`
Creates a new snippet. Requires authentication. Body validated with `createSnippetSchema` (Zod).

### `GET /api/snippets/[id]`
Returns a single snippet. Private snippets are only visible to their author.

### `PATCH /api/snippets/[id]`
Updates a snippet. Only the author can update.

### `DELETE /api/snippets/[id]`
Deletes a snippet. Only the author can delete.

### `POST /api/webhooks/clerk`
Handles Clerk webhook events (`user.created`, `user.updated`, `user.deleted`). Verified via Svix signatures.

---

## Page Routing

| Route                      | Component                  | Type   | Description                       |
| -------------------------- | -------------------------- | ------ | --------------------------------- |
| `/`                        | `src/app/page.tsx`         | Server | Landing page or auth'd dashboard  |
| `/sign-in`                 | Clerk `<SignIn />`         | Client | Sign-in page                      |
| `/sign-up`                 | Clerk `<SignUp />`         | Client | Sign-up page                      |
| `/(dashboard)`             | Dashboard layout           | Server | Sidebar + header shell            |
| `/(dashboard)/`            | Dashboard home             | Server | Stats, recent snippets, actions   |
| `/(dashboard)/feed`        | Feed page                  | Server | Browse all public snippets        |
| `/(dashboard)/snippets/new`| New snippet page           | Server | Create snippet form               |
| `/(dashboard)/snippets/[id]`| Snippet detail            | Server | View snippet with code block      |
| `/(dashboard)/snippets/[id]/edit` | Edit snippet        | Server | Edit snippet form                 |

The `(dashboard)` route group provides a shared layout with:
- **DashboardHeader**: Sticky top bar with logo and Clerk `<UserButton />`
- **DashboardNav**: Sidebar navigation (Dashboard, Feed, Create, Collections, Profile)
- **Toaster**: Sonner toast notifications

---

## Component Architecture

```
src/components/
├── ui/            → shadcn/ui primitives (Button, Card, Dialog, Form, etc.)
├── layouts/       → Page-level structural components (Header, Nav)
├── forms/         → Domain forms (CreateSnippetForm, EditSnippetForm)
├── features/      → Domain-specific interactive components (SnippetActions)
├── shared/        → Reusable cross-domain components (CodeBlock)
└── providers/     → Context providers (AuthProvider / ClerkProvider)
```

### Key Components

| Component             | Client/Server | Description                                     |
| --------------------- | ------------- | ----------------------------------------------- |
| `DashboardHeader`     | Server        | Top bar with logo and user button                |
| `DashboardNav`        | Client        | Sidebar nav with active-route highlighting       |
| `CreateSnippetForm`   | Client        | Full snippet creation form with tag management   |
| `EditSnippetForm`     | Client        | Pre-filled snippet editing form                  |
| `SnippetActions`      | Client        | Edit/Delete buttons with confirmation dialog     |
| `CodeBlock`           | Client        | Syntax-highlighted code with copy-to-clipboard   |
| `AuthProvider`        | Server        | Wraps children in `<ClerkProvider>`              |

---

## Validation

Snippet input is validated using **Zod** (`src/lib/validations/snippet.ts`):

| Field         | Rules                                              |
| ------------- | -------------------------------------------------- |
| `title`       | Required, 3–100 chars, trimmed                     |
| `description` | Optional, max 500 chars                            |
| `code`        | Required, 1–50,000 chars                           |
| `language`    | Must be one of 21 supported languages              |
| `tags`        | Array of up to 10 strings, each max 20 chars       |
| `isPublic`    | Boolean, defaults to `true`                        |

The same schema is used on both client (React Hook Form resolver) and server (API route validation).

### Supported Languages (21)

JavaScript, TypeScript, Python, Java, Go, Rust, PHP, Ruby, Swift, Kotlin, C#, C++, C, HTML, CSS, SCSS, SQL, Bash, JSON, YAML, Markdown

---

## Styling

- **Tailwind CSS 4** with `@tailwindcss/postcss` plugin
- **CSS Variables** for theming (light/dark mode via `.dark` class)
- **shadcn/ui** (New York variant) with `slate` base color
- **`cn()` utility** (`clsx` + `tailwind-merge`) for conditional class merging
- **tw-animate-css** for animation utilities

---

## Environment Variables

| Variable                | Purpose                         |
| ----------------------- | ------------------------------- |
| `DATABASE_URL`          | MongoDB connection string       |
| `CLERK_WEBHOOK_SECRET`  | Svix secret for webhook verification |
| Clerk env vars          | Clerk publishable/secret keys   |

---

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start dev server (Turbopack)         |
| `npm run build`    | Production build                     |
| `npm run start`    | Start production server              |
| `npm run lint`     | Run ESLint                           |
| `npm run format`   | Format with Prettier                 |
| `npm run db:push`  | Push Prisma schema to MongoDB        |
| `npm run db:studio`| Open Prisma Studio                   |
| `npm run db:generate`| Generate Prisma client             |
| `npm run db:migrate` | Run Prisma migrations              |

---

## Path Aliases

Configured in `tsconfig.json`:

```
@/* → src/*
```

All imports use the `@/` prefix (e.g., `@/components/ui/button`, `@/lib/db/prisma`).

---

## Key Design Decisions

1. **Server Components by default** — Pages and layouts are async server components that fetch data directly via Prisma. Client components are used only where interactivity is needed (forms, navigation, code copy).

2. **Polymorphic social features** — Comments, Likes, and Bookmarks can belong to either a Snippet or a Blog via optional foreign keys, avoiding separate tables for each content type.

3. **Clerk → DB sync** — User data is dual-stored: Clerk handles authentication, while MongoDB stores the user record for relational queries. Sync happens via webhooks and fallback auto-creation in auth helpers.

4. **Shared validation** — The Zod schema is shared between client-side form validation (via `@hookform/resolvers`) and server-side API validation, ensuring consistency.

5. **Route groups** — The `(dashboard)` route group provides a consistent layout (header + sidebar) for all authenticated pages without affecting URL paths.
