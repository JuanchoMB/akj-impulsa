-- AKJ Impulsa · 06 (16 nov 2026): datos de demostración más completos.
-- Se ejecuta DESPUÉS de 01, 02, 04 y 05. No cambia tablas ni permisos.
--   · Nombres realistas pero ficticios para las 4 cuentas y los 2 negocios existentes (Ley 1581 de 2012).
--   · 10 cuentas nuevas: emprendedor3 a emprendedor8 y cliente3 a cliente6 @akj.test.
--     Cada cuenta nueva copia la contraseña cifrada de cliente1@akj.test (no se escribe ninguna clave aquí).
--   · 8 negocios en total, 24 ofertas (una no disponible) y 17 solicitudes en distintos estados.
-- Se puede ejecutar más de una vez. Para deshacerlo: 06b_borrar_datos_demostracion.sql.

-- 1. Nombres de las cuentas y negocios que ya existían ─────────────────────────────────────
update public.perfiles p set nombre = v.nombre
from (values ('cliente1@akj.test', 'Laura Gómez'), ('cliente2@akj.test', 'Andrés Ríos'),
             ('emprendedor1@akj.test', 'Rosa Elena Castaño'), ('emprendedor2@akj.test', 'Germán Restrepo')) v(email, nombre)
join auth.users u on u.email = v.email
where p.id = u.id;

update public.emprendimientos set nombre = 'Arreglos La Aguja de Rosa', zona = 'Barrio Granada'
  where id = '10000000-0000-0000-0000-000000000001';
update public.emprendimientos set nombre = 'Taller Madera Viva', zona = 'Barrio La Patria', contacto = 'https://wa.me/570000000002'
  where id = '10000000-0000-0000-0000-000000000002';

-- 2. Cuentas nuevas (copian la configuración y la contraseña de cliente1) ─────────────────
do $$
declare
  cuenta record;
  columnas_usuario text;
  columnas_identidad text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into columnas_usuario
    from information_schema.columns
   where table_schema = 'auth' and table_name = 'users' and is_generated = 'NEVER';
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into columnas_identidad
    from information_schema.columns
   where table_schema = 'auth' and table_name = 'identities' and is_generated = 'NEVER';

  for cuenta in
    select * from (values
      ('a0000000-0000-4000-8000-0000000000e3'::uuid, 'emprendedor3@akj.test', 'emprendedor', 'Natalia Giraldo'),
      ('a0000000-0000-4000-8000-0000000000e4'::uuid, 'emprendedor4@akj.test', 'emprendedor', 'Carlos Mario López'),
      ('a0000000-0000-4000-8000-0000000000e5'::uuid, 'emprendedor5@akj.test', 'emprendedor', 'Felipe Arango'),
      ('a0000000-0000-4000-8000-0000000000e6'::uuid, 'emprendedor6@akj.test', 'emprendedor', 'Diana Marcela Quintero'),
      ('a0000000-0000-4000-8000-0000000000e7'::uuid, 'emprendedor7@akj.test', 'emprendedor', 'Manuela Vélez'),
      ('a0000000-0000-4000-8000-0000000000e8'::uuid, 'emprendedor8@akj.test', 'emprendedor', 'Sofía Londoño'),
      ('a0000000-0000-4000-8000-0000000000c3'::uuid, 'cliente3@akj.test', 'cliente', 'Paula Herrera'),
      ('a0000000-0000-4000-8000-0000000000c4'::uuid, 'cliente4@akj.test', 'cliente', 'Santiago Morales'),
      ('a0000000-0000-4000-8000-0000000000c5'::uuid, 'cliente5@akj.test', 'cliente', 'Valeria Cárdenas'),
      ('a0000000-0000-4000-8000-0000000000c6'::uuid, 'cliente6@akj.test', 'cliente', 'Julián Ospina')
    ) v(id, email, rol, nombre)
  loop
    if not exists (select 1 from auth.users where email = cuenta.email) then
      execute format(
        'insert into auth.users (%1$s)
         select %1$s from (
           select (jsonb_populate_record(u, jsonb_build_object(
             ''id'', %2$L, ''email'', %3$L, ''created_at'', now(), ''updated_at'', now(),
             ''last_sign_in_at'', null, ''raw_user_meta_data'', ''{}''::jsonb))).*
           from auth.users u where u.email = ''cliente1@akj.test'') x',
        columnas_usuario, cuenta.id, cuenta.email);

      execute format(
        'insert into auth.identities (%1$s)
         select %1$s from (
           select (jsonb_populate_record(i, jsonb_build_object(
             ''id'', gen_random_uuid(), ''user_id'', %2$L, ''provider_id'', %2$L,
             ''identity_data'', jsonb_build_object(''sub'', %2$L, ''email'', %3$L, ''email_verified'', true, ''phone_verified'', false),
             ''created_at'', now(), ''updated_at'', now(), ''last_sign_in_at'', null))).*
           from auth.identities i
           join auth.users u on u.id = i.user_id
           where u.email = ''cliente1@akj.test'' and i.provider = ''email'') x',
        columnas_identidad, cuenta.id, cuenta.email);
    end if;

    insert into public.perfiles (id, rol, nombre)
    select u.id, cuenta.rol, cuenta.nombre from auth.users u where u.email = cuenta.email
    on conflict (id) do update set nombre = excluded.nombre, rol = excluded.rol;
  end loop;
