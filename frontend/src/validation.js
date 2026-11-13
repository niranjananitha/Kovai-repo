// Client-side checks are only for a friendlier experience.
// The server repeats every check and is the real gatekeeper.
export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 1000
// Start showing the "n/120" counter when the title is this long.
export const TITLE_COUNTER_FROM = 100

// Returns an error message, or '' when the title is fine.
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
