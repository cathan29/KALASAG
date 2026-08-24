/**
 * Sanitizes raw API strings for preview/card views.
 *
 * @param {string} text - The raw text to sanitize.
 * @returns {string} The sanitized text.
 */
export const sanitizePreviewText = (text) => {
  if (text == null) {
    return '';
  }

  return text
    .replace(/&#x201C;|&#x201D;/g, '"')
    .replace(/&#xB0;/g, '°')
    .replace(/&#xD;|&#xA;|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};
