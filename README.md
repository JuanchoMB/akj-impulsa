# AKJ Impulsa · Piloto web (Componente 3)

Piloto web para consultar ofertas de pequeños emprendimientos de Armenia y gestionar solicitudes
entre clientes y emprendedores desde distintos dispositivos.

- **Componente 1:** requisitos RF01–RF09, decisiones D1–D4 y comprobación de Supabase.
- **Componente 2 (v2.1):** pantallas P1–P14 y mensajes M1–M31.
- **Tecnología:** aplicación web (Vite + JavaScript + Tailwind) conectada a **Supabase**. Se publica en **Cloudflare Pages**.

## Requisitos

- Node.js 20.19 o superior (probado con Node 22).
- npm (viene con Node).

## Cómo ejecutarlo

1. Instala las dependencias (solo la primera vez):

   ```bash
   npm install
   ```

2. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

3. Abre `http://localhost:5180` en el navegador.

   Para probar desde el celular en la misma red wifi, usa la dirección "Network" que muestra la terminal
   (por ejemplo `http://192.168.1.20:5180`).

## Modo demostración y modo Supabase

| Modo | Cuándo se activa | Datos |
|---|---|---|
| **Demostración** | No existe `.env.local` o le falta la clave pública. | Ficticios. Se guardan solo en ese navegador. Sirve cualquier contraseña. |
| **Supabase** | `.env.local` tiene la URL y la clave publishable. | Servicio compartido real: lo que hace un dispositivo lo ven los demás. |

Para activar el modo Supabase:

1. Copia `.env.example` como `.env.local`.
2. Completa `VITE_SUPABASE_PUBLISHABLE_KEY` con la clave **publishable**.
   La encuentras en *Supabase → Project Settings → API Keys*.
3. Reinicia `npm run dev`.

> Nunca pongas la clave secreta (`sb_secret_…` o `service_role`) en `.env.local`: el navegador la vería.
> El piloto la detecta y se niega a usarla.

### Cuentas de prueba

`cliente1@akj.test`, `cliente2@akj.test`, `emprendedor1@akj.test` y `emprendedor2@akj.test`.
Las contraseñas las entrega el equipo y **no se escriben en el repositorio** (Ley 1581 de 2012 y acta de inicio).

## Base de datos (Supabase)

Antes de ejecutar los scripts, crea las 4 cuentas de prueba en *Authentication → Users*.
Después, en el SQL Editor de Supabase, ejecuta los archivos de `supabase/` en este orden:

| Archivo | Para qué sirve | Origen |
|---|---|---|
| `01_esquema_y_permisos.sql` | Tablas, reglas de estados y permisos | Componente 1 (ya ejecutado en `akj-impulsa-pruebas`) |
| `02_datos_de_prueba.sql` | Perfiles, 2 negocios y 3 ofertas ficticias | Componente 1 (ya ejecutado) |
| `04_reintento_sin_duplicados.sql` | Reintentar un envío sin duplicarlo (P6) | Componente 2 |
| `05_campos_del_diseno.sql` | Ficha N.º, aviso, zona, contacto editable y oferta solicitada visible | Componente 3 |

El piloto **funciona aunque 04 y 05 todavía no se hayan ejecutado** (modo compatible), y usa los campos nuevos
en cuanto existen, sin cambiar código:

- **Sin 04:** el reintento de P6 podría duplicar la solicitud.
- **Sin 05:** no hay ficha N.º (se muestran los primeros caracteres del identificador), aviso de la oferta ni zona,
  y el contacto del negocio aparece solo para leer.

La migración 05 **no cambia ni borra ninguna política probada** en el Componente 1. Solo agrega:

- Las columnas `solicitudes.numero`, `ofertas.aviso` y `emprendimientos.zona`.
- `editar_contacto_propio`: el emprendedor puede cambiar **solo** la columna `contacto` de **su** negocio (D2).
- `ver_oferta_solicitada`: el cliente sigue viendo el nombre de una oferta que solicitó aunque el negocio la desactive.

### Probar las migraciones sin tocar Supabase

```bash
npm run probar:sql
```

Monta 01 + 02 + 04 + 05 en un Postgres en memoria (PGlite) con la simulación de Supabase Auth del
Componente 1 (`pruebas/00_simulacion_auth_local.sql`). Corre en dos partes:

