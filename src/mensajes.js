// Mensajes del sistema definidos en la sección 7 del Componente 2.
// Criterios: decir qué pasó y qué hacer, sin culpar a la persona; el botón y su confirmación usan
// el mismo verbo; ningún mensaje promete notificaciones, reservas ni pagos.
export const M = {
  M1: 'Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.',
  M2: 'Tu sesión terminó. Entra de nuevo para continuar.',
  M3: 'No pudimos cargar las ofertas. Revisa tu conexión e inténtalo de nuevo.',
  M5: 'Enviar no es una reserva ni un pago. El negocio te responde y acuerdan los detalles.',
  M6: 'Escribe qué necesitas antes de enviar.',
  M7: 'Llegaste al máximo de 500 caracteres.',
  M8: 'Esta oferta ya no está disponible. Vuelve al catálogo para ver otras.',
  M9_TITULO: '¡Solicitud registrada!',
  M9: 'El negocio la verá en su panel. Puedes seguir el estado en Mis solicitudes.',
  M10_TITULO: 'No pudimos confirmar el envío',
  M10: 'Se perdió la conexión y no sabemos si tu solicitud llegó al negocio. Revisa Mis solicitudes: si ya aparece, no la envíes de nuevo.',
  M10B: 'Si la reintentas, no se duplica: el sistema reconoce que es la misma solicitud.',
  M11: 'Aún no has enviado solicitudes. Mira las ofertas y envía la primera.',
  M13: 'No se pudo actualizar. Revisa tu conexión e inténtalo de nuevo.',
  M14: 'Cerrada por el emprendimiento:',
  M15: 'No tienes solicitudes pendientes. Cuando un cliente te escriba desde la app, aparecerá aquí.',
  M16: 'Esta solicitud no está disponible para tu cuenta.',
  M17: 'Solicitud en atención. El cliente ya puede verlo.',
  M18: 'El cliente verá el motivo. Cerrar no significa que hubo una venta. Una solicitud cerrada no se puede reabrir.',
  M19: 'Elige un motivo para cerrar la solicitud.',
  M20: 'Escribe el motivo.',
  M21: 'Solicitud cerrada. El cliente verá el motivo.',
  M22: 'No se pudo cambiar el estado. Revisa tu conexión e inténtalo de nuevo.',
  M23_NO: 'Oferta no disponible. Ya no aparece en el catálogo.',
  M23_SI: 'Oferta disponible. Ya aparece en el catálogo.',
  M24: 'Completa el nombre, la descripción y el precio de referencia.',
  M25: 'Escribe el precio de referencia en pesos, sin decimales.',
  M26: 'Oferta guardada.',
  M27: 'Cambios guardados.',
  M28: (ficha) =>
    `¿Necesitas acordar detalles? Escríbele al negocio y menciona tu ficha ${ficha}. La plataforma no comparte tus datos de contacto con el negocio.`,
  M29: (ficha) =>
    `La plataforma no te muestra los datos de contacto del cliente, salvo lo que él escriba en su mensaje. Si necesita acordar detalles, te escribirá a tu WhatsApp mencionando la ficha ${ficha}. Aquí registras en qué va la solicitud.`,
  M30: 'Contacto guardado. Los clientes lo verán en el detalle de tus ofertas.',
};

// Motivos de cierre (sección 6 del Componente 2). "Otro" abre un campo de texto corto.
export const MOTIVOS_CIERRE = [
  'Consulta respondida',
  'Se acordó por WhatsApp',
  'Sin cupo para esa fecha',
  'Oferta no disponible',
  'El cliente no respondió',
];

export const ESTADOS = {
  pendiente: {
    nombre: 'Pendiente',
    plural: 'Pendientes',
    explicacion: 'el negocio aún no la revisa.',
  },
  en_atencion: {
    nombre: 'En atención',
    plural: 'En atención',
    explicacion: 'el negocio la está gestionando.',
  },
  cerrada: {
    nombre: 'Cerrada',
    plural: 'Cerradas',
    explicacion: 'el negocio terminó de gestionarla y dejó un motivo.',
  },
};

// La base guarda el nombre visible de la categoría (ofertas.categoria, como en 02_datos_de_prueba.sql).
export const CATEGORIAS = [
  { valor: 'Arreglos', icono: 'content_cut', punto: 'bg-primary' },
  { valor: 'Confección', icono: 'checkroom', punto: 'bg-on-primary-fixed-variant' },
  { valor: 'Hogar y técnicos', icono: 'home_repair_service', punto: 'bg-tertiary-container' },
  { valor: 'Repostería', icono: 'bakery_dining', punto: 'bg-secondary-container' },
  { valor: 'Turismo', icono: 'hiking', punto: 'bg-cafetal' },
  { valor: 'Mascotas', icono: 'pets', punto: 'bg-secondary' },
  { valor: 'Belleza', icono: 'face_retouching_natural', punto: 'bg-maiz' },
  { valor: 'Muebles', icono: 'chair', punto: 'bg-gris' },
  { valor: 'Accesorios', icono: 'diamond', punto: 'bg-outline' },
];

export const MAX_MENSAJE = 500;