end $$;

-- 3. Negocios nuevos ─────────────────────────────────────────────────────────────────────
insert into public.emprendimientos (id, propietario_id, nombre, zona, contacto)
select v.id::uuid, u.id, v.nombre, v.zona, v.contacto
from (values
  ('10000000-0000-0000-0000-000000000003', 'emprendedor3@akj.test', 'Dulce Tentación Repostería', 'Barrio La Castellana', 'https://wa.me/570000000003'),
  ('10000000-0000-0000-0000-000000000004', 'emprendedor4@akj.test', 'FríoTec Servicios Técnicos', 'A domicilio en Armenia', 'https://wa.me/570000000004'),
  ('10000000-0000-0000-0000-000000000005', 'emprendedor5@akj.test', 'Ruta Cafetera Tours', 'Salida desde el centro', 'https://wa.me/570000000005'),
  ('10000000-0000-0000-0000-000000000006', 'emprendedor6@akj.test', 'Patitas Felices Veterinaria', 'Barrio Los Profesionales', 'https://wa.me/570000000006'),
  ('10000000-0000-0000-0000-000000000007', 'emprendedor7@akj.test', 'Lashes Studio Armenia', 'Avenida Bolívar', null),
  ('10000000-0000-0000-0000-000000000008', 'emprendedor8@akj.test', 'Bisutería Café y Oro', 'Ferias del centro', 'https://wa.me/570000000008')
) v(id, email, nombre, zona, contacto)
join auth.users u on u.email = v.email
on conflict (id) do nothing;

