"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { TOPICS, nextTopic, prevTopic } from "../../content/curriculum";

/**
 * Global keyboard nav. Returns control state for the help dialog so a parent
 * component (the GlobalShortcuts mount) can render it.
 *
 * Bindings:
 *  j / k     prev / next topic on /learn/*
 *  ?         open help dialog
 *  g h       home
 *  g m       map
 *  g d       dashboard
 *  g r       researchers
 *
 * All bindings suppressed when the focus is in an input / textarea /
 * contenteditable, or when a modal dialog is open (best-effort detection).
 */
export function useKeyboardNav() {
  const router = useRouter();
  const path = usePathname();
  const [helpOpen, setHelpOpen] = React.useState(false);
  // Mirror current pathname into a ref so the global listener (bound once)
  // always sees the latest value without re-binding on every navigation.
  const pathRef = React.useRef(path);
  React.useEffect(() => {
    pathRef.current = path;
  }, [path]);

  React.useEffect(() => {
    let chord: "g" | null = null;
    let chordTimer: number | null = null;

    const clearChord = () => {
      chord = null;
      if (chordTimer !== null) {
        window.clearTimeout(chordTimer);
        chordTimer = null;
      }
    };

    const inEditable = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
      if (el.isContentEditable) return true;
      return false;
    };

    const isModalOpen = () =>
      !!document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'
      );

    const goLearn = (dir: "next" | "prev") => {
      const m = pathRef.current.match(/^\/learn\/([^/]+)\/([^/?#]+)/);
      let slug: string | null = m ? `${m[1]}/${m[2]}` : null;
      if (!slug) slug = TOPICS[0].slug;
      const target = dir === "next" ? nextTopic(slug) : prevTopic(slug);
      if (target) router.push(`/learn/${target.slug}`);
    };

    const handler = (e: KeyboardEvent) => {
      // Always allow Cmd/Ctrl combos to fall through (palette etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (inEditable(e.target)) return;
      if (isModalOpen()) return;

      const k = e.key;

      // Chord: g + (h|m|d|r)
      if (chord === "g") {
        if (k === "h") { e.preventDefault(); router.push("/"); clearChord(); return; }
        if (k === "m") { e.preventDefault(); router.push("/map"); clearChord(); return; }
        if (k === "d") { e.preventDefault(); router.push("/dashboard"); clearChord(); return; }
        if (k === "r") { e.preventDefault(); router.push("/researchers"); clearChord(); return; }
        // any other key cancels chord
        clearChord();
        return;
      }

      if (k === "g") {
        chord = "g";
        if (chordTimer !== null) window.clearTimeout(chordTimer);
        chordTimer = window.setTimeout(() => clearChord(), 1200);
        return;
      }

      if (k === "?" || (k === "/" && e.shiftKey)) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      if (k === "j" || k === "J") {
        if (pathRef.current.startsWith("/learn/")) {
          e.preventDefault();
          goLearn("next");
        }
        return;
      }
      if (k === "k" || k === "K") {
        if (pathRef.current.startsWith("/learn/")) {
          e.preventDefault();
          goLearn("prev");
        }
        return;
      }

      if (k === "Escape") {
        setHelpOpen(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearChord();
    };
  }, [router]);

  return { helpOpen, setHelpOpen };
}
