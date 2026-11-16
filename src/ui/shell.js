import { esDemostracion } from '../config.js';
import { esc, icono, inicial } from './formato.js';

// Barra inferior por rol (sección 2 del Componente 2).
const BARRAS = {
  invitado: [
    { id: 'ofertas', ruta: '/', texto: 'Ofertas', icono: 'storefront' },
    { id: 'mis-solicitudes', ruta: '/mis-solicitudes', texto: 'Mis solicitudes', icono: 'assignment' },
    { id: 'cuenta', ruta: '/entrar', texto: 'Entrar', icono: 'account_circle' },
  ],
  cliente: [
    { id: 'ofertas', ruta: '/', texto: 'Ofertas', icono: 'storefront' },
    { id: 'mis-solicitudes', ruta: '/mis-solicitudes', texto: 'Mis solicitudes', icono: 'assignment' },
    { id: 'cuenta', ruta: '/cuenta', texto: 'Cuenta', icono: 'account_circle' },
  ],
  emprendedor: [
    { id: 'solicitudes', ruta: '/panel', texto: 'Solicitudes', icono: 'assignment' },
    { id: 'mis-ofertas', ruta: '/mis-ofertas', texto: 'Mis ofertas', icono: 'storefront' },
    { id: 'cuenta', ruta: '/cuenta', texto: 'Cuenta', icono: 'account_circle' },
  ],
};

// En computador (desde 768 px) el menú va en el encabezado; en el celular, en la barra inferior.
function menuEscritorio(sesion, activa) {
  const items = (BARRAS[sesion?.rol] || BARRAS.invitado).filter((item) => item.id !== 'cuenta');
  return `
    <nav class="hidden md:flex items-center gap-1" aria-label="Menú">
      ${items
        .map((item) => {
          const actual = item.id === activa;
          return `<a href="#${item.ruta}" ${actual ? 'aria-current="page"' : ''}
            class="min-h-[44px] px-4 rounded-full flex items-center gap-2 text-body-sm transition-colors ${
              actual ? 'bg-primary-fixed text-primary font-body-bold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }">${icono(item.icono, `text-[20px] ${actual ? 'icono-relleno' : ''}`)}<span>${item.texto}</span></a>`;
        })
        .join('')}
    </nav>`;
}

export function pintarEncabezado(sesion, { ocultarEntrar = false, activa = null } = {}) {
  const contenedor = document.getElementById('encabezado');
  const accion = sesion
    ? `<a href="#/cuenta" class="flex items-center gap-2 rounded-full md:pl-1 md:pr-3 md:py-1 md:hover:bg-surface-container ${activa === 'cuenta' ? 'md:bg-primary-fixed' : ''}"
          aria-label="Cuenta de ${esc(sesion.nombre)}">
         <span class="w-11 h-11 md:w-9 md:h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-display text-[18px] md:text-[15px] font-bold">${esc(inicial(sesion.nombre))}</span>
         <span class="hidden md:inline font-body-bold text-body-sm text-on-surface max-w-[180px] truncate">${esc(sesion.nombre)}</span>
       </a>`
    : ocultarEntrar
      ? ''
      : `<a href="#/entrar" class="min-h-[44px] min-w-[44px] px-space-sm md:px-5 flex items-center justify-center rounded-full font-body-bold text-body-bold text-primary hover:underline md:hover:no-underline md:bg-primary md:text-on-primary md:hover:bg-[#1b367a]">Entrar</a>`;
  contenedor.innerHTML = `
    <div class="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.05)] pt-safe">
      <div class="h-16 md:h-[72px] px-margin md:px-8 flex items-center justify-between gap-6 max-w-[480px] md:max-w-[1120px] mx-auto">
        <a href="#/" class="flex flex-col min-w-0 shrink-0" aria-label="AKJ Impulsa, ir al inicio">
          <span class="font-headline-sm text-headline-sm md:text-[21px] text-primary tracking-tight leading-none">AKJ Impulsa</span>
          <span class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider leading-none mt-1">
            Armenia, Quindío${esDemostracion ? ' · <span class="text-secondary">Demostración</span>' : ''}
          </span>
        </a>
        ${menuEscritorio(sesion, activa)}
        <div class="flex items-center gap-space-sm">${accion}</div>
      </div>
    </div>`;
}

export function pintarBarra(sesion, activa) {
  const contenedor = document.getElementById('barra-inferior');
  if (!activa) {
    contenedor.innerHTML = '';
    document.body.dataset.conBarra = 'no';
    return;
  }
  document.body.dataset.conBarra = 'si';
  const items = BARRAS[sesion?.rol] || BARRAS.invitado;
  contenedor.innerHTML = `
    <div class="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div class="max-w-[480px] mx-auto h-16 flex items-center justify-around px-space-xs">
        ${items
          .map((item) => {
            const actual = item.id === activa;
            return `<a href="#${item.ruta}" ${actual ? 'aria-current="page"' : ''}
              class="flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                actual ? 'text-primary font-body-bold' : 'text-on-surface-variant hover:text-on-surface'
              }">
              ${icono(item.icono, `text-[24px] ${actual ? 'icono-relleno' : ''}`)}
              <span class="font-label-caps text-label-caps">${item.texto}</span>
            </a>`;
          })
          .join('')}
      </div>
    </div>`;
}
