// Prueba local de 01 + 02 + 04 + 05 con PGlite (Postgres en memoria) y la simulación de Supabase Auth
// del Componente 1 (00_simulacion_auth_local.sql). No toca el proyecto de Supabase.
//   Parte 1: los 33 casos del Componente 1 (03_pruebas_permisos.sql), ahora con 04 y 05 aplicadas.
//   Parte 2: 25 casos de lo que agregan 04 y 05 y de lo que usa el piloto.
// Uso: npm run probar:sql
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const carpetaSql = fileURLToPath(new URL('..', import.meta.url));
const leer = (f) => readFileSync(`${carpetaSql}/${f}`, 'utf8');
const MIGRACIONES = [
  'pruebas/00_simulacion_auth_local.sql',
  '01_esquema_y_permisos.sql',
  '02_datos_de_prueba.sql',
  '04_reintento_sin_duplicados.sql',
  '05_campos_del_diseno.sql',
];

async function baseNueva() {
  const base = new PGlite();
  for (const f of MIGRACIONES) await base.exec(leer(f));
  return base;
}

// Parte 1 ----------------------------------------------------------------------------------------
console.log('Parte 1 · 33 casos del Componente 1 con 04 y 05 aplicadas');
const base1 = await baseNueva();
const salida = await base1.exec(leer('pruebas/03_pruebas_permisos.sql'));
const filasC1 = salida.at(-1).rows;
const casosC1 = filasC1.filter((f) => f.caso !== 'TOTAL');
for (const f of casosC1) {
  console.log(`${f.cumple === 'Sí' ? 'OK ' : 'MAL'} ${f.caso.padEnd(4)} ${f.quien} · ${f.operacion} → ${f.obtenido}`);
}
const fallosC1 = casosC1.filter((f) => f.cumple !== 'Sí').length;
console.log(`${filasC1.find((f) => f.caso === 'TOTAL').quien}\n`);

// Parte 2 ----------------------------------------------------------------------------------------
console.log('Parte 2 · 25 casos de 04, 05 y del piloto');
const db = await baseNueva();
const U = {
  c1: '00000000-0000-0000-0000-0000000000c1', c2: '00000000-0000-0000-0000-0000000000c2',
  e1: '00000000-0000-0000-0000-0000000000e1', e2: '00000000-0000-0000-0000-0000000000e2',
};

const O1 = '20000000-0000-0000-0000-000000000001';
const O3 = '20000000-0000-0000-0000-000000000003';
const N1 = '10000000-0000-0000-0000-000000000001';

async function como(quien, sql, params = []) {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [quien ? U[quien] : '']);
  await db.exec(`set role ${quien ? 'authenticated' : 'anon'}`);
  try {
    const r = await db.query(sql, params);
    return { filas: r.rows, cambiadas: r.affectedRows };
  } catch (e) {
    return { error: e.code, mensaje: e.message };
  }
}

let fallos = 0;
function caso(nombre, ok, detalle) {
  console.log(`${ok ? 'OK ' : 'MAL'} ${nombre}`, ok ? '' : JSON.stringify(detalle));
  if (!ok) fallos++;
}

const ID = '30000000-0000-0000-0000-000000000001';
let r = await como('c1', `insert into solicitudes (id, oferta_id, mensaje, cliente_id) values ($1,$2,'Subir 2 cm',$3) returning id, numero, estado, emprendimiento_id`, [ID, O1, U.c1]);
caso('cliente1 envía con id propio → ficha 101, pendiente, negocio puesto por la base', r.filas?.[0]?.numero == 101 && r.filas[0].estado === 'pendiente' && r.filas[0].emprendimiento_id === N1, r);
r = await como('c1', `insert into solicitudes (id, oferta_id, mensaje, cliente_id) values ($1,$2,'otra vez',$3)`, [ID, O1, U.c1]);
caso('reintento con el mismo id → 23505 (no duplica)', r.error === '23505', r);
r = await como('c1', `insert into solicitudes (oferta_id, mensaje, cliente_id) values ($1,'x',$2)`, [O3, U.c1]);
caso('oferta no disponible → P0001 "no está disponible"', r.error === 'P0001' && /no está disponible/.test(r.mensaje), r);
r = await como('c1', `insert into solicitudes (oferta_id, mensaje, cliente_id) values ($1,'x',$2)`, [O1, U.c2]);
caso('cliente1 no puede enviar a nombre de cliente2', r.error === '42501', r);
r = await como('e1', `insert into solicitudes (oferta_id, mensaje, cliente_id) values ($1,'x',$2)`, [O1, U.e1]);
caso('emprendedor no puede enviar solicitudes', r.error === '42501', r);
r = await como('c1', `update solicitudes set numero = 5 where id = $1`, [ID]);
caso('nadie puede cambiar el número de ficha', !!r.error, r);

