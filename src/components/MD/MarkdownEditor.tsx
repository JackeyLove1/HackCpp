"use client";

import React from 'react';
import { Code2, Eye, EyeOff, Heading2, Italic, Link, List, Quote, Sigma, Type } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from './MarkdownPreview';

type Mode = 'split' | 'edit' | 'preview';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  localeLabel?: string;
};

export function MarkdownEditor({ value, onChange, placeholder, localeLabel }: Props) {
  const [mode, setMode] = React.useState<Mode>('split');
  const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const applyWrap = React.useCallback(
    (prefix: string, suffix = prefix, placeholderText = 'text') => {
      const textarea = textAreaRef.current;
      if (!textarea) return;
      const { selectionStart, selectionEnd } = textarea;
      const selected = value.slice(selectionStart, selectionEnd);
      const insertion = selected || placeholderText;
      const nextValue =
        value.slice(0, selectionStart) +
        prefix +
        insertion +
        suffix +
        value.slice(selectionEnd);
      onChange(nextValue);

      requestAnimationFrame(() => {
        const cursorStart = selectionStart + prefix.length;
        const cursorEnd = cursorStart + insertion.length;
        textarea.focus();
        textarea.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [value, onChange]
  );

  const insertLinePrefix = (token: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const startLine = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const selected = value.slice(startLine, selectionEnd);
    const next = `${value.slice(0, startLine)}${token}${selected}${value.slice(
      selectionEnd
    )}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const offset = token.length;
      textarea.setSelectionRange(selectionStart + offset, selectionEnd + offset);
    });
  };

  const toolbar = [
    {
      label: 'Heading',
      icon: Heading2,
      action: () => insertLinePrefix('## '),
    },
    {
      label: 'Bold',
      icon: Type,
      action: () => applyWrap('**'),
    },
    {
      label: 'Italic',
      icon: Italic,
      action: () => applyWrap('_'),
    },
    {
      label: 'Quote',
      icon: Quote,
      action: () => insertLinePrefix('> '),
    },
    {
      label: 'List',
      icon: List,
      action: () => insertLinePrefix('- '),
    },
    {
      label: 'Code',
      icon: Code2,
      action: () => applyWrap('```\\n', '\\n```', 'code'),
    },
    {
      label: 'Link',
      icon: Link,
      action: () => applyWrap('[', '](https://)', 'text'),
    },
    {
      label: 'Math',
      icon: Sigma,
      action: () => applyWrap('$$', '$$', 'E=mc^2'),
    },
  ];

  const renderPreview = mode !== 'edit';
  const renderEditor = mode !== 'preview';

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-xs">
        <div className="flex flex-wrap gap-1">
          {toolbar.map((item) => (
            <Button
              key={item.label}
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-md border"
              onClick={item.action}
              title={item.label}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={mode === 'split' ? 'default' : 'ghost'}
            onClick={() => setMode('split')}
          >
            Split
          </Button>
          <Button
            type="button"
            size="icon"
            variant={mode === 'edit' ? 'default' : 'ghost'}
            onClick={() => setMode('edit')}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={mode === 'preview' ? 'default' : 'ghost'}
            onClick={() => setMode('preview')}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-2">
        <div
          className={cn(
            'border-b md:border-r',
            mode === 'preview' ? 'hidden md:block' : 'block'
          )}
        >
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
            <span>Editor {localeLabel ? `(${localeLabel})` : null}</span>
          </div>
          <textarea
            ref={textAreaRef}
            className="h-72 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm focus:outline-none md:h-[400px]"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
          />
        </div>
        {renderPreview ? (
          <div className="border-t md:border-0">
            <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
              <span>Preview</span>
            </div>
            <div className="markdown-body prose prose-sm max-w-none px-4 py-2 dark:prose-invert">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
