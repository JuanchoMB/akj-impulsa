// P2 · Detalle de oferta, con la variante de aviso (RF04, D2, M4).
import { datos, esError } from '../datos/index.js';
import { M } from '../mensajes.js';
import { bannerError, bannerInfo, enlaceVolver } from '../ui/componentes.js';
import { categoria, enlaceContacto, esc, icono, precio } from '../ui/formato.js';

export function ofertaNoDisponible() {
  return `
    <div class="pt-2 flex flex-col gap-4">
      ${enlaceVolver('/', 'Volver al catálogo')}
      ${bannerError(M.M8)}
      <a href="#/" class="boton-principal">${icono('storefront')} Ver otras ofertas</a>
    </div>`;
}

export function contactoNegocio(contacto, { titulo = '¿Prefieres hablar directo?' } = {}) {
  const enlace = enlaceContacto(contacto);
  if (!enlace) return '';
  const canal = enlace.esWhatsapp ? 'por WhatsApp' : 'por su canal de contacto';
  return `
    <a href="${esc(enlace.url)}" target="_blank" rel="noopener noreferrer"
       class="w-full min-h-[56px] px-space-md py-3 bg-surface-container-lowest rounded-[10px] flex items-center justify-between gap-3 text-on-surface hover:bg-surface-container-low transition-colors shadow-sm">
      <span class="flex items-center gap-3">
        ${icono('chat', 'text-tertiary text-[24px]')}
        <span class="flex flex-col text-left">
          <span class="font-body-bold text-body-bold leading-tight">${esc(titulo)}</span>
          <span class="font-body-sm text-body-sm text-on-surface-variant">Escríbele al negocio ${canal}</span>
        </span>
      </span>
      ${icono('open_in_new', 'text-on-surface-variant text-[20px]')}
      <span class="sr-only">(se abre en otra pestaña)</span>
    </a>`;
}

function pasos() {
  const lista = [
    ['Envías tu solicitud', 'Escribe en un mensaje corto qué necesitas.'],
    ['El negocio la revisa', 'Te responde por su canal y acuerdan los detalles.'],
    ['Sigues el estado en Mis solicitudes', 'Revisa en Mis solicitudes en qué va tu solicitud.'],
  ];
  return `
    <section class="bg-surface-container-lowest p-space-md rounded-[10px] shadow-sm" aria-labelledby="como-funciona">
      <div class="flex items-center gap-2 mb-space-sm">
        ${icono('format_list_numbered', 'text-primary text-[22px]')}
        <h2 id="como-funciona" class="font-headline-md text-headline-md text-on-surface">Cómo funciona</h2>
      </div>
      <ol class="flex flex-col gap-space-md mt-2">
        ${lista
          .map(
            ([t, d], i) => `
          <li class="flex items-start gap-3.5">
            <span class="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono-code font-bold text-[14px] shrink-0 mt-0.5">${i + 1}</span>
            <span class="min-w-0">
              <span class="block font-body-bold text-body-bold text-on-surface leading-snug">${t}</span>
              <span class="block font-body-sm text-body-sm text-on-surface-variant mt-0.5">${d}</span>
            </span>
          </li>`,
          )
          .join('')}
      </ol>
    </section>`;
}

function accionPrincipal(ctx, o) {
  const { sesion } = ctx;
  if (sesion?.rol === 'emprendedor') {
    const esMia = ctx.esMia;
    return `
      <div class="flex flex-col gap-3">
        ${bannerInfo('Las solicitudes se envían desde una cuenta de cliente.', 'info')}
        ${esMia ? `<a href="#/mis-ofertas/${encodeURIComponent(o.id)}/editar" class="boton-secundario">${icono('edit')} Editar esta oferta</a>` : ''}
      </div>`;
  }
  const destino = `/oferta/${encodeURIComponent(o.id)}/solicitar`;
  const href = sesion ? `#${destino}` : `#/entrar?volver=${encodeURIComponent(destino)}`;
  return `
    <div class="sticky bottom-[calc(4.5rem_+_env(safe-area-inset-bottom))] z-10 -mx-margin px-margin pt-2 pb-2 bg-surface/95 backdrop-blur-md">
      <a href="${href}" class="boton-principal">${icono('send')} Enviar solicitud</a>
      ${sesion ? '' : '<p class="mt-1.5 text-center font-body-sm text-body-sm text-on-surface-variant">Te pediremos entrar con tu cuenta de prueba.</p>'}
    </div>`;
}

