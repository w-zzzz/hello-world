"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { patchProgress, useTopicProgress } from "@/hooks/useProgress";

/** Tracks reading progress, persists to DB every 6s, and renders a top progress bar. */
export function ScrollDepthTracker({ slug }: { slug: string }) {
  const { scrollYProgress } = useScroll();
  const x = useSpring(scrollYProgress, { stiffness: 220, damping: 32 });
  const { progress, mutate } = useTopicProgress(slug);
  const lastPersistedRef = React.useRef(0);
  const lastSentRef = React.useRef(0);
  const restoredRef = React.useRef(false);

  // Restore scroll position once the saved depth loads.
  React.useEffect(() => {
    if (restoredRef.current) return;
    if (!progress) return;
    if (progress.scrollDepth > 0.05 && progress.scrollDepth < 0.95) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: progress.scrollDepth * max, behavior: "instant" as ScrollBehavior });
    }
    restoredRef.current = true;
  }, [progress]);

  // Persist throttled to once every 6 seconds.
  React.useEffect(() => {
    const interval = setInterval(() => {
      const v = scrollYProgress.get();
      if (Math.abs(v - lastSentRef.current) < 0.04) return;
      lastSentRef.current = v;
      lastPersistedRef.current = Date.now();
      patchProgress(slug, { scrollDepth: v }).then(() => mutate()).catch(() => {});
    }, 6000);
    return () => clearInterval(interval);
  }, [slug, scrollYProgress, mutate]);

  return (
    <motion.div
      className="fixed top-0 inset-x-0 h-[2px] origin-left z-[60] bg-[var(--color-accent)]"
      style={{ scaleX: x }}
      aria-hidden
    />
  );
}
