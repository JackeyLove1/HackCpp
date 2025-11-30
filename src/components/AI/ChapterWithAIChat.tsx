'use client';

import { useEffect, useState } from 'react';
import { AIChatSidebar } from './AIChatSidebar';
import { TextSelectionToolbar } from './TextSelectionToolbar';

interface ChapterWithAIChatProps {
  chapterContent: string;
  locale: string;
}

export function ChapterWithAIChat({
  chapterContent,
  locale,
}: ChapterWithAIChatProps) {
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<{ top: number; left: number } | null>(null);
  const [explainRequest, setExplainRequest] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to ensure selection is finalized
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          // 清空状态，确保下次选中能正常触发
          setSelectedText('');
          setSelectionPosition(null);
          return;
        }

        const text = selection.toString().trim();

        // Only show toolbar for meaningful selections (at least 2 characters)
        if (text.length < 2) {
          setSelectedText('');
          setSelectionPosition(null);
          return;
        }

        // Calculate toolbar position
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Ignore collapsed selections
        if (rect.width === 0 || rect.height === 0) {
          setSelectedText('');
          setSelectionPosition(null);
          return;
        }

        // Position toolbar below the selection
        // Use viewport coordinates since toolbar is position: fixed
        const top = rect.bottom + 8;
        const left = rect.left + rect.width / 2;

        setSelectedText(text);
        setSelectionPosition({ top, left });
      }, 50);
    };

    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleCloseToolbar = () => {
    setSelectedText('');
    setSelectionPosition(null);
  };

  const handleExplain = (text: string) => {
    // Open the chat sidebar if it's closed
    setIsOpen(true);
    // Trigger the explain request
    setExplainRequest(text);
  };

  return (
    <>
      <TextSelectionToolbar
        selectedText={selectedText}
        locale={locale}
        position={selectionPosition}
        onExplain={handleExplain}
        onClose={handleCloseToolbar}
      />
      <AIChatSidebar
        chapterContent={chapterContent}
        selectedText={selectedText}
        locale={locale}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        explainRequest={explainRequest}
        onExplainHandled={() => setExplainRequest('')}
      />
      <style jsx global>{`
        ::selection {
          background-color: rgba(59, 130, 246, 0.3);
          color: inherit;
        }

        ::-moz-selection {
          background-color: rgba(59, 130, 246, 0.3);
          color: inherit;
        }

        .chapter-content-wrapper ::selection {
          background-color: rgba(59, 130, 246, 0.5);
        }

        .chapter-content-wrapper ::-moz-selection {
          background-color: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </>
  );
}

