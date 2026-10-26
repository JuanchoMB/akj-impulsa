// Datos ficticios para el modo demostración (Ley 1581 de 2012: nada identificable).
// Siguen la convención de 02_datos_de_prueba.sql ("Cliente 1", "Modistería de prueba"…) y amplían el
// catálogo a 8 negocios y 15 ofertas, una no disponible, como en las pantallas del Componente 2.
// Los contactos usan un número inválido a propósito (570000000000).

const CONTACTO_FICTICIO = 'https://wa.me/570000000000';

export const usuariosEjemplo = [
  { id: 'u-cliente1', email: 'cliente1@akj.test', nombre: 'Cliente 1', rol: 'cliente' },
  { id: 'u-cliente2', email: 'cliente2@akj.test', nombre: 'Cliente 2', rol: 'cliente' },
  { id: 'u-emprendedor1', email: 'emprendedor1@akj.test', nombre: 'Emprendedor 1 (modistería)', rol: 'emprendedor' },
  { id: 'u-emprendedor2', email: 'emprendedor2@akj.test', nombre: 'Emprendedor 2 (muebles)', rol: 'emprendedor' },
  // Clientes sin cuenta de acceso: solo aparecen en solicitudes ya registradas.
  { id: 'u-cliente3', email: null, nombre: 'Cliente 3', rol: 'cliente' },
  { id: 'u-cliente4', email: null, nombre: 'Cliente 4', rol: 'cliente' },
];

export const negociosEjemplo = [
  { id: 'n-1', propietario_id: 'u-emprendedor1', nombre: 'Modistería de prueba', zona: 'Barrio Granada', contacto: CONTACTO_FICTICIO },
  { id: 'n-2', propietario_id: null, nombre: 'Servicio técnico de prueba', zona: 'A domicilio', contacto: CONTACTO_FICTICIO },
  { id: 'n-3', propietario_id: null, nombre: 'Repostería de prueba', zona: 'Barrio La Castellana', contacto: CONTACTO_FICTICIO },
  { id: 'n-4', propietario_id: null, nombre: 'Turismo de prueba', zona: 'Salida desde el centro', contacto: CONTACTO_FICTICIO },
  { id: 'n-5', propietario_id: null, nombre: 'Veterinaria de prueba', zona: 'Barrio Los Profesionales', contacto: CONTACTO_FICTICIO },
  { id: 'n-6', propietario_id: null, nombre: 'Pestañas de prueba', zona: 'Avenida Bolívar', contacto: CONTACTO_FICTICIO },
  { id: 'n-7', propietario_id: 'u-emprendedor2', nombre: 'Restauración de prueba', zona: 'Barrio La Patria', contacto: null },
  { id: 'n-8', propietario_id: null, nombre: 'Accesorios de prueba', zona: 'Ferias del centro', contacto: CONTACTO_FICTICIO },
];

const AVISO_URGENCIAS =
  'Este canal no atiende urgencias ni consultas clínicas. Si tu mascota tiene una urgencia, llama al consultorio.';

export const ofertasEjemplo = [
  { id: 'o-01', negocio_id: 'n-1', nombre: 'Subir ruedo', categoria: 'Arreglos', precio_cop: 12000, precio_desde: true, aviso: null, disponible: true,
    descripcion: 'Pantalones de dril, paño, vestidos y dobladillo invisible hecho a mano. Trae la prenda puesta o con la medida marcada.' },
  { id: 'o-02', negocio_id: 'n-1', nombre: 'Cambio de cremallera', categoria: 'Arreglos', precio_cop: 15000, precio_desde: true, aviso: null, disponible: true,
    descripcion: 'Cremalleras metálicas, invisibles o para chaquetas gruesas de invierno.' },
  { id: 'o-03', negocio_id: 'n-1', nombre: 'Ajuste de cintura', categoria: 'Arreglos', precio_cop: 18000, precio_desde: true, aviso: null, disponible: true,
    descripcion: 'Entrar o sacar cintura en pantalones, faldas y vestidos.' },
  { id: 'o-04', negocio_id: 'n-1', nombre: 'Vestido de fiesta a medida', categoria: 'Confección', precio_cop: 250000, precio_desde: true, aviso: null, disponible: false,
    descripcion: 'Confección personalizada con prueba previa para grados y ceremonias.' },
  { id: 'o-05', negocio_id: 'n-2', nombre: 'Visita de diagnóstico de nevera', categoria: 'Hogar y técnicos', precio_cop: 40000, precio_desde: false, aviso: null, disponible: true,
    descripcion: 'Revisión a domicilio en Armenia. La reparación se cotiza aparte cuando se ve el aparato.' },
  { id: 'o-06', negocio_id: 'n-2', nombre: 'Reparación de lavadora', categoria: 'Hogar y técnicos', precio_cop: 60000, precio_desde: true, aviso: null, disponible: true,
    descripcion: 'Lavadoras de carga superior y frontal. Cuéntanos la marca y qué está fallando.' },
  { id: 'o-07', negocio_id: 'n-3', nombre: 'Torta personalizada 20 porciones', categoria: 'Repostería', precio_cop: 120000, precio_desde: true,
    aviso: 'Pide con al menos 8 días de anticipación. Escribe en tu mensaje la fecha aproximada.', disponible: true,
    descripcion: 'Bizcocho de vainilla, chocolate o naranja con decoración según la ocasión.' },
  { id: 'o-08', negocio_id: 'n-3', nombre: 'Cupcakes decorados x 12', categoria: 'Repostería', precio_cop: 48000, precio_desde: true, aviso: null, disponible: true,
    descripcion: 'Doce cupcakes con crema de mantequilla y decoración temática.' },
  { id: 'o-09', negocio_id: 'n-4', nombre: 'Avistamiento de aves', categoria: 'Turismo', precio_cop: 150000, precio_desde: false,
    aviso: 'El precio es por persona. La salida depende del clima y se confirma por WhatsApp.', disponible: true,
    descripcion: 'Recorrido de madrugada con guía local. Incluye transporte desde el centro y refrigerio.' },
  { id: 'o-10', negocio_id: 'n-4', nombre: 'Recorrido Valle de Cocora y Salento', categoria: 'Turismo', precio_cop: 180000, precio_desde: true, aviso: null, disponible: true,
    descripcion: 'Día completo con caminata por el valle y visita al pueblo. Precio por persona.' },
  { id: 'o-11', negocio_id: 'n-5', nombre: 'Vacuna antirrábica', categoria: 'Mascotas', precio_cop: 45000, precio_desde: false, aviso: AVISO_URGENCIAS, disponible: true,
    descripcion: 'Inmunización preventiva anual contra la rabia para caninos y felinos desde los 3 meses de edad. Presenta el carné previo si lo tienes.' },
  { id: 'o-12', negocio_id: 'n-5', nombre: 'Baño y corte para perro', categoria: 'Mascotas', precio_cop: 35000, precio_desde: true, aviso: AVISO_URGENCIAS, disponible: true,
    descripcion: 'Baño, secado, corte de uñas y limpieza de oídos. El precio varía según el tamaño.' },
  { id: 'o-13', negocio_id: 'n-6', nombre: 'Extensiones de pestañas volumen ruso', categoria: 'Belleza', precio_cop: 90000, precio_desde: true, aviso: null, disponible: true,
    descripcion: 'Aplicación completa. El retoque se cotiza según el estado de las pestañas.' },
  { id: 'o-14', negocio_id: 'n-7', nombre: 'Restaurar silla', categoria: 'Muebles', precio_cop: 90000, precio_desde: true, aviso: null, disponible: true,
    descripcion: 'Lijado, resane y acabado en laca o barniz. Describe la madera y el daño en tu mensaje.' },
  { id: 'o-15', negocio_id: 'n-8', nombre: 'Aretes artesanales', categoria: 'Accesorios', precio_cop: 25000, precio_desde: true, aviso: null, disponible: true,
    descripcion: 'Aretes hechos a mano con mostacilla y semillas. Pregunta por los diseños disponibles.' },
];

