export const isProbablyMarkdown = (txt: string): boolean => {
  const patterns: RegExp[] = [
    /^\s*#{1,6}\s+/m, // headings
    /^\s*>\s+/m, // blockquote
    /^\s*[-+*]\s+/m, // unordered list
    /^\s*\d+\.\s+/m, // ordered list
    /`{3,}/m, // fenced code block
    /\[.+?\]\(.+?\)/, // link
    /!\[.*?\]\(.+?\)/, // image
    /\*\*[^*]+\*\*/m, // bold
    /\*[^*]+\*/m, // italic
    /`{1,3}[^`]+`{1,3}/m, // inline code
    /<[^>]+>/m, // html tag
  ];
  return patterns.some((re) => re.test(txt));
};
