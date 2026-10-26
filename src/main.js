import './estilos.css';
import { datos, esError } from './datos/index.js';
import { bannerError, cargando, enlaceVolver } from './ui/componentes.js';
import { pintarBarra, pintarEncabezado } from './ui/shell.js';

import catalogo from './pantallas/catalogo.js';
import detalleOferta from './pantallas/detalleOferta.js';
import entrar from './pantallas/entrar.js';
import enviarSolicitud from './pantallas/enviarSolicitud.js';
import solicitudRegistrada from './pantallas/solicitudRegistrada.js';
import envioSinConfirmar from './pantallas/envioSinConfirmar.js';
import misSolicitudes from './pantallas/misSolicitudes.js';
import cuenta from './pantallas/cuenta.js';
import panel from './pantallas/panel.js';
import detalleSolicitud from './pantallas/detalleSolicitud.js';
import misOfertas from './pantallas/misOfertas.js';
import formularioOferta from './pantallas/formularioOferta.js';

// Mapa de navegación (sección 3 del Componente 2). "barra" es la pestaña activa de la barra inferior;
// las pantallas de formulario y de detalle del emprendedor no la muestran, como en el diseño.
const RUTAS = [
  { patron: '/', pantalla: catalogo, barra: 'ofertas', titulo: 'Ofertas' },
  { patron: '/oferta/:id', pantalla: detalleOferta, barra: 'ofertas', titulo: 'Detalle de oferta' },
  { patron: '/oferta/:id/solicitar', pantalla: enviarSolicitud, rol: 'cliente', titulo: 'Enviar solicitud' },
  { patron: '/solicitud-registrada/:id', pantalla: solicitudRegistrada, rol: 'cliente', titulo: 'Solicitud registrada' },
  { patron: '/envio-sin-confirmar', pantalla: envioSinConfirmar, rol: 'cliente', titulo: 'Envío sin confirmar' },
  { patron: '/mis-solicitudes', pantalla: misSolicitudes, rol: 'cliente', barra: 'mis-solicitudes', titulo: 'Mis solicitudes' },
  { patron: '/entrar', pantalla: entrar, barra: 'cuenta', soloInvitado: true, titulo: 'Entrar' },
  { patron: '/cuenta', pantalla: cuenta, rol: 'sesion', barra: 'cuenta', titulo: 'Cuenta' },
  { patron: '/panel', pantalla: panel, rol: 'emprendedor', barra: 'solicitudes', titulo: 'Solicitudes' },
  { patron: '/panel/:id', pantalla: detalleSolicitud, rol: 'emprendedor', titulo: 'Detalle de solicitud' },
  { patron: '/panel/:id/cerrar', pantalla: detalleSolicitud, rol: 'emprendedor', titulo: 'Cerrar solicitud', cerrar: true },
  { patron: '/mis-ofertas', pantalla: misOfertas, rol: 'emprendedor', barra: 'mis-ofertas', titulo: 'Mis ofertas' },
  { patron: '/mis-ofertas/nueva', pantalla: formularioOferta, rol: 'emprendedor', titulo: 'Nueva oferta' },
  { patron: '/mis-ofertas/:id/editar', pantalla: formularioOferta, rol: 'emprendedor', titulo: 'Editar oferta' },
];

const main = document.getElementById('contenido');
let sesion = null;
let turno = 0;
let limpiezas = [];
let primeraVez = true;

