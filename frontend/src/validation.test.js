import { describe, expect, it } from 'vitest'
import { showTitleCounter, validateDescription, validateTitle } from './validation'

describe('validateTitle', () => {
  it('rejects empty and whitespace-only titles', () => {
    expect(validateTitle('')).not.toBe('')
    expect(validateTitle('   ')).not.toBe('')
  })

  it('trims before counting', () => {
    expect(validateTitle('  ok  ')).toBe('')
    expect(validateTitle(' ' + 'x'.repeat(120) + ' ')).toBe('')
  })

  it('rejects more than 120 characters', () => {
    expect(validateTitle('x'.repeat(121))).not.toBe('')
  })
})

describe('validateDescription', () => {
  it('allows empty and up to 1000 characters', () => {
    expect(validateDescription('')).toBe('')
    expect(validateDescription('x'.repeat(1000))).toBe('')
  })

  it('rejects more than 1000 characters', () => {
    expect(validateDescription('x'.repeat(1001))).not.toBe('')
  })
})

describe('showTitleCounter', () => {
  it('appears only as the title nears its limit', () => {
    expect(showTitleCounter('short')).toBe(false)
    expect(showTitleCounter('x'.repeat(100))).toBe(true)
  })
})
