// P8 · Panel del emprendimiento (RF07): solicitudes por estado.
import { datos } from '../datos/index.js';
import { ESTADOS, M } from '../mensajes.js';
import { mostrarAviso } from '../ui/avisos.js';
import { bannerError, cargando, perforacion } from '../ui/componentes.js';
import { categoria, esc, fechaHora, ficha, icono, primerNombre, sello } from '../ui/formato.js';
import { activarEtiqueta, botonActualizar, girar } from './actualizacion.js';

const PESTANAS = ['pendiente', 'en_atencion', 'cerrada'];

function tarjeta(s) {
  const cat = categoria(s.oferta?.categoria);
  // El nombre del cliente solo aparece si la base lo entrega (hoy no: política perfil_propio).
  const nombre = primerNombre(s.cliente_nombre);
  return `
    <li>
      <a href="#/panel/${encodeURIComponent(s.id)}"
         class="group block bg-surface-container-lowest rounded-xl overflow-hidden hover:bg-surface-container-low transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
         aria-label="Ficha ${esc(ficha(s))}${nombre ? ` de ${esc(nombre)}` : ''}, ${esc(s.oferta?.nombre || '')}, ${esc(ESTADOS[s.estado]?.nombre || '')}">
        ${perforacion()}
        <div class="p-4 pt-2 flex items-start gap-3">
          <div class="flex-1 min-w-0 flex flex-col gap-1.5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-baseline gap-2 min-w-0">
                <span class="font-mono-code text-secondary font-bold text-base leading-none shrink-0">${esc(ficha(s))}</span>
                ${nombre ? `<span class="font-body-bold text-body-base text-on-surface truncate">${esc(nombre)}</span>` : ''}
              </div>
              ${sello(s.estado)}
            </div>
            <span class="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-md bg-surface-container text-primary font-body-bold text-body-sm">
              ${icono(cat.icono, 'text-[16px]')}<span>${esc(s.oferta?.nombre || '')}</span>
            </span>
            <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 italic bg-surface-container-low px-2.5 py-1.5 rounded-lg">“${esc(s.mensaje)}”</p>
            ${
              s.estado === 'cerrada'
                ? `<p class="font-body-sm text-[14px] text-on-surface"><strong class="font-body-bold">Motivo:</strong> ${esc(s.motivo_cierre)}</p>`
                : ''
            }
            <span class="flex items-center gap-1.5 pt-0.5 text-on-surface-variant">
              ${icono('schedule', 'text-[15px]')}
              <time datetime="${esc(s.creada_en)}" class="font-mono-code text-xs font-medium">${esc(fechaHora(s.creada_en, { conAnio: false }))}</time>
            </span>
          </div>
          <span class="self-center w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-primary transition-colors shrink-0">
            ${icono('arrow_forward', 'text-[20px]')}
          </span>
        </div>
      </a>
    </li>`;
}

function vacio(estado, conteos) {
  if (estado === 'pendiente') {
    return `
      <div class="w-full bg-surface-container-lowest rounded-[10px] p-6 shadow-sm flex flex-col items-center text-center">
        <div class="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-3">${icono('inbox', 'text-primary text-[36px]')}</div>
        <h2 class="font-headline-sm text-headline-sm text-on-surface mt-1 mb-1.5">Bandeja al día</h2>
        <p class="font-body-base text-body-base text-on-surface-variant max-w-[300px]">${M.M15}</p>
        <div class="w-full mt-6 flex flex-col gap-space-sm">
          ${
            conteos.en_atencion
              ? `<button type="button" data-ir="en_atencion" class="boton-secundario justify-between">
                   <span class="flex items-center gap-2">${icono('pending_actions', 'text-[20px] text-secondary')} Ver solicitudes en atención (${conteos.en_atencion})</span>
                   ${icono('arrow_forward')}
                 </button>`
              : ''
          }
          <a href="#/mis-ofertas" class="min-h-[48px] px-4 rounded-[10px] text-on-surface-variant hover:text-primary flex items-center justify-center gap-1.5 font-body-sm text-body-sm font-bold">
            ${icono('storefront', 'text-[18px]')} Ver mis ofertas publicadas
          </a>
        </div>
      </div>`;
  }
  const texto = estado === 'en_atencion' ? 'No tienes solicitudes en atención.' : 'Aún no has cerrado solicitudes.';
  return `<div class="rounded-xl p-6 border-2 border-dashed border-outline-variant bg-surface-container-lowest text-center">
            <p class="font-body-base text-body-base text-on-surface-variant">${texto}</p>
          </div>`;
}