export default async function detalleOferta(ctx) {
  let o;
  try {
    o = await datos.ofertas.obtener(ctx.params.id);
  } catch (error) {
    if (ctx.manejarError(error) || !ctx.vigente()) return;
    if (esError(error, 'no_encontrada')) {
      ctx.main.innerHTML = ofertaNoDisponible();
      return;
    }
    throw error;
  }
  if (!ctx.vigente()) return;

  if (ctx.sesion?.rol === 'emprendedor') {
    const negocio = await datos.negocio.mio().catch(() => null);
    ctx.esMia = negocio?.id === o.negocio_id;
    if (!ctx.vigente()) return;
  }

  // Un cliente puede seguir leyendo una oferta que solicitó aunque ya no esté disponible (migración 05);
  // en ese caso se le muestra M8 en lugar del detalle.
  if (!o.disponible && !ctx.esMia) {
    ctx.main.innerHTML = ofertaNoDisponible();
    return;
  }

  const cat = categoria(o.categoria);
  const notaPrecio = o.precio_desde
    ? 'Precio de referencia. El valor final puede cambiar según el caso; el negocio te lo confirma.'
    : 'Precio de referencia. El negocio te confirma los detalles.';

  ctx.main.innerHTML = `
    <div class="flex flex-col gap-space-md pt-1 entrada-suave">
      <div>${enlaceVolver(ctx.sesion?.rol === 'emprendedor' ? '/mis-ofertas' : '/', ctx.sesion?.rol === 'emprendedor' ? 'Volver a Mis ofertas' : 'Volver')}</div>

      ${o.disponible ? '' : bannerInfo('Esta oferta no está disponible: no aparece en el catálogo ni recibe solicitudes. Puedes activarla en Mis ofertas.', 'visibility_off')}

      <article class="bg-surface-container-lowest p-space-md rounded-[10px] shadow-sm">
        <span class="inline-flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-full mb-space-sm font-label-caps text-label-caps text-on-surface uppercase tracking-wider">
          ${icono(cat.icono, 'text-[16px] text-secondary')}${esc(cat.nombre)}
        </span>
        <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-snug">${esc(o.nombre)}</h1>

        ${
          o.aviso
            ? `<div class="bg-error-container/30 rounded-[10px] p-space-md my-space-sm" role="note">
                <div class="flex items-start gap-3">
                  ${icono('emergency', 'text-secondary text-[24px] shrink-0 mt-0.5')}
                  <div class="flex flex-col">
                    <span class="font-label-caps text-label-caps text-secondary uppercase tracking-wider">Aviso importante</span>
                    <p class="font-body-base text-body-base text-on-surface mt-1 leading-snug">${esc(o.aviso)}</p>
                  </div>
                </div>
              </div>`
            : ''
        }

        <p class="font-body-base text-body-base text-on-surface-variant mt-2 flex items-start gap-1.5">
          ${icono('storefront', 'text-[18px] text-primary mt-1')}
          <span>${esc([o.negocio?.nombre, o.negocio?.zona].filter(Boolean).join(' · '))}</span>
        </p>

        <div class="mt-space-md bg-surface-container-low p-space-md rounded-[10px]">
          <span class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider block">Precio de referencia</span>
          <div class="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
            ${o.precio_desde ? '<span class="font-body-base text-body-base text-on-surface-variant">Desde</span>' : ''}
            <span class="font-mono-price text-[30px] leading-tight text-on-surface font-bold tracking-tight">${esc(precio(o.precio_cop))}</span>
            <span class="font-mono-code text-mono-code text-on-surface-variant">COP</span>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-1.5">${notaPrecio}</p>
        </div>
      </article>

      <section class="bg-surface-container-lowest p-space-md rounded-[10px] shadow-sm" aria-labelledby="sobre-servicio">
        <div class="flex items-center gap-2 mb-space-xs">
          ${icono('description', 'text-primary text-[22px]')}
          <h2 id="sobre-servicio" class="font-headline-md text-headline-md text-on-surface">Sobre este servicio</h2>
        </div>
        <p class="font-body-base text-body-base text-on-surface leading-relaxed mt-2 whitespace-pre-line">${esc(o.descripcion)}</p>
      </section>

      ${pasos()}

      ${contactoNegocio(o.negocio?.contacto)}

      ${o.disponible ? accionPrincipal(ctx, o) : ''}
    </div>`;
}
