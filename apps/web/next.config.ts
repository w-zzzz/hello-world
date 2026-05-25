import createMDX from '@next/mdx'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

// Turbopack requires string-based plugin specifiers (functions aren't serializable).
const withMDX = createMDX({
  options: {
    remarkPlugins: [['remark-math']],
    rehypePlugins: [['rehype-katex']],
  },
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
}

export default withMDX(withNextIntl(nextConfig))
