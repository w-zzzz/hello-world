import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TutorMessage } from '../tutor-message'

describe('TutorMessage', () => {
  it('escapes <img onerror> as text, does NOT create an img element', () => {
    const malicious = 'hello <img src=x onerror="alert(1)" />'
    const { container } = render(<TutorMessage content={malicious} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('img src=x')
  })

  it('does not render <iframe> from untrusted content', () => {
    const { container } = render(<TutorMessage content="see <iframe src=evil />" />)
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('does not render <script>', () => {
    const { container } = render(<TutorMessage content="<script>alert(1)</script>" />)
    expect(container.querySelector('script')).toBeNull()
  })

  it('renders inline math via KaTeX', () => {
    const { container } = render(<TutorMessage content="Pythagoras: $a^2 + b^2 = c^2$." />)
    expect(container.querySelector('.katex')).not.toBeNull()
  })

  it('renders block math via KaTeX', () => {
    const { container } = render(<TutorMessage content="$$E = mc^2$$" />)
    expect(container.querySelector('.katex-display, .katex')).not.toBeNull()
  })

  it('renders bold, lists, links', () => {
    const { container } = render(
      <TutorMessage content="**bold** and [link](https://example.com)" />,
    )
    expect(container.querySelector('strong')).not.toBeNull()
    const a = container.querySelector('a')
    expect(a?.getAttribute('href')).toBe('https://example.com')
    expect(a?.getAttribute('rel')).toContain('noopener')
  })

  it('does not interpret math inside backtick code', () => {
    const { container } = render(<TutorMessage content="`$x = 1$`" />)
    // Inside code, KaTeX should not have rendered
    const code = container.querySelector('code')
    expect(code?.textContent).toBe('$x = 1$')
  })
})
