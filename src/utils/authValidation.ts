const zeroWidthPattern = /[\u200B-\u200D\uFEFF]/g;
const repeatedWhitespacePattern = /\s+/g;

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const nameRegex = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]{1,79}$/u;

export function normalizeEmail(value: string) {
  return value.replace(zeroWidthPattern, '').trim().toLowerCase();
}

export function normalizeName(value: string) {
  return value.replace(zeroWidthPattern, '').trim().replace(repeatedWhitespacePattern, ' ');
}

export function isValidEmail(value: string) {
  return emailRegex.test(normalizeEmail(value));
}

export function isValidName(value: string) {
  return nameRegex.test(normalizeName(value));
}

export function isValidPassword(value: string) {
  return passwordRegex.test(value);
}
