/**
 * Frontend Security Utilities
 * Sanitizare input, validare, protectie XSS
 */

/** Sanitizeaza text - elimina tag-uri HTML si caractere periculoase */
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/** Truncheaza text la o lungime maxima */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength);
}

/** Valideaza email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

/** Valideaza parola (min 8, max 128, 1 majuscula, 1 minuscula, 1 cifra) */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: 'min8' };
  if (password.length > 128) return { valid: false, error: 'max128' };
  if (!/[A-Z]/.test(password)) return { valid: false, error: 'uppercase' };
  if (!/[a-z]/.test(password)) return { valid: false, error: 'lowercase' };
  if (!/\d/.test(password)) return { valid: false, error: 'digit' };

  const common = ['12345678', '123456789', '1234567890', 'password', 'qwerty123', 'abcdefgh'];
  if (common.includes(password.toLowerCase())) return { valid: false, error: 'common' };

  return { valid: true };
}

/** Valideaza numar de telefon MD */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // optional
  return /^\+?373\d{8}$|^\d{8,9}$/.test(phone.replace(/\s/g, ''));
}

/** Valideaza IDNO (13 cifre) */
export function isValidIDNO(idno: string): boolean {
  return /^\d{13}$/.test(idno.replace(/\s/g, ''));
}

/** Limita de caractere pentru campuri */
export const FIELD_LIMITS = {
  username: { min: 3, max: 100 },
  email: { max: 255 },
  password: { min: 8, max: 128 },
  phone: { max: 20 },
  fullName: { max: 200 },
  companyName: { max: 200 },
  idno: { max: 13 },
  iban: { max: 34 },
  chatMessage: { max: 2000 },
  documentTitle: { max: 300 },
  documentDesc: { max: 2000 },
} as const;
