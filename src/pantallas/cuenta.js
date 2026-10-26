// P14 · Cuenta del cliente y del emprendedor (RF01, D2, M30, M31).
import { esDemostracion } from '../config.js';
import { datos } from '../datos/index.js';
import { M } from '../mensajes.js';
import { mostrarAviso } from '../ui/avisos.js';
import { ocupado } from '../ui/componentes.js';
import { enlaceContacto, esc, icono, inicial } from '../ui/formato.js';

function tarjetaPerfil(sesion) {
  return `
    <section class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center gap-4">
      <div class="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center font-display text-[22px] font-bold shrink-0" aria-hidden="true">
        ${esc(inicial(sesion.nombre))}
      </div>
      <div class="flex flex-col min-w-0">
        <span class="font-body-bold text-body-bold text-on-surface">${esc(sesion.nombre)}</span>
        <span class="font-mono-code text-mono-code text-on-surface-variant truncate">${esc(sesion.email || '')}</span>
        <span class="mt-1 self-start px-2 py-0.5 rounded bg-surface-container font-label-caps text-label-caps uppercase text-on-surface-variant">
          ${sesion.rol === 'emprendedor' ? 'Emprendedor' : 'Cliente'}
        </span>
      </div>
    </section>`;
}

function seccionNegocio(negocio, editable) {
  if (!negocio) {
    return `<p class="font-body-sm text-body-sm text-on-surface-variant">Tu cuenta todavía no tiene un negocio asociado. Pídele al equipo del piloto que lo cree.</p>`;
  }
  // Sin la migración 05 la base no deja cambiar el contacto: se muestra solo para leer.
  if (!editable) {
    return `
      <section class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2">
        <span class="font-label-caps text-label-caps uppercase text-on-surface-variant">Tu negocio</span>
        <span class="font-body-bold text-body-bold text-on-surface">${esc(negocio.nombre)}</span>
        <span class="font-body-bold text-body-sm text-on-surface mt-1">Contacto para clientes</span>
        <span class="font-mono-code text-mono-code text-on-surface-variant break-all">${esc(negocio.contacto || 'Sin contacto registrado')}</span>
        <span class="font-body-sm text-[13px] text-on-surface-variant">Por ahora el contacto lo registra el equipo del piloto.</span>
      </section>`;
  }
  return `
    <form id="form-contacto" class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3" novalidate>
      <span class="font-label-caps text-label-caps uppercase text-on-surface-variant">Tu negocio</span>
      <span class="font-body-bold text-body-bold text-on-surface">${esc(negocio.nombre)}</span>
      <label for="contacto" class="font-body-bold text-body-sm text-on-surface">Contacto para clientes (opcional)</label>
      <input id="contacto" name="contacto" class="campo font-mono-code text-mono-code" inputmode="url" autocomplete="off"
             placeholder="https://wa.me/57… o tu número de celular" value="${esc(negocio.contacto || '')}" aria-describedby="ayuda-contacto error-contacto" />
      <span id="ayuda-contacto" class="font-body-sm text-[13px] text-on-surface-variant">
        Aparece en el detalle de tus ofertas. Es el canal por el que los clientes te escriben mencionando su ficha.
      </span>
      <span id="error-contacto" class="font-body-sm text-body-sm text-secondary" aria-live="polite"></span>
      <button type="submit" class="boton-principal min-h-[48px] text-body-sm">Guardar contacto</button>
    </form>`;
}

export default async function cuenta(ctx) {
  const { sesion } = ctx;
  let negocio = null;
  let editable = false;
  if (sesion.rol === 'emprendedor') {
    try {
      [negocio, { contactoEditable: editable }] = await Promise.all([datos.negocio.mio(), datos.capacidades()]);
    } catch (error) {
      if (ctx.manejarError(error)) return;
      console.error(error);
    }
    if (!ctx.vigente()) return;
  }

  ctx.main.innerHTML = `
    <div class="flex flex-col gap-5 pt-2 entrada-suave">
      <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Cuenta</h1>
      ${tarjetaPerfil(sesion)}
      ${sesion.rol === 'emprendedor' ? seccionNegocio(negocio, editable) : ''}
      <p class="font-body-sm text-body-sm text-on-surface-variant">Esta es una cuenta de prueba del piloto. Los datos son ficticios.</p>
      <button type="button" id="cerrar-sesion"
              class="w-full min-h-[52px] rounded-xl border-2 border-secondary/40 text-secondary font-body-bold text-body-bold flex items-center justify-center gap-2 hover:bg-secondary/5">
        ${icono('logout')} Cerrar sesión
      </button>
      ${
        esDemostracion
          ? `<button type="button" id="restablecer" class="self-center min-h-[44px] px-3 text-on-surface-variant font-body-sm text-body-sm underline">
               Restablecer los datos de la demostración
             </button>`
          : ''
      }
    </div>`;

  // M31: se vuelve a P3 aunque el servicio no responda.
  ctx.main.querySelector('#cerrar-sesion').addEventListener('click', async (evento) => {
    ocupado(evento.currentTarget, true, 'Cerrando sesión…');
    await ctx.cerrarSesion();
  });

  ctx.main.querySelector('#restablecer')?.addEventListener('click', () => {
    if (!confirm('¿Volver a los datos de ejemplo? Se borran las solicitudes y ofertas que creaste en esta demostración.')) return;
    datos.restablecer();
    mostrarAviso('Datos de la demostración restablecidos.', 'info');
  });

  const form = ctx.main.querySelector('#form-contacto');
  form?.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const campo = form.querySelector('#contacto');
    const error = form.querySelector('#error-contacto');
    const valor = campo.value.trim();
    error.textContent = '';
    campo.removeAttribute('aria-invalid');
    if (valor && !enlaceContacto(valor)) {
      error.textContent = 'Escribe un enlace que empiece por https:// o un número de celular de 10 dígitos.';
      campo.setAttribute('aria-invalid', 'true');
      campo.focus();
      return;
    }
    const boton = form.querySelector('button[type="submit"]');
    ocupado(boton, true, 'Guardando…');
    try {
      await datos.negocio.guardarContacto(valor);
      mostrarAviso(M.M30, 'exito');
    } catch (e) {
      if (ctx.manejarError(e)) return;
      console.error(e);
      mostrarAviso('No se pudo guardar el contacto. Revisa tu conexión e inténtalo de nuevo.', 'error');
    } finally {
      ocupado(boton, false);
    }
  });
}
