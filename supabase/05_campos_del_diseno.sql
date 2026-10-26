-- AKJ Impulsa · Migración 05 (25 oct 2026): campos del diseño (Componente 2) que usa el piloto.
-- Se ejecuta en el SQL Editor de Supabase DESPUÉS de 01, 02 y 04.
-- No modifica ni elimina ninguna política probada en el Componente 1: solo agrega columnas
-- y dos permisos nuevos y acotados (puntos 3 y 4).

-- 1. Número de ficha visible para cliente y emprendedor (P5, P7, P8–P11: "Ficha N.º 101").
--    Lo asigna la base; nadie lo puede escribir. Las solicitudes que ya existen reciben número al ejecutar esto.
alter table public.solicitudes
  add column numero bigint generated always as identity (start with 101) unique;

-- 2. Aviso para el cliente (M4: P2 y P13) y zona del negocio (P1 y P2: "· Barrio Granada").
--    Los permisos de 01 sobre ofertas y emprendimientos son de tabla completa, así que ya cubren estas columnas.
alter table public.ofertas
  add column aviso text check (aviso is null or length(trim(aviso)) between 1 and 200);
alter table public.emprendimientos
  add column zona text;

-- 3. D2: el emprendedor registra el contacto de SU negocio en Cuenta (P14). Solo la columna contacto.
grant update (contacto) on public.emprendimientos to authenticated;
create policy editar_contacto_propio on public.emprendimientos for update to authenticated
  using (propietario_id = auth.uid())
  with check (propietario_id = auth.uid());

-- 4. El cliente sigue viendo el nombre de la oferta en Mis solicitudes (P7) aunque el negocio
--    la marque como no disponible (D1). Solo las ofertas que ese mismo cliente solicitó.
create policy ver_oferta_solicitada on public.ofertas for select to authenticated
  using (exists (select 1 from public.solicitudes s
                 where s.oferta_id = ofertas.id and s.cliente_id = auth.uid()));

-- Zonas de los negocios de prueba (opcional, solo para que el catálogo se vea como en el diseño).
update public.emprendimientos set zona = 'Barrio Granada'   where id = '10000000-0000-0000-0000-000000000001';
update public.emprendimientos set zona = 'Barrio La Patria' where id = '10000000-0000-0000-0000-000000000002';
