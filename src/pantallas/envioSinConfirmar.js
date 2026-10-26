// P6 · Envío sin confirmar (RF05, RNF06, M10, M10b). Invita a revisar Mis solicitudes antes de reintentar;
// el reintento usa el mismo identificador, así que no duplica la solicitud.
import { datos, esError } from '../datos/index.js';
import { M } from '../mensajes.js';
import { mostrarAviso } from '../ui/avisos.js';
import { bannerInfo, enlaceVolver, ocupado } from '../ui/componentes.js';
import { icono } from '../ui/formato.js';
import { guardarBorrador, leerBorrador } from './borrador.js';
import { activarCampoMensaje, campoMensaje, enviar, resumenOferta } from './enviarSolicitud.js';

export default async function envioSinConfirmar(ctx) {
  const borrador = leerBorrador();
  if (!borrador?.id) {
    ctx.navegar('/mis-solicitudes', { reemplazar: true });
    return;
  }

  // Sin conexión puede que no carguemos la oferta; la pantalla funciona igual sin el resumen.
  const oferta = await datos.ofertas.obtener(borrador.oferta_id).catch(() => null);
  if (!ctx.vigente()) return;

  ctx.main.innerHTML = `
    <div class="flex flex-col gap-4 pt-1 entrada-suave">
      <div>${enlaceVolver(`/oferta/${encodeURIComponent(borrador.oferta_id)}`, 'Volver a la oferta')}</div>
      <h1 class="font-headline-lg text-headline-lg text-on-surface -mt-2">${M.M10_TITULO}</h1>
      ${oferta ? resumenOferta(oferta) : ''}

      <div class="bg-error-container/40 rounded-xl p-4 flex items-start gap-3" role="alert">
        <span class="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center shrink-0 mt-0.5">${icono('error', 'text-[20px] icono-relleno')}</span>
        <div class="flex-1 flex flex-col">
          <span class="font-body-bold text-body-base text-on-error-container">Revisa antes de enviarla otra vez</span>
          <p class="font-body-sm text-body-sm text-on-error-container mt-0.5">${M.M10}</p>
        </div>
      </div>

      <form id="form-reintento" class="flex flex-col gap-4" novalidate>
        <div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
          ${campoMensaje(borrador.mensaje)}
          <p class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 -mt-1">
            ${icono('info', 'text-[16px]')} Tu mensaje se conservó.
          </p>
        </div>
        ${bannerInfo(M.M5, 'verified_user')}
        <div class="pt-1 flex flex-col gap-3">
          <a href="#/mis-solicitudes" class="boton-principal">${icono('assignment')} Ver mis solicitudes</a>
          <button type="submit" class="boton-secundario">${icono('refresh')} <span>Reintentar envío</span></button>
          <p class="font-body-sm text-body-sm text-on-surface-variant text-center">${M.M10B}</p>
        </div>
      </form>
    </div>`;

  const form = ctx.main.querySelector('#form-reintento');
  const campo = activarCampoMensaje(form);
  campo.area.addEventListener('input', () => guardarBorrador({ ...leerBorrador(), mensaje: campo.area.value }));

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!campo.validar()) return;
    const boton = form.querySelector('button[type="submit"]');
    ocupado(boton, true, 'Enviando…');
    await enviar(ctx, borrador.oferta_id, campo.area.value.trim(), {
      alFallar(error) {
        ocupado(boton, false);
        if (error) {
          console.error(error);
          mostrarAviso(esError(error, 'no_disponible') ? M.M8 : 'No se pudo enviar la solicitud. Inténtalo de nuevo.', 'error');
        }
      },
    });
  });
}
