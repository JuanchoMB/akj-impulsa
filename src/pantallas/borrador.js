// Borrador de la solicitud en curso: conserva el mensaje y el MISMO identificador entre intentos,
// para que un reintento no cree una segunda solicitud (P6, M10, M10b).
import { nuevoId } from '../datos/index.js';

const CLAVE = 'akj-borrador-solicitud';

export function leerBorrador() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE));
  } catch {
    return null;
  }
}

export function guardarBorrador(borrador) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(borrador));
  } catch {
    // Sin almacenamiento: el reintento seguirá funcionando mientras la pestaña esté abierta.
  }
  return borrador;
}

export function borrarBorrador() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // Nada que borrar.
  }
}

// Reutiliza el identificador si ya hubo un intento para esta oferta; si no, crea uno nuevo.
export function prepararEnvio(ofertaId, mensaje) {
  const previo = leerBorrador();
  const id = previo?.oferta_id === ofertaId && previo?.id ? previo.id : nuevoId();
  return guardarBorrador({ id, oferta_id: ofertaId, mensaje, intentado: true });
}
