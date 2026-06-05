import { describe, expect, it } from 'vitest'
import { classifyKrokiError, extractLine } from '@/lib/krokiError'

describe('extractLine', () => {
  it('pulls a line number from common Kroki messages', () => {
    expect(extractLine('Error line 3 in file: ...')).toBe(3)
    expect(extractLine('syntax error in line 2')).toBe(2)
    expect(extractLine('input:5:10: unexpected token')).toBe(5)
    expect(extractLine('第 7 行 有錯')).toBe(7)
  })

  it('returns null when no line is present', () => {
    expect(extractLine('something went wrong')).toBeNull()
    expect(extractLine('')).toBeNull()
  })
})

describe('classifyKrokiError', () => {
  it('classifies a fetch failure as network', () => {
    const e = classifyKrokiError({ networkError: true, body: 'Failed to fetch' })
    expect(e.kind).toBe('network')
    expect(e.line).toBeNull()
  })

  it('classifies unsupported-type HTTP statuses', () => {
    expect(classifyKrokiError({ status: 404, body: 'not found' }).kind).toBe('unsupported')
    expect(classifyKrokiError({ status: 503, body: '' }).kind).toBe('unsupported')
    expect(classifyKrokiError({ status: 200, body: 'Unsupported diagram type' }).kind).toBe('unsupported')
  })

  it('classifies a 400 with a line as syntax and extracts the line', () => {
    const e = classifyKrokiError({ status: 400, body: 'Error line 4: unexpected }' })
    expect(e.kind).toBe('syntax')
    expect(e.line).toBe(4)
    expect(e.raw).toContain('unexpected')
  })

  it('falls back to unknown', () => {
    expect(classifyKrokiError({ status: 418, body: 'teapot' }).kind).toBe('unknown')
  })
})
