// P4 · Enviar solicitud (RF05, D3). La fecha aproximada se escribe en el mensaje; no hay campo propio.
import { datos, esError } from '../datos/index.js';
import { M, MAX_MENSAJE } from '../mensajes.js';
import { mostrarAviso } from '../ui/avisos.js';
import { bannerError, bannerInfo, enlaceVolver, ocupado } from '../ui/componentes.js';
import { esc, icono, precioConDesde } from '../ui/formato.js';
import { borrarBorrador, leerBorrador, prepararEnvio } from './borrador.js';
import { ofertaNoDisponible } from './detalleOferta.js';

export const AYUDA_MENSAJE =
  'Describe la prenda, el daño o las medidas. Si tienes una fecha en mente, escríbela aquí. Si quieres que el negocio te llame, puedes dejar tu número aquí; el negocio podrá verlo.';

export function resumenOferta(o) {
  return `
    <section class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm" aria-label="Oferta">
      <div class="flex items-center gap-2">
        ${icono('storefront', 'text-primary text-[20px] icono-relleno')}
        <span class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Detalle del servicio</span>
      </div>
      <div class="flex flex-col">
        <h2 class="font-headline-sm text-headline-sm text-on-surface">${esc(o.nombre)}</h2>
        <p class="font-body-base text-body-base text-on-surface-variant mt-0.5">${esc(o.negocio?.nombre || '')}</p>
      </div>
      <div class="pt-1 flex items-baseline justify-between gap-2">
        <span class="font-body-sm text-body-sm text-on-surface-variant">Precio de referencia</span>
        <span class="font-mono-price text-mono-price text-primary">${esc(precioConDesde(o))}</span>
      </div>
    </section>`;
}

export function campoMensaje(valor = '') {
  return `
    <div class="flex flex-col">
      <label for="mensaje" class="font-body-bold text-body-bold text-on-surface mb-1">Cuéntale al negocio qué necesitas</label>
      <p id="ayuda-mensaje" class="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">${AYUDA_MENSAJE}</p>
      <textarea id="mensaje" name="mensaje" rows="6" maxlength="${MAX_MENSAJE}" aria-describedby="ayuda-mensaje estado-mensaje"
                class="campo min-h-[150px]" placeholder="Ej.: Tengo un pantalón de lino que me queda 4 cm largo…">${esc(valor)}</textarea>
      <div class="flex justify-between items-start gap-3 pt-1.5">
        <p id="estado-mensaje" class="font-body-sm text-body-sm text-secondary min-h-[22px]" aria-live="polite"></p>
        <span id="contador" class="font-mono-code text-mono-code text-on-surface-variant shrink-0">0/${MAX_MENSAJE}</span>
      </div>
    </div>`;
}

// Contador y mensajes de validación del texto (M6, M7).
export function activarCampoMensaje(raiz) {
  const area = raiz.querySelector('#mensaje');
  const contador = raiz.querySelector('#contador');
  const estado = raiz.querySelector('#estado-mensaje');
  const actualizar = () => {
    const n = area.value.length;
    contador.textContent = `${n}/${MAX_MENSAJE}`;
    if (n >= MAX_MENSAJE) estado.textContent = M.M7;
    else if (estado.textContent === M.M7) estado.textContent = '';
    if (area.value.trim()) area.removeAttribute('aria-invalid');
  };
  area.addEventListener('input', actualizar);
  actualizar();
  return {
    area,
    validar() {
      if (!area.value.trim()) {
        estado.textContent = M.M6;
        area.setAttribute('aria-invalid', 'true');
        area.focus();
        return false;
      }
      return true;
    },
  };
}

// Envía y decide a qué pantalla ir. Lo usan P4 y P6.
export async function enviar(ctx, ofertaId, mensaje, { alFallar } = {}) {
  const borrador = prepararEnvio(ofertaId, mensaje);
  try {
    const solicitud = await datos.solicitudes.enviar(borrador);
    borrarBorrador();
    ctx.navegar(`/solicitud-registrada/${encodeURIComponent(solicitud.id)}`, { reemplazar: true });
  } catch (error) {
    if (ctx.manejarError(error)) return;
    if (esError(error, 'conexion')) {
      // No sabemos si llegó: P6 conserva el mensaje y el mismo identificador.
      if (ctx.ruta.startsWith('/envio-sin-confirmar')) {
        mostrarAviso('Todavía no hay conexión. Revisa Mis solicitudes o inténtalo de nuevo en un momento.', 'error');
        alFallar?.();
      } else {
        ctx.navegar('/envio-sin-confirmar');
      }
      return;
    }
    alFallar?.(error);
  }
}

export default async function enviarSolicitud(ctx) {
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
  if (!o.disponible) {
    ctx.main.innerHTML = ofertaNoDisponible();
    return;
  }

  // Si la persona tuvo que entrar de nuevo, se recupera lo que había escrito.
  const previo = leerBorrador();
  const textoPrevio = previo?.oferta_id === o.id ? previo.mensaje : '';

  ctx.main.innerHTML = `
    <div class="flex flex-col gap-space-lg pt-1 entrada-suave">
      <div>${enlaceVolver(`/oferta/${encodeURIComponent(o.id)}`, 'Volver a la oferta')}</div>
      <h1 class="font-headline-lg text-headline-lg text-on-surface -mt-2">Enviar solicitud</h1>
      ${resumenOferta(o)}
      <div id="error-envio"></div>
      <form id="form-solicitud" class="flex flex-col gap-space-lg" novalidate>
        ${campoMensaje(textoPrevio)}
        ${bannerInfo(M.M5)}
        <button type="submit" class="boton-principal"><span>Enviar solicitud</span>${icono('send')}</button>
      </form>
    </div>`;

  const form = ctx.main.querySelector('#form-solicitud');
  const zonaError = ctx.main.querySelector('#error-envio');
  const campo = activarCampoMensaje(form);

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    zonaError.innerHTML = '';
    if (!campo.validar()) return;
    const boton = form.querySelector('button[type="submit"]');
    ocupado(boton, true, 'Enviando…');
    await enviar(ctx, o.id, campo.area.value.trim(), {
      alFallar(error) {
        ocupado(boton, false);
        if (esError(error, 'no_disponible')) {
          zonaError.innerHTML = `${bannerError(M.M8)}<a href="#/" class="boton-secundario mt-3">${icono('storefront')} Ver otras ofertas</a>`;
          boton.disabled = true;
        } else {
          console.error(error);
          zonaError.innerHTML = bannerError('No se pudo enviar la solicitud. Inténtalo de nuevo.');
        }
        zonaError.scrollIntoView({ block: 'center' });
      },
    });
  });
}
