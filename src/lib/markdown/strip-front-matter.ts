const FRONT_MATTER_REGEX =
  /^\uFEFF?(?:\s*\r?\n)?---\s*(?:\r?\n|\r)([\s\S]*?)(?:\r?\n|\r)---\s*(?:\r?\n|\r)*/;

/**
 * Removes a leading YAML front matter block from markdown content.
 */
export const stripFrontMatter = (source?: string): string => {
  if (!source) return '';
  if (!source.trimStart().startsWith('---')) {
    return source;
  }

  return source.replace(FRONT_MATTER_REGEX, '').replace(/^\s*/, '');
};

