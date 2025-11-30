import matter from 'gray-matter';

export type ChapterMetaDirectives = {
  title?: string;
  description?: string;
  keywords?: string | string[];
  robots?:
    | {
        index?: boolean;
        follow?: boolean;
        googleBot?: {
          index?: boolean;
          follow?: boolean;
        };
      }
    | string
    | boolean;
  [key: string]: unknown;
};

export type ChapterFrontMatter = {
  meta?: ChapterMetaDirectives;
  [key: string]: unknown;
};

export type ParsedChapterMarkdown = {
  content: string;
  frontMatter: ChapterFrontMatter;
  meta: ChapterMetaDirectives;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stripLeadingWhitespace = (value: string): string => {
  const withoutBom = value.replace(/^\uFEFF/, '');
  return withoutBom.replace(/^\s*(\r?\n)/, '');
};

export const parseChapterMarkdown = (
  source?: string
): ParsedChapterMarkdown => {
  const input = typeof source === 'string' ? source : '';

  try {
    const parsed = matter(input);
    const frontMatter = isPlainObject(parsed.data)
      ? (parsed.data as ChapterFrontMatter)
      : {};
    const meta = isPlainObject(frontMatter.meta)
      ? (frontMatter.meta as ChapterMetaDirectives)
      : {};

    return {
      content: stripLeadingWhitespace(parsed.content ?? ''),
      frontMatter,
      meta,
    };
  } catch (error) {
    console.warn('Failed to parse chapter front matter', error);
    return {
      content: input,
      frontMatter: {},
      meta: {},
    };
  }
};

