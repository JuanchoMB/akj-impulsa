// Servicio de datos compartido: proyecto de Supabase probado en el Componente 1.
// Los permisos los aplica la base (políticas por fila de 01_esquema_y_permisos.sql); esta capa solo
// traduce nombres, respuestas y errores al formato que usan las pantallas.
//
// Funciona con 01 y 02 solamente, y aprovecha 04 y 05 en cuanto se ejecutan en la base:
//   sin 04 → el reintento de P6 puede duplicar la solicitud (como en la página de comprobación).
//   sin 05 → no hay ficha N.º (se muestra el inicio del identificador), aviso, zona ni contacto editable.
//
// Equivalencias entre la base y las pantallas:
//   emprendimientos           → negocio
//   ofertas.emprendimiento_id → negocio_id
//   precio_es_referencia      → precio_desde ("Desde $…": el precio puede cambiar según el caso)
import { createClient } from '@supabase/supabase-js';
import { ErrorDatos } from './errores.js';

const CLAVE_ALMACEN = 'akj-impulsa-sesion';

// Las relaciones se nombran con su llave foránea (!…_fkey): ofertas y emprendimientos también quedan
// unidas a través de solicitudes, y sin la indicación el servicio respondería que la relación es ambigua.
function selecciones(con05) {
  const negocio = con05 ? 'id,nombre,zona,contacto' : 'id,nombre,contacto';
  return {
    con05,
    negocio,
    oferta: `id,emprendimiento_id,nombre,descripcion,categoria,precio_cop,precio_es_referencia,${con05 ? 'aviso,' : ''}disponible,negocio:emprendimientos!ofertas_emprendimiento_id_fkey(${negocio})`,
    solicitud: `id,${con05 ? 'numero,' : ''}oferta_id,cliente_id,emprendimiento_id,mensaje,estado,motivo_cierre,creada_en,actualizada_en,oferta:ofertas!solicitudes_oferta_id_fkey(id,nombre,categoria,precio_cop,precio_es_referencia),negocio:emprendimientos!solicitudes_emprendimiento_id_fkey(${negocio})`,
  };
}

function traducir(error) {
  if (!error) return null;
  if (error instanceof ErrorDatos) return error;
  const texto = `${error.message || ''} ${error.details || ''}`.trim();
  const codigo = String(error.code || '');
  const crear = (tipo) => new ErrorDatos(tipo, texto, codigo);
  if (codigo === 'PGRST303' || /jwt expired|invalid jwt|refresh token/i.test(texto)) return crear('sesion_vencida');
  if (/failed to fetch|networkerror|load failed|fetch failed|network request failed/i.test(texto)) return crear('conexion');
  if (codigo === '42501') return crear('permiso');
  if (codigo === 'PGRST116') return crear('no_encontrada');
  // 23514: reglas como cierre_con_motivo. P0001: reglas de los disparadores (transición no permitida…).
  if (['23514', '23502', '22001', 'P0001'].includes(codigo)) return crear('validacion');
  return crear('desconocido');
}

// Supabase devuelve { data, error }; aquí se convierte en valor o excepción.
async function resultado(promesa) {
  let respuesta;
  try {
    respuesta = await promesa;
  } catch (e) {
    throw traducir(e);
  }
  if (respuesta.error) throw traducir(respuesta.error);
  return respuesta.data;
}

function aOferta(fila) {
  if (!fila) return fila;
  const { emprendimiento_id, precio_es_referencia, precio_cop, ...resto } = fila;
  return { aviso: null, ...resto, negocio_id: emprendimiento_id, precio_cop: Number(precio_cop), precio_desde: !!precio_es_referencia };
}

// Campos de la pantalla → columnas de la tabla ofertas (solo los que vienen definidos).
function aColumnasOferta(campos, con05) {
  const columnas = {
    nombre: campos.nombre,
    descripcion: campos.descripcion,
    categoria: campos.categoria,
    precio_cop: campos.precio_cop,
    precio_es_referencia: campos.precio_desde,
    aviso: con05 ? campos.aviso : undefined,
    disponible: campos.disponible,
  };
  return Object.fromEntries(Object.entries(columnas).filter(([, v]) => v !== undefined));
}

function aSolicitud(fila) {
  if (!fila) return fila;
  return {
    numero: null,
    ...fila,
    // La política perfil_propio no deja ver perfiles ajenos: el emprendedor no conoce el nombre del cliente.
    cliente_nombre: null,
    oferta: fila.oferta ? aOferta(fila.oferta) : null,
  };
}

