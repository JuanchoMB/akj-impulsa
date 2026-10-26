// P3 · Entrar con las cuentas de prueba (RF01). Un solo mensaje de error (M1).
import { esDemostracion } from '../config.js';
import { datos, esError } from '../datos/index.js';
import { M } from '../mensajes.js';
import { bannerError, bannerInfo, ocupado } from '../ui/componentes.js';
import { icono } from '../ui/formato.js';

const CUENTAS_PRUEBA = ['cliente1@akj.test', 'cliente2@akj.test', 'emprendedor1@akj.test', 'emprendedor2@akj.test'];

function ayudaDemostracion() {
  if (!esDemostracion) return '';
  return `
    <section class="rounded-xl border border-dashed border-secondary/50 bg-surface-container-lowest p-4 flex flex-col gap-3" aria-labelledby="titulo-demo">
      <div class="flex items-center gap-2">
        ${icono('science', 'text-secondary text-[20px]')}
        <h2 id="titulo-demo" class="font-body-bold text-body-base">Modo demostración</h2>
      </div>
      <p class="font-body-sm text-body-sm text-on-surface-variant">
        Los datos son ficticios y se guardan solo en este navegador. Toca una cuenta para llenar el correo; en la demostración sirve cualquier contraseña.
      </p>
      <div class="grid grid-cols-2 gap-2">
        ${CUENTAS_PRUEBA.map(
          (c) => `<button type="button" data-cuenta="${c}" class="min-h-[44px] px-2 rounded-lg bg-surface-container-low text-primary font-mono-code text-[12px] font-semibold hover:bg-surface-container break-all">${c}</button>`,
        ).join('')}
      </div>
    </section>`;
}

export default async function entrar(ctx) {
  const avisoSesion = ctx.query.aviso === 'sesion' ? bannerInfo(M.M2, 'schedule') : '';

  ctx.main.innerHTML = `
    <div class="flex flex-col gap-5 pt-2 entrada-suave">
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-[8px] bg-primary/10 text-primary">${icono('key', 'text-[18px]')}</span>
          <span class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Acceso al piloto</span>
        </div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Entrar</h1>
        <p class="font-body-base text-body-base text-on-surface-variant">Usa la cuenta de prueba que te dio el equipo del piloto.</p>
      </div>

      ${avisoSesion}
      <div id="error-entrar"></div>

      <form id="form-entrar" class="flex flex-col gap-5" novalidate>
        <div class="flex flex-col gap-1.5">
          <label for="correo" class="font-body-bold text-body-bold">Correo</label>
          <input id="correo" name="correo" type="email" inputmode="email" autocomplete="username" autocapitalize="none" spellcheck="false"
                 class="campo" required />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="contrasena" class="font-body-bold text-body-bold">Contraseña</label>
          <div class="relative">
            <input id="contrasena" name="contrasena" type="password" autocomplete="current-password" class="campo pr-28" required />
            <button type="button" id="ver-contrasena" aria-controls="contrasena" aria-pressed="false"
                    class="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[44px] px-3 rounded-lg bg-surface-container-high text-primary font-body-bold text-body-sm flex items-center gap-1">
              ${icono('visibility', 'text-[18px]')}<span>Mostrar</span>
            </button>
          </div>
        </div>
        <button type="submit" class="boton-principal mt-1"><span>Entrar</span>${icono('arrow_forward')}</button>
      </form>

      ${ayudaDemostracion()}

      <p class="font-body-sm text-body-sm text-on-surface-variant">
        Las cuentas son de prueba y los datos son ficticios. No escribas aquí contraseñas de otros servicios.
      </p>
    </div>`;

  const form = ctx.main.querySelector('#form-entrar');
  const correo = form.querySelector('#correo');
  const contrasena = form.querySelector('#contrasena');
  const zonaError = ctx.main.querySelector('#error-entrar');
  const verBtn = form.querySelector('#ver-contrasena');

  verBtn.addEventListener('click', () => {
    const mostrar = contrasena.type === 'password';
    contrasena.type = mostrar ? 'text' : 'password';
    verBtn.setAttribute('aria-pressed', String(mostrar));
    verBtn.innerHTML = `${icono(mostrar ? 'visibility_off' : 'visibility', 'text-[18px]')}<span>${mostrar ? 'Ocultar' : 'Mostrar'}</span>`;
  });

  ctx.main.querySelectorAll('[data-cuenta]').forEach((b) =>
    b.addEventListener('click', () => {
      correo.value = b.dataset.cuenta;
      contrasena.focus();
    }),
  );

  function mostrarError(texto) {
    zonaError.innerHTML = bannerError(texto);
    correo.setAttribute('aria-invalid', 'true');
    contrasena.setAttribute('aria-invalid', 'true');
    zonaError.scrollIntoView({ block: 'nearest' });
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    zonaError.innerHTML = '';
    correo.removeAttribute('aria-invalid');
    contrasena.removeAttribute('aria-invalid');
    if (!correo.value.trim() || !contrasena.value) {
      mostrarError('Escribe tu correo y tu contraseña para entrar.');
      (correo.value.trim() ? contrasena : correo).focus();
      return;
    }
    const boton = form.querySelector('button[type="submit"]');
    ocupado(boton, true, 'Entrando…');
    try {
      const perfil = await datos.sesion.entrar(correo.value, contrasena.value);
      ctx.iniciarSesion(perfil);
    } catch (error) {
      ocupado(boton, false);
      if (esError(error, 'credenciales')) {
        mostrarError(M.M1);
        contrasena.value = '';
        contrasena.focus();
      } else if (esError(error, 'conexion')) {
        mostrarError('No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.');
      } else {
        console.error(error);
        mostrarError('No pudimos entrar. Inténtalo de nuevo en un momento.');
      }
    }
  });
}
