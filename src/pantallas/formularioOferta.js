// P13 · Nueva oferta y Editar oferta (RF02). Mismo formulario; al editar se cargan los datos.
import { datos, esError } from '../datos/index.js';
import { CATEGORIAS, M } from '../mensajes.js';
import { mostrarAviso } from '../ui/avisos.js';
import { bannerError, enlaceVolver, ocupado } from '../ui/componentes.js';
import { categoria, esc, icono } from '../ui/formato.js';

const LIMITES = { nombre: 80, descripcion: 500, aviso: 200 };
const PRECIO_MAXIMO = 100000000;
const miles = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

// "28.000", "28000" o "$ 28.000" → 28000. Decimales o letras → null (M25).
export function leerPrecio(texto) {
  const limpio = String(texto || '').replace(/[\s$]/g, '');
  if (!/^(\d{1,3}(\.\d{3})+|\d+)$/.test(limpio)) return null;
  const valor = Number(limpio.replaceAll('.', ''));
  return valor > 0 && valor <= PRECIO_MAXIMO ? valor : null;
}

// Si la oferta tiene una categoría que no está en la lista, se conserva como opción para no cambiarla sin querer.
function opcionesCategoria(actual) {
  const elegida = categoria(actual).valor;
  const valores = CATEGORIAS.map((c) => c.valor);
  if (elegida && !valores.includes(elegida)) valores.push(elegida);
  return valores.map((v) => `<option value="${esc(v)}" ${v === elegida ? 'selected' : ''}>${esc(v)}</option>`).join('');
}

function campoTexto({ id, etiqueta, valor, ayuda = '', placeholder = '', maximo, opcional = false }) {
  return `
    <div class="flex flex-col gap-1.5">
      <label for="${id}" class="font-body-bold text-body-sm text-on-surface">${etiqueta}${opcional ? ' <span class="font-body-base text-on-surface-variant">(opcional)</span>' : ''}</label>
      <input id="${id}" name="${id}" type="text" maxlength="${maximo}" value="${esc(valor)}" placeholder="${esc(placeholder)}"
             class="campo" ${ayuda ? `aria-describedby="ayuda-${id}"` : ''} />
      ${ayuda ? `<span id="ayuda-${id}" class="font-body-sm text-[13px] text-on-surface-variant">${ayuda}</span>` : ''}
    </div>`;
}

