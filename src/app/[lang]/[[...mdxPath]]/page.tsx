import path from 'path';

import { ChapterPreviewShell } from '@/components/AI/ChapterPreviewShell';
import { stripFrontMatter } from '@/lib/markdown/strip-front-matter';
import { useMDXComponents } from '@/mdx-components';
import { generateStaticParamsFor, importPage } from 'nextra/pages';
import { promises as fs } from 'fs';

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath, params.lang)
  return metadata
}

type PageProps = Readonly<{
  params: Promise<{
    mdxPath: string[]
    lang: string
  }>
}>
const Wrapper = useMDXComponents().wrapper

type ChapterInfo = {
  bookId: string;
  bookSlug: string;
  chapterPath: string;
  chapterPaths: string[];
};

const parseChapterInfo = (filePath?: string): ChapterInfo | null => {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  const contentIndex = parts.indexOf('content');

  // Expecting: src/content/<lang>/<bookId>/<bookSlug>/<chapter...>
  if (contentIndex === -1 || parts.length < contentIndex + 5) return null;

  const [bookId, bookSlug, ...chapterSegments] = parts.slice(contentIndex + 2);

  // 之前这里要求第一个路径片段以 "chapter" 开头，
  // 但你的实际内容路径是类似 "01_limits_.../01_limit_..."，不会满足这个条件，
  // 导致所有页面都被视为「非章节」，从而不会挂载 AI Chat 包裹组件。
  // 这里放宽为：只要满足 content/<lang>/<bookId>/<bookSlug>/<chapter...> 结构即可。
  if (!bookId || !bookSlug || chapterSegments.length === 0) return null;

  const chapterPath = chapterSegments
    .join('/')
    .replace(/\.(mdx?|md)(\.tsx)?$/, '');

  return {
    bookId,
    bookSlug,
    chapterPath,
    chapterPaths: [chapterPath],
  };
};

const loadChapterContent = async (filePath?: string) => {
  if (!filePath) return '';

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  try {
    const raw = await fs.readFile(absolutePath, 'utf8');
    return stripFrontMatter(raw);
  } catch (error) {
    console.warn('Failed to read chapter content', error);
    return '';
  }
};

export default async function Page(props: PageProps) {
  const params = await props.params
  const result = await importPage(params.mdxPath, params.lang)
  const { default: MDXContent, toc, metadata } = result

  const chapterInfo = parseChapterInfo(metadata?.filePath);
  const chapterContent = chapterInfo
    ? await loadChapterContent(metadata.filePath)
    : '';

  const content = chapterInfo ? (
    <ChapterPreviewShell
      locale={params.lang}
      chapterContent={chapterContent}
      bookId={chapterInfo.bookId}
      bookSlug={chapterInfo.bookSlug}
      chapterPath={chapterInfo.chapterPath}
      chapterPaths={chapterInfo.chapterPaths}
    >
      <MDXContent {...props} params={params} />
    </ChapterPreviewShell>
  ) : (
    <MDXContent {...props} params={params} />
  );

  return (
    <Wrapper toc={toc} metadata={metadata}>
      {content}
    </Wrapper>
  )
}
