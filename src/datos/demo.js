// Modo demostración: imita el servicio compartido de Supabase dentro de este navegador.
// Sirve para mostrar y probar las pantallas sin conexión a la base. Las reglas de permisos
// replican las políticas probadas en el Componente 1 (cada quien ve y cambia solo lo suyo).
import { ErrorDatos } from './errores.js';
import { negociosEjemplo, ofertasEjemplo, solicitudesEjemplo, usuariosEjemplo } from './ejemplo.js';
import { nuevoId } from './id.js';

const CLAVE_DATOS = 'akj-demo-datos-v2';
const CLAVE_SESION = 'akj-demo-sesion';
const ESPERA_MS = 250;

function leer(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave));
  } catch {
    return null;
  }
}

function escribir(clave, valor) {
  try {
    if (valor == null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento (modo privado): los datos viven solo mientras la pestaña esté abierta.
  }
}

function datosIniciales() {
  return {
    usuarios: structuredClone(usuariosEjemplo),
    negocios: structuredClone(negociosEjemplo),
    ofertas: structuredClone(ofertasEjemplo),
    solicitudes: structuredClone(solicitudesEjemplo),
    siguienteNumero: 215,
  };
}

export function crearDemostracion() {
  let bd = leer(CLAVE_DATOS) || datosIniciales();
  let usuarioId = leer(CLAVE_SESION);
  const oyentes = new Set();

  const guardar = () => escribir(CLAVE_DATOS, bd);

  // Simula la red: una pequeña espera y error de conexión si el navegador está sin internet.
  async function red() {
    await new Promise((r) => setTimeout(r, ESPERA_MS));
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new ErrorDatos('conexion', 'Sin conexión (modo demostración)');
    }
  }

  const usuarioActual = () => bd.usuarios.find((u) => u.id === usuarioId) || null;

  function exigirSesion(rol) {
    const u = usuarioActual();
    if (!u) throw new ErrorDatos('sesion_vencida');
    if (rol && u.rol !== rol) throw new ErrorDatos('permiso');
    return u;
  }

  const negocioPorId = (id) => bd.negocios.find((n) => n.id === id);
  const negocioPublico = (n) => (n ? { id: n.id, nombre: n.nombre, zona: n.zona, contacto: n.contacto } : null);

  function ofertaConNegocio(o) {
    return { ...structuredClone(o), negocio: negocioPublico(negocioPorId(o.negocio_id)) };
  }

  function negocioDe(usuario) {
    return bd.negocios.find((n) => n.propietario_id === usuario.id) || null;
  }

  function solicitudCompleta(s) {
    const o = bd.ofertas.find((x) => x.id === s.oferta_id);
    return {
      ...structuredClone(s),
      // Como en la base (política perfil_propio), el emprendedor no ve ningún dato del cliente.
      cliente_nombre: null,
      oferta: o
        ? { id: o.id, nombre: o.nombre, categoria: o.categoria, precio_cop: o.precio_cop, precio_desde: o.precio_desde }
        : null,
      negocio: negocioPublico(negocioPorId(o?.negocio_id)),
    };
  }

  const recientesPrimero = (a, b) => new Date(b.creada_en) - new Date(a.creada_en);

  function avisar() {
    const sesion = usuarioActual();
    oyentes.forEach((fn) => fn(sesion ? { ...sesion } : null));
  }

  return {
    modo: 'demostracion',

    async capacidades() {
      return { aviso: true, contactoEditable: true };
    },

    sesion: {
      async obtener() {
        const u = usuarioActual();
        return u ? { id: u.id, email: u.email, nombre: u.nombre, rol: u.rol } : null;
      },
      async entrar(email, contrasena) {
        await red();
        const correo = String(email || '').trim().toLowerCase();
        const u = bd.usuarios.find((x) => x.email && x.email === correo);
        if (!u || !contrasena) throw new ErrorDatos('credenciales');
        usuarioId = u.id;
        escribir(CLAVE_SESION, usuarioId);
        avisar();
        return { id: u.id, email: u.email, nombre: u.nombre, rol: u.rol };
      },
      async salir() {
        usuarioId = null;
        escribir(CLAVE_SESION, null);
        avisar();
      },
      alCambiar(fn) {
        oyentes.add(fn);
        return () => oyentes.delete(fn);
      },
    },

    ofertas: {
      async catalogo() {
        await red();
        return bd.ofertas
          .filter((o) => o.disponible)
          .map(ofertaConNegocio)
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      },
      async obtener(id) {
        await red();
        const o = bd.ofertas.find((x) => x.id === id);
        const u = usuarioActual();
        const esDueno = o && u && negocioPorId(o.negocio_id)?.propietario_id === u.id;
        // Una oferta no disponible solo la ve su dueño (D1).
        if (!o || (!o.disponible && !esDueno)) throw new ErrorDatos('no_encontrada');
        return ofertaConNegocio(o);
      },
      async mias() {
        await red();
        const u = exigirSesion('emprendedor');
        const n = negocioDe(u);
        if (!n) return [];
        return bd.ofertas
          .filter((o) => o.negocio_id === n.id)
          .map(ofertaConNegocio)
          .sort((a, b) => Number(b.disponible) - Number(a.disponible) || a.nombre.localeCompare(b.nombre, 'es'));
      },
      async crear(campos) {
        await red();
        const u = exigirSesion('emprendedor');
        const n = negocioDe(u);
        if (!n) throw new ErrorDatos('permiso');
        const nueva = { ...campos, id: nuevoId(), negocio_id: n.id, disponible: campos.disponible ?? true };
        bd.ofertas.push(nueva);
        guardar();
        return ofertaConNegocio(nueva);
      },
      async actualizar(id, campos) {
        await red();
        const u = exigirSesion('emprendedor');
        const o = bd.ofertas.find((x) => x.id === id);
        if (!o || negocioPorId(o.negocio_id)?.propietario_id !== u.id) throw new ErrorDatos('no_encontrada');
        const { nombre, descripcion, categoria, precio_cop, precio_desde, aviso, disponible } = campos;
        Object.assign(
          o,
          Object.fromEntries(
            Object.entries({ nombre, descripcion, categoria, precio_cop, precio_desde, aviso, disponible }).filter(
              ([, v]) => v !== undefined,
            ),
          ),
        );
        guardar();
        return ofertaConNegocio(o);
      },
    },

    solicitudes: {
      async enviar({ id, oferta_id, mensaje }) {
        await red();
        const u = exigirSesion('cliente');
        // Reintento con el mismo identificador: no se duplica (migración 04).
        const existente = bd.solicitudes.find((s) => s.id === id);
        if (existente) {
          if (existente.cliente_id !== u.id) throw new ErrorDatos('permiso');
          return solicitudCompleta(existente);
        }
        const o = bd.ofertas.find((x) => x.id === oferta_id);
        if (!o || !o.disponible) throw new ErrorDatos('no_disponible');
        const ahora = new Date().toISOString();
        const nueva = {
          id,
          numero: bd.siguienteNumero++,
          oferta_id,
          cliente_id: u.id,
          mensaje,
          estado: 'pendiente',
          motivo_cierre: null,
          creada_en: ahora,
          actualizada_en: ahora,
        };
        bd.solicitudes.push(nueva);
        guardar();
        return solicitudCompleta(nueva);
      },
      async mias() {
        await red();
        const u = exigirSesion('cliente');
        return bd.solicitudes
          .filter((s) => s.cliente_id === u.id)
          .sort(recientesPrimero)
          .map((s) => solicitudCompleta(s));
      },
      async delNegocio() {
        await red();
        const u = exigirSesion('emprendedor');
        const n = negocioDe(u);
        if (!n) return [];
        const ids = new Set(bd.ofertas.filter((o) => o.negocio_id === n.id).map((o) => o.id));
        return bd.solicitudes
          .filter((s) => ids.has(s.oferta_id))
          .sort(recientesPrimero)
          .map((s) => solicitudCompleta(s));
      },
      async obtener(id) {
        await red();
        const u = exigirSesion();
        const s = bd.solicitudes.find((x) => x.id === id);
        if (!s) throw new ErrorDatos('no_encontrada');
        const o = bd.ofertas.find((x) => x.id === s.oferta_id);
        const esDueno = negocioPorId(o?.negocio_id)?.propietario_id === u.id;
        if (s.cliente_id !== u.id && !esDueno) throw new ErrorDatos('no_encontrada');
        return solicitudCompleta(s);
      },
      async cambiarEstado(id, estado, motivo = null) {
        await red();
        const u = exigirSesion('emprendedor');
        const s = bd.solicitudes.find((x) => x.id === id);
        const o = s && bd.ofertas.find((x) => x.id === s.oferta_id);
        if (!s || negocioPorId(o?.negocio_id)?.propietario_id !== u.id) throw new ErrorDatos('no_encontrada');
        // Reglas de estados: una cerrada no se reabre; cerrar exige motivo (cierre_con_motivo).
        if (s.estado === 'cerrada') throw new ErrorDatos('validacion', 'La solicitud ya está cerrada');
        if (estado === 'en_atencion' && s.estado !== 'pendiente') throw new ErrorDatos('validacion');
        if (estado === 'cerrada' && !String(motivo || '').trim()) throw new ErrorDatos('validacion', 'cierre_con_motivo');
        s.estado = estado;
        s.motivo_cierre = estado === 'cerrada' ? String(motivo).trim() : null;
        s.actualizada_en = new Date().toISOString();
        guardar();
        return solicitudCompleta(s);
      },
    },

    negocio: {
      async mio() {
        await red();
        const u = exigirSesion('emprendedor');
        const n = negocioDe(u);
        return n ? structuredClone(n) : null;
      },
      async guardarContacto(contacto) {
        await red();
        const u = exigirSesion('emprendedor');
        const n = negocioDe(u);
        if (!n) throw new ErrorDatos('permiso');
        n.contacto = contacto || null;
        guardar();
        return structuredClone(n);
      },
    },

    // Solo en demostración: vuelve a los datos de ejemplo.
    restablecer() {
      bd = datosIniciales();
      guardar();
    },
  };
}
