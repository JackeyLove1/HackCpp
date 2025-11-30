'use client';

import { useAISettingsStore } from '@/stores/aiSettingsStore';
import { Settings, X } from 'lucide-react';
import { useState } from 'react';

interface AISettingsModalProps {
  locale: string;
}

export function AISettingsModal({ locale }: AISettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings, resetSettings } = useAISettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);

  const labels = {
    title: locale === 'zh' ? 'AI 设置' : locale === 'ja' ? 'AI 設定' : 'AI Settings',
    baseUrl: locale === 'zh' ? 'Base URL' : locale === 'ja' ? 'Base URL' : 'Base URL',
    apiKey: locale === 'zh' ? 'API Key' : locale === 'ja' ? 'API キー' : 'API Key',
    model: locale === 'zh' ? '模型' : locale === 'ja' ? 'モデル' : 'Model',
    save: locale === 'zh' ? '保存' : locale === 'ja' ? '保存' : 'Save',
    reset: locale === 'zh' ? '重置' : locale === 'ja' ? 'リセット' : 'Reset',
    cancel: locale === 'zh' ? '取消' : locale === 'ja' ? 'キャンセル' : 'Cancel',
    openSettings:
      locale === 'zh' ? '打开AI设置' : locale === 'ja' ? 'AI設定を開く' : 'Open AI Settings',
    baseUrlPlaceholder: 'https://api.openai.com/v1',
    apiKeyPlaceholder:
      locale === 'zh' ? '输入你的 API Key' : locale === 'ja' ? 'APIキーを入力' : 'Enter your API Key',
    modelPlaceholder:
      locale === 'zh'
        ? '例如: gpt-4o-mini'
        : locale === 'ja'
        ? '例: gpt-4o-mini'
        : 'e.g., gpt-4o-mini',
  };

  const handleOpen = () => {
    setLocalSettings(settings);
    setIsOpen(true);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setIsOpen(false);
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings(useAISettingsStore.getState().settings);
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-md p-2 hover:bg-accent"
        aria-label={labels.openSettings}
      >
        <Settings className="h-5 w-5" />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background text-foreground p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{labels.title}</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-1.5 hover:bg-accent"
            aria-label={labels.cancel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">{labels.baseUrl}</label>
            <input
              type="text"
              value={localSettings.baseUrl}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, baseUrl: e.target.value })
              }
              placeholder={labels.baseUrlPlaceholder}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">{labels.apiKey}</label>
            <input
              type="password"
              value={localSettings.apiKey}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, apiKey: e.target.value })
              }
              placeholder={labels.apiKeyPlaceholder}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block text-foreground">{labels.model}</label>
            <input
              type="text"
              value={localSettings.model}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, model: e.target.value })
              }
              placeholder={labels.modelPlaceholder}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={handleReset}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {labels.reset}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {labels.cancel}
          </button>
          <button
            onClick={handleSave}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {labels.save}
          </button>
        </div>
      </div>
    </>
  );
}
