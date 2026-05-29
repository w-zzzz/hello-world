#!/usr/bin/env python3
"""Detect ASCII '"' inside MDX JSX attribute values that would close the attribute prematurely.

Run: python3 scripts/check-mdx-attrs.py
Self-test: python3 scripts/check-mdx-attrs.py --self-test
Exit: 0 if clean, 1 if any issues found.
"""

# This file intentionally embeds "ambiguous" Unicode (full-width punctuation in
# self-test fixtures, curly/CJK quote suggestions in messages) — that is the
# domain it lints. Disable RUF001 for the whole file rather than per line.
# ruff: noqa: RUF001
import glob
import re
import sys

# Attributes the project uses on JSX components in MDX. Add new ones here as components grow.
ATTRS = (
    "title",
    "question",
    "explanation",
    "placeholder",
    "label",
    "note",
    "caption",
    "description",
)
ATTR_OPEN = re.compile(r"\b(" + "|".join(ATTRS) + r')="')

# Safe characters that may follow the closing `"` of a JSX attribute value.
_SAFE_AFTER = " \t\n\r/>}"


def _scan_line(line):
    """Yield (col, snippet) tuples for each broken attribute on a single line.

    Heuristic: for each `name="` opener, find the next `"`. If the character that
    follows that inner `"` is NOT a JSX-attribute terminator (whitespace, `/`,
    `>`, `}`, or end-of-line), the inner `"` is interpreted by the parser as
    part of the attribute name region — i.e., the attribute value contains an
    unescaped ASCII double-quote that breaks MDX.
    """
    findings = []
    for m in ATTR_OPEN.finditer(line):
        start = m.end()  # position right after the opening "
        rest = line[start:]
        idx = rest.find('"')
        if idx == -1:
            continue  # closing " on a later line; skip (rare in MDX)
        after = rest[idx + 1 : idx + 2]
        # Safe terminators after the closing ": whitespace, /, >, }, end of line.
        # If `after` is anything else (alphanumerics, CJK, punctuation, etc.),
        # that means the `"` we found is actually a stray inner quote and the
        # real attribute close is further along — the bug.
        if not after or after in _SAFE_AFTER:
            continue  # legitimate close
        col = start + idx + 1
        findings.append((col, line.rstrip("\n")))
    return findings


def scan_file(path):
    issues = []
    in_fence = False
    with open(path, encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            stripped = line.lstrip()
            # crude code-fence handling
            if stripped.startswith("```"):
                in_fence = not in_fence
                continue
            if in_fence:
                continue
            # skip JSX/JS line comments
            if stripped.startswith("{/*") or stripped.startswith("//") or stripped.startswith("/*"):
                continue
            for col, text in _scan_line(line):
                issues.append((lineno, col, text))
    return issues


def self_test():
    # Patterns that MUST be flagged
    bad = [
        '<Pitfall title="Don\'t equate "more signals" with "x">',
        '  question="为什么人们常说 MFI 是"资金流量版的 RSI"？"',
        '  explanation="均价低于 VWAP 就等于"成交在均值之下"。"',
    ]
    # Patterns that MUST NOT be flagged
    good = [
        '<Quiz id="A-01-q1" question="What is X?" answer={1} />',
        '<Quiz options={["one","two","three"]} />',
        'title="Don\'t worry about it"',  # single quote inside is fine
        '<Pitfall title="Common pitfall">',
        '  question="Simple question?"',
        '<Foo title="hello" note="world" />',
    ]

    def check(line):
        # Apply identical logic to a single-line string.
        # Skip the fence/comment guards because the test strings are bare JSX.
        return bool(_scan_line(line))

    failures = []
    for line in bad:
        if not check(line):
            failures.append(f"FALSE NEGATIVE: {line!r} should have been flagged")
    for line in good:
        if check(line):
            failures.append(f"FALSE POSITIVE: {line!r} should NOT have been flagged")

    if failures:
        for f in failures:
            print(f, file=sys.stderr)
        print(f"self-test FAIL ({len(failures)} failures)", file=sys.stderr)
        sys.exit(1)
    print("self-test PASS")
    sys.exit(0)


def main():
    if "--self-test" in sys.argv:
        self_test()
        return

    files = sorted(glob.glob("packages/content/lessons/**/*.mdx", recursive=True))
    total = 0
    for f in files:
        bad = scan_file(f)
        for lineno, col, text in bad:
            print(
                f"{f}:{lineno}:{col}: nested '\"' in JSX attribute value -- "
                f"use '‘’' (en) or '「」' (zh) instead"
            )
            print(f"  | {text.strip()[:140]}")
            total += 1
    if total:
        print(
            f"\nFOUND {total} broken MDX attribute(s) across {len(files)} file(s).",
            file=sys.stderr,
        )
        print(
            'Fix tip: replace inner ASCII " with single quotes (en) or '
            "full-width 「」 (zh) -- see ADR M7 § fixes.",
            file=sys.stderr,
        )
        sys.exit(1)
    print(f"checked {len(files)} MDX file(s) -- 0 issues")
    sys.exit(0)


if __name__ == "__main__":
    main()
