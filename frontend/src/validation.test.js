import { describe, expect, it } from 'vitest'
import {
  showTitleCounter,
  validateDescription,
  validateEmail,
  validateLoginPassword,
  validateName,
  validatePassword,
  validateTitle,
} from './validation'

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

describe('validateName', () => {
  it('needs 1 to 80 characters after trimming', () => {
    expect(validateName('')).not.toBe('')
    expect(validateName('   ')).not.toBe('')
    expect(validateName('  Ada  ')).toBe('')
    expect(validateName('x'.repeat(80))).toBe('')
    expect(validateName('x'.repeat(81))).not.toBe('')
  })
})

describe('validateEmail', () => {
  it('accepts a normal address, with surrounding spaces', () => {
    expect(validateEmail('  ada@example.com ')).toBe('')
  })

  it('rejects empty and badly shaped addresses', () => {
    for (const bad of ['', '   ', 'ada', 'ada@', 'ada@example', '@example.com', 'a da@example.com']) {
      expect(validateEmail(bad)).not.toBe('')
    }
  })

  it('rejects more than 255 characters', () => {
    expect(validateEmail('x'.repeat(250) + '@example.com')).not.toBe('')
  })
})

describe('validatePassword', () => {
  it('needs 8 to 128 characters', () => {
    expect(validatePassword('1234567')).not.toBe('')
    expect(validatePassword('12345678')).toBe('')
    expect(validatePassword('x'.repeat(128))).toBe('')
    expect(validatePassword('x'.repeat(129))).not.toBe('')
  })

  it('does not trim: spaces count', () => {
    expect(validatePassword('  abcd  ')).toBe('')
    expect(validatePassword('        ')).toBe('')
  })

  it('has no composition rules', () => {
    expect(validatePassword('aaaaaaaa')).toBe('')
  })

  it('must differ from the email, ignoring case', () => {
    expect(validatePassword('ada@example.com', 'ada@example.com')).not.toBe('')
    expect(validatePassword('ADA@example.com', ' ada@example.com ')).not.toBe('')
    expect(validatePassword('ada@example.com')).toBe('')
  })
})

describe('validateLoginPassword', () => {
  it('only requires something to be typed', () => {
    expect(validateLoginPassword('')).not.toBe('')
    expect(validateLoginPassword('x')).toBe('')
  })
})
