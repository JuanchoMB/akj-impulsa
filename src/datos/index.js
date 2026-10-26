// Punto único de acceso a los datos. Las pantallas no saben si hablan con Supabase o con la demostración.
import { config } from '../config.js';
import { crearDemostracion } from './demo.js';
import { crearSupabase } from './supabase.js';

export const datos =
  config.modo === 'supabase'
    ? crearSupabase({ url: config.supabaseUrl, clave: config.supabaseClave })
    : crearDemostracion();

export { ErrorDatos, esError } from './errores.js';
export { nuevoId } from './id.js';
