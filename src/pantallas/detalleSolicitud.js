// P9 / P10 · Detalle de solicitud (Pendiente / En atención) y P11 · Cerrar solicitud (RF07, RF08, D4).
// Solo el emprendedor dueño cambia el estado. Una solicitud cerrada no se reabre.
import { datos, esError } from '../datos/index.js';
import { M, MOTIVOS_CIERRE } from '../mensajes.js';
import { mostrarAviso } from '../ui/avisos.js';
import { bannerConfirmacion, bannerError, enlaceVolver, ocupado, perforacion, textoCierre } from '../ui/componentes.js';
import { categoria, esc, fechaHora, ficha, icono, precioConDesde, sello } from '../ui/formato.js';

const MAX_OTRO = 120;

function noDisponible() {
  return `
    <div class="pt-2 flex flex-col gap-4">
      ${enlaceVolver('/panel', 'Volver a Solicitudes')}
      ${bannerError(M.M16)}
    </div>`;
}

function fichaSolicitud(s) {
  const cat = categoria(s.oferta?.categoria);
  return `
    <article class="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden" aria-label="Ficha ${esc(ficha(s))}">
      ${perforacion()}
      <div class="p-5 pt-3 flex flex-col gap-space-md">
        <div class="flex items-start justify-between gap-2">
          <div class="flex flex-col">
            <span class="font-label-caps text-label-caps text-on-surface-variant tracking-wider uppercase">Ficha de solicitud</span>
            <span class="font-mono-price text-[28px] leading-8 font-bold text-secondary mt-0.5">${esc(ficha(s))}</span>
          </div>
          ${sello(s.estado)}
        </div>
        <div class="grid grid-cols-1 gap-3">
          ${
            s.cliente_nombre
              ? `<div class="flex items-center gap-2.5 p-3 rounded-lg bg-surface-container-low">
                  <span class="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">${icono('person', 'text-[20px]')}</span>
                  <span class="flex flex-col min-w-0">
                    <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Cliente</span>
                    <span class="font-body-bold text-body-bold text-on-surface truncate">${esc(s.cliente_nombre)}</span>
                  </span>
                </div>`
              : ''
          }
          <div class="flex items-center justify-between gap-2 p-3 rounded-lg bg-surface-container-low">
            <span class="flex items-center gap-2.5 min-w-0">
              <span class="w-9 h-9 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary shrink-0">${icono(cat.icono, 'text-[20px]')}</span>
              <span class="flex flex-col min-w-0">
                <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Oferta</span>
                <span class="font-body-bold text-body-bold text-on-surface">${esc(s.oferta?.nombre || '')}</span>
              </span>
            </span>
            <span class="font-label-caps text-label-caps text-tertiary px-2 py-1 bg-surface-container-lowest rounded shrink-0">${esc(cat.nombre)}</span>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <div class="p-3 rounded-lg bg-surface-container-low flex flex-col">
              <span class="font-label-caps text-label-caps text-on-surface-variant uppercase flex items-center gap-1">${icono('schedule', 'text-[14px]')} Registro</span>
              <span class="font-mono-code text-[13px] text-on-surface font-semibold mt-1">${esc(fechaHora(s.creada_en))}</span>
            </div>
            <div class="p-3 rounded-lg bg-surface-container-low flex flex-col">
              <span class="font-label-caps text-label-caps text-on-surface-variant uppercase flex items-center gap-1">${icono('payments', 'text-[14px]')} Precio ref.</span>
              <span class="font-mono-price text-[16px] text-primary font-bold mt-1">${esc(s.oferta ? precioConDesde(s.oferta) : '')}</span>
            </div>
          </div>
        </div>
        <div class="flex flex-col rounded-xl bg-surface p-4">
          <div class="flex items-center gap-1.5 mb-2">
            ${icono('format_quote', 'text-secondary text-[18px]')}
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Mensaje del cliente</span>
          </div>
          <p class="font-body-base text-body-base text-on-surface italic whitespace-pre-line break-words">“${esc(s.mensaje)}”</p>
        </div>
        ${s.estado === 'cerrada' ? textoCierre(s.motivo_cierre) : ''}
      </div>
      <div class="w-full h-1.5 ${s.estado === 'pendiente' ? 'bg-primary' : s.estado === 'en_atencion' ? 'bg-maiz' : 'bg-gris'}"></div>
    </article>`;
}

function acciones(s) {
  if (s.estado === 'cerrada') {
    return `<p class="font-body-sm text-body-sm text-on-surface-variant text-center">Esta solicitud está cerrada y no se puede reabrir.</p>`;
  }
  return `
    <div class="flex flex-col gap-3">
      ${
        s.estado === 'pendiente'
          ? `<button type="button" id="pasar-atencion" class="boton-principal">${icono('assignment_turned_in')} <span>Pasar a “En atención”</span></button>`
          : ''
      }
      <button type="button" id="abrir-cierre" class="boton-secundario text-on-surface">
        ${icono('cancel', 'text-[20px] text-secondary')} Cerrar solicitud
      </button>
    </div>`;
}