1. **Los 33 casos del Componente 1** (`pruebas/03_pruebas_permisos.sql`), para comprobar que 04 y 05 no rompen nada.
2. **25 casos nuevos:** envío, reintento duplicado, oferta no disponible, transiciones de estado,
   cierre sin motivo, cuentas ajenas, sesión, contacto del negocio y aviso.

Todos deben salir `OK`. `03_pruebas_permisos.sql` también se puede correr en el SQL Editor de Supabase.

### Cómo se relacionan la base y las pantallas

| En la base | En el piloto |
|---|---|
| `emprendimientos` | negocio |
| `ofertas.precio_es_referencia` | "Desde $…" (el precio puede cambiar según el caso) |
| `ofertas.categoria` | se guarda el nombre visible: "Arreglos", "Muebles", "Confección"… |
| `perfiles` (política `perfil_propio`) | el emprendedor **no** ve el nombre del cliente; se identifica por la ficha N.º |

## Publicar en Cloudflare Pages

1. Ejecuta `npm run build`. La carpeta `dist/` es el sitio listo para publicar.
2. En Cloudflare Pages configura:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Variables de entorno:** `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`

La navegación usa direcciones con `#` (por ejemplo `/#/mis-solicitudes`), así que no necesita reglas de redirección.

## Estructura

```
src/
  main.js             Arranque, rutas y permisos por rol
  config.js           Elige el modo (demostración o Supabase)
  mensajes.js         Mensajes M1–M31, motivos de cierre, estados y categorías
  datos/
    index.js          Punto único de acceso a los datos
    supabase.js       Servicio compartido real
    demo.js           Simulación local con las mismas reglas de permisos
    ejemplo.js        Datos ficticios: 8 negocios y 15 ofertas
  pantallas/          Una pantalla por archivo (P1–P14)
  ui/                 Encabezado, barra inferior, avisos y piezas comunes
supabase/             Scripts SQL (01, 02, 04, 05)
  pruebas/            Simulación de Auth (00), 33 casos del Componente 1 (03) y prueba automática
```

## Pantallas y requisitos

| Pantalla | Ruta | Requisitos |
|---|---|---|
| P1 Catálogo | `#/` | RF03, D1 |
| P2 Detalle de oferta (con aviso) | `#/oferta/:id` | RF04, D2 |
| P3 Entrar | `#/entrar` | RF01 |
| P4 Enviar solicitud | `#/oferta/:id/solicitar` | RF05, D3 |
| P5 Solicitud registrada | `#/solicitud-registrada/:id` | RF05, D2 |
| P6 Envío sin confirmar | `#/envio-sin-confirmar` | RF05, RNF06 |
| P7 Mis solicitudes | `#/mis-solicitudes` | RF06 |
| P8 Panel del emprendimiento | `#/panel` | RF07 |
| P9 / P10 Detalle de solicitud | `#/panel/:id` | RF07, RF08 |
| P11 Cerrar solicitud | `#/panel/:id/cerrar` | RF08, D4 |
| P12 Mis ofertas | `#/mis-ofertas` | RF02, D1 |
| P13 Nueva / editar oferta | `#/mis-ofertas/nueva`, `#/mis-ofertas/:id/editar` | RF02 |
| P14 Cuenta | `#/cuenta` | RF01, D2 |

RF09 (buscar y filtrar) tiene prioridad *Podría* y no está implementado.

## Decisiones técnicas del piloto

- **Cerrar sesión (pendiente del Componente 1):** la sesión se borra del dispositivo aunque el servicio
  responda con error. Se usa `signOut({ scope: 'local' })`, que no intenta cerrar las sesiones de otros dispositivos.
- **Reintento sin duplicar (P6):** el navegador genera el identificador antes de enviar y lo conserva entre intentos.
  Si la base responde `23505` (ya existe), se muestra la solicitud que ya estaba registrada.
- **Seguridad:** todo texto escrito por personas se escapa antes de mostrarse. Los enlaces de contacto solo aceptan
  `https://` o un número de celular, que se convierte en enlace de WhatsApp. Los permisos reales los aplica la base
  de datos con políticas por fila.
- **Accesibilidad (RNF03–RNF05):**
  - Texto base de 17 px y botones de al menos 48 px.
  - Etiquetas visibles en todos los campos y foco visible.
  - Avisos anunciados a lectores de pantalla.
  - Respeta "reducir movimiento".
  - Funciona desde 360 px; en computador usa una columna central de 480 px.
