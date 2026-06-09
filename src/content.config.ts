import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const sommarpratare = defineCollection({
  // Astro Content Layer API: one Markdown file per summer host, loaded from
  // src/content/sommarpratare. Frontmatter-only — there is no rendered body.
  loader: glob({ pattern: '**/*.md', base: './src/content/sommarpratare' }),
  schema: z.object({
    /** Full name, as broadcast. */
    name: z.string(),
    /** Broadcast date in Sommar i P1 (YYYY-MM-DD). */
    date: z.coerce.date(),
    /** Short "known for" line — profession/role. */
    description: z.string().optional(),
    /** Optional explicit profile/article links. When omitted the UI falls back
        to a search link built from the name (see src/lib/links.ts). */
    instagram: z.string().url().optional(),
    /** Approximate Instagram follower count (volatile — a mid-2026 snapshot). */
    instagramFollowers: z.number().optional(),
    x: z.string().url().optional(),
    wikipedia: z.string().url().optional(),
    /** Sveriges Radio episode page for this host's Sommar i P1. */
    sr: z.string().url().optional(),
    /** Optional avatar image (path or URL). Falls back to an initials avatar. */
    image: z.string().optional(),
  }),
});

export const collections = { sommarpratare };
