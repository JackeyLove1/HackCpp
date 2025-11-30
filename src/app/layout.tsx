import type { ReactNode } from "react";

// 引入全局样式（Tailwind v4 + Nextra）
// 之前只在 `src/app/[lang]/layout.tsx` 中引入，
// 导致 `/question` 这种不在 [lang] 下面的路由没有样式。
import "./[lang]/styles/index.css";
import "katex/dist/katex.min.css";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}


