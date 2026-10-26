import { esc, icono } from './formato.js';

// Aviso breve de confirmación o error (M17, M21, M23, M26, M27, M30…).
// Se muestra sobre la barra inferior y se anuncia a lectores de pantalla (aria-live en #avisos).
let temporizador = null;

const ESTILOS = {
  exito: { icono: 'check_circle', color: 'text-tertiary-fixed' },
  error: { icono: 'error', color: 'text-secondary-fixed-dim' },
  info: { icono: 'info', color: 'text-primary-fixed-dim' },
};

export function mostrarAviso(texto, tipo = 'exito') {
  const contenedor = document.getElementById('avisos');
  if (!contenedor) return;
  const estilo = ESTILOS[tipo] || ESTILOS.info;
  const conBarra = document.body.dataset.conBarra === 'si';
  contenedor.innerHTML = `
    <div role="status" class="fijo-columna fixed left-0 right-0 ${conBarra ? 'bottom-[84px]' : 'bottom-5'} z-[60] px-margin entrada-suave">
      <div class="bg-inverse-surface text-inverse-on-surface rounded-[10px] px-4 py-3 flex items-start gap-2.5 shadow-lg">
        ${icono(estilo.icono, `${estilo.color} text-[20px] icono-relleno mt-0.5`)}
        <p class="font-body-sm text-body-sm flex-1">${esc(texto)}</p>
        <button type="button" data-cerrar-aviso class="-m-1.5 w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-inverse-on-surface/80 hover:bg-white/10" aria-label="Cerrar aviso">
          ${icono('close', 'text-[18px]')}
        </button>
      </div>
    </div>`;
  contenedor.querySelector('[data-cerrar-aviso]').addEventListener('click', ocultarAviso);
  clearTimeout(temporizador);
  temporizador = setTimeout(ocultarAviso, 4500);
}

export function ocultarAviso() {
  clearTimeout(temporizador);
  const contenedor = document.getElementById('avisos');
  if (contenedor) contenedor.innerHTML = '';
}