r = await como('c1', `select s.numero, o.nombre, e.nombre as negocio, e.zona from solicitudes s join ofertas o on o.id = s.oferta_id join emprendimientos e on e.id = s.emprendimiento_id`);
caso('cliente1 ve su solicitud con oferta, negocio y zona', r.filas?.length === 1 && r.filas[0].zona === 'Barrio Granada', r);
r = await como('c2', `select id from solicitudes`);
caso('cliente2 no ve la solicitud de cliente1', r.filas?.length === 0, r);
r = await como('e2', `update solicitudes set estado='en_atencion' where id=$1`, [ID]);
caso('emprendedor2 no cambia el estado (0 filas)', r.cambiadas === 0, r);
r = await como('e1', `update solicitudes set estado='en_atencion' where id=$1 returning estado`, [ID]);
caso('emprendedor1 pasa a En atención', r.filas?.[0]?.estado === 'en_atencion', r);
r = await como('e1', `update solicitudes set estado='cerrada' where id=$1`, [ID]);
caso('cerrar sin motivo → 23514 cierre_con_motivo', r.error === '23514', r);
r = await como('e1', `update solicitudes set estado='cerrada', motivo_cierre='Consulta respondida' where id=$1 returning estado`, [ID]);
caso('cerrar con motivo', r.filas?.[0]?.estado === 'cerrada', r);
r = await como('e1', `update solicitudes set estado='en_atencion' where id=$1`, [ID]);
caso('una cerrada no se reabre → P0001', r.error === 'P0001', r);
r = await como('e1', `select nombre from perfiles where id=$1`, [U.c1]);
caso('el emprendedor no ve el nombre del cliente (perfiles)', r.filas?.length === 0, r);

r = await como('e2', `update emprendimientos set contacto='https://wa.me/570000000009' where id=$1`, [N1]);
caso('emprendedor2 no cambia el contacto ajeno (0 filas)', r.cambiadas === 0, r);
r = await como('e1', `update emprendimientos set contacto='https://wa.me/570000000002' where id=$1 returning contacto`, [N1]);
caso('emprendedor1 guarda su contacto', r.filas?.[0]?.contacto === 'https://wa.me/570000000002', r);
r = await como('e1', `update emprendimientos set nombre='Otro nombre' where id=$1`, [N1]);
caso('el emprendedor no puede cambiar el nombre del negocio', r.error === '42501', r);
r = await como(null, `update emprendimientos set contacto='x' where id=$1`, [N1]);
caso('sin sesión no se cambia el contacto', r.error === '42501', r);

r = await como('e1', `update ofertas set aviso='No atendemos urgencias por este canal', disponible=false where id=$1 returning aviso`, [O1]);
caso('emprendedor1 pone aviso y desactiva su oferta', r.filas?.[0]?.aviso?.startsWith('No atendemos'), r);
r = await como('c1', `select nombre, disponible from ofertas where id=$1`, [O1]);
caso('cliente1 sigue viendo la oferta que solicitó', r.filas?.length === 1, r);
r = await como('c2', `select nombre from ofertas where id=$1`, [O1]);
caso('cliente2 ya no la ve (no disponible)', r.filas?.length === 0, r);
r = await como(null, `select nombre from ofertas where disponible`);
caso('sin sesión el catálogo muestra solo disponibles', r.filas?.length === 1, r);
r = await como('e1', `insert into ofertas (emprendimiento_id, nombre, descripcion, categoria, precio_cop, precio_es_referencia, aviso) values ($1,'Ajuste de hombros','Sacos y chaquetas','Arreglos',28000,true,null) returning id`, [N1]);
caso('emprendedor1 crea una oferta', r.filas?.length === 1, r);
r = await como('e2', `insert into ofertas (emprendimiento_id, nombre, descripcion, categoria, precio_cop) values ($1,'Ajena','x','Arreglos',1)`, [N1]);
caso('emprendedor2 no crea ofertas en el negocio ajeno', r.error === '42501', r);
r = await como('e1', `update ofertas set aviso='   ' where id=$1`, [O1]);
caso('aviso en blanco → 23514', r.error === '23514', r);

const total = fallosC1 + fallos;
console.log(total ? `\n${total} caso(s) fallaron` : `\nTodos los casos pasaron (${casosC1.length} + 25)`);
process.exit(total ? 1 : 0);
