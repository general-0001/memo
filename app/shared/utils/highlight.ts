const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export type HighlightSegment = {
  text: string
  active: boolean
}

/**
 * Splits text into highlight segments using the provided query.
 * Returns a single inactive segment when the query is empty.
 */
export const buildHighlightSegments = (text: string, query: string): HighlightSegment[] => {
  if (!query.trim()) {
    return [{ text, active: false }]
  }

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')

  return text
    .split(regex)
    .map<HighlightSegment>((segment, index) => ({
      text: segment,
      active: index % 2 === 1,
    }))
    .filter((segment) => segment.text.length > 0)
}
