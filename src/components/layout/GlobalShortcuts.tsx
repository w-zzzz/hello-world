"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Keyboard, X } from "lucide-react";
import { CommandPalette } from "@/components/CommandPalette";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";

const SHORTCUTS: { keys: string[]; desc: string }[] = [
  { keys: ["⌘", "K"], desc: "Open command palette (Ctrl+K on Windows)" },
  { keys: ["/"], desc: "Focus search" },
  { keys: ["?"], desc: "Show this help" },
  { keys: ["j"], desc: "Next topic (on /learn/*)" },
  { keys: ["k"], desc: "Previous topic (on /learn/*)" },
  { keys: ["g", "h"], desc: "Go home" },
  { keys: ["g", "m"], desc: "Go to map" },
  { keys: ["g", "d"], desc: "Go to dashboard" },
  { keys: ["g", "r"], desc: "Go to researchers" },
];

export function GlobalShortcuts() {
  const { helpOpen, setHelpOpen } = useKeyboardNav();
  const reduce = useReducedMotion();

  return (
    <>
      <CommandPalette />

      <Dialog.Root open={helpOpen} onOpenChange={setHelpOpen}>
        <Dialog.Portal>
          <AnimatePresence>
            {helpOpen && (
              <>
                <Dialog.Overlay asChild forceMount>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.18 }}
                    className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
                  />
                </Dialog.Overlay>
                <Dialog.Content asChild forceMount aria-describedby={undefined}>
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.99 }}
                    transition={{ duration: reduce ? 0 : 0.22, ease: [0.32, 0.72, 0, 1] }}
                    className="fixed left-1/2 top-[16vh] z-[70] -translate-x-1/2 w-[92vw] max-w-md rounded-2xl border border-soft surface shadow-2xl shadow-black/30 overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-soft">
                      <Dialog.Title className="inline-flex items-center gap-2 text-sm font-semibold">
                        <Keyboard className="h-4 w-4 text-[var(--color-accent)]" />
                        Keyboard shortcuts
                      </Dialog.Title>
                      <Dialog.Close
                        aria-label="Close"
                        className="grid place-items-center h-7 w-7 rounded-md text-[var(--color-muted-fg)] hover:text-[var(--color-fg)] hover:bg-[var(--color-muted)]"
                      >
                        <X className="h-4 w-4" />
                      </Dialog.Close>
                    </div>
                    <ul className="p-3">
                      {SHORTCUTS.map((s) => (
                        <li
                          key={s.desc}
                          className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md text-sm"
                        >
                          <span className="text-[var(--color-muted-fg)]">{s.desc}</span>
                          <span className="flex items-center gap-1">
                            {s.keys.map((k, i) => (
                              <kbd
                                key={i}
                                className="rounded border border-soft bg-[var(--color-bg)] px-1.5 py-0.5 text-[11px] font-mono text-[var(--color-fg)]"
                              >
                                {k}
                              </kbd>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </Dialog.Content>
              </>
            )}
          </AnimatePresence>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
