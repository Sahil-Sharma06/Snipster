# Snipster

A full-stack platform for developers to create, organize, and share code snippets and blog posts. Built with Next.js 16 App Router, MongoDB, and Clerk authentication.

## Features

- **Snippets** — Create, edit, and delete syntax-highlighted code snippets with language tagging and visibility controls
- **Blogs** — Write and publish blog posts with a rich text editor, cover images, and draft/publish workflow
- **Collections** — Organize snippets into named collections with public or private visibility
- **Feed** — Browse public snippets and blog posts from the community with search and filter support
- **Social** — Follow other users, like and bookmark content, and leave comments
- **Notifications** — Notification bell for follows, likes, and comments
- **Profiles** — Public user profiles with bio, social links, and tabbed content views
- **Dark / Light theme** — System-aware theme with manual toggle

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Language | TypeScript 5 |
| Database | MongoDB via Prisma ORM 5 |
| Authentication | Clerk + Svix webhooks |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui, Radix UI, Lucide Icons |
| Forms | React Hook Form + Zod |
| Rich Text | TipTap |
| Code Highlighting | react-syntax-highlighter (Prism) |
| File Uploads | Cloudinary |
| State Management | Zustand |
| Toasts | Sonner |

## Getting Started

### Prerequisites

- Node.js 18 or later
- A MongoDB database (MongoDB Atlas recommended)
- A Clerk account for authentication
- A Cloudinary account for image uploads

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Sahil-Sharma06/Snipster.git
cd snipster
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL="mongodb+srv://..."

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=whsec_...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

4. Push the database schema and generate the Prisma client:

```bash
npm run db:push
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
src/
  app/
    (dashboard)/          # Authenticated route group
      feed/               # Public content feed
      snippets/           # Snippet detail and edit pages
      blogs/              # Blog detail and edit pages
      my-blogs/           # Author's draft and published posts
      my-snippets/        # Author's snippet management
      collections/        # Collections CRUD and explore
      bookmarks/          # Saved content
      profile/            # Public user profiles
      notifications/      # Notification center
    api/                  # Route handlers (REST)
    sign-in/              # Clerk sign-in page
    sign-up/              # Clerk sign-up page
  components/
    features/             # Feature-specific interactive components
    forms/                # React Hook Form forms
    layouts/              # Header, sidebar, mobile nav
    shared/               # Reusable components (CodeBlock, Pagination, etc.)
    ui/                   # shadcn/ui primitives
  lib/
    auth/                 # Server-side current user helper
    db/                   # Prisma client singleton
    validations/          # Zod schemas
    constants/            # Language list and other constants
  middleware.ts           # Clerk auth middleware
prisma/
  schema.prisma           # Database schema
```

## License

MIT
