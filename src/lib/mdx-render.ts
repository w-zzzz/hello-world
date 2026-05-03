import "server-only";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { MDXRemoteOptions } from "next-mdx-remote-client/rsc";

export const mdxOptions: MDXRemoteOptions = {
  parseFrontmatter: false,
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      [rehypeKatex, { strict: false, output: "html" }],
      [
        rehypePrettyCode,
        {
          theme: { dark: "github-dark-default", light: "github-light-default" },
          keepBackground: false,
        },
      ],
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: "anchor" } }],
    ],
  },
};
