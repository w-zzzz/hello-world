#!/usr/bin/env -S tsx
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { INDICATORS } from '@quant-academy/indicators-ts';
import type { Bar } from '@quant-academy/indicators-ts/types';

const REPO_ROOT = resolve(import.meta.dirname ?? __dirname, '..');
const FIX_ROOT = resolve(REPO_ROOT, 'python/qa_indicators/qa_indicators/fixtures');

interface Golden {
  indicator: string;
  params: Record<string, string | number>;
  input: string;
  tolerance: { abs: number; rel: number };
  outputs: Record<string, (number | null)[]>;
}

function readJson<T>(path: string): T {
  if (!existsSync(path)) {
    console.error(`Missing fixture: ${path}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

function withinTolerance(a: number, b: number, abs: number, rel: number): boolean {
  const diff = Math.abs(a - b);
  return diff <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b)));
}

function main() {
  const { bars } = readJson<{ bars: Bar[] }>(resolve(FIX_ROOT, 'parity_input.json'));
  let totalPoints = 0;
  let totalIndicators = 0;
  for (const id of Object.keys(INDICATORS).sort()) {
    const golden = readJson<Golden>(resolve(FIX_ROOT, 'golden', `${id}.json`));
    const result = INDICATORS[id]({ bars, params: golden.params });
    for (const [col, expected] of Object.entries(golden.outputs)) {
      if (!Object.prototype.hasOwnProperty.call(result, col)) {
        console.error(`FAIL [${id}]: TS output missing column "${col}"`);
        process.exit(1);
      }
      const actual = result[col];
      if (actual.length !== expected.length) {
        console.error(`FAIL [${id}.${col}]: length mismatch ts=${actual.length} py=${expected.length}`);
        process.exit(1);
      }
      for (let i = 0; i < actual.length; i++) {
        const a = actual[i];
        const e = expected[i];
        if (a === null && e === null) {
          totalPoints++;
          continue;
        }
        if (a === null || e === null) {
          console.error(`FAIL [${id}.${col}][${i}]: null mismatch ts=${a} py=${e}`);
          process.exit(1);
        }
        if (!Number.isFinite(a) || !Number.isFinite(e)) {
          console.error(`FAIL [${id}.${col}][${i}]: non-finite ts=${a} py=${e}`);
          process.exit(1);
        }
        if (!withinTolerance(a, e, golden.tolerance.abs, golden.tolerance.rel)) {
          console.error(
            `FAIL [${id}.${col}][${i}]: expected=${e} got=${a} diff=${Math.abs(a - e)} ` +
              `tol_abs=${golden.tolerance.abs} tol_rel=${golden.tolerance.rel}`,
          );
          process.exit(1);
        }
        totalPoints++;
      }
    }
    totalIndicators++;
  }
  console.log(`OK: ${totalIndicators} indicators × ${totalPoints} points checked`);
}

main();