export default async function panel(ctx) {
  let estado = PESTANAS.includes(ctx.query.estado) ? ctx.query.estado : 'pendiente';
  let lista = null;
  let ultima = null;

  const negocio = await datos.negocio.mio().catch((e) => {
    if (ctx.manejarError(e)) return undefined;
    return null;
  });
  if (negocio === undefined || !ctx.vigente()) return;

  ctx.main.innerHTML = `
    <div class="flex flex-col gap-4 pt-1">
      <section class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <h1 class="font-headline-md text-headline-md text-on-surface tracking-tight leading-snug">${esc(negocio?.nombre || 'Tu negocio')}</h1>
          <p class="font-body-base text-body-base text-on-surface-variant mt-0.5">Solicitudes que te han enviado</p>
        </div>
        ${botonActualizar()}
      </section>
      <div id="pestanas" role="tablist" aria-label="Estados de las solicitudes" class="w-full bg-surface-container-high p-1 rounded-xl flex items-stretch gap-1"></div>
      <div id="zona-lista" role="tabpanel">${cargando('Cargando solicitudes…')}</div>
      <footer class="bg-surface-container p-3.5 rounded-xl flex items-start gap-3">
        <span class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary shrink-0">${icono('touch_app', 'text-[18px]')}</span>
        <p class="font-body-sm text-body-sm text-on-surface">Toca una solicitud para ver el mensaje completo y cambiar su estado. El cliente ve el cambio al actualizar Mis solicitudes.</p>
      </footer>
    </div>`;

  const zona = ctx.main.querySelector('#zona-lista');
  const pestanas = ctx.main.querySelector('#pestanas');
  const pintarEtiqueta = activarEtiqueta(ctx, () => ultima);

  function pintarPestanas(conteos) {
    pestanas.innerHTML = PESTANAS.map((e) => {
      const activa = e === estado;
      const conteo = e === 'cerrada' ? '' : conteos[e];
      return `
        <button type="button" role="tab" data-estado="${e}" aria-selected="${activa}" id="pestana-${e}"
                class="flex-1 min-h-[48px] px-2 rounded-lg flex items-center justify-center gap-1.5 text-body-sm transition-colors ${
                  activa ? 'bg-primary text-on-primary font-body-bold' : 'text-on-surface hover:bg-surface-container font-body-base'
                }">
          <span>${ESTADOS[e].plural}</span>
          ${
            conteo
              ? `<span class="px-1.5 py-0.5 rounded-full font-mono-code text-xs font-bold leading-none ${
                  activa ? 'bg-surface-container-lowest text-primary' : e === 'en_atencion' ? 'bg-[#fff3d6] text-[#8a5d00]' : 'bg-primary-fixed text-primary'
                }">${conteo}</span>`
              : ''
          }
        </button>`;
    }).join('');
    zona.setAttribute('aria-labelledby', `pestana-${estado}`);
  }

  function pintarLista() {
    const conteos = Object.fromEntries(PESTANAS.map((e) => [e, lista.filter((s) => s.estado === e).length]));
    pintarPestanas(conteos);
    const filtradas = lista.filter((s) => s.estado === estado);
    zona.innerHTML = filtradas.length
      ? `<ul class="flex flex-col gap-3.5 entrada-suave">${filtradas.map(tarjeta).join('')}</ul>`
      : vacio(estado, conteos);
    zona.querySelector('[data-ir]')?.addEventListener('click', (e) => cambiarPestana(e.currentTarget.dataset.ir));
  }

  function cambiarPestana(nuevo) {
    estado = nuevo;
    history.replaceState(null, '', `#/panel?estado=${nuevo}`);
    if (lista) pintarLista();
  }

  pestanas.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-estado]');
    if (boton) cambiarPestana(boton.dataset.estado);
  });
  // Flechas izquierda/derecha entre pestañas (patrón de accesibilidad de tablist).
  pestanas.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = PESTANAS.indexOf(estado);
    const siguiente = PESTANAS[(i + (e.key === 'ArrowRight' ? 1 : PESTANAS.length - 1)) % PESTANAS.length];
    cambiarPestana(siguiente);
    pestanas.querySelector(`[data-estado="${siguiente}"]`)?.focus();
  });

  async function cargar({ manual = false } = {}) {
    girar(ctx, true);
    try {
      lista = await datos.solicitudes.delNegocio();
      ultima = new Date();
    } catch (error) {
      if (ctx.manejarError(error) || !ctx.vigente()) return;
      girar(ctx, false);
      if (lista) mostrarAviso(M.M13, 'error');
      else {
        pintarPestanas({});
        zona.innerHTML = bannerError(M.M13, { reintentar: true });
        zona.querySelector('[data-reintentar]').addEventListener('click', () => cargar());
      }
      return;
    }
    if (!ctx.vigente()) return;
    girar(ctx, false);
    pintarEtiqueta();
    pintarLista();
    if (manual) mostrarAviso('Lista actualizada.', 'info');
  }

  pintarPestanas({});
  ctx.main.querySelector('[data-actualizar]').addEventListener('click', () => cargar({ manual: true }));
  await cargar();
}
