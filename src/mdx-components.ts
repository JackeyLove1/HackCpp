import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'
import { Pre, withIcons } from 'nextra/components'
import { GitHubIcon } from 'nextra/icons'
import BilibiliVideo from '@/components/BilibiliVideo';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

export const useMDXComponents: typeof getDocsMDXComponents = () => ({
  ...getDocsMDXComponents({
    pre: withIcons(Pre, { js: GitHubIcon }),
  }),
  BilibiliVideo,
  Button,
  Link,
})
