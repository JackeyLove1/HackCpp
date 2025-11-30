"use client";

import { LOCALE_NAMES, LOCALES, Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  value: Record<string, string>;
  onChange: (locale: Locale, value: string) => void;
  description?: string;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
};

const labelForLocale = (locale: Locale) =>
  LOCALE_NAMES[locale] ? `${LOCALE_NAMES[locale]} (${locale})` : locale;

export function LocalizedFieldGroup({
  label,
  value,
  onChange,
  description,
  textarea,
  rows = 2,
  placeholder,
}: Props) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {LOCALES.map((locale) => (
          <label key={locale} className="flex flex-col gap-1 text-xs font-medium">
            <span className="text-muted-foreground">{labelForLocale(locale)}</span>
            {textarea ? (
              <textarea
                className={cn(
                  'min-h-[60px] rounded-md border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                  'resize-y'
                )}
                rows={rows}
                value={value[locale] ?? ''}
                placeholder={placeholder}
                onChange={(event) => onChange(locale, event.target.value)}
              />
            ) : (
              <input
                className="rounded-md border bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={value[locale] ?? ''}
                placeholder={placeholder}
                onChange={(event) => onChange(locale, event.target.value)}
              />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
