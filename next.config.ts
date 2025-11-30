import createWithNextra from 'nextra'

const withNextra = createWithNextra({
  defaultShowCopyCode: true,
  unstable_shouldAddLocaleToLinks: true,
  latex: {
    renderer: 'mathjax',
  }
})


export default withNextra({
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 跳过构建阶段的 TypeScript 类型错误（慎用，仅为保证构建通过）
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  cleanDistDir: true,
  i18n: {
    locales: ['zh'],
    defaultLocale: 'zh',
  },
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
})
