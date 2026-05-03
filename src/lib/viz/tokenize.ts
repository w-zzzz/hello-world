/** A tiny BPE tokenizer demo. Not a real GPT-2 tokenizer (no byte-level
 *  pre-tokenization, no GPT-2 vocab) — instead a hand-curated 200-merge table
 *  that gives realistic token splits for English and demonstrates how merges
 *  interact. Good enough for illustration; ~5KB shipped. */

const MERGES_TXT = `t h
i n
a n
e r
o n
r e
e n
e d
o u
i s
i ng
o r
en t
i t
e s
i on
to
i s
on g
ed
in g
re
te
le
co
of
in
to
ar
or
nd
me
ti
he
ha
ic
the
on
an
en
re
er
es
in
ed
ti on
in g
e d
i ng
n d
i s
e r
o ut
o n
o r
e n
ar e
m e
of
fo r
b e
c on
n e
h is
he r
m a
o ne
co m
ti me
no t
b ut
yo u
n ow
he ll
o ld
go od
b ad
m ake
m ade
s ee
g et
s ay
t hat
this
the y
the m
the re
w h ich
w h en
w h o
w h at
w h ere
w h y
w it h
w it hout
o ver
u nder
b et we en
on ly
m any
some
much
mo re
le ss
high
low
fast
slow
big
small
all
any
each
every
so me
no
o ne
two
three
four
five
ten
do g
ca t
ho me
ho use
ca r
day
night
year
week
mon th
hou r
m in ute
sec ond
ti me
mod el
neur al
net work
deep
le arn ing
ma chine
artific ial
intelligence
trans former
attent ion
emb ed ding
to ken
tra in
val id
test
data
batch
loss
gra di ent
op tim iz er
acc uracy
inf er ence
te xt
im age
vid eo
au dio
mod al
gen er ate
re cur rent
con vol ut ional
pool ing
soft max
re lu
sig moid
tan h
norm al iz ation
re sid ual
en cod er
de cod er
self att ent ion`;

type Pair = [string, string];

function loadMerges(): Pair[] {
  return MERGES_TXT.trim()
    .split(/\n+/)
    .map((line) => line.trim().split(/\s+/) as Pair)
    .filter((p) => p.length === 2);
}

const MERGES = loadMerges();
const RANK = new Map<string, number>(MERGES.map(([a, b], i) => [`${a} ${b}`, i] as const));

export type Token = {
  text: string;
  id: number; // hashed id (illustrative)
};

function toBytes(s: string): string[] {
  // Treat each character as a token start, and represent leading space as 'Ġ' so
  // BPE merges can group across word boundaries (in style of GPT-2).
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === " ") out.push("Ġ");
    else if (ch === "\n") out.push("\n");
    else out.push(ch);
  }
  return out;
}

function bpe(tokens: string[]): string[] {
  let arr = [...tokens];
  while (true) {
    let bestIdx = -1;
    let bestRank = Infinity;
    for (let i = 0; i < arr.length - 1; i++) {
      const r = RANK.get(`${arr[i]} ${arr[i + 1]}`);
      if (r !== undefined && r < bestRank) {
        bestRank = r;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    arr = [
      ...arr.slice(0, bestIdx),
      arr[bestIdx] + arr[bestIdx + 1],
      ...arr.slice(bestIdx + 2),
    ];
  }
  return arr;
}

function djb2(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0xffffff;
  return h;
}

export function tokenize(text: string): Token[] {
  if (!text) return [];
  // split on whitespace boundaries, but preserve leading spaces via Ġ
  const segments: string[][] = [];
  const re = /(\s+|\S+)/g;
  let m: RegExpExecArray | null;
  let pendingLeadingSpace = false;
  while ((m = re.exec(text)) !== null) {
    const seg = m[0];
    if (/^\s+$/.test(seg)) {
      pendingLeadingSpace = true;
      continue;
    }
    const bytes = toBytes((pendingLeadingSpace ? " " : "") + seg);
    segments.push(bytes);
    pendingLeadingSpace = false;
  }
  const tokens: Token[] = [];
  for (const seg of segments) {
    const merged = bpe(seg);
    for (const t of merged) {
      const display = t.replace(/Ġ/g, "·");
      tokens.push({ text: display, id: djb2(t) });
    }
  }
  return tokens;
}