function hojaCierre(s) {
  return `
    <div class="fixed inset-0 z-[70] flex items-end justify-center" id="capa-cierre">
      <div class="absolute inset-0 bg-[#2A211C]/50 backdrop-blur-[2px]" data-cancelar aria-hidden="true"></div>
      <div role="dialog" aria-modal="true" aria-labelledby="titulo-cierre" aria-describedby="nota-cierre"
           class="hoja-entrada relative w-full max-w-[480px] bg-surface-container-lowest rounded-t-[20px] shadow-2xl max-h-[92dvh] overflow-y-auto pb-safe">
        <div class="w-full h-1 bg-primary"></div>
        <div class="relative pt-3 pb-1 flex justify-center">
          <span class="w-12 h-1.5 bg-surface-variant rounded-full" aria-hidden="true"></span>
          <button type="button" data-cancelar class="absolute right-3 top-2 w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container" aria-label="Cancelar y volver">
            ${icono('close', 'text-[22px]')}
          </button>
        </div>
        <form id="form-cierre" class="flex flex-col px-space-md pb-6 gap-space-md" novalidate>
          <div class="pr-10">
            <h2 id="titulo-cierre" class="font-headline-lg text-headline-lg text-on-surface leading-tight">Cerrar solicitud</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${esc(ficha(s))} · ${esc(s.oferta?.nombre || '')}</p>
            <p id="nota-cierre" class="font-body-sm text-body-sm text-on-surface-variant mt-1.5">${M.M18}</p>
          </div>
          <fieldset class="flex flex-col gap-2.5">
            <legend class="sr-only">Motivo de cierre, visible para el cliente</legend>
            ${[...MOTIVOS_CIERRE, 'Otro']
              .map(
                (m, i) => `
              <label class="motivo flex items-center gap-3 min-h-[52px] px-4 py-3 rounded-[10px] bg-surface-container-low cursor-pointer transition-colors has-[:checked]:bg-primary has-[:checked]:text-on-primary has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/30">
                <input type="radio" name="motivo" value="${esc(m)}" class="sr-only peer" ${i === 0 ? 'data-primero' : ''} />
                <span class="w-5 h-5 rounded-full border-2 border-outline flex items-center justify-center shrink-0 peer-checked:bg-on-primary peer-checked:border-on-primary peer-checked:text-primary text-transparent">
                  ${icono('check', 'text-[15px]')}
                </span>
                <span class="font-body-base text-body-base peer-checked:font-body-bold">${esc(m)}</span>
              </label>`,
              )
              .join('')}
          </fieldset>
          <div id="zona-otro" class="hidden flex-col gap-1.5">
            <label for="motivo-otro" class="font-label-caps text-label-caps uppercase text-on-surface-variant">Escribe el motivo</label>
            <textarea id="motivo-otro" rows="2" maxlength="${MAX_OTRO}" class="campo" aria-describedby="error-otro"
                      placeholder="Ej.: El cliente prefirió una fecha que no tengo disponible"></textarea>
            <span id="error-otro" class="font-body-sm text-body-sm text-secondary" aria-live="polite"></span>
          </div>
          <div id="error-cierre"></div>
          <div class="flex flex-col gap-2 pt-1">
            <button type="submit" class="boton-principal" disabled aria-describedby="ayuda-boton">${icono('task_alt')} <span>Cerrar con este motivo</span></button>
            <p id="ayuda-boton" class="font-body-sm text-body-sm text-on-surface-variant text-center">${M.M19}</p>
            <button type="button" data-cancelar class="min-h-[48px] text-primary font-body-bold text-body-bold rounded-[10px] hover:bg-surface-container-low">Cancelar y volver</button>
          </div>
        </form>
      </div>
    </div>`;
}

