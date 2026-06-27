/**
 * Convert Arabic numerals to English numerals
 * ٠١٢٣٤٥٦٧٨٩ → 0123456789
 */
export const toEnglishNumbers = (num: number | string): string => {
  const arabicToEnglish: { [key: string]: string } = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
  };

  return String(num).replace(/[٠-٩]/g, (char) => arabicToEnglish[char] || char);
};
