"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import React from "react";
import { RotateCw, SlidersHorizontal, Type } from "lucide-react";

type Props = {
  locale: string;
  bookId: string;
  bookSlug: string;
  chapterPath: string;
  chapterPaths: string[];
  currentIndex: number;
  totalChapters: number;
};

type FontKey = "sans" | "serif" | "mono" | "kaiti" | "songti" | "heiti";

type ReadingPreferences = {
  fontSize: number;
  lineHeight: number;
  fontFamily: FontKey;
};

type Copy = {
  button: string;
  heading: string;
  fontSize: string;
  lineHeight: string;
  fontFamily: string;
  reset: string;
};

const DEFAULT_PREFERENCES: ReadingPreferences = {
  fontSize: 16,
  lineHeight: 1.7,
  fontFamily: "sans",
};

const FONT_FAMILIES: Record<FontKey, string> = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  mono: "var(--font-mono)",
  kaiti:
    "'KaiTi', 'STKaiti', 'Kaiti SC', 'AR PL KaitiM GB', 'DFKai-SB', '楷体', '楷体_GB2312', serif",
  songti:
    "'SimSun', '宋体', 'Songti SC', 'NSimSun', 'PMingLiu', 'Songti TC', serif",
  heiti:
    "'SimHei', 'Heiti SC', 'Heiti TC', 'Microsoft YaHei', '微软雅黑', 'Arial', 'Helvetica', sans-serif",
};

const clampFontSize = (value: number) =>
  Math.min(22, Math.max(14, Math.round(value)));
const clampLineHeight = (value: number) =>
  Math.min(2.1, Math.max(1.3, Math.round(value * 100) / 100));

const getLocaleCopy = (locale: string): Copy => {
  if (locale === "zh") {
    return {
      button: "阅读设置",
      heading: "排版调节",
      fontSize: "字号",
      lineHeight: "行间距",
      fontFamily: "字体",
      reset: "重置",
    };
  }

  if (locale === "ja") {
    return {
      button: "読書設定",
      heading: "タイポグラフィ",
      fontSize: "文字サイズ",
      lineHeight: "行間",
      fontFamily: "フォント",
      reset: "リセット",
    };
  }

  return {
    button: "Reading settings",
    heading: "Typography",
    fontSize: "Font size",
    lineHeight: "Line height",
    fontFamily: "Font family",
    reset: "Reset",
  };
};