export default async function detalleSolicitud(ctx) {
  let s;
  try {
    s = await datos.solicitudes.obtener(ctx.params.id);
  } catch (error) {
    if (ctx.manejarError(error) || !ctx.vigente()) return;
    if (esError(error, 'no_encontrada') || esError(error, 'permiso')) {
      ctx.main.innerHTML = noDisponible();
      return;
    }
    throw error;
  }
  if (!ctx.vigente()) return;

  // Una solicitud cerrada no se reabre ni se vuelve a cerrar.
  if (ctx.cerrar && s.estado === 'cerrada') {
    ctx.navegar(`/panel/${encodeURIComponent(s.id)}`, { reemplazar: true });
    return;
  }

  const rutaDetalle = `/panel/${encodeURIComponent(s.id)}`;
  const recienAtendida = ctx.query.ok === 'atencion' && s.estado === 'en_atencion';

  ctx.main.innerHTML = `
    <div class="flex flex-col gap-space-md pt-1 ${ctx.cerrar ? '' : 'entrada-suave'}" ${ctx.cerrar ? 'aria-hidden="true"' : ''}>
      <div class="flex items-center justify-between gap-2 flex-wrap">
        ${enlaceVolver(`/panel?estado=${s.estado}`, 'Volver a Solicitudes')}
        <span class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant max-w-full">
          ${icono('storefront', 'text-[15px]')}
          <span class="font-label-caps text-label-caps truncate">${esc(s.negocio?.nombre || '')}</span>
        </span>
      </div>
      <h1 class="font-headline-lg text-headline-lg text-on-surface">Detalle de solicitud</h1>
      ${recienAtendida ? bannerConfirmacion(M.M17) : ''}
      ${fichaSolicitud(s)}
      <section class="w-full rounded-xl p-4 bg-surface-container flex items-start gap-3" aria-label="Cómo coordinar con el cliente">
        <span class="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-primary shrink-0 mt-0.5">${icono('tips_and_updates', 'text-[18px]')}</span>
        <div class="flex flex-col">
          <span class="font-body-bold text-body-sm text-on-surface">Cómo coordinar con el cliente</span>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">${esc(M.M29(ficha(s)))}</p>
        </div>
      </section>
      <div id="error-estado"></div>
      ${acciones(s)}
    </div>
    ${ctx.cerrar ? hojaCierre(s) : ''}`;

  // La hoja de cierre reemplaza la entrada del historial: "Cancelar" vuelve al mismo detalle sin duplicarlo.
  ctx.main.querySelector('#abrir-cierre')?.addEventListener('click', () =>
    ctx.navegar(`${rutaDetalle}/cerrar`, { reemplazar: true }),
  );

  // P9 → P10: pasar a En atención.
  const pasar = ctx.main.querySelector('#pasar-atencion');
  pasar?.addEventListener('click', async () => {
    const zonaError = ctx.main.querySelector('#error-estado');
    zonaError.innerHTML = '';
    ocupado(pasar, true, 'Actualizando…');
    try {
      await datos.solicitudes.cambiarEstado(s.id, 'en_atencion');
      ctx.navegar(`${rutaDetalle}?ok=atencion`, { reemplazar: true });
    } catch (error) {
      if (ctx.manejarError(error)) return;
      ocupado(pasar, false);
      if (esError(error, 'no_encontrada')) zonaError.innerHTML = bannerError(M.M16);
      else if (esError(error, 'validacion')) ctx.navegar(rutaDetalle, { reemplazar: true });
      else {
        console.error(error);
        zonaError.innerHTML = bannerError(M.M22);
      }
    }
  });

  if (ctx.cerrar) activarHoja(ctx, s, rutaDetalle);
}

function activarHoja(ctx, s, rutaDetalle) {
  const capa = ctx.main.querySelector('#capa-cierre');
  const form = capa.querySelector('#form-cierre');
  const enviar = form.querySelector('button[type="submit"]');
  const ayuda = form.querySelector('#ayuda-boton');
  const zonaOtro = form.querySelector('#zona-otro');
  const otro = form.querySelector('#motivo-otro');
  const errorOtro = form.querySelector('#error-otro');
  const zonaError = form.querySelector('#error-cierre');

  document.body.style.overflow = 'hidden';
  ctx.alSalir(() => {
    document.body.style.overflow = '';
    document.removeEventListener('keydown', alTeclear);
  });

  const cancelar = () => ctx.navegar(rutaDetalle, { reemplazar: true });
  capa.querySelectorAll('[data-cancelar]').forEach((b) => b.addEventListener('click', cancelar));

  // Escape cierra la hoja; Tab se mantiene dentro de ella.
  function alTeclear(e) {
    if (e.key === 'Escape') cancelar();
    if (e.key !== 'Tab') return;
    const enfocables = [...capa.querySelectorAll('button:not([disabled]), input, textarea')].filter((el) => el.offsetParent !== null || el.type === 'radio');
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }
  document.addEventListener('keydown', alTeclear);

  const elegido = () => form.querySelector('input[name="motivo"]:checked')?.value || null;

  form.addEventListener('change', () => {
    const motivo = elegido();
    const esOtro = motivo === 'Otro';
    zonaOtro.classList.toggle('hidden', !esOtro);
    zonaOtro.classList.toggle('flex', esOtro);
    if (esOtro) otro.focus();
    enviar.disabled = !motivo;
    ayuda.classList.toggle('hidden', !!motivo);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    zonaError.innerHTML = '';
    errorOtro.textContent = '';
    let motivo = elegido();
    if (!motivo) return;
    if (motivo === 'Otro') {
      motivo = otro.value.trim();
      if (!motivo) {
        errorOtro.textContent = M.M20;
        otro.setAttribute('aria-invalid', 'true');
        otro.focus();
        return;
      }
    }
    ocupado(enviar, true, 'Cerrando…');
    try {
      await datos.solicitudes.cambiarEstado(s.id, 'cerrada', motivo);
      ctx.navegar('/panel', { reemplazar: true });
      mostrarAviso(M.M21, 'exito');
    } catch (error) {
      if (ctx.manejarError(error)) return;
      ocupado(enviar, false);
      console.error(error);
      zonaError.innerHTML = bannerError(esError(error, 'no_encontrada') ? M.M16 : M.M22);
    }
  });

  setTimeout(() => form.querySelector('[data-primero]')?.focus(), 50);
}