export default async function formularioOferta(ctx) {
  const editando = !!ctx.params.id;
  let o = { nombre: '', descripcion: '', categoria: CATEGORIAS[0].valor, precio_cop: '', precio_desde: true, aviso: '' };
  // El aviso para el cliente necesita la migración 05; sin ella el campo no se muestra.
  const { aviso: conAviso } = await datos.capacidades();
  if (!ctx.vigente()) return;

  if (editando) {
    try {
      o = await datos.ofertas.obtener(ctx.params.id);
      const negocio = await datos.negocio.mio();
      if (negocio?.id !== o.negocio_id) throw Object.assign(new Error('ajena'), { tipo: 'no_encontrada' });
    } catch (error) {
      if (ctx.manejarError(error) || !ctx.vigente()) return;
      ctx.main.innerHTML = `<div class="pt-2 flex flex-col gap-4">${enlaceVolver('/mis-ofertas', 'Volver a Mis ofertas')}
        ${bannerError(error.tipo === 'no_encontrada' ? 'Esta oferta no está disponible para tu cuenta.' : 'No pudimos cargar la oferta. Revisa tu conexión e inténtalo de nuevo.')}</div>`;
      return;
    }
    if (!ctx.vigente()) return;
  }

  ctx.main.innerHTML = `
    <div class="flex flex-col pt-1 pb-4 entrada-suave">
      <div>${enlaceVolver('/mis-ofertas', 'Volver a Mis ofertas')}</div>
      <header class="mt-2 mb-6">
        <h1 class="font-headline-lg text-headline-lg text-on-surface mb-1">${editando ? 'Editar oferta' : 'Nueva oferta'}</h1>
        <p class="font-body-base text-body-base text-on-surface-variant">
          ${editando ? 'Los cambios se verán en el catálogo cuando guardes.' : 'Publica una oferta para que los clientes te envíen solicitudes.'}
        </p>
      </header>
      <div id="error-oferta" class="mb-4 empty:mb-0"></div>
      <form id="form-oferta" class="flex flex-col gap-5" novalidate>
        ${campoTexto({ id: 'nombre', etiqueta: 'Nombre de la oferta', valor: o.nombre, maximo: LIMITES.nombre,
          ayuda: 'Usa un nombre corto que el cliente entienda.', placeholder: 'Ej.: Ajuste de hombros en chaqueta' })}

        <div class="flex flex-col gap-1.5">
          <label for="descripcion" class="font-body-bold text-body-sm text-on-surface">Descripción</label>
          <textarea id="descripcion" name="descripcion" rows="4" maxlength="${LIMITES.descripcion}" class="campo"
                    placeholder="Qué incluye, materiales o condiciones del servicio">${esc(o.descripcion)}</textarea>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="categoria" class="font-body-bold text-body-sm text-on-surface">Categoría</label>
          <div class="relative">
            <select id="categoria" name="categoria" class="campo appearance-none pr-10 cursor-pointer">
              ${opcionesCategoria(o.categoria)}
            </select>
            ${icono('expand_more', 'text-[22px] text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none')}
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="precio" class="font-body-bold text-body-sm text-on-surface">Precio de referencia</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 font-mono-price text-mono-price text-on-surface-variant" aria-hidden="true">$</span>
            <input id="precio" name="precio" type="text" inputmode="numeric" autocomplete="off" aria-describedby="ayuda-precio"
                   class="campo pl-9 font-mono-price text-mono-price" value="${o.precio_cop ? esc(miles.format(o.precio_cop)) : ''}" placeholder="0" />
          </div>
          <span id="ayuda-precio" class="font-body-sm text-[13px] text-on-surface-variant">En pesos colombianos, sin decimales.</span>
        </div>

        <label class="rounded-[10px] bg-surface-container-low p-4 flex items-start gap-3 cursor-pointer">
          <input type="checkbox" id="precio_desde" name="precio_desde" class="mt-1 w-6 h-6 shrink-0 accent-[#2447a0]" ${o.precio_desde ? 'checked' : ''} />
          <span class="flex flex-col">
            <span class="font-body-bold text-body-base text-on-surface leading-tight">El precio puede cambiar según el caso</span>
            <span class="font-body-sm text-body-sm text-on-surface-variant mt-1">Se mostrará como “Desde $…”. El valor final lo acuerdas con el cliente cuando veas el caso.</span>
          </span>
        </label>

        ${
          conAviso
            ? campoTexto({ id: 'aviso', etiqueta: 'Aviso para el cliente', valor: o.aviso || '', maximo: LIMITES.aviso, opcional: true,
                ayuda: 'Aparecerá destacado en la ficha antes de que el cliente envíe su solicitud.', placeholder: 'Ej.: No atendemos urgencias por este canal' })
            : ''
        }

        <button type="submit" class="boton-principal mt-2">${icono('save')} <span>${editando ? 'Guardar cambios' : 'Guardar oferta'}</span></button>
      </form>
    </div>`;

  const form = ctx.main.querySelector('#form-oferta');
  const zonaError = ctx.main.querySelector('#error-oferta');
  const campo = (id) => form.querySelector(`#${id}`);

  campo('precio').addEventListener('blur', () => {
    const valor = leerPrecio(campo('precio').value);
    if (valor) campo('precio').value = miles.format(valor);
  });

  function marcar(ids) {
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    ids.forEach((id) => campo(id).setAttribute('aria-invalid', 'true'));
    if (ids.length) campo(ids[0]).focus();
  }

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    zonaError.innerHTML = '';
    const nombre = campo('nombre').value.trim();
    const descripcion = campo('descripcion').value.trim();
    const textoPrecio = campo('precio').value.trim();

    const faltan = [!nombre && 'nombre', !descripcion && 'descripcion', !textoPrecio && 'precio'].filter(Boolean);
    if (faltan.length) {
      zonaError.innerHTML = bannerError(M.M24);
      marcar(faltan);
      return;
    }
    const precio_cop = leerPrecio(textoPrecio);
    if (!precio_cop) {
      zonaError.innerHTML = bannerError(M.M25);
      marcar(['precio']);
      return;
    }
    marcar([]);

    const campos = {
      nombre,
      descripcion,
      categoria: campo('categoria').value,
      precio_cop,
      precio_desde: campo('precio_desde').checked,
      aviso: conAviso ? campo('aviso').value.trim() || null : undefined,
    };

    const boton = form.querySelector('button[type="submit"]');
    ocupado(boton, true, 'Guardando…');
    try {
      if (editando) await datos.ofertas.actualizar(o.id, campos);
      else await datos.ofertas.crear({ ...campos, disponible: true });
      ctx.navegar('/mis-ofertas', { reemplazar: true });
      mostrarAviso(editando ? M.M27 : M.M26, 'exito');
    } catch (error) {
      if (ctx.manejarError(error)) return;
      ocupado(boton, false);
      console.error(error);
      zonaError.innerHTML = bannerError(
        esError(error, 'validacion')
          ? 'Revisa los datos de la oferta: alguno no es válido.'
          : 'No se pudo guardar la oferta. Revisa tu conexión e inténtalo de nuevo.',
      );
      zonaError.scrollIntoView({ block: 'center' });
    }
  });
}
