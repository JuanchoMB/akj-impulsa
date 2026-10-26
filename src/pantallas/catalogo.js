// P1 · Catálogo de ofertas (RF03). Se ve sin sesión; solo muestra ofertas disponibles (D1).
import { datos } from '../datos/index.js';
import { M } from '../mensajes.js';
import { bannerError, cargando } from '../ui/componentes.js';
import { categoria, esc, icono, precioConDesde } from '../ui/formato.js';

const cabecera = `
  <header class="pb-space-md flex flex-col gap-1">
    <div class="inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase">
      <span class="w-2 h-2 rounded-full bg-primary"></span>Armenia, Quindío
    </div>
    <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">Ofertas de negocios de Armenia</h1>
    <p class="font-body-base text-body-base text-on-surface-variant">
      Mira precios de referencia y envía tu solicitud directamente al negocio.
    </p>
  </header>`;

function tarjeta(o) {
  const cat = categoria(o.categoria);
  const negocio = [o.negocio?.nombre, o.negocio?.zona].filter(Boolean).join(' · ');
  return `
    <li>
      <a href="#/oferta/${encodeURIComponent(o.id)}"
         class="bg-surface-container-lowest p-5 rounded-lg flex flex-col gap-3.5 transition-colors hover:bg-surface-container-low shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <span class="inline-flex items-center gap-2 self-start px-2.5 py-1 rounded bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm">
          <span class="w-2 h-2 rounded-full ${cat.punto}"></span>${esc(cat.nombre)}
        </span>
        <span class="flex flex-col gap-0.5">
          <span class="font-headline-sm text-headline-sm text-on-surface">${esc(o.nombre)}</span>
          <span class="font-body-base text-body-base text-on-surface-variant">${esc(negocio)}</span>
        </span>
        <span class="pt-2 flex items-end justify-between gap-3">
          <span class="flex flex-col">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Precio de referencia</span>
            <span class="font-mono-price text-mono-price text-on-surface mt-0.5">${esc(precioConDesde(o))}</span>
          </span>
          <span class="inline-flex items-center gap-1 font-body-bold text-body-sm text-primary shrink-0">
            Ver oferta ${icono('arrow_forward', 'text-[18px]')}
          </span>
        </span>
      </a>
    </li>`;
}

export default async function catalogo(ctx) {
  async function pintar() {
    ctx.main.innerHTML = cabecera + cargando('Cargando ofertas…');
    let ofertas;
    try {
      ofertas = await datos.ofertas.catalogo();
    } catch (error) {
      if (ctx.manejarError(error) || !ctx.vigente()) return;
      ctx.main.innerHTML = cabecera + bannerError(M.M3, { reintentar: true });
      ctx.main.querySelector('[data-reintentar]').addEventListener('click', pintar);
      return;
    }
    if (!ctx.vigente()) return;
    ctx.main.innerHTML =
      cabecera +
      (ofertas.length
        ? `<p class="sr-only">${ofertas.length} ofertas disponibles.</p>
           <ul class="flex flex-col gap-4 entrada-suave">${ofertas.map(tarjeta).join('')}</ul>`
        : `<div class="rounded-xl p-6 border-2 border-dashed border-outline-variant bg-surface-container-lowest text-center">
             <p class="font-body-base text-body-base">Todavía no hay ofertas disponibles. Vuelve más tarde.</p>
           </div>`);
  }
  await pintar();
}
