import { describe, expect, it } from 'vitest'
import { initials } from './format'

describe('initials', () => {
  it('uses first and last name', () => {
    expect(initials('Ada Lovelace')).toBe('AL')
    expect(initials('  ada  b  lovelace ')).toBe('AL')
  })

  it('uses the first two letters of a single name', () => {
    expect(initials('Ada')).toBe('AD')
  })

  it('falls back to the email, then to a question mark', () => {
    expect(initials('', 'zed@example.com')).toBe('Z')
    expect(initials(null, null)).toBe('?')
  })
})
