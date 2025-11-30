'use client';

import { ReactNode, useMemo } from 'react';

import { ChapterWithAIChat } from './ChapterWithAIChat';
import { ReadingEnhancer } from './ReadingEnhancer';

type Props = {
  locale: string;
  chapterContent: string;
  bookId: string;
  bookSlug: string;
  chapterPath: string;
  chapterPaths?: string[];
  children: ReactNode;
};

export function ChapterPreviewShell({
  locale,
  chapterContent,
  bookId,
  bookSlug,
  chapterPath,
  chapterPaths,
  children,
}: Props) {
  const normalizedChapterPaths = useMemo(() => {
    const candidates = (chapterPaths ?? []).filter(Boolean);
    if (candidates.length === 0) {
      return [chapterPath];
    }
    return candidates;
  }, [chapterPaths, chapterPath]);

  const currentIndex = Math.max(
    0,
    normalizedChapterPaths.indexOf(chapterPath)
  );

  return (
    <div className="relative space-y-4">
      {/* <ReadingEnhancer
        locale={locale}
        bookId={bookId}
        bookSlug={bookSlug}
        chapterPath={chapterPath}
        chapterPaths={normalizedChapterPaths}
        currentIndex={currentIndex}
        totalChapters={normalizedChapterPaths.length}
      /> */}

      <div className="chapter-content-wrapper">
        {children}
      </div>

      <ChapterWithAIChat chapterContent={chapterContent} locale={locale} />
    </div>
  );
}

