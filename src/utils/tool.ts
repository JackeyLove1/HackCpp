/**
 * 安全分割 HTML 内容，避免切断 MathJax 公式
 * 会根据 <br> / <br/> / <br /> 换行符在非公式区域拆分为段落
 */
export const splitContentSafely = (
  htmlContent: string | null | undefined
): string[] => {
  if (!htmlContent) return [];

  const segments: string[] = [];
  let currentSegment = '';
  let inMath = false;
  let i = 0;

  while (i < htmlContent.length) {
    // 先处理 $$...$$ 这种块级公式分隔符
    if (htmlContent[i] === '$' && htmlContent[i + 1] === '$') {
      inMath = !inMath;
      currentSegment += '$$';
      i += 2;
      continue;
    }

    // 再处理单个 $...$ 行内公式分隔符
    if (htmlContent[i] === '$') {
      inMath = !inMath;
      currentSegment += htmlContent[i];
      i++;
      continue;
    }

    if (htmlContent.substring(i, i + 4).toLowerCase() === '<br>') {
      if (!inMath) {
        if (currentSegment.trim().length > 0) {
          segments.push(currentSegment);
          currentSegment = '';
        }
        i += 4;
      } else {
        currentSegment += ' ';
        i += 4;
      }
      continue;
    }

    if (
      htmlContent.substring(i, i + 5).toLowerCase() === '<br/>' ||
      htmlContent.substring(i, i + 5).toLowerCase() === '<br />'
    ) {
      const skip = htmlContent[i + 3] === '/' ? 5 : 6;
      if (!inMath) {
        if (currentSegment.trim().length > 0) {
          segments.push(currentSegment);
          currentSegment = '';
        }
        i += skip;
      } else {
        currentSegment += ' ';
        i += skip;
      }
      continue;
    }

    currentSegment += htmlContent[i];
    i++;
  }

  if (currentSegment.trim().length > 0) {
    segments.push(currentSegment);
  }

  return segments;
};


