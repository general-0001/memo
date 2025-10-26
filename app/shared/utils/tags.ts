const TAG_PATTERN = /#([\p{L}\p{N}_-]+)/giu

export const extractTags = (text?: string | null): string[] => {
  if (!text) {
    return []
  }
  const tags = new Set<string>()
  let match: RegExpExecArray | null = null
  while ((match = TAG_PATTERN.exec(text))) {
    tags.add(`#${match[1]}`)
  }
  return Array.from(tags.values())
}
