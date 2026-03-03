// Clamp nota entre 0 e 10, retorna string vazia se input vazio
export function clampNota(value) {
  if (value === '' || value === null || value === undefined) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return Math.min(10, Math.max(0, num)).toString();
}

// Clamp inteiro positivo com min/max
export function clampInt(value, min = 1, max = 999) {
  if (value === '' || value === null || value === undefined) return min;
  const num = parseInt(value);
  if (isNaN(num)) return min;
  return Math.min(max, Math.max(min, num));
}

// Truncar nome a maxLen chars
export function sanitizeName(value, maxLen = 100) {
  return (value || '').slice(0, maxLen);
}

// Validar formato semestre (ex: "2024.1", "2024.2", "2024/1")
export function isValidSemestre(value) {
  if (!value) return true; // opcional
  return /^\d{4}[./]\d$/.test(value.trim());
}