export function ReadingEnhancer({
  locale,
  bookId,
  bookSlug,
  chapterPath,
  chapterPaths,
  currentIndex,
  totalChapters,
}: Props) {
  const router = useRouter();
  const [isRestored, setIsRestored] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [preferences, setPreferences] = React.useState<ReadingPreferences>(
    DEFAULT_PREFERENCES
  );
  const storageKey = React.useMemo(
    () => `openbook:reader:prefs:${locale}`,
    [locale]
  );
  const copy = React.useMemo(() => getLocaleCopy(locale), [locale]);

  // Restore scroll position after initial render
  React.useEffect(() => {
    if (isRestored) return;

    const progressKey = `openbook:progress:${bookId}`;

    try {
      const raw = window.localStorage.getItem(progressKey);
      if (raw) {
        const data = JSON.parse(raw) as {
          chapterPath?: string;
          scrollY?: number;
        };
        if (data.chapterPath === chapterPath && typeof data.scrollY === "number") {
          // Delay scroll restoration to ensure DOM is ready
          requestAnimationFrame(() => {
            window.scrollTo({ top: data.scrollY, behavior: "instant" });
            setIsRestored(true);
          });
        } else {
          setIsRestored(true);
        }
      } else {
        setIsRestored(true);
      }
    } catch {
      setIsRestored(true);
    }
  }, [bookId, chapterPath, isRestored]);

  // Track scroll position with debouncing
  React.useEffect(() => {
    const progressKey = `openbook:progress:${bookId}`;
    let scrollTimer: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      scrollTimer = setTimeout(() => {
        const scrollY = window.scrollY;
        const payload = {
          bookId,
          bookSlug,
          chapterPath,
          chapterIndex: currentIndex,
          totalChapters,
          scrollY,
          updatedAt: Date.now(),
        };
        try {
          window.localStorage.setItem(progressKey, JSON.stringify(payload));
        } catch {
          // ignore
        }
      }, 1000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [bookId, bookSlug, chapterPath, currentIndex, totalChapters]);

  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (event.key === "T" || event.key === "t") {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (currentIndex < 0 || !chapterPaths.length) {
        return;
      }

      if (event.key === "N" || event.key === "n") {
        if (currentIndex < chapterPaths.length - 1) {
          event.preventDefault();
          const nextPath = chapterPaths[currentIndex + 1];
          router.push(`/${locale}/books/${bookSlug}/${nextPath}`);
        }
      } else if (event.key === "P" || event.key === "p") {
        if (currentIndex > 0) {
          event.preventDefault();
          const prevPath = chapterPaths[currentIndex - 1];
          router.push(`/${locale}/books/${bookSlug}/${prevPath}`);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [locale, bookSlug, chapterPaths, currentIndex, router]);

  // Load saved typography preferences
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ReadingPreferences>;
        setPreferences({
          fontSize: clampFontSize(parsed.fontSize ?? DEFAULT_PREFERENCES.fontSize),
          lineHeight: clampLineHeight(
            parsed.lineHeight ?? DEFAULT_PREFERENCES.lineHeight
          ),
          fontFamily: (parsed.fontFamily as FontKey) ?? DEFAULT_PREFERENCES.fontFamily,
        });
      }
    } catch {
      // ignore invalid stored value
    } finally {
      setIsMounted(true);
    }
  }, [storageKey]);

  // Apply typography preferences and persist them
  React.useEffect(() => {
    if (!isMounted) return;

    const fontStack =
      FONT_FAMILIES[preferences.fontFamily] ?? FONT_FAMILIES[DEFAULT_PREFERENCES.fontFamily];
    document.documentElement.style.setProperty(
      "--reading-font-size",
      `${preferences.fontSize}px`
    );
    document.documentElement.style.setProperty(
      "--reading-line-height",
      preferences.lineHeight.toString()
    );
    document.documentElement.style.setProperty(
      "--reading-font-family",
      fontStack
    );

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      // ignore
    }
  }, [isMounted, preferences, storageKey]);

  const updatePreference = (updates: Partial<ReadingPreferences>) => {
    setPreferences((prev) => ({
      fontSize: clampFontSize(updates.fontSize ?? prev.fontSize),
      lineHeight: clampLineHeight(updates.lineHeight ?? prev.lineHeight),
      fontFamily: (updates.fontFamily as FontKey) ?? prev.fontFamily,
    }));
  };

  const fontOptions: { value: FontKey; label: string; sample: string }[] =
    React.useMemo(
      () => [
        {
          value: "sans",
          label:
            locale === "zh"
              ? "默认无衬线"
              : locale === "ja"
              ? "標準サンセリフ"
              : "Sans",
          sample: "Aa",
        },
        {
          value: "serif",
          label:
            locale === "zh"
              ? "衬线 Serif"
              : locale === "ja"
              ? "セリフ"
              : "Serif",
          sample: "Aa",
        },
        {
          value: "mono",
          label:
            locale === "zh"
              ? "等宽字体"
              : locale === "ja"
              ? "等幅"
              : "Mono",
          sample: "Aa",
        },
        {
          value: "kaiti",
          label: locale === "zh" ? "楷体" : "KaiTi",
          sample: "楷",
        },
        {
          value: "songti",
          label: locale === "zh" ? "宋体" : locale === "ja" ? "宋体" : "SongTi",
          sample: "宋",
        },
        {
          value: "heiti",
          label: locale === "zh" ? "黑体" : locale === "ja" ? "黑体" : "HeiTi",
          sample: "黑",
        },
      ],
      [locale]
    );

  return (
    <div className="hidden w-full justify-end gap-2 pb-6 lg:flex">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="shadow-sm">
            <SlidersHorizontal className="h-4 w-4" />
            <span>{copy.button}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{copy.heading}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => updatePreference(DEFAULT_PREFERENCES)}
            >
              <RotateCw className="mr-1 h-3.5 w-3.5" />
              {copy.reset}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{copy.fontSize}</span>
                <span className="font-medium text-foreground">
                  {preferences.fontSize}px
                </span>
              </div>
              <input
                type="range"
                min={14}
                max={22}
                step={1}
                value={preferences.fontSize}
                onChange={(event) =>
                  updatePreference({ fontSize: Number(event.target.value) })
                }
                className="w-full accent-primary"
                aria-label={copy.fontSize}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{copy.lineHeight}</span>
                <span className="font-medium text-foreground">
                  {preferences.lineHeight.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={1.3}
                max={2.1}
                step={0.05}
                value={preferences.lineHeight}
                onChange={(event) =>
                  updatePreference({ lineHeight: Number(event.target.value) })
                }
                className="w-full accent-primary"
                aria-label={copy.lineHeight}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{copy.fontFamily}</span>
                <span className="font-medium text-foreground">
                  {fontOptions.find((option) => option.value === preferences.fontFamily)
                    ?.label || preferences.fontFamily}
                </span>
              </div>
              <Select
                value={preferences.fontFamily}
                onValueChange={(value) =>
                  updatePreference({ fontFamily: value as FontKey })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={copy.fontFamily} />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span
                        className="inline-flex items-center gap-2"
                        style={{ fontFamily: FONT_FAMILIES[option.value] }}
                      >
                        <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs">
                          {option.sample}
                        </span>
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

