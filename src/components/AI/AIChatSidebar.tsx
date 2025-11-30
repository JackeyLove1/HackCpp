'use client';

import MarkdownPreview from '@/components/MD/MarkdownPreview';
import { AISettingsModal } from '@/components/AI/AISettingsModal';
import { useAISettingsStore } from '@/stores/aiSettingsStore';
import { Check, Copy, Loader2, MessageSquarePlus, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

interface AIChatSidebarProps {
  chapterContent: string;
  selectedText?: string;
  locale: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  explainRequest?: string;
  onExplainHandled?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatSidebar({
  chapterContent,
  selectedText,
  locale,
  isOpen,
  setIsOpen,
  explainRequest,
  onExplainHandled,
}: AIChatSidebarProps) {
  const { settings } = useAISettingsStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [pinnedSelectedText, setPinnedSelectedText] = useState<string | undefined>(selectedText);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bodyOverflowRef = useRef<string | undefined>(undefined);

  // When the panel opens, jump it into view and focus the input
  useEffect(() => {
    if (!isOpen) return;

    chatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [isOpen]);

  // Lock background scroll when the chat is open
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (!isOpen) {
      if (bodyOverflowRef.current !== undefined) {
        document.body.style.overflow = bodyOverflowRef.current;
      }
      return;
    }

    bodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = bodyOverflowRef.current ?? '';
    };
  }, [isOpen]);

  // Keep the latest message in view only when the user is near the bottom.
  useEffect(() => {
    if (!isOpen || !messagesContainerRef.current || !isAtBottom) return;

    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading, isOpen, isAtBottom]);

  // Auto-focus input when selected text changes
  useEffect(() => {
    if (selectedText && isOpen) {
      inputRef.current?.focus();
    }
  }, [selectedText, isOpen]);

  // Pin the selected text for the current chat session so it doesn't disappear
  // when the actual DOM selection is cleared after focusing the textarea.
  useEffect(() => {
    if (selectedText) {
      setPinnedSelectedText(selectedText);
    }
  }, [selectedText]);

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    // Clear pinned selected text when starting a completely new conversation
    setPinnedSelectedText(undefined);
  };

  const handleSubmitWithText = useCallback(async (textToSubmit: string) => {
    if (!textToSubmit.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSubmit,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          chapterContent,
          selectedText: pinnedSelectedText,
          aiSettings: settings,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response stream');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };

      setMessages(prev => [...prev, assistantMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });

          assistantMessage.content += text;
          setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          error instanceof Error
            ? error.message
            : locale === 'zh'
            ? '抱歉，发生了错误。请重试。'
            : locale === 'ja'
            ? '申し訳ありませんが、エラーが発生しました。もう一度お試しください。'
            : 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, chapterContent, pinnedSelectedText, settings, locale]);

  // Handle explain request from toolbar
  useEffect(() => {
    if (explainRequest && onExplainHandled) {
      const explainPrompt =
        locale === 'zh'
          ? `请解释以下内容：\n\n"${explainRequest}"`
          : locale === 'ja'
          ? `次の内容を说明してください：\n\n"${explainRequest}"`
          : `Please explain the following:\n\n"${explainRequest}"`;

      setInput(explainPrompt);
      // Focus the input after setting the explain prompt
      setTimeout(() => {
        inputRef.current?.focus();
        // Auto-submit the explain request
        handleSubmitWithText(explainPrompt);
      }, 100);

      onExplainHandled();
    }
  }, [explainRequest, locale, onExplainHandled, handleSubmitWithText]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await handleSubmitWithText(input);
  };

  const effectiveSelectedText = pinnedSelectedText;

  const labels = {
    title:
      locale === 'zh' ? 'AI 助手' : locale === 'ja' ? 'AI アシスタント' : 'AI Assistant',
    placeholder:
      locale === 'zh'
        ? effectiveSelectedText
          ? '询问关于选中文本的问题...'
          : '询问关于这个章节的问题...'
        : locale === 'ja'
        ? effectiveSelectedText
          ? '選択したテキストについて質問する...'
          : 'この章について質問する...'
        : effectiveSelectedText
        ? 'Ask about the selected text...'
        : 'Ask about this chapter...',
    openChat:
      locale === 'zh' ? '打开 AI 助手' : locale === 'ja' ? 'AI を開く' : 'Open AI Assistant',
    closeChat:
      locale === 'zh' ? '关闭 AI 助手' : locale === 'ja' ? 'AI を閉じる' : 'Close AI Assistant',
    selectedTextHint:
      locale === 'zh'
        ? '已选中文本'
        : locale === 'ja'
        ? 'テキストが選択されました'
        : 'Text selected',
    newChat:
      locale === 'zh' ? '新建对话' : locale === 'ja' ? '新しい会話' : 'New Chat',
    copy:
      locale === 'zh' ? '复制' : locale === 'ja' ? 'コピー' : 'Copy',
    copied:
      locale === 'zh' ? '已复制' : locale === 'ja' ? 'コピーしました' : 'Copied',
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-sm font-medium text-neutral-50 shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-3 lg:right-8"
          aria-label={labels.openChat}
        >
          <Sparkles className="h-6 w-6 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{labels.openChat}</span>
        </button>
      )}

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={chatPanelRef}
            className="fixed inset-0 z-50 flex items-end justify-center px-3 py-6 lg:items-start lg:justify-end lg:px-6 lg:py-[5vh]"
          >
            <div className="flex h-[95vh] w-[90vw] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl lg:h-[90vh] lg:w-[28vw] lg:max-w-[480px] lg:min-w-[320px]">
              <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-900/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-neutral-200" />
                  <h2 className="font-semibold text-neutral-100">{labels.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="rounded-md p-1.5 text-neutral-200 transition-colors hover:bg-neutral-800"
                  aria-label={labels.newChat}
                  title={labels.newChat}
                >
                  <MessageSquarePlus className="h-5 w-5" />
                </button>
                <AISettingsModal locale={locale} />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1.5 text-neutral-200 transition-colors hover:bg-neutral-800"
                  aria-label={labels.closeChat}
                >
                  <X className="h-5 w-5" />
                </button>
                </div>
              </div>

              {effectiveSelectedText && (
                <div className="shrink-0 border-b border-neutral-800 bg-neutral-900/50 px-4 py-2">
                  <p className="text-xs font-medium text-neutral-400">
                    {labels.selectedTextHint}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm italic text-neutral-100">
                    &ldquo;{effectiveSelectedText}&rdquo;
                  </p>
                </div>
              )}

              <div
                ref={messagesContainerRef}
                className="flex-1 space-y-4 overflow-y-auto px-4 py-4 lg:max-h-none"
                onScroll={() => {
                  const el = messagesContainerRef.current;
                  if (!el) return;

                  const threshold = 40;
                  const distanceFromBottom =
                    el.scrollHeight - el.scrollTop - el.clientHeight;

                  setIsAtBottom(distanceFromBottom <= threshold);
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
                onTouchMove={(e) => {
                  e.stopPropagation();
                }}
              >
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-neutral-500">
                    <Sparkles className="mb-3 h-12 w-12 text-neutral-600" />
                    <p className="text-sm">{labels.placeholder}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`relative max-w-[85%] rounded-2xl border px-4 py-2.5 ${
                            message.role === 'user'
                              ? 'border-neutral-700 bg-neutral-800 text-neutral-100'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-100'
                          }`}
                        >
                          {message.role === 'assistant' ? (
                            <>
                              <div className="prose prose-sm prose-invert max-w-none text-neutral-100">
                                <MarkdownPreview>{message.content}</MarkdownPreview>
                              </div>
                              {message.content && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(message.id, message.content)}
                                  className="absolute -right-2 -top-2 rounded-md border border-neutral-800 bg-neutral-950 p-1.5 shadow-md transition-colors hover:border-neutral-700"
                                  aria-label={copiedMessageId === message.id ? labels.copied : labels.copy}
                                  title={copiedMessageId === message.id ? labels.copied : labels.copy}
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4 text-neutral-200" />
                                  )}
                                </button>
                              )}
                            </>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-2.5">
                          <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="shrink-0 border-t border-neutral-800 bg-neutral-900/60 p-4">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={labels.placeholder}
                    rows={1}
                    className="flex-1 resize-none rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 outline-none ring-offset-neutral-950 placeholder:text-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-700 focus-visible:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="flex items-center justify-center rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
