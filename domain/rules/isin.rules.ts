// Sin dependencias: lo usan la acción del servidor que añade activos y el adaptador de Yahoo.

const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

/** Devuelve el ISIN en mayúsculas y sin espacios ni guiones, o null si el texto no tiene forma de ISIN. */
export function extractIsin(query: string): string | null {
  const compact = query.replace(/[\s-]/g, "").toUpperCase();
  return ISIN_PATTERN.test(compact) ? compact : null;
}

/** Comprueba el dígito de control del ISIN (Luhn sobre las letras convertidas a números: A=10 ... Z=35). */
export function hasValidIsinChecksum(isin: string): boolean {
  if (!ISIN_PATTERN.test(isin)) return false;

  const digits = isin
    .split("")
    .map((char) => (char >= "A" && char <= "Z" ? String(char.charCodeAt(0) - 55) : char))
    .join("");

  let sum = 0;
  let doubleNext = false;
  for (let index = digits.length - 1; index >= 0; index--) {
    let digit = Number(digits[index]);
    if (doubleNext) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleNext = !doubleNext;
  }
  return sum % 10 === 0;
}
