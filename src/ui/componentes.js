// Piezas de interfaz que se repiten entre pantallas, tomadas del código del Componente 2.
import { ESTADOS } from '../mensajes.js';
import { esc, icono } from './formato.js';

export function enlaceVolver(ruta, texto) {
  return `
    <a href="#${ruta}" class="inline-flex items-center gap-1.5 min-h-[48px] -ml-1 px-1 text-primary font-body-bold text-body-bold hover:underline">
      ${icono('arrow_back', 'text-[22px]')}<span>${esc(texto)}</span>
    </a>`;
}

export function cargando(texto = 'Cargando…') {
  return `
    <div class="py-16 flex flex-col items-center gap-3 text-on-surface-variant" role="status">
      ${icono('progress_activity', 'text-[32px] text-primary girando')}
      <p class="font-body-base text-body-base">${esc(texto)}</p>
    </div>`;
}

export function bannerError(texto, { reintentar = false } = {}) {
  return `
    <div class="w-full bg-error-container/50 rounded-xl p-4 flex items-start gap-3" role="alert">
      ${icono('error', 'text-secondary text-[24px] icono-relleno shrink-0 mt-0.5')}
      <div class="flex flex-col gap-3 flex-1">
        <p class="font-body-bold text-body-base text-on-error-container leading-snug">${esc(texto)}</p>
        ${
          reintentar
            ? `<button type="button" data-reintentar class="self-start min-h-[44px] px-4 rounded-lg bg-surface-container-lowest text-primary font-body-bold text-body-sm border border-borde flex items-center gap-1.5">
                ${icono('refresh', 'text-[18px]')} Intentar de nuevo
              </button>`
            : ''
        }
      </div>
    </div>`;
}

export function bannerConfirmacion(texto) {
  return `
    <div class="w-full rounded-xl bg-tertiary-fixed/40 p-3.5 flex items-center gap-3" role="status">
      <span class="w-8 h-8 rounded-full bg-cafetal text-white flex items-center justify-center shrink-0">
        ${icono('check_circle', 'text-[20px] icono-relleno')}
      </span>
      <p class="font-body-bold text-body-base leading-snug text-cafetal">${esc(texto)}</p>
    </div>`;
}

export function bannerInfo(texto, nombreIcono = 'info') {
  return `
    <div class="bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-sm">
      ${icono(nombreIcono, 'text-primary text-[22px] shrink-0 mt-0.5')}
      <p class="font-body-sm text-body-sm text-on-surface leading-snug">${esc(texto)}</p>
    </div>`;
}

// Borde troquelado de la ficha de solicitud.
export function perforacion() {
  return `<div aria-hidden="true" class="px-3 pt-2"><div class="ficha-perforada"></div></div>`;
}

export function explicacionEstados() {
  const colores = { pendiente: 'bg-primary', en_atencion: 'bg-maiz', cerrada: 'bg-gris' };
  return `
    <aside class="bg-surface-container-lowest rounded-[10px] p-4 flex flex-col" aria-labelledby="titulo-estados">
      <div class="flex items-center gap-2 mb-3">
        <span class="w-7 h-7 rounded-[6px] bg-primary-fixed flex items-center justify-center shrink-0">
          ${icono('help_center', 'text-primary text-[18px]')}
        </span>
        <h2 id="titulo-estados" class="font-headline-sm text-[17px] text-on-surface">¿Qué significa cada estado?</h2>
      </div>
      <ul class="flex flex-col gap-2.5 pl-1">
        ${Object.entries(ESTADOS)
          .map(
            ([clave, e]) => `
          <li class="flex items-start gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full ${colores[clave]} shrink-0 mt-2"></span>
            <p class="font-body-base text-body-sm text-on-surface leading-snug">
              <strong class="font-body-bold">${e.nombre}:</strong> ${e.explicacion}
            </p>
          </li>`,
          )
          .join('')}
      </ul>
    </aside>`;
}

export function textoCierre(motivo) {
  return `
    <div class="p-2.5 rounded-[6px] bg-surface-container flex items-start gap-2">
      ${icono('info', 'text-[18px] text-outline shrink-0 mt-0.5')}
      <p class="font-body-sm text-[14px] leading-snug text-on-surface">
        <strong class="font-body-bold">Cerrada por el emprendimiento:</strong> ${esc(motivo)}
      </p>
    </div>`;
}

// Botón con estado "trabajando": evita dobles envíos y muestra que algo está pasando.
export function ocupado(boton, trabajando, textoTrabajando = 'Guardando…') {
  if (!boton) return;
  if (trabajando) {
    boton.dataset.original = boton.innerHTML;
    boton.disabled = true;
    boton.setAttribute('aria-busy', 'true');
    boton.innerHTML = `${icono('progress_activity', 'text-[20px] girando')}<span>${esc(textoTrabajando)}</span>`;
  } else {
    boton.disabled = false;
    boton.removeAttribute('aria-busy');
    if (boton.dataset.original) boton.innerHTML = boton.dataset.original;
  }
}
