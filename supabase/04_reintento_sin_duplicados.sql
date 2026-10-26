-- AKJ Impulsa · Migración 04 (24 oct 2026): reintentar un envío sin duplicar la solicitud.
-- Se ejecuta en Supabase DESPUÉS de 01_esquema_y_permisos.sql. No cambia ninguna política de acceso.
--
-- Cómo se usa desde la aplicación:
--   1. Antes de enviar, el navegador genera el identificador: const id = crypto.randomUUID();
--   2. Inserta la solicitud con ese id. Si la conexión falla, conserva el mismo id.
--   3. Al reintentar con el mismo id, la base responde con el error 23505 (clave duplicada)
--      si la primera vez sí se guardó. La aplicación lo trata como "ya estaba registrada"
--      y muestra la confirmación, en lugar de crear una segunda solicitud.
grant insert (id) on public.solicitudes to authenticated;