export const solicitudesEjemplo = [
  { id: 's-205', numero: 205, oferta_id: 'o-01', cliente_id: 'u-cliente4', estado: 'cerrada', motivo_cierre: 'Se acordó por WhatsApp',
    mensaje: 'Necesito subir el ruedo de un vestido largo para un grado.', creada_en: '2026-10-17T10:05:00-05:00', actualizada_en: '2026-10-18T09:00:00-05:00' },
  { id: 's-207', numero: 207, oferta_id: 'o-01', cliente_id: 'u-cliente3', estado: 'en_atencion', motivo_cierre: null,
    mensaje: 'Dos pantalones de dril, unos 3 centímetros. Los necesito para el viernes si es posible.', creada_en: '2026-10-19T09:40:00-05:00', actualizada_en: '2026-10-19T14:00:00-05:00' },
  { id: 's-209', numero: 209, oferta_id: 'o-02', cliente_id: 'u-cliente4', estado: 'en_atencion', motivo_cierre: null,
    mensaje: 'Cremallera de un morral, se reventó por un lado.', creada_en: '2026-10-19T17:10:00-05:00', actualizada_en: '2026-10-20T08:30:00-05:00' },
  { id: 's-177', numero: 177, oferta_id: 'o-07', cliente_id: 'u-cliente1', estado: 'cerrada', motivo_cierre: 'Sin cupo para esa fecha',
    mensaje: 'Torta de unicornio para el cumpleaños de mi hija, para dentro de tres semanas.', creada_en: '2026-10-18T11:30:00-05:00', actualizada_en: '2026-10-18T16:00:00-05:00' },
  { id: 's-198', numero: 198, oferta_id: 'o-05', cliente_id: 'u-cliente1', estado: 'en_atencion', motivo_cierre: null,
    mensaje: 'La nevera no enfría desde ayer. Es una nevera de dos puertas.', creada_en: '2026-10-20T15:15:00-05:00', actualizada_en: '2026-10-20T18:00:00-05:00' },
  { id: 's-211', numero: 211, oferta_id: 'o-03', cliente_id: 'u-cliente3', estado: 'pendiente', motivo_cierre: null,
    mensaje: 'Vestido para un matrimonio el sábado 31.', creada_en: '2026-10-20T11:20:00-05:00', actualizada_en: '2026-10-20T11:20:00-05:00' },
  { id: 's-212', numero: 212, oferta_id: 'o-14', cliente_id: 'u-cliente2', estado: 'pendiente', motivo_cierre: null,
    mensaje: 'Silla de comedor con la madera pelada en el espaldar. Es de cedro.', creada_en: '2026-10-21T08:50:00-05:00', actualizada_en: '2026-10-21T08:50:00-05:00' },
  { id: 's-213', numero: 213, oferta_id: 'o-02', cliente_id: 'u-cliente2', estado: 'pendiente', motivo_cierre: null,
    mensaje: 'Chaqueta de jean, la cremallera se dañó.', creada_en: '2026-10-21T16:15:00-05:00', actualizada_en: '2026-10-21T16:15:00-05:00' },
  { id: 's-214', numero: 214, oferta_id: 'o-01', cliente_id: 'u-cliente1', estado: 'pendiente', motivo_cierre: null,
    mensaje: 'Pantalón azul, subir 3 cm. Lo puedo llevar el martes.', creada_en: '2026-10-22T21:41:00-05:00', actualizada_en: '2026-10-22T21:41:00-05:00' },
];
