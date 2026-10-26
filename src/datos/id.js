// Identificador UUID v4 generado en el navegador antes de enviar (reintento sin duplicar).
// crypto.randomUUID() solo existe en https o localhost; al probar desde el celular por la red local
// (http://192.168…) se usa getRandomValues, que sí está disponible.
export function nuevoId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
