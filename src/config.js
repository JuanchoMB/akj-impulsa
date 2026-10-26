// Lee la conexión a Supabase desde .env.local. Sin los dos valores, el piloto usa el modo demostración.
const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const clave = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

// Protección: una clave secreta nunca debe llegar al navegador.
const pareceSecreta = clave.startsWith('sb_secret_') || clave.includes('service_role');
if (pareceSecreta) {
  console.error(
    'AKJ Impulsa: VITE_SUPABASE_PUBLISHABLE_KEY parece una clave secreta. Usa la clave publishable. El piloto arranca en modo demostración.',
  );
}

export const config = {
  supabaseUrl: url,
  supabaseClave: clave,
  modo: url && clave && !pareceSecreta ? 'supabase' : 'demostracion',
};

export const esDemostracion = config.modo === 'demostracion';
