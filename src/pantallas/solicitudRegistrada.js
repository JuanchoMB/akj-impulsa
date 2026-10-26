// P5 · Solicitud registrada (RF05, M9, M28): ficha N.º, estado Pendiente y contacto del negocio.
import { datos, esError } from '../datos/index.js';
import { M } from '../mensajes.js';
import { bannerError, perforacion } from '../ui/componentes.js';
import { enlaceContacto, esc, fechaHora, ficha, icono, precio, sello } from '../ui/formato.js';

function fila(etiqueta, contenido) {
  return `
    <div class="py-2.5 flex flex-col gap-1">
      <span class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">${etiqueta}</span>
      ${contenido}
    </div>`;
}

export default async function solicitudRegistrada(ctx) {
  let s;
  try {
    s = await datos.solicitudes.obtener(ctx.params.id);
  } catch (error) {
    if (ctx.manejarError(error) || !ctx.vigente()) return;
    if (esError(error, 'no_encontrada')) {
      ctx.main.innerHTML = `<div class="pt-2 flex flex-col gap-4">${bannerError(M.M16)}
        <a href="#/mis-solicitudes" class="boton-principal">${icono('assignment')} Ver mis solicitudes</a></div>`;
      return;
    }
    throw error;
  }
  if (!ctx.vigente()) return;

  const numero = ficha(s);
  const contacto = enlaceContacto(s.negocio?.contacto);

  ctx.main.innerHTML = `
    <div class="flex flex-col pt-2 pb-4 entrada-suave">
      <div class="flex flex-col items-center text-center pb-6 px-2">
        <div class="w-14 h-14 rounded-full bg-tertiary-fixed flex items-center justify-center text-cafetal mb-3 shadow-sm">
          ${icono('check_circle', 'text-[32px] icono-relleno')}
        </div>
        <h1 class="font-headline-lg text-headline-lg text-cafetal tracking-tight">${M.M9_TITULO}</h1>
        <p class="font-body-base text-body-base text-on-surface-variant max-w-[330px] mt-1.5">
          El negocio la verá en su panel. Puedes seguir el estado en <strong class="font-body-bold text-on-surface">Mis solicitudes</strong>.
        </p>
      </div>

      <article class="w-full max-w-[400px] mx-auto bg-surface-container-lowest rounded-[10px] shadow-sm overflow-hidden" aria-label="Ficha de solicitud ${esc(numero)}">
        ${perforacion()}
        <div class="p-space-md pt-3">
          <div class="flex items-start justify-between gap-3 pb-4 border-b border-surface-container">
            <div class="flex flex-col">
              <span class="font-mono-code text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Ficha de solicitud</span>
              <span class="font-mono-price text-[24px] font-bold text-secondary tracking-tight mt-0.5">${esc(numero)}</span>
            </div>
            ${sello(s.estado)}
          </div>
          <div class="flex flex-col divide-y divide-surface-container">
            ${fila('Oferta', `<span class="font-body-bold text-body-base">${esc(s.oferta?.nombre || '')}</span>`)}
            ${fila('Negocio', `<span class="font-body-bold text-body-base text-primary">${esc(s.negocio?.nombre || '')}</span>`)}
            ${fila(
              'Precio de referencia',
              `<span class="flex items-baseline gap-1.5">${s.oferta?.precio_desde ? '<span class="font-body-sm text-body-sm text-on-surface-variant">Desde</span>' : ''}
                <span class="font-mono-price text-mono-price text-cafetal font-bold">${esc(precio(s.oferta?.precio_cop))}</span></span>`,
            )}
            ${fila('Fecha', `<span class="font-mono-code text-body-sm text-on-surface">${esc(fechaHora(s.creada_en))}</span>`)}
          </div>

          <div class="my-3 border-b border-dashed border-outline-variant"></div>

          <div class="flex flex-col gap-2.5 bg-surface-container-low p-3 rounded-[8px]">
            <div class="flex items-start gap-2">
              ${icono('bookmark', 'text-secondary text-[20px] mt-0.5 shrink-0')}
              <p class="font-body-sm text-body-sm text-on-surface leading-snug">
                ¿Necesitas acordar detalles? Escríbele al negocio y menciona tu ficha <strong class="font-body-bold text-secondary">${esc(numero)}</strong>.
                La plataforma no comparte tus datos de contacto con el negocio.
              </p>
            </div>
            ${
              contacto
                ? `<a href="${esc(contacto.url)}" target="_blank" rel="noopener noreferrer"
                     class="w-full min-h-[48px] rounded-[8px] border border-borde bg-surface-container-lowest flex items-center justify-center gap-2 text-primary font-body-bold text-body-sm">
                     ${icono('chat', 'text-[18px]')} Escribir al negocio${contacto.esWhatsapp ? ' por WhatsApp' : ''}
                     <span class="sr-only">(se abre en otra pestaña)</span>
                   </a>`
                : '<p class="font-body-sm text-body-sm text-on-surface-variant">Este negocio no registró un contacto. Sigue el estado en Mis solicitudes.</p>'
            }
          </div>
        </div>
      </article>

      <div class="w-full max-w-[400px] mx-auto mt-6 flex flex-col gap-space-sm">
        <a href="#/mis-solicitudes" class="boton-principal">${icono('assignment')} Ver mis solicitudes</a>
        <a href="#/" class="boton-secundario text-on-surface">${icono('storefront', 'text-[20px] text-on-surface-variant')} Seguir viendo ofertas</a>
      </div>
    </div>`;
}
