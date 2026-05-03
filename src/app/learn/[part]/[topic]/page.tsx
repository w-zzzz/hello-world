import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import "katex/dist/katex.min.css";
import { loadTopicSource, listTopicSlugs } from "@/lib/mdx";
import { mdxOptions } from "@/lib/mdx-render";
import { mdxComponents } from "@/components/content/MDXComponents";
import { TopicHeader } from "@/components/learn/TopicHeader";
import { NextPrev } from "@/components/learn/NextPrev";
import { PrereqList } from "@/components/learn/PrereqList";
import { ReferencesPanel } from "@/components/learn/ReferencesPanel";
import { TOPIC_BY_SLUG, nextTopic, prevTopic } from "../../../../../content/curriculum";

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await listTopicSlugs();
  return slugs.map((s) => {
    const [part, topic] = s.split("/");
    return { part, topic };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ part: string; topic: string }>;
}) {
  const { part, topic } = await params;
  const slug = `${part}/${topic}`;
  const meta = TOPIC_BY_SLUG[slug];
  if (!meta) return { title: "Topic not found" };
  return {
    title: meta.title,
    description: meta.hook,
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ part: string; topic: string }>;
}) {
  const { part, topic } = await params;
  const slug = `${part}/${topic}`;
  const meta = TOPIC_BY_SLUG[slug];
  if (!meta) notFound();

  const loaded = await loadTopicSource(slug);
  if (!loaded) notFound();

  const { frontmatter, content } = loaded;
  const prev = prevTopic(slug);
  const next = nextTopic(slug);

  return (
    <article className="pt-32 pb-16">
      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 max-w-3xl">
          <TopicHeader topic={meta} />
          <PrereqList prereqs={meta.prereqs} />
          <div className="mt-12 prose-block">
            <MDXRemote source={content} options={mdxOptions} components={mdxComponents} />
          </div>
          <NextPrev prev={prev} next={next} />
        </div>
        <ReferencesPanel
          papers={frontmatter.papers ?? []}
          hf={frontmatter.hfResources ?? []}
          free={frontmatter.freeResources ?? []}
          researchers={frontmatter.researchers ?? []}
        />
      </div>
    </article>
  );
}
