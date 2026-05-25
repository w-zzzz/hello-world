import createMDX from '@next/mdx'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
}

export default withMDX(withNextIntl(nextConfig))
