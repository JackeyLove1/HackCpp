'use client';

import { BookOpen, Copy, Languages, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface TextSelectionToolbarProps {
  selectedText: string;
  locale: string;
  /**
   * 可选：外部传入的弹出位置。如果未传，则根据当前选区自动计算。
   */
  position?: { top: number; left: number } | null;
  onExplain: (text: string) => void;
  onClose: () => void;
}

export function TextSelectionToolbar({
  selectedText,
  locale,
  position,
  onExplain,
  onClose,
}: TextSelectionToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  // 根据当前选区（或父组件传入的位置）计算弹出位置：始终显示在选中文本正下方
  useEffect(() => {
    if (!selectedText) {
      setToolbarPosition(null);
      return;
    }

    // 如果父组件提供了位置，优先使用
    if (position) {
      setToolbarPosition(position);
      return;
    }

    const updatePosition = () => {
      if (typeof window === 'undefined') return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      // Use viewport coordinates since toolbar is position: fixed
      const top = rect.bottom + 8;
      const left = rect.left + rect.width / 2;
      setToolbarPosition({ top, left });
    };

    updatePosition();

    // Update position on scroll to handle scrolling while toolbar is open
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [selectedText, position]);

  // 点击任意非工具栏区域时关闭
  useEffect(() => {
    if (!selectedText || !toolbarPosition) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current?.contains(event.target as Node)) {
        return;
      }
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedText, toolbarPosition, onClose]);

  const handleExplain = () => {
    onExplain(selectedText);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
    onClose();
  };

  const handleSearch = () => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleTranslate = () => {
    const targetLang = navigator.language.split('-')[0] || 'en';
    const translateUrl = `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(
      selectedText,
    )}`;
    window.open(translateUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const labels = {
    explain: locale === 'zh' ? '解释' : locale === 'ja' ? '解説' : 'Explain',
    copy: locale === 'zh' ? '复制' : locale === 'ja' ? 'コピー' : 'Copy',
    search: locale === 'zh' ? '搜索' : locale === 'ja' ? '検索' : 'Search',
    translate: locale === 'zh' ? '翻译' : locale === 'ja' ? '翻訳' : 'Translate',
  };

  if (!selectedText || !toolbarPosition) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[100] flex items-center gap-1 rounded-lg border bg-background shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
      style={{
        top: `${toolbarPosition.top}px`,
        left: `${toolbarPosition.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <button
        type="button"
        onClick={handleExplain}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        title={labels.explain}
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span>{labels.explain}</span>
      </button>

      <div className="h-5 w-px bg-border" />

      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        title={labels.copy}
      >
        <Copy className="h-3.5 w-3.5" />
        <span>{labels.copy}</span>
      </button>

      <div className="h-5 w-px bg-border" />

      <button
        type="button"
        onClick={handleSearch}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        title={labels.search}
      >
        <Search className="h-3.5 w-3.5" />
        <span>{labels.search}</span>
      </button>

      <div className="h-5 w-px bg-border" />

      <button
        type="button"
        onClick={handleTranslate}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        title={labels.translate}
      >
        <Languages className="h-3.5 w-3.5" />
        <span>{labels.translate}</span>
      </button>
    </div>
  );
}
