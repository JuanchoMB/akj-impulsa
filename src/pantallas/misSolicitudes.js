// P7 · Mis solicitudes (RF06): estado y motivo de cierre de cada solicitud del cliente.
import { datos } from '../datos/index.js';
import { M } from '../mensajes.js';
import { mostrarAviso } from '../ui/avisos.js';
import { bannerError, cargando, explicacionEstados, perforacion, textoCierre } from '../ui/componentes.js';
import { categoria, esc, fechaHora, ficha, icono, sello } from '../ui/formato.js';
import { activarEtiqueta, botonActualizar, girar } from './actualizacion.js';
import { borrarBorrador, leerBorrador } from './borrador.js';

const GIROS = ['-rotate-2', 'rotate-1', '-rotate-1'];

function tarjeta(s, i) {
  const cat = categoria(s.oferta?.categoria);
  const negocio = [s.negocio?.nombre, s.negocio?.zona].filter(Boolean).join(' · ');
  return `
    <li>
      <article class="bg-surface-container-lowest rounded-[10px] overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.04)]" aria-label="Ficha ${esc(ficha(s))}">
        ${perforacion()}
        <div class="p-4 pt-2 flex flex-col">
          <div class="flex items-start justify-between gap-3">
            <div class="flex flex-col min-w-0">
              <span class="font-mono-code text-[15px] font-bold text-secondary uppercase tracking-wider">${esc(ficha(s))}</span>
              <h2 class="font-headline-sm text-headline-sm text-on-surface mt-1 leading-snug">${esc(s.oferta?.nombre || 'Oferta')}</h2>
            </div>
            <div class="shrink-0 ${GIROS[i % GIROS.length]}">${sello(s.estado)}</div>
          </div>
          <div class="flex items-start gap-1.5 mt-2.5 text-on-surface-variant">
            ${icono(cat.icono, 'text-[18px] text-outline shrink-0 mt-0.5')}
            <span class="font-body-sm text-body-sm leading-tight">${esc(negocio)}</span>
          </div>
          ${s.estado === 'cerrada' ? `<div class="mt-3">${textoCierre(s.motivo_cierre)}</div>` : ''}
          <div class="mt-3.5 bg-surface-container-low -mx-4 -mb-4 px-4 py-3 flex items-center justify-between gap-2">
            <span class="flex items-center gap-1.5 text-on-surface-variant shrink-0">
              ${icono('schedule', 'text-[16px]')}
              <span class="font-mono-code text-[12px] text-on-surface whitespace-nowrap">${esc(fechaHora(s.creada_en))}</span>
            </span>
            <span class="font-label-caps text-label-caps text-outline uppercase tracking-wider text-right min-w-0">${esc(cat.nombre)}</span>
          </div>
        </div>
      </article>
    </li>`;
}

const vacio = `
  <div class="w-full rounded-xl p-6 border-2 border-dashed border-outline-variant bg-surface-container-lowest flex flex-col items-center text-center">
    <div class="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4 text-outline">
      ${icono('assignment_late', 'text-[32px]')}
    </div>
    <p class="font-body-base text-body-base text-on-surface mb-6 max-w-[320px]">${M.M11}</p>
    <a href="#/" class="boton-principal">${icono('storefront')} Ver ofertas</a>
  </div>`;

export default async function misSolicitudes(ctx) {
  let ultima = null;
  let lista = null;

  ctx.main.innerHTML = `
    <div class="flex flex-col gap-5 pt-1">
      <section class="flex items-start justify-between gap-space-sm">
        <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Mis solicitudes</h1>
        ${botonActualizar()}
      </section>
      <div id="zona-lista">${cargando('Cargando tus solicitudes…')}</div>
      ${explicacionEstados()}
    </div>`;
  const zona = ctx.main.querySelector('#zona-lista');
  const pintarEtiqueta = activarEtiqueta(ctx, () => ultima);

  async function cargar({ manual = false } = {}) {
    girar(ctx, true);
    try {
      lista = await datos.solicitudes.mias();
      ultima = new Date();
    } catch (error) {
      if (ctx.manejarError(error) || !ctx.vigente()) return;
      girar(ctx, false);
      if (lista) mostrarAviso(M.M13, 'error');
      else zona.innerHTML = bannerError(M.M13, { reintentar: true });
      zona.querySelector('[data-reintentar]')?.addEventListener('click', () => cargar());
      return;
    }
    if (!ctx.vigente()) return;
    girar(ctx, false);
    pintarEtiqueta();

    // Si la solicitud que quedó "sin confirmar" ya aparece, el borrador deja de hacer falta.
    const borrador = leerBorrador();
    if (borrador && lista.some((s) => s.id === borrador.id)) borrarBorrador();

    zona.innerHTML = lista.length
      ? `<ul class="flex flex-col gap-4 entrada-suave">${lista.map(tarjeta).join('')}</ul>`
      : vacio;
    if (manual) mostrarAviso('Lista actualizada.', 'info');
  }

  ctx.main.querySelector('[data-actualizar]').addEventListener('click', () => cargar({ manual: true }));
  await cargar();
}
