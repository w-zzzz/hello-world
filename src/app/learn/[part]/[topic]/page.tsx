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
import { ScrollDepthTracker } from "@/components/learn/ScrollDepthTracker";
import { QuizBlock } from "@/components/learn/QuizBlock";
import { RelatedTopics } from "@/components/learn/RelatedTopics";
import { TableOfContents } from "@/components/learn/TableOfContents";
import { extractHeadings } from "@/lib/headings";
import { estimateReadingMinutes } from "@/lib/reading-time";
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
  const readingMinutes = estimateReadingMinutes(content);
  const headings = extractHeadings(content);

  return (
    <article className="pt-32 pb-16">
      <ScrollDepthTracker slug={slug} />
      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-[1fr_280px] xl:grid-cols-[220px_1fr_280px]">
        {/* TOC sidebar — appears on xl viewports as the leftmost column. */}
        <aside className="hidden xl:block xl:sticky xl:top-24 xl:self-start xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto pr-2 -ml-2">
          <TableOfContents headings={headings} />
        </aside>

        <div className="min-w-0 max-w-3xl">
          <TopicHeader topic={meta} readingMinutes={readingMinutes} />
          <PrereqList prereqs={meta.prereqs} />
          <div className="mt-12 prose-block">
            <MDXRemote source={content} options={mdxOptions} components={mdxComponents} />
          </div>
          {frontmatter.quiz && frontmatter.quiz.length > 0 && (
            <QuizBlock topicSlug={slug} questions={frontmatter.quiz} />
          )}
          <RelatedTopics slug={slug} />
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
