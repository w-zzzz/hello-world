import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { TOPICS } from "../content/curriculum";

const url = (process.env.DATABASE_URL ?? "file:./prisma/dev.db").replace(/^file:/, "");
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(`Seeding ${TOPICS.length} topics into ${url}…`);
  for (const t of TOPICS) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {
        partSlug: t.partSlug,
        partIndex: t.partIndex,
        topicIndex: t.topicIndex,
        title: t.title,
        hook: t.hook,
        estMinutes: t.estMinutes,
        hasHeroViz: t.hasHeroViz,
        vizKey: t.vizKey ?? null,
        prereqs: JSON.stringify(t.prereqs),
      },
      create: {
        slug: t.slug,
        partSlug: t.partSlug,
        partIndex: t.partIndex,
        topicIndex: t.topicIndex,
        title: t.title,
        hook: t.hook,
        estMinutes: t.estMinutes,
        hasHeroViz: t.hasHeroViz,
        vizKey: t.vizKey ?? null,
        prereqs: JSON.stringify(t.prereqs),
      },
    });
  }
  console.log("Done.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
