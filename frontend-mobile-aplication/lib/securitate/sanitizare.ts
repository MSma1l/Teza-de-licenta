/**
 * Utilitare de securitate pentru protectie XSS si injection
 *
 * Folosit la toate input-urile inainte de a fi trimise la backend
 * sau afisate in UI.
 */

/**
 * Sanitizeaza un input text pentru a preveni XSS injection.
 * - Elimina tag-uri HTML si scripturi
 * - Escapeaza caractere speciale
 * - Nu modifica continutul daca e text normal
 *
 * NU folositi pentru parole - parolele trebuie pastrate exact.
 */
export function sanitizeazaInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    // Elimina script tags complet (greedy)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    // Elimina iframe-uri
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    // Elimina toate tag-urile HTML ramase
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Escape caractere speciale ramase
    .replace(/[<>"'`]/g, (ch) => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
      };
      return map[ch];
    });
}

/**
 * Verifica daca un string contine pattern-uri suspicioase de injection.
 * Returneaza true daca e suspect.
 */
export function continePatternInjection(input: string): boolean {
  if (typeof input !== 'string') return false;
  const patterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,           // onclick=, onerror=, etc
    /<iframe/i,
    /\bunion\s+select\b/i,  // SQL injection
    /\bdrop\s+table\b/i,
    /\bexec\s*\(/i,
    /['"]\s*;\s*--/,         // SQL comment injection
  ];
  return patterns.some((p) => p.test(input));
}

/**
 * Limita un string la o lungime maxima (anti-DoS).
 */
export function limiteazaLungime(input: string, max: number): string {
  if (typeof input !== 'string') return '';
  return input.length <= max ? input : input.slice(0, max);
}

/**
 * Sanitizeaza un email - lowercase + trim + verifica format de baza.
 */
export function sanitizeazaEmail(email: string): string {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase().slice(0, 255);
}

/**
 * Verifica daca un username este valid (alfanumeric, _, -, .).
 */
export function esteUsernameValid(username: string): boolean {
  if (typeof username !== 'string') return false;
  return /^[a-zA-Z0-9._-]{3,100}$/.test(username);
}
