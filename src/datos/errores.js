// Errores que entienden las pantallas, sin importar si los datos vienen de Supabase o de la demostración.
//   credenciales   → M1
//   sesion_vencida → M2
//   conexion       → M3, M10, M13, M22 según la pantalla
//   no_disponible  → M8
//   no_encontrada  → M16 (o la oferta ya no existe)
//   permiso        → la base rechazó la operación por permisos
//   validacion     → la base rechazó los datos (por ejemplo, cerrar sin motivo)
export class ErrorDatos extends Error {
  constructor(tipo, detalle = '', codigo = '') {
    super(detalle || tipo);
    this.name = 'ErrorDatos';
    this.tipo = tipo;
    this.codigo = codigo;
  }
}

export const esError = (error, tipo) => error instanceof ErrorDatos && error.tipo === tipo;
