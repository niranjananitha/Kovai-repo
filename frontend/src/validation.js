// Client-side checks are only for a friendlier experience.
// The server repeats every check and is the real gatekeeper.
// These limits must match backend/app/tasks.py and backend/app/auth.py.
export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 1000
// Start showing the "n/120" counter when the title is this long.
export const TITLE_COUNTER_FROM = 100

export const NAME_MAX = 80
export const EMAIL_MAX = 255
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// Each validate function returns an error message, or '' when the value is fine.
export function validateTitle(title) {
  const trimmed = title.trim()
  if (!trimmed) return 'Please enter a title.'
  if (trimmed.length > TITLE_MAX) return `Title must be ${TITLE_MAX} characters or fewer.`
  return ''
}

export function validateDescription(description) {
  if (description.trim().length > DESCRIPTION_MAX) {
    return `Description must be ${DESCRIPTION_MAX} characters or fewer.`
  }
  return ''
}

export function showTitleCounter(title) {
  return title.trim().length >= TITLE_COUNTER_FROM
}

export function validateName(name) {
  const trimmed = name.trim()
  if (!trimmed) return 'Please enter your name.'
  if (trimmed.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`
  return ''
}

export function validateEmail(email) {
  const trimmed = email.trim()
  if (!trimmed) return 'Please enter your email.'
  if (trimmed.length > EMAIL_MAX || !EMAIL_PATTERN.test(trimmed)) return 'Enter a valid email address.'
  return ''
}

// The password is never trimmed: spaces can be part of it.
export function validatePassword(password, email = '') {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`
  if (password.length > PASSWORD_MAX) return `Use ${PASSWORD_MAX} characters or fewer.`
  if (email.trim() && password.toLowerCase() === email.trim().toLowerCase()) {
    return 'Your password must be different from your email.'
  }
  return ''
}

// Sign in only needs both fields filled in; the server decides if they are right.
export function validateLoginPassword(password) {
  return password ? '' : 'Please enter your password.'
}