-- 4. Ofertas (2 a 4 por negocio) ──────────────────────────────────────────────────────────
insert into public.ofertas (id, emprendimiento_id, nombre, descripcion, categoria, precio_cop, precio_es_referencia, aviso, disponible) values
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Cambio de cremallera', 'Cremalleras metálicas, invisibles o para chaquetas gruesas. Trae la prenda para medir.', 'Arreglos', 15000, true, null, true),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Ajuste de cintura', 'Entrar o sacar cintura en pantalones, faldas y vestidos.', 'Arreglos', 18000, true, null, true),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'Restaurar comedor de 6 puestos', 'Lijado, resane y acabado de mesa y sillas. Se cotiza al ver el estado de la madera.', 'Muebles', 450000, true, 'La visita para ver el mueble se acuerda por WhatsApp.', true),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'Lacado de mueble', 'Acabado en laca mate o brillante para cómodas, mesas de noche y bibliotecas.', 'Muebles', 150000, true, null, true),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'Torta personalizada 20 porciones', 'Bizcocho de vainilla, chocolate o naranja con decoración según la ocasión.', 'Repostería', 120000, true, 'Pide con al menos 8 días de anticipación y escribe la fecha aproximada en tu mensaje.', true),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 'Cupcakes decorados x 12', 'Doce cupcakes con crema de mantequilla y decoración temática.', 'Repostería', 48000, true, null, true),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 'Postre de tres leches familiar', 'Postre para 10 personas, entregado frío en recipiente desechable.', 'Repostería', 45000, false, null, true),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 'Visita de diagnóstico de nevera', 'Revisión a domicilio en Armenia. La reparación se cotiza aparte cuando se ve el aparato.', 'Hogar y técnicos', 40000, false, null, true),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', 'Reparación de lavadora', 'Lavadoras de carga superior y frontal. Cuéntanos la marca y qué está fallando.', 'Hogar y técnicos', 60000, true, null, true),
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000004', 'Instalación de calentador', 'Instalación de calentador de paso a gas o eléctrico, con revisión de conexiones.', 'Hogar y técnicos', 80000, true, null, true),
  ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000005', 'Recorrido Valle de Cocora y Salento', 'Día completo con caminata por el valle y visita al pueblo. Precio por persona.', 'Turismo', 180000, true, 'La salida depende del clima y del número de personas; se confirma por WhatsApp.', true),
  ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000005', 'Avistamiento de aves', 'Recorrido de madrugada con guía local. Incluye transporte desde el centro y refrigerio.', 'Turismo', 150000, false, null, true),
  ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000005', 'Tour finca cafetera', 'Visita guiada a una finca, proceso del café y degustación. Precio por persona.', 'Turismo', 120000, true, null, true),
  ('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000006', 'Vacuna antirrábica', 'Vacuna anual para perros y gatos desde los 3 meses. Trae el carné si lo tienes.', 'Mascotas', 45000, false, 'Este canal no atiende urgencias ni consultas clínicas. Si tu mascota tiene una urgencia, llama al consultorio.', true),
  ('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000006', 'Baño y corte para perro', 'Baño, secado, corte de uñas y limpieza de oídos. El precio varía según el tamaño.', 'Mascotas', 35000, true, 'Este canal no atiende urgencias ni consultas clínicas. Si tu mascota tiene una urgencia, llama al consultorio.', true),
  ('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000006', 'Consulta general', 'Revisión general y plan de vacunación. Se agenda por teléfono.', 'Mascotas', 50000, false, 'Este canal no atiende urgencias ni consultas clínicas. Si tu mascota tiene una urgencia, llama al consultorio.', true),
  ('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000007', 'Extensiones de pestañas volumen ruso', 'Aplicación completa. El retoque se cotiza según el estado de las pestañas.', 'Belleza', 90000, true, null, true),
  ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000007', 'Lifting de pestañas', 'Curvado y tinte de pestañas naturales. Dura entre 6 y 8 semanas.', 'Belleza', 70000, false, null, true),
  ('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000008', 'Aretes artesanales', 'Aretes hechos a mano con mostacilla y semillas. Pregunta por los diseños disponibles.', 'Accesorios', 25000, true, null, true),
  ('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000008', 'Pulsera en mostacilla', 'Pulsera tejida con los colores que elijas.', 'Accesorios', 18000, true, null, true),
  ('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000008', 'Collar personalizado', 'Collar con inicial o nombre en dije dorado.', 'Accesorios', 40000, true, null, true)
on conflict (id) do nothing;

