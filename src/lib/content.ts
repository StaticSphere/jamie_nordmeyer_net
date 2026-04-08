import { getCollection, type CollectionEntry } from "astro:content";

export const POSTS_PER_PAGE = 10;

export type Taxonomy = {
  name: string;
  slug: string;
  count: number;
};

export type PostEntry = CollectionEntry<"posts">;
export type PageEntry = CollectionEntry<"pages">;

export type PaginatedPosts = {
  posts: PostEntry[];
  currentPage: number;
  totalPages: number;
};

type TaxonomyRef = {
  name: string;
  slug: string;
};

const sortPostsByDateDesc = (a: PostEntry, b: PostEntry) => b.data.date.getTime() - a.data.date.getTime();

function withBase(pathname: string): string {
  const baseUrl = import.meta.env.BASE_URL ?? "/";
  const normalizedPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  return `${baseUrl}${normalizedPath}`;
}

export function getEntrySlug(entry: Pick<PostEntry | PageEntry, "id">): string {
  const lastSegment = entry.id.split("/").pop() ?? entry.id;
  return lastSegment.replace(/\.[^.]+$/, "");
}

export function getPostUrl(post: PostEntry): string {
  return withBase(post.data.wpLink);
}

export function getCategoryUrl(slug: string): string {
  return withBase(`/category/${slug}/`);
}

export function getTagUrl(slug: string): string {
  return withBase(`/tag/${slug}/`);
}

export async function getAllPosts(): Promise<PostEntry[]> {
  const posts = await getCollection("posts");
  return posts.sort(sortPostsByDateDesc);
}

export async function getPostBySlug(slug: string): Promise<PostEntry | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => getEntrySlug(post) === slug);
}

export async function getPostByDateAndSlug(
  year: string,
  month: string,
  day: string,
  slug: string
): Promise<PostEntry | undefined> {
  const posts = await getAllPosts();

  return posts.find((post) => {
    const postYear = String(post.data.date.getFullYear());
    const postMonth = String(post.data.date.getMonth() + 1).padStart(2, "0");
    const postDay = String(post.data.date.getDate()).padStart(2, "0");

    return postYear === year && postMonth === month && postDay === day && getEntrySlug(post) === slug;
  });
}

export async function getRecentPosts(limit = 5): Promise<PostEntry[]> {
  const posts = await getAllPosts();
  return posts.slice(0, limit);
}

function buildTaxonomyCounts(items: TaxonomyRef[]): Taxonomy[] {
  const counts = new Map<string, Taxonomy>();

  for (const item of items) {
    const existing = counts.get(item.slug);

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(item.slug, {
        name: item.name,
        slug: item.slug,
        count: 1
      });
    }
  }

  return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllCategories(): Promise<Taxonomy[]> {
  const posts = await getAllPosts();
  return buildTaxonomyCounts(posts.flatMap((post) => post.data.categories));
}

export async function getAllTags(): Promise<Taxonomy[]> {
  const posts = await getAllPosts();
  return buildTaxonomyCounts(posts.flatMap((post) => post.data.tags));
}

export async function getPostsByCategorySlug(slug: string): Promise<PostEntry[]> {
  const posts = await getAllPosts();
  return posts.filter((post) =>
    post.data.categories.some((category: TaxonomyRef) => category.slug === slug)
  );
}

export async function getPostsByTagSlug(slug: string): Promise<PostEntry[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.data.tags.some((tag: TaxonomyRef) => tag.slug === slug));
}

export async function getAllPages(): Promise<PageEntry[]> {
  const pages = await getCollection("pages");
  return pages.sort((a: PageEntry, b: PageEntry) => a.data.title.localeCompare(b.data.title));
}

export async function getPageBySlug(slug: string): Promise<PageEntry | undefined> {
  const pages = await getAllPages();
  return pages.find((page) => getEntrySlug(page) === slug);
}

export async function getTotalPostPages(postsPerPage = POSTS_PER_PAGE): Promise<number> {
  const posts = await getAllPosts();
  return Math.max(1, Math.ceil(posts.length / postsPerPage));
}

export async function getPaginatedPosts(
  page: number,
  postsPerPage = POSTS_PER_PAGE
): Promise<PaginatedPosts> {
  const posts = await getAllPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / postsPerPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * postsPerPage;
  const end = start + postsPerPage;

  return {
    posts: posts.slice(start, end),
    currentPage,
    totalPages
  };
}