export function crearSupabase({ url, clave }) {
  const sb = createClient(url, clave, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: CLAVE_ALMACEN },
  });

  let perfilEnCache = null;
  let sel = null;
  let con04 = true;

  // Revisa una sola vez si la migración 05 está en la base, mirando si las ofertas traen la columna aviso.
  // Si el catálogo está vacío se pregunta por la columna directamente (responde 42703 si no existe).
  async function S() {
    if (sel) return sel;
    let { data, error } = await sb.from('ofertas').select('*').limit(1);
    let con05 = data?.length ? 'aviso' in data[0] : null;
    if (con05 === null && !error) {
      ({ error } = await sb.from('ofertas').select('aviso').limit(1));
      con05 = !error;
      if (error && error.code !== '42703') return selecciones(true);
    }
    // Sin conexión: no se guarda la respuesta y se vuelve a revisar en la siguiente consulta.
    if (con05 === null) return selecciones(true);
    if (!con05) console.info('AKJ Impulsa: falta la migración 05 en Supabase; el piloto funciona sin ficha N.º, aviso, zona ni contacto editable.');
    sel = selecciones(con05);
    return sel;
  }

  async function usuarioActual() {
    const { data } = await sb.auth.getSession();
    return data.session?.user || null;
  }

  async function perfilDe(usuario) {
    if (!usuario) return null;
    if (perfilEnCache?.id === usuario.id) return perfilEnCache;
    const filas = await resultado(sb.from('perfiles').select('id,nombre,rol').eq('id', usuario.id).limit(1));
    if (!filas.length) throw new ErrorDatos('permiso', 'La cuenta no tiene perfil en public.perfiles (revisa 02_datos_de_prueba.sql).');
    perfilEnCache = { id: usuario.id, email: usuario.email, nombre: filas[0].nombre, rol: filas[0].rol };
    return perfilEnCache;
  }

  async function exigirUsuario() {
    const u = await usuarioActual();
    if (!u) throw new ErrorDatos('sesion_vencida');
    return u;
  }

  async function negocioMio() {
    const u = await exigirUsuario();
    const { negocio } = await S();
    const filas = await resultado(
      sb.from('emprendimientos').select(`${negocio},propietario_id`).eq('propietario_id', u.id).limit(1),
    );
    return filas[0] ? { zona: null, ...filas[0] } : null;
  }

  return {
    modo: 'supabase',

    // Qué partes del diseño admite la base en este momento (las pantallas ocultan las que no).
    async capacidades() {
      const { con05 } = await S();
      return { aviso: con05, contactoEditable: con05 };
    },

    sesion: {
      async obtener() {
        const u = await usuarioActual();
        if (!u) return null;
        try {
          return await perfilDe(u);
        } catch (e) {
          if (e.tipo === 'sesion_vencida') return null;
          throw e;
        }
      },
      async entrar(email, contrasena) {
        let respuesta;
        try {
          respuesta = await sb.auth.signInWithPassword({ email: String(email).trim(), password: contrasena });
        } catch (e) {
          throw traducir(e);
        }
        const { data, error } = respuesta;
        if (error) {
          if (error.status === 400 || /invalid login credentials/i.test(error.message)) throw new ErrorDatos('credenciales');
          throw traducir(error);
        }
        perfilEnCache = null;
        try {
          return await perfilDe(data.user);
        } catch (e) {
          await sb.auth.signOut({ scope: 'local' }).catch(() => {});
          throw e;
        }
      },
      // M31 y pendiente del Componente 1: la sesión se borra del dispositivo aunque el servicio
      // responda con error (el 403 de /logout?scope=global que se vio en la comprobación).
      async salir() {
        perfilEnCache = null;
        try {
          await sb.auth.signOut({ scope: 'local' });
        } catch {
          // Se ignora: lo importante es que el dispositivo quede sin sesión.
        }
        try {
          localStorage.removeItem(CLAVE_ALMACEN);
        } catch {
          // Sin almacenamiento disponible.
        }
      },
      alCambiar(fn) {
        const { data } = sb.auth.onAuthStateChange((evento, session) => {
          if (evento === 'SIGNED_OUT' || !session) {
            perfilEnCache = null;
            fn(null);
          }
        });
        return () => data.subscription.unsubscribe();
      },
    },

    ofertas: {
      async catalogo() {
        const { oferta } = await S();
        const filas = await resultado(sb.from('ofertas').select(oferta).eq('disponible', true).order('nombre'));
        return filas.map(aOferta);
      },
      async obtener(id) {
        const { oferta } = await S();
        const filas = await resultado(sb.from('ofertas').select(oferta).eq('id', id).limit(1));
        if (!filas.length) throw new ErrorDatos('no_encontrada');
        return aOferta(filas[0]);
      },
      async mias() {
        const n = await negocioMio();
        if (!n) return [];
        const { oferta } = await S();
        const filas = await resultado(
          sb.from('ofertas').select(oferta).eq('emprendimiento_id', n.id)
            .order('disponible', { ascending: false }).order('nombre'),
        );
        return filas.map(aOferta);
      },
      async crear(campos) {
        const n = await negocioMio();
        if (!n) throw new ErrorDatos('permiso');
        const { oferta, con05 } = await S();
        const fila = await resultado(
          sb.from('ofertas').insert({ ...aColumnasOferta(campos, con05), emprendimiento_id: n.id }).select(oferta).single(),
        );
        return aOferta(fila);
      },
      async actualizar(id, campos) {
        const { oferta, con05 } = await S();
        const filas = await resultado(sb.from('ofertas').update(aColumnasOferta(campos, con05)).eq('id', id).select(oferta));
        // Cero filas = la oferta no es de este negocio (casos negativos N6 y N9).
        if (!filas.length) throw new ErrorDatos('no_encontrada');
        return aOferta(filas[0]);
      },
    },

    solicitudes: {
      // Reintento sin duplicar: el id lo genera el navegador; si ya existe, la base responde 23505
      // y se muestra la solicitud que ya estaba registrada (migración 04).
      // El negocio y el estado inicial los pone la base (disparador antes_de_crear_solicitud).
      async enviar({ id, oferta_id, mensaje }) {
        const u = await exigirUsuario();
        const { solicitud } = await S();
        const insertar = (fila) => resultado(sb.from('solicitudes').insert(fila).select(solicitud).single());
        try {
          const fila = await insertar(con04 ? { id, oferta_id, mensaje, cliente_id: u.id } : { oferta_id, mensaje, cliente_id: u.id });
          return aSolicitud(fila);
        } catch (e) {
          if (e.codigo === '23505') {
            const fila = await resultado(sb.from('solicitudes').select(solicitud).eq('id', id).single());
            return aSolicitud(fila);
          }
          if (e.codigo === 'P0001' && /no está disponible/i.test(e.message)) throw new ErrorDatos('no_disponible', e.message, e.codigo);
          // Sin la migración 04 la base no deja escribir el id: se envía sin él (el reintento podría duplicar).
          if (con04 && e.codigo === '42501' && /permission denied for table/i.test(e.message)) {
            console.warn('AKJ Impulsa: falta la migración 04 en Supabase. El reintento de P6 podría duplicar solicitudes.');
            con04 = false;
            return aSolicitud(await insertar({ oferta_id, mensaje, cliente_id: u.id }));
          }
          throw e;
        }
      },
      async mias() {
        const u = await exigirUsuario();
        const { solicitud } = await S();
        const filas = await resultado(
          sb.from('solicitudes').select(solicitud).eq('cliente_id', u.id).order('creada_en', { ascending: false }),
        );
        return filas.map(aSolicitud);
      },
      async delNegocio() {
        const n = await negocioMio();
        if (!n) return [];
        const { solicitud } = await S();
        const filas = await resultado(
          sb.from('solicitudes').select(solicitud).eq('emprendimiento_id', n.id).order('creada_en', { ascending: false }),
        );
        return filas.map(aSolicitud);
      },
      async obtener(id) {
        const { solicitud } = await S();
        const filas = await resultado(sb.from('solicitudes').select(solicitud).eq('id', id).limit(1));
        if (!filas.length) throw new ErrorDatos('no_encontrada');
        return aSolicitud(filas[0]);
      },
      async cambiarEstado(id, estado, motivo = null) {
        const { solicitud } = await S();
        const cambios = estado === 'cerrada' ? { estado, motivo_cierre: motivo } : { estado };
        const filas = await resultado(sb.from('solicitudes').update(cambios).eq('id', id).select(solicitud));
        // Cero filas modificadas = la solicitud no es de este negocio (caso negativo N8).
        if (!filas.length) throw new ErrorDatos('no_encontrada');
        return aSolicitud(filas[0]);
      },
    },

    negocio: {
      mio: negocioMio,
      // Requiere la migración 05 (permiso editar_contacto_propio).
      async guardarContacto(contacto) {
        const n = await negocioMio();
        if (!n) throw new ErrorDatos('permiso');
        const { negocio } = await S();
        const filas = await resultado(
          sb.from('emprendimientos').update({ contacto: contacto || null }).eq('id', n.id).select(`${negocio},propietario_id`),
        );
        if (!filas.length) throw new ErrorDatos('permiso');
        return filas[0];
      },
    },
  };
}
