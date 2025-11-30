import type { I18nLangAsyncProps, I18nLangKeys } from '@/i18n';

import type { Metadata } from 'next';

import type { ReactNode } from 'react';
import { CustomFooter } from '@/components/CustomFooter';

import { useServerLocale } from '@/hooks';
import LocaleToggle from '@/widgets/locale-toggle';
import ThemeToggle from '@/widgets/theme-toggle';
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';
import { Footer, LastUpdated, Layout, Navbar } from 'nextra-theme-docs';
import { Banner, Head, MathJaxContext, Search } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';

import { getDictionary, getDirection } from '../_dictionaries/get-dictionary';
import { ThemeProvider } from './_components/ThemeProvider';
import './styles/index.css';
import { Analytics } from '@vercel/analytics/react';
import 'katex/dist/katex.min.css';
import { Toaster } from '@/components/ui/toaster';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  // Define your metadata here
  // For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
  metadataBase: new URL('https://nextjs-nextra-starter-green.vercel.app'),
  icons: '/img/favicon.svg',
} satisfies Metadata;

const repo = 'https://github.com/JackeyLove1/KaoYanXueTang';

const CustomBanner = async ({ lang }: I18nLangAsyncProps) => {
  const { t } = await useServerLocale(lang);
  return (
    <Banner storageKey="starter-banner">
      <div className="flex justify-center items-center gap-1">
        {t('banner.title')}{' '}
        <a
          className="max-sm:hidden text-warning hover:underline"
          target="_blank"
          href={repo}
        >
          {t('banner.more')}
        </a>
      </div>
    </Banner>
  );
};

const CustomNavbar = async ({ lang }: I18nLangAsyncProps) => {
  const { t } = await useServerLocale(lang);
  return (
    <Navbar
      logo={<span>{t('systemTitle')}</span>}
      logoLink={`/${lang}`}
      projectLink={repo}
    >
      <>
        <LocaleToggle className="max-md:hidden" />
        <ThemeToggle className="max-md:hidden" />
      </>
    </Navbar>
  );
};

const BaiduTrack = () => {
  return (
    <>
      <Script strategy="afterInteractive">
        {`
         var _hmt = _hmt || [];
        (function() {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?8269f3757a03a04bc4a6e529373f4667";
        var s = document.getElementsByTagName("script")[0]; 
        s.parentNode.insertBefore(hm, s);
        })();
        `}
      </Script>
    </>
  );
};

interface Props {
  children: ReactNode;
  params: Promise<{ lang: I18nLangKeys }>;
}

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const pageMap = await getPageMap(lang);

  const title = 'My Nextra Starter';
  const description = 'A Starter template with Next.js, Nextra';

  const { t } = await useServerLocale(lang);

  return (
    <>
      <Head
      // ... Your additional head options
      >
        {/* <title>{asPath !== '/' ? `${normalizePagesResult.title} - ${title}` : title}</title> */}
        <meta property="og:title" content={title} />
        <meta name="description" content={description} />
        <meta property="og:description" content={description} />
        <link rel="canonical" href={repo} />
      </Head>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        storageKey="starter-theme-provider"
        disableTransitionOnChange
      >
        <MathJaxContext>
          <Layout
            banner={<CustomBanner lang={lang} />}
            navbar={<CustomNavbar lang={lang} />}
            lastUpdated={<LastUpdated></LastUpdated>}
            editLink={null}
            docsRepositoryBase="https://github.com/JackeyLove1/KaoYanXueTang"
            footer={
              <Footer className="bg-background py-5!">
                <CustomFooter />
              </Footer>
            }
            search={<Search />}
            i18n={[
              { locale: 'en', name: 'English' },
              { locale: 'zh', name: '简体中文' },
            ]}
            pageMap={pageMap}
            feedback={{ content: '' }}
          // ... Your additional layout options
          >
            {children}
          </Layout>
        </MathJaxContext>
      </ThemeProvider>
      <Toaster />
      <GoogleAnalytics gaId="G-1QQ3Y1H4F4" />
      <BaiduTrack />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
