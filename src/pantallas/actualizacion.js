// Botón "Actualizar" con la etiqueta "Actualizado hace N min" (M12) para P7 y P8.
import { haceCuanto, icono } from '../ui/formato.js';

export function botonActualizar() {
  return `
    <div class="flex flex-col items-end shrink-0">
      <button type="button" data-actualizar
              class="flex items-center gap-1.5 px-3 min-h-[48px] bg-surface-container-lowest text-primary rounded-[10px] hover:bg-surface-container transition-colors shadow-sm">
        ${icono('refresh', 'text-[20px]')}
        <span class="font-body-bold text-body-sm">Actualizar</span>
      </button>
      <span data-hace class="font-body-sm text-[12px] text-on-surface-variant mt-1" aria-live="polite"></span>
    </div>`;
}

// Mantiene al día la etiqueta mientras la pantalla esté abierta.
export function activarEtiqueta(ctx, obtenerFecha) {
  const pintar = () => {
    const etiqueta = ctx.main.querySelector('[data-hace]');
    if (etiqueta) etiqueta.textContent = haceCuanto(obtenerFecha());
  };
  pintar();
  const intervalo = setInterval(pintar, 30000);
  ctx.alSalir(() => clearInterval(intervalo));
  return pintar;
}

export function girar(ctx, activo) {
  const boton = ctx.main.querySelector('[data-actualizar]');
  if (!boton) return;
  boton.disabled = activo;
  boton.setAttribute('aria-busy', String(activo));
  boton.querySelector('.material-symbols-outlined')?.classList.toggle('girando', activo);
}
