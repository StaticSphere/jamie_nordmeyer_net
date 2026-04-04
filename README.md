# jamienordmeyer.net (Astro)

This Astro project uses **local Markdown content files** and no longer depends on the WordPress API.

## What is implemented

- Layout and styling inspired by the WordPress Period theme used on the live site
- Tailwind CSS v4 for utility-first styling across layouts, pages, and components
- Shared Tailwind theme tokens and reusable component classes for consistent spacing/colors/typography
- Font Awesome icons loaded from a local npm package (no external icon CDN dependency)
- Home page with post listing, featured images, and 10-post pagination
- Local content collections for posts and pages
- WordPress-style public URLs for posts, categories, tags, pages, and homepage pagination
- Sidebar widgets for:
  - Recent Posts
  - Categories
  - Tags (tag cloud sizing based on usage count)
- No comment UI or comment links
- Local copies of uploaded media under `src/assets/images/`

## Content locations

- Posts: `src/content/posts/YYYY/MM/*.md` (for example, `src/content/posts/2018/10/intern-talks.md`)
- Pages: `src/content/pages/*.md`
- Uploaded media: `src/assets/images/**`

## Local development

```sh
pnpm install
pnpm dev
```

## Media migration (imports)

```sh
pnpm migrate:images
```

Optional dry-run:

```sh
pnpm migrate:images -- --dry-run --verbose
```

Legacy alias (still supported):

```sh
pnpm migrate:wp-uploads
```

## Build and preview

```sh
pnpm build
pnpm preview
```

## Key files

- `src/content.config.ts` - Astro content collection schemas
- `src/content/posts/` - local post content organized by year/month
- `src/content/pages/` - local page content
- `src/lib/content.ts` - local content query and pagination helpers
- `src/components/PostCard.astro` - homepage/archive post cards
- `src/components/Sidebar.astro` - Recent Posts, Categories, Tags widgets
- `src/components/Pagination.astro` - homepage pagination UI
- `src/pages/[year]/[month]/[day]/[slug].astro` - WordPress-style post routes
- `src/pages/[slug].astro` - top-level page routes like `about-me`
- `src/styles/global.css` - Tailwind entrypoint, theme tokens, and shared content helpers