-- 5. Solicitudes (2 o 3 por cliente nuevo o renombrado) ───────────────────────────────────
-- El negocio, el estado inicial y las fechas los pone la base (disparador antes_de_crear_solicitud).
insert into public.solicitudes (id, cliente_id, oferta_id, mensaje)
select v.id::uuid, u.id, v.oferta::uuid, v.mensaje
from (values
  ('30000000-0000-0000-0000-000000000101', 'cliente1@akj.test', '20000000-0000-0000-0000-000000000004', 'Chaqueta de jean, la cremallera se dañó. La puedo llevar el sábado en la mañana.'),
  ('30000000-0000-0000-0000-000000000102', 'cliente1@akj.test', '20000000-0000-0000-0000-000000000008', 'Torta de unicornio para el cumpleaños de mi hija, para unas 20 personas. Sería para el 6 de diciembre.'),
  ('30000000-0000-0000-0000-000000000103', 'cliente1@akj.test', '20000000-0000-0000-0000-000000000017', '¿Cuánto vale la vacuna para un gato de 2 años? ¿Atienden los sábados?'),
  ('30000000-0000-0000-0000-000000000104', 'cliente2@akj.test', '20000000-0000-0000-0000-000000000011', 'La nevera no enfría desde ayer. Es una nevera de dos puertas, vivo en el barrio La Castellana.'),
  ('30000000-0000-0000-0000-000000000105', 'cliente2@akj.test', '20000000-0000-0000-0000-000000000006', 'Comedor de cedro con la madera pelada en las patas. Puedo mandar fotos por WhatsApp.'),
  ('30000000-0000-0000-0000-000000000106', 'cliente2@akj.test', '20000000-0000-0000-0000-000000000014', 'Somos 4 personas, queremos ir el sábado 21 de noviembre.'),
  ('30000000-0000-0000-0000-000000000107', 'cliente3@akj.test', '20000000-0000-0000-0000-000000000020', '¿Tienen cupo el viernes en la tarde para volumen ruso?'),
  ('30000000-0000-0000-0000-000000000108', 'cliente3@akj.test', '20000000-0000-0000-0000-000000000022', 'Me gustaron los aretes verdes de la foto, ¿todavía los tienen?'),
  ('30000000-0000-0000-0000-000000000109', 'cliente3@akj.test', '20000000-0000-0000-0000-000000000005', 'Vestido para un matrimonio el sábado 28, hay que entrarle 2 cm de cintura.'),
  ('30000000-0000-0000-0000-000000000110', 'cliente4@akj.test', '20000000-0000-0000-0000-000000000015', 'Estoy de paso en Armenia, ¿hay salida este domingo? Somos 2 personas.'),
  ('30000000-0000-0000-0000-000000000111', 'cliente4@akj.test', '20000000-0000-0000-0000-000000000012', 'La lavadora no centrifuga y hace un ruido fuerte. Es una LG de carga frontal.'),
  ('30000000-0000-0000-0000-000000000112', 'cliente5@akj.test', '20000000-0000-0000-0000-000000000018', 'Perro criollo mediano, necesito baño y corte de uñas esta semana.'),
  ('30000000-0000-0000-0000-000000000113', 'cliente5@akj.test', '20000000-0000-0000-0000-000000000009', 'Cupcakes de chocolate para una reunión de oficina el jueves.'),
  ('30000000-0000-0000-0000-000000000114', 'cliente5@akj.test', '20000000-0000-0000-0000-000000000024', 'Collar con la inicial V en dorado, es para regalo.'),
  ('30000000-0000-0000-0000-000000000115', 'cliente6@akj.test', '20000000-0000-0000-0000-000000000007', 'Cómoda de 4 cajones, quisiera laca blanca mate.'),
  ('30000000-0000-0000-0000-000000000116', 'cliente6@akj.test', '20000000-0000-0000-0000-000000000013', 'Calentador de paso a gas para apartamento, ya lo tengo comprado.'),
  ('30000000-0000-0000-0000-000000000117', 'cliente6@akj.test', '20000000-0000-0000-0000-000000000016', 'Somos una familia de 5, ¿el tour incluye almuerzo?')
) v(id, email, oferta, mensaje)
join auth.users u on u.email = v.email
on conflict (id) do nothing;

-- 6. Estados: algunas en atención y otras cerradas con motivo (solo si siguen pendientes) ──
update public.solicitudes set estado = 'en_atencion'
 where estado = 'pendiente' and id in (
   '30000000-0000-0000-0000-000000000101', '30000000-0000-0000-0000-000000000104',
   '30000000-0000-0000-0000-000000000110', '30000000-0000-0000-0000-000000000113');

update public.solicitudes s set estado = 'cerrada', motivo_cierre = v.motivo
from (values
  ('30000000-0000-0000-0000-000000000103', 'Consulta respondida'),
  ('30000000-0000-0000-0000-000000000106', 'Sin cupo para esa fecha'),
  ('30000000-0000-0000-0000-000000000108', 'Se acordó por WhatsApp'),
  ('30000000-0000-0000-0000-000000000115', 'El cliente no respondió')
) v(id, motivo)
where s.id = v.id::uuid and s.estado <> 'cerrada';