function leerHash() {
  const crudo = decodeURI(location.hash.replace(/^#/, '')) || '/';
  const [ruta, consulta = ''] = crudo.split('?');
  return { ruta: ruta || '/', query: Object.fromEntries(new URLSearchParams(consulta)), completa: crudo };
}

function buscarRuta(ruta) {
  const partes = ruta.split('/').filter(Boolean);
  for (const r of RUTAS) {
    const patron = r.patron.split('/').filter(Boolean);
    if (patron.length !== partes.length) continue;
    const params = {};
    const coincide = patron.every((p, i) => {
      if (p.startsWith(':')) {
        params[p.slice(1)] = decodeURIComponent(partes[i]);
        return true;
      }
      return p === partes[i];
    });
    if (coincide) return { ...r, params };
  }
  return null;
}

const inicioDe = (s) => (s?.rol === 'emprendedor' ? '/panel' : '/');

// Solo se aceptan rutas internas en ?volver= (evita redirecciones a otros sitios).
function rutaSegura(ruta, porDefecto) {
  return typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//') ? ruta : porDefecto;
}

function navegar(ruta, { reemplazar = false } = {}) {
  const destino = `#${ruta}`;
  if (reemplazar) {
    history.replaceState(null, '', destino);
    renderizar();
  } else if (location.hash === destino) {
    renderizar();
  } else {
    location.hash = ruta;
  }
}

// M2: si la sesión venció, se borra del dispositivo y se pide entrar de nuevo.
function manejarError(error) {
  if (!esError(error, 'sesion_vencida')) return false;
  const volver = leerHash().completa;
  sesion = null;
  datos.sesion.salir();
  navegar(`/entrar?aviso=sesion&volver=${encodeURIComponent(volver)}`, { reemplazar: true });
  return true;
}

async function renderizar() {
  const { ruta, query, completa } = leerHash();
  const r = buscarRuta(ruta);

  // Reglas de acceso por rol (la base también las aplica; aquí solo se evita mostrar pantallas vacías).
  if (r?.rol && !sesion) return navegar(`/entrar?volver=${encodeURIComponent(completa)}`, { reemplazar: true });
  if (r?.rol && r.rol !== 'sesion' && sesion.rol !== r.rol) return navegar(inicioDe(sesion), { reemplazar: true });
  if (r?.soloInvitado && sesion) return navegar(rutaSegura(query.volver, inicioDe(sesion)), { reemplazar: true });
  if (r?.patron === '/' && sesion?.rol === 'emprendedor') return navegar('/panel', { reemplazar: true });

  limpiezas.forEach((fn) => fn());
  limpiezas = [];
  const miTurno = ++turno;

  document.title = r ? `${r.titulo} · AKJ Impulsa` : 'Página no encontrada · AKJ Impulsa';
  pintarEncabezado(sesion, { ocultarEntrar: r?.patron === '/entrar' });
  pintarBarra(sesion, r?.barra || null);
  main.className = `block w-full max-w-[480px] mx-auto px-margin pt-[calc(4.5rem_+_env(safe-area-inset-top))] ${
    r?.barra ? 'pb-[calc(7rem_+_env(safe-area-inset-bottom))]' : 'pb-10'
  } min-h-[100dvh] outline-none`;
  main.innerHTML = cargando();
  if (!r?.cerrar) window.scrollTo(0, 0);

  if (!r) {
    main.innerHTML = `
      <div class="pt-2 flex flex-col gap-4">
        ${enlaceVolver(inicioDe(sesion), 'Ir al inicio')}
        <h1 class="font-headline-lg text-headline-lg">No encontramos esta página</h1>
        <p class="text-on-surface-variant">Puede que el enlace esté incompleto. Vuelve al inicio para seguir.</p>
      </div>`;
    return;
  }

  const ctx = {
    params: r.params,
    query,
    ruta: completa,
    sesion,
    main,
    cerrar: !!r.cerrar,
    navegar,
    vigente: () => miTurno === turno,
    alSalir: (fn) => limpiezas.push(fn),
    manejarError,
    iniciarSesion(perfil) {
      sesion = perfil;
      navegar(rutaSegura(query.volver, inicioDe(perfil)), { reemplazar: true });
    },
    async cerrarSesion() {
      sesion = null;
      await datos.sesion.salir();
      navegar('/entrar', { reemplazar: true });
    },
  };

  try {
    await r.pantalla(ctx);
  } catch (error) {
    if (manejarError(error)) return;
    console.error(error);
    if (ctx.vigente()) {
      main.innerHTML = bannerError('Algo salió mal al abrir esta pantalla. Revisa tu conexión e inténtalo de nuevo.', {
        reintentar: true,
      });
      main.querySelector('[data-reintentar]')?.addEventListener('click', () => renderizar());
    }
  }

  // Al cambiar de pantalla, el foco va al contenido para que los lectores de pantalla la anuncien.
  if (!primeraVez && ctx.vigente() && !r.cerrar) main.focus({ preventScroll: true });
  primeraVez = false;
}

async function arrancar() {
  try {
    sesion = await datos.sesion.obtener();
  } catch (error) {
    console.error(error);
    sesion = null;
  }
  // Si el servicio invalida la sesión (por ejemplo, no se pudo renovar el token), se vuelve a pintar.
  datos.sesion.alCambiar((nueva) => {
    if (!nueva && sesion) {
      sesion = null;
      renderizar();
    }
  });
  window.addEventListener('hashchange', renderizar);
  renderizar();
}

arrancar();
