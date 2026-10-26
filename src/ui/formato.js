import { CATEGORIAS, ESTADOS } from '../mensajes.js';

// Todo texto que venga de la base de datos o de una persona pasa por esc() antes de ir al HTML.
export function esc(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const pesos = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export function precio(valor) {
  return `$${pesos.format(Number(valor) || 0)}`;
}

export function precioConDesde(oferta) {
  return `${oferta.precio_desde ? 'Desde ' : ''}${precio(oferta.precio_cop)}`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function hora(d) {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

// "22 oct 2026 · 9:41 p. m."
export function fechaHora(iso, { conAnio = true } = {}) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const fecha = `${d.getDate()} ${MESES[d.getMonth()]}${conAnio ? ` ${d.getFullYear()}` : ''}`;
  return `${fecha} · ${hora(d)}`;
}

// M12: "Actualizado hace N min"
export function haceCuanto(fecha) {
  if (!fecha) return '';
  const minutos = Math.floor((Date.now() - fecha.getTime()) / 60000);
  if (minutos < 1) return 'Actualizado ahora';
  if (minutos < 60) return `Actualizado hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `Actualizado hace ${horas} h`;
}

export function ficha(solicitud) {
  if (solicitud?.numero != null) return `N.º ${solicitud.numero}`;
  // Respaldo mientras la base no tenga número de ficha: primeros caracteres del identificador.
  return `N.º ${String(solicitud?.id || '').slice(0, 6).toUpperCase()}`;
}

// Una categoría escrita de otra forma en la base ("arreglos", "ARREGLOS") se reconoce igual;
// una desconocida se muestra tal cual con un ícono genérico.
export function categoria(valor) {
  const texto = String(valor || '').trim();
  const clave = texto.toLocaleLowerCase('es');
  const conocida = CATEGORIAS.find((c) => c.valor.toLocaleLowerCase('es') === clave);
  if (conocida) return { ...conocida, nombre: conocida.valor };
  return { valor: texto, nombre: texto || 'Sin categoría', icono: 'sell', punto: 'bg-outline' };
}

export function sello(estado) {
  const e = ESTADOS[estado] || { nombre: estado };
  return `<span class="sello sello-${esc(estado)}">${esc(e.nombre)}</span>`;
}

export function primerNombre(nombre) {
  return String(nombre || '').trim().split(/\s+/)[0] || '';
}

export function inicial(nombre) {
  return (String(nombre || '').trim()[0] || '?').toUpperCase();
}

// Solo se aceptan enlaces http(s); un número de celular se convierte en enlace de WhatsApp.
export function enlaceContacto(contacto) {
  const texto = String(contacto || '').trim();
  if (!texto) return null;
  const digitos = texto.replace(/[\s()+-]/g, '');
  if (/^\d{10,13}$/.test(digitos)) {
    const numero = digitos.length === 10 ? `57${digitos}` : digitos;
    return { url: `https://wa.me/${numero}`, esWhatsapp: true };
  }
  try {
    const url = new URL(texto);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const esWhatsapp = /(^|\.)wa\.me$|whatsapp\.com$/.test(url.hostname);
    return { url: url.href, esWhatsapp };
  } catch {
    return null;
  }
}

export function icono(nombre, clases = 'text-[20px]') {
  return `<span class="material-symbols-outlined ${clases}" aria-hidden="true">${nombre}</span>`;
}
