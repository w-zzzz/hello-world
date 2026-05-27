import { describe, expect, it } from 'vitest'
import { stripMdx } from '../prompts/lesson'

describe('stripMdx', () => {
  it('drops front matter', () => {
    expect(stripMdx('---\ntitle: A\n---\nhello')).toBe('hello')
  })

  it('drops import + export lines', () => {
    expect(stripMdx("import x from 'y'\nexport const a = 1\nhello")).toBe('hello')
  })

  it('strips simple JSX tags but keeps inner text', () => {
    expect(stripMdx('<Chart symbol="SPY" />a<Pitfall>b</Pitfall>')).toBe('ab')
  })

  it('strips script blocks fully', () => {
    expect(stripMdx('before<script>alert(1)</script>after')).toBe('beforeafter')
  })

  it('strips </script > with whitespace', () => {
    expect(stripMdx('a<script>x</script >b')).toBe('ab')
  })

  it('defeats nested-tag injection (single regex would leave <script>)', () => {
    expect(stripMdx('a<scr<script>ipt>alert(1)</script>b')).not.toContain('<script')
  })

  it('strips style blocks', () => {
    expect(stripMdx('a<style>.x{}</style>b')).toBe('ab')
  })

  it('handles unterminated script by dropping the rest', () => {
    expect(stripMdx('keep<script>unterminated')).toBe('keep')
  })

  it('collapses 3+ blank lines into one blank line', () => {
    expect(stripMdx('a\n\n\n\nb')).toBe('a\n\nb')
  })
})
