// P12 · Mis ofertas (RF02, D1): ver las ofertas del negocio y activar o desactivar su disponibilidad.
import { datos } from '../datos/index.js';
import { M } from '../mensajes.js';
import { mostrarAviso } from '../ui/avisos.js';
import { bannerError, bannerInfo } from '../ui/componentes.js';
import { categoria, esc, icono, precio } from '../ui/formato.js';

function interruptor(o) {
  const si = o.disponible;
  return `
    <div class="flex items-center gap-space-sm">
      <button type="button" role="switch" aria-checked="${si}" data-disponible="${esc(o.id)}"
              aria-label="Disponibilidad de ${esc(o.nombre)}"
              class="relative inline-flex h-9 w-16 shrink-0 items-center rounded-full transition-colors ${si ? 'bg-tertiary-container' : 'bg-surface-container-highest border border-outline-variant'}">
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm transition-transform ${si ? 'translate-x-8' : 'translate-x-1'}">
          ${icono(si ? 'check' : 'close', `text-[16px] ${si ? 'text-tertiary-container' : 'text-outline'}`)}
        </span>
      </button>
      <span class="flex flex-col">
        <span class="font-body-bold text-body-sm ${si ? 'text-tertiary' : 'text-on-surface-variant'}">${si ? 'Disponible' : 'No disponible'}</span>
        <span class="font-label-caps text-label-caps text-on-surface-variant">${si ? 'Recibe solicitudes' : 'Oculta a clientes'}</span>
      </span>
    </div>`;
}

function tarjeta(o) {
  const cat = categoria(o.categoria);
  return `
    <li>
      <article class="bg-surface-container-lowest rounded-[10px] p-space-md flex flex-col gap-space-md shadow-sm transition-opacity ${o.disponible ? '' : 'opacity-70'}" data-oferta="${esc(o.id)}">
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">${esc(cat.nombre)}</span>
            <span class="inline-flex items-center gap-1 font-body-sm text-body-sm ${o.disponible ? 'text-tertiary' : 'text-on-surface-variant'}">
              <span class="w-2 h-2 rounded-full ${o.disponible ? 'bg-tertiary' : 'bg-outline-variant'}"></span>
              ${o.disponible ? 'Visible en el catálogo' : 'Oculta'}
            </span>
          </div>
          <h2 class="font-headline-sm text-headline-sm text-on-surface">${esc(o.nombre)}</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">${esc(o.descripcion)}</p>
        </div>
        <div class="bg-surface-container-low rounded-[8px] p-space-sm flex items-baseline justify-between gap-2">
          <span class="font-body-sm text-body-sm text-on-surface-variant">Precio de referencia</span>
          <span class="flex items-baseline gap-1">
            ${o.precio_desde ? '<span class="font-body-sm text-body-sm text-on-surface-variant">Desde</span>' : ''}
            <span class="font-mono-price text-mono-price text-primary font-bold">${esc(precio(o.precio_cop))}</span>
          </span>
        </div>
        <div class="flex items-center justify-between gap-2 flex-wrap">
          ${interruptor(o)}
          <a href="#/mis-ofertas/${encodeURIComponent(o.id)}/editar" class="font-body-bold text-body-sm text-primary hover:underline flex items-center gap-1 min-h-[44px] px-1">
            Editar detalles ${icono('arrow_forward', 'text-[16px]')}
          </a>
        </div>
      </article>
    </li>`;
}

export default async function misOfertas(ctx) {
  let ofertas;
  try {
    ofertas = await datos.ofertas.mias();
  } catch (error) {
    if (ctx.manejarError(error) || !ctx.vigente()) return;
    console.error(error);
    ctx.main.innerHTML = bannerError('No pudimos cargar tus ofertas. Revisa tu conexión e inténtalo de nuevo.', { reintentar: true });
    ctx.main.querySelector('[data-reintentar]').addEventListener('click', () => ctx.navegar('/mis-ofertas', { reemplazar: true }));
    return;
  }
  if (!ctx.vigente()) return;

  ctx.main.innerHTML = `
    <div class="flex flex-col gap-space-lg pt-1 entrada-suave">
      <div class="flex flex-col gap-space-sm">
        <div class="flex items-center justify-between gap-space-sm">
          <div class="flex flex-col">
            <span class="font-label-caps text-label-caps text-primary tracking-wider uppercase">Catálogo activo</span>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Mis ofertas</h1>
          </div>
          <a href="#/mis-ofertas/nueva" class="h-12 px-space-md bg-primary hover:bg-[#1b367a] text-on-primary rounded-[10px] font-body-bold text-body-base flex items-center gap-space-xs shadow-sm shrink-0">
            ${icono('add', 'text-[22px]')} Nueva oferta
          </a>
        </div>
        <p class="font-body-base text-body-base text-on-surface-variant">Así ven tus ofertas los clientes en el catálogo.</p>
      </div>
      ${
        ofertas.length
          ? `<ul class="flex flex-col gap-space-md">${ofertas.map(tarjeta).join('')}</ul>`
          : `<div class="rounded-xl p-6 border-2 border-dashed border-outline-variant bg-surface-container-lowest text-center flex flex-col gap-4 items-center">
               <p class="font-body-base text-body-base">Aún no tienes ofertas. Crea la primera para que aparezca en el catálogo.</p>
               <a href="#/mis-ofertas/nueva" class="boton-principal">${icono('add')} Nueva oferta</a>
             </div>`
      }
      ${bannerInfo('Las ofertas no disponibles no aparecen en el catálogo ni reciben solicitudes.')}
    </div>`;

  // D1: activar o desactivar con un toque (M23). Se revierte si el servicio no responde.
  // El contenedor <main> se reutiliza entre pantallas: el oyente se retira al salir.
  const control = new AbortController();
  ctx.alSalir(() => control.abort());
  ctx.main.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('[data-disponible]');
    if (!boton || boton.disabled) return;
    const id = boton.dataset.disponible;
    const oferta = ofertas.find((o) => o.id === id);
    const nuevo = !oferta.disponible;
    boton.disabled = true;
    try {
      const guardada = await datos.ofertas.actualizar(id, { disponible: nuevo });
      Object.assign(oferta, guardada);
      mostrarAviso(nuevo ? M.M23_SI : M.M23_NO, 'exito');
    } catch (error) {
      if (ctx.manejarError(error)) return;
      console.error(error);
      mostrarAviso('No se pudo cambiar la disponibilidad. Revisa tu conexión e inténtalo de nuevo.', 'error');
    }
    if (!ctx.vigente()) return;
    boton.closest('li').outerHTML = tarjeta(oferta);
    ctx.main.querySelector(`[data-disponible="${CSS.escape(id)}"]`)?.focus();
  }, { signal: control.signal });
}
