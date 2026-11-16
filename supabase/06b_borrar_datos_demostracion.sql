-- AKJ Impulsa · 06b: deshace 06_datos_demostracion.sql.
-- Borra las cuentas, negocios, ofertas y solicitudes agregadas, y devuelve los nombres originales de 02.
-- Las solicitudes de la comprobación del Componente 1 no se tocan.

delete from public.solicitudes where id::text like '30000000-0000-0000-0000-0000000001%';
-- Solicitudes que otras personas hayan creado desde el piloto sobre las ofertas o con las cuentas agregadas.
delete from public.solicitudes
 where oferta_id::text like '20000000-0000-0000-0000-0000000000%'
   and oferta_id not in ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003');
delete from public.solicitudes where cliente_id::text like 'a0000000-0000-4000-8000-%';
delete from public.ofertas
 where id::text like '20000000-0000-0000-0000-0000000000%'
   and id not in ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003');
delete from public.emprendimientos where id in (
  '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000008');
delete from public.perfiles where id::text like 'a0000000-0000-4000-8000-%';
delete from auth.identities where user_id::text like 'a0000000-0000-4000-8000-%';
delete from auth.users where id::text like 'a0000000-0000-4000-8000-%';

update public.perfiles p set nombre = v.nombre
from (values ('cliente1@akj.test', 'Cliente 1'), ('cliente2@akj.test', 'Cliente 2'),
             ('emprendedor1@akj.test', 'Emprendedor 1 (modistería)'), ('emprendedor2@akj.test', 'Emprendedor 2 (muebles)')) v(email, nombre)
join auth.users u on u.email = v.email
where p.id = u.id;
update public.emprendimientos set nombre = 'Modistería de prueba' where id = '10000000-0000-0000-0000-000000000001';
update public.emprendimientos set nombre = 'Restauración de prueba', contacto = null where id = '10000000-0000-0000-0000-000000000002';
