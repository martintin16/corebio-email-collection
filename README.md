# Corebio Mail — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind + React Hook Form + Zod.

## 5 funcionalidades nuevas — las 7 etapas ✅ completas (ver PDF de especificación)

Editor de texto enriquecido, plantillas, acceso a Drive por carpeta/archivo, programar envío, y la vista
"Enviados". Diseño completo en el addendum del PDF. Se construyeron en 7 etapas, cada una un cambio autocontenido:

1. **Arreglar posicionamiento del menú de 3 puntos** (`ActionsMenu`) — ✅ hecho, ver más abajo.
2. **Editor de texto enriquecido** (Tiptap) en Redactar/Responder + fix del ícono de adjuntar en Responder — ✅ hecho, ver más abajo.
3. **Plantillas prefabricadas** — ✅ hecho, ver más abajo.
4. **Programar envío** — botón dividido + selector de fecha/hora en Redactar y Responder — ✅ hecho, ver más abajo.
5. **Vista "Programados"** — pestaña dentro de cada casilla — ✅ hecho, ver más abajo.
6. **Acceso a Drive** — entry point en "Editar permisos" + explorador de carpetas/archivos — ✅ hecho, ver más abajo.
7. **Vista "Enviados"** — tercera pestaña + detalle + "Reenviar" — ✅ hecho, ver más abajo (se adelantó,
   agregada a pedido durante la etapa 6).

Con esto, las 5 funcionalidades del addendum de diseño están construidas en el frontend, todas sobre datos
mock — igual que el resto del proyecto, quedan listas para conectarse al backend real cuando exista.

## Editor de texto enriquecido (Tiptap)

```
components/compose/
  rich-text-editor.tsx     Wrapper de Tiptap: barra de formato + <EditorContent/>
  toolbar-button.tsx        Botón chico y cuadrado reutilizado por cada acción de la barra

components/icons/index.tsx  + BoldIcon, ItalicIcon, UnderlineIcon, TextColorIcon, BulletListIcon,
                             OrderedListIcon, LinkIcon, ClearFormatIcon

lib/utils.ts                + htmlToPlainText() — el editor guarda HTML; un campo "vacío" sigue
                             siendo "<p></p>", así que la validación de "¿escribió algo?" compara
                             contra el texto plano, no contra el markup
lib/validations/compose.ts  body ahora valida con htmlToPlainText() en vez de un .min(1) directo

app/globals.css             + estilos acotados a .ProseMirror (listas, links, placeholder) — Tailwind
                             resetea eso por default (Preflight) y Tiptap genera el HTML directo, sin
                             que nosotros podamos agregarle clases tag por tag
```

**Qué tiene la barra:** Negrita, Cursiva, Subrayado, Color de texto (paleta fija de 5 — no selector
libre, para que el texto siga siendo legible en cualquier cliente de mail), Lista con viñetas, Lista
numerada, Insertar enlace (con validación de URL), Quitar formato. Mismo componente en `ComposeForm`
y en `ReplyBox` — no hay dos implementaciones.

**Responsive:** la barra usa scroll horizontal (`overflow-x-auto`) en vez de esconder botones detrás
de un menú "más" — con 8 botones nomás, todo sigue alcanzable con un swipe en vez de un tap extra.

**Bug corregido de paso:** el ícono de adjuntar en `ReplyBox` no tenía ningún `<input type="file">`
tapado detrás — era un ícono suelto sin ninguna función. Como este componente se reestructuraba igual
para sumar el editor, se corrigió en el mismo cambio (mismo patrón que ya usaba `ComposeForm`: label +
input oculto + chips de archivos adjuntos con opción de quitar cada uno).

## Plantillas prefabricadas

```
components/compose/template-picker.tsx   Botón "Insertar plantilla" + menú (Floating UI, mismo patrón
                                          que ActionsMenu) + confirmación si ya había texto escrito

lib/types/template.ts                    MessageTemplate { id, name, preview, body }
lib/api/templates.ts                     getTemplatesForMailbox(mailboxId) — mock, solo lectura
```

**Solo en Redactar, no en Responder** — una plantilla institucional tiene sentido para empezar un
mensaje nuevo, no para contestar uno puntual. Las plantillas son por casilla: al cambiar el selector
"De" (cuando hay más de una casilla asignada), el menú vuelve a pedir la lista correspondiente.

**Si ya había texto escrito**, insertar una plantilla no lo pisa en silencio — aparece un diálogo de
confirmación (`Dialog` genérico, tono neutro, no destructivo) antes de reemplazar.

**Decisión de alcance:** esta ronda cubre *usar* plantillas, no *administrarlas*. Un CRUD para
crear/editar plantillas (y quién puede hacerlo — ¿cualquier admin, un rol específico?) es una
funcionalidad en sí misma y queda para una iteración futura.

## Programar envío

```
components/compose/send-split-button.tsx   Botón dividido: mitad izquierda = enviar ya (submit nativo
                                             en Redactar, onClick a mano en Responder — ver más abajo),
                                             mitad derecha = abre el menú de programación (Floating UI,
                                             mismo patrón que ActionsMenu/TemplatePicker). Compartido
                                             por ComposeForm y ReplyBox.

lib/schedule-options.ts                     Opciones rápidas calculadas según la hora actual
                                             ("Esta tarde", "Esta noche", "Mañana", "El lunes"),
                                             formatScheduledAt() para el texto del toast, y
                                             isValidScheduleTime() (mínimo 5 minutos en el futuro)

lib/actions/schedule.ts                     scheduleMessage() — Server Action simulada (misma
                                             convención que el resto de lib/actions/*)

components/icons/index.tsx                  + ChevronDownIcon, ClockIcon
```

**En Redactar y en Responder** — a pedido, se extendió más allá del diseño original del PDF (que lo
tenía solo en Redactar): también se puede programar una respuesta. `SendSplitButton` es el mismo
componente en los dos lados, pero adaptado a cómo maneja cada uno su envío:

- **Redactar** usa react-hook-form: la mitad izquierda queda como `type="submit"` del `<form>`
  existente, sin tocar. Elegir una opción del menú corre `handleSubmit` a mano (mismo validador que
  un envío normal) y, si es válido, programa y cierra.
- **Responder** no tiene `<form>` ni react-hook-form — maneja su propio estado con `useState`. Ahí
  `SendSplitButton` recibe un `onSend` y la mitad izquierda pasa a `type="button"`. La validación
  ("¿hay texto?") se hace a mano en `handleSend`/`handleSchedule` y se muestra igual que un error de
  campo, debajo del editor.

En los dos casos, si falta algo (el "Para" en Redactar, el cuerpo vacío en cualquiera de los dos) el
error se marca en rojo antes de programar — no se programa nada a mitad de camino.

**Selector de fecha y hora:** inputs nativos (`<input type="date">` / `type="time">`), sin librería
nueva — alcanza para lo que hace falta acá. Valida que la fecha/hora elegida esté al menos 5 minutos
en el futuro; si no, muestra el error dentro del mismo menú sin cerrarlo.

**Fechas:** se guardan en UTC (`scheduledAt` como ISO 8601) y se muestran siempre en horario de
Argentina — así es como se van a persistir cuando exista el backend real.

**Limitación conocida (mock):** al igual que el resto de las acciones simuladas del proyecto (crear
usuario, reconectar casilla, etc.), `scheduleMessage()` no persiste en ningún lado — solo simula el
viaje de ida y vuelta y muestra el toast de éxito. La etapa 5 ("Programados") va a mostrar su propio
listado de ejemplo en vez de reflejar lo que se programó acá; se van a unir cuando el backend exista
de verdad y ambas puntas lean/escriban del mismo lugar.

**Por qué no hay "send later" nativo:** la Gmail API no tiene ese endpoint — el backend va a necesitar
guardar el mensaje con su fecha y un job periódico propio (ver el PDF de especificación) que lo
dispare cuando corresponda. No es gratis en el sentido de "ya viene con la API", pero tampoco requiere
un servicio pago nuevo (alcanza con un cron dentro del mismo proceso de NestJS).

## Vista "Programados"

```
app/(dashboard)/inbox/[mailboxId]/scheduled/page.tsx   Panel derecho de la pestaña — sin detalle por
                                                         ítem (las acciones ya están en la fila), solo
                                                         explica eso en vez de quedar vacío

components/inbox/mailbox-tabs.tsx            Pestañas "Recibidos" / "Programados" — Link + usePathname()
components/inbox/mailbox-list-panel.tsx      Client wrapper: decide cuál lista mostrar según la pestaña
components/inbox/scheduled-message-list.tsx  Lista + ActionsMenu (Editar / Cancelar envío) por fila

lib/types/scheduled-message.ts               ScheduledMessage { id, mailboxId, to, subject,
                                               bodyPreview, body, scheduledAt }
lib/api/scheduled-messages.ts                getScheduledMessages(mailboxId), getScheduledMessageById(id)
                                               — mock de solo lectura, ejemplo fijo (ver limitación abajo)
lib/actions/schedule.ts                       + cancelScheduledMessage(id) — Server Action simulada
```

**Dónde vive:** una pestaña más, al lado de "Recibidos", dentro del panel de lista de cada casilla
(`app/(dashboard)/inbox/[mailboxId]/layout.tsx` ahora pide las dos listas de una — mensajes y
programados — y `MailboxListPanel`, del lado del cliente, decide cuál mostrar con `usePathname()`).
El panel derecho (`scheduled/page.tsx`) no tiene una vista de detalle por ítem: las acciones ya están
en el menú de 3 puntos de cada fila, así que solo hace falta explicar eso.

**Acciones por fila (mismo patrón que Admin → Usuarios/Casillas — `ActionsMenu` + `ConfirmDialog`):**
- **Editar** navega a `/compose?edit=<id>` (mismo mecanismo de intercepting route que "Redactar" del
  sidebar) y reabre Redactar con destinatario, asunto y cuerpo prellenados. No reprograma solo:
  la persona vuelve a elegir cuándo mandarlo (opción rápida o fecha/hora a mano), igual que un envío
  nuevo — mantener automáticamente el horario original hubiera pedido que el selector de fecha
  acepte un valor inicial, que quedó fuera de esta ronda.
- **Cancelar envío** pide confirmación (`ConfirmDialog`, tono destructivo — es irreversible) y al
  confirmar saca la fila de la lista.

**Limitación conocida (mock):** `getScheduledMessages()` es un listado de ejemplo fijo, no conectado a
lo que `scheduleMessage()` guarda al programar desde Redactar/Responder (que, como se explica arriba,
tampoco persiste nada todavía). "Cancelar" sí se ve reflejado al toque porque `ScheduledMessageList`
mantiene su propia copia local y saca la fila ahí mismo cuando la acción simulada resuelve bien — un
patrón "optimista" que no depende de que el mock tenga estado compartido de verdad. Las dos puntas se
terminan de unir cuando exista el backend real.

## Vista "Enviados"

```
app/(dashboard)/inbox/[mailboxId]/sent/page.tsx              Panel derecho por default de la pestaña
                                                                ("Elegí un mensaje enviado")
app/(dashboard)/inbox/[mailboxId]/sent/[sentId]/page.tsx     Detalle de un enviado (solo lectura) + Reenviar

components/inbox/sent-message-list.tsx    Lista de la pestaña — mismo patrón visual que MessageList
                                            (Recibidos), pero "Para" en vez de remitente, sin punto de
                                            no-leído
components/inbox/forward-button.tsx       Botón "Reenviar" del detalle — navega con router.push en vez
                                            de <Link><Button/></Link> (anidar un <button> dentro de un
                                            <a> es HTML inválido)

components/inbox/mailbox-tabs.tsx         Ahora 3 pestañas: Recibidos / Enviados / Programados — la
                                            pestaña activa se lee del segmento de URL después del
                                            mailboxId ("sent", "scheduled", o ninguno), no de un param
                                            puntual, porque ahora hay dos rutas con su propio detalle
                                            ([messageId] y sent/[sentId])
components/inbox/mailbox-split-view.tsx   El "hasSelection" que decide mobile (lista vs. detalle) pasó
                                            de useParams({messageId}) a leer los segmentos de la URL
                                            por la misma razón: sent/[sentId] usa un param llamado
                                            sentId, no messageId — un solo nombre ya no alcanzaba

lib/types/mail.ts       + SentMessageSummary, SentMessageDetail (to, subject, snippet/body, sentAt)
lib/api/mail.ts         + getSentMessages(mailboxId), getSentMessage(mailboxId, sentId),
                          getSentMessageById(sentId) — mock, mismo patrón que el resto del archivo
lib/forward.ts          buildForwardSubject()/buildForwardBody() — arman el "Fwd: " y la cita del
                          mensaje original, compartido por los dos page.tsx de Compose

components/icons/index.tsx   + SentIcon (ícono de la pestaña/estado vacío, distinto de ForwardIcon
                               para no repetir el mismo glifo en dos acciones distintas)

app/globals.css   + .email-body (mismas reglas de listas/links que .ProseMirror, pero para HTML ya
                    enviado que se muestra de solo lectura con dangerouslySetInnerHTML — no es el
                    editor, así que no correspondía reusar la clase .ProseMirror ahí)
```

**Reenviar:** desde el detalle de un enviado, abre Redactar (misma intercepting route que "Redactar"
del sidebar) con el asunto prefijado "Fwd: " y el cuerpo original citado debajo, destinatario vacío —
la persona elige a quién reenviarlo. Comparte el mecanismo `initialValues` de `ComposeForm` que ya
existía para "Editar" un envío programado (etapa 5); ambos casos ahora conviven en el mismo `page.tsx`
de Compose vía `?edit=` o `?forward=` (mutuamente excluyentes, `edit` gana si por error vinieran los dos).

**Limitación conocida (mock):** igual que "Programados", es un listado de ejemplo fijo — mandar un
mensaje desde Redactar/Responder no agrega una fila acá todavía. Se van a unir cuando exista el
backend real y ambas puntas lean/escriban del mismo lugar.

## Acceso a Drive

```
components/admin/manage-drive-dialog.tsx   Explorador: breadcrumb + lista (carpetas y archivos
                                             mezclados, checkbox por ítem) + contador de
                                             seleccionados + Guardar/Cancelar

components/admin/edit-permissions-dialog.tsx   + botón "Gestionar Drive" por fila de casilla,
                                                 habilitado solo si esa fila tiene Enviar o Leer
                                                 tildado (en vivo, con useWatch — no hace falta
                                                 guardar el permiso primero para poder abrirlo)

lib/types/drive.ts    DriveItem { id, name, type: "folder"|"file", parentId, shared }
lib/api/drive.ts      getDriveFolderContents(mailboxId, folderId), getDriveSharedItemIds(mailboxId)
                        — mock con árbol fijo por casilla
lib/actions/drive.ts  updateDriveAccess({ mailboxId, userId, itemIds }) — Server Action simulada

components/icons/index.tsx   + FolderIcon, DriveIcon
```

**Por qué vive dentro de "Editar permisos" y no en una pantalla aparte:** el acceso a Drive es,
conceptualmente, una extensión del mismo permiso que ya se gestiona ahí (¿qué puede tocar esta
persona de esta casilla?) — agregarlo como una acción más evita una pantalla nueva que la gente
tenga que aprender a encontrar. Se deshabilita si la fila no tiene ningún acceso a esa casilla
todavía, para no dar Drive sin dar la casilla.

**Carpetas y archivos en la misma lista**, cada uno con su propio checkbox — se puede compartir a
nivel carpeta o a nivel archivo puntual, según lo charlado. La selección es global a la sesión del
diálogo (no se pierde al navegar entre carpetas): se pre-tilda con todo lo que ya está compartido
hoy en toda la casilla (`getDriveSharedItemIds`, no hace falta haber visitado cada carpeta para que
aparezca tildado) y **"Compartido"** es una etiqueta aparte que muestra el estado ya guardado —
puede no coincidir con la selección mientras se edita, a propósito, para que se vea qué va a cambiar.

**Estados:** loading (spinner al abrir una carpeta), error con reintentar (la carpeta "Comprobantes"
del mock falla la primera vez que se abre a propósito, para poder ver y probar ese estado sin
depender de que un backend real falle justo ahí), carpeta vacía, y "Guardar cambios" con el mismo
`LoadingOverlay` bloqueante + `preventClose` que ya usa Conectar/Reconectar casilla.

**Limitación conocida:** es un explorador para elegir qué compartir, no un Drive completo — no hay
subir, renombrar ni eliminar archivos, eso se sigue haciendo desde Google Drive directamente.

**Corregido en esta revisión — Escape con modales anidados:** al estar "Gestionar Drive" anidado
dentro de "Editar permisos" (otro modal), y con menús flotantes (programar envío, plantillas, menú
de fila) que también pueden estar abiertos arriba de un modal, cada uno escuchaba Escape por su
cuenta — apretar Escape con dos capas abiertas las cerraba juntas en vez de solo la de arriba. Se
corrigió con `lib/dialog-stack.ts`: una pila compartida (`pushDialogLayer`/`popDialogLayer`/
`isTopDialogLayer`) en la que cada modal o menú se anota mientras está abierto, y su propio listener
de Escape solo actúa si es el tope de la pila. Aplicado a `Dialog`, `ConfirmDialog`,
`ComposeModalShell`, `TemplatePicker`, `SendSplitButton` y `ActionsMenu` — la única pieza con
listener de Escape que quedaba afuera de este mecanismo. De paso, `ConfirmDialog` no tenía manejo de
Escape en absoluto (solo cerraba con click en el backdrop) y su click en el backdrop no respetaba
`isLoading` como sí lo hace `Dialog` con `preventClose` — ambas cosas también corregidas acá.

## `ActionsMenu`: ya no hace falta scrollear para ver el menú completo

```
components/ui/actions-menu.tsx    Reescrito para usar @floating-ui/react en vez de position:absolute fijo
```

**El problema:** el menú se posicionaba siempre hacia abajo del botón (`top-full`), sin chequear si había
lugar. Con una fila cerca del borde inferior de la pantalla o de la tabla con scroll de Usuarios/Casillas, el
menú se abría igual hacia abajo y quedaba parcialmente tapado.

**La solución — `@floating-ui/react` (MIT, gratis):** es la librería que usan por debajo Radix UI y Headless
UI para resolver exactamente este problema, así que no tiene sentido reescribirla a mano. Dos piezas:
- `flip()`: si no hay espacio debajo, abre el menú hacia arriba solo — sin ningún cálculo manual.
- `FloatingPortal`: renderiza el menú al final del `<body>` en vez de anidado dentro de la tabla, así ningún
  contenedor padre con scroll/overflow lo puede recortar.

La lógica de cerrar con click afuera o con Escape se mantuvo igual que antes — solo cambió el posicionamiento,
no el comportamiento. Como es el mismo componente que ya usan Usuarios y Casillas, el arreglo mejora esas dos
pantallas también, no solo las que vienen (menú de plantillas, botón dividido de "Enviar").

## Alcance actual

Vistas implementadas de punta a punta: **Login**, **Recuperar contraseña**, **Nueva contraseña**, el **layout del dashboard**, **Inbox**, **Redactar**, y ahora **Admin → Usuarios** y **Admin → Casillas**.

```
app/(dashboard)/
  layout.tsx                          Ahora recibe también el slot @modal
  @modal/
    default.tsx                        Nada, cuando ninguna ruta lo está interceptando
    (.)compose/page.tsx                 Intercepta /compose navegado desde adentro → modal
  compose/page.tsx                     Fallback de página completa (carga directa / refresh)
  inbox/...

components/compose/
  compose-form.tsx                     Compartido por el modal y la página completa (prop `mode`)
  compose-modal-shell.tsx               Backdrop + Escape + cierre vía router.back()

lib/validations/compose.ts             composeSchema
```

**Cómo se abre "Redactar":** el ítem del sidebar ya era un `<Link href="/compose">` normal — Next.js lo intercepta automáticamente porque es navegación interna (client-side). Si alguien entra directo a `/compose` (o refresca estando ahí), no hay una pantalla "de atrás" para tapar, así que se sirve `compose/page.tsx` como página completa en su lugar — mismo `<ComposeForm/>`, distinto marco alrededor.

El resto de Inbox (lista, detalle, responder inline, selector de casilla,
loading/empty/error/404) se mantiene igual que antes — ver `app/(dashboard)/inbox/`
y `components/inbox/`. `lib/api/mail.ts` sigue siendo la capa de datos MOCK
que consumen tanto Inbox como Compose (`getMailboxesForCurrentUser`).

## Rutas y protección

- Sin sesión → cualquier ruta que no sea de auth redirige a `/login`.
- Con sesión → las rutas de auth (`/login`, etc.) redirigen a `/inbox`.
- `/admin/*` sin rol admin → redirige a `/inbox`. Esto es solo UX (evita renderizar algo que no van a poder usar); la protección real de los datos está en el `RolesGuard` de cada endpoint del backend.

## Dependencias además de Next/React/TS/Tailwind/RHF/Zod

- `@supabase/ssr` + `@supabase/supabase-js` — cliente oficial de Supabase Auth (imprescindible, es el mecanismo de login que definimos).
- `@hookform/resolvers` — conecta los schemas de Zod con React Hook Form (conector oficial del propio equipo de RHF).
- `clsx` + `tailwind-merge` — combinan clases de Tailwind y resuelven conflictos cuando un componente reutilizable (`Button`, `Input`) recibe un `className` externo que pisa una clase de la base.

## Estados cubiertos en Login

- Validación por campo (email inválido, contraseña vacía) vía Zod, mensajes inline.
- Error general de credenciales inválidas (banner arriba del formulario).
- Loading / disabled durante el submit (evita doble envío).
- Mostrar / ocultar contraseña.
- Accesible: labels asociados, `aria-invalid`, `aria-describedby`, foco visible, orden de tabulación correcto.

## Setup para correrlo y probarlo

`npm install && npm run dev` no alcanza solo: el login pega de verdad contra Supabase Auth (es lo único que
nunca estuvo mockeado — todo lo demás sí lo está). Pasos completos:

1. **Node 18.18+ o 20+** (lo que pide Next 14.2).
2. `npm install`.
3. Crear un proyecto en Supabase (ya tenés cuenta) si todavía no tenés uno para este proyecto.
4. `cp .env.example .env.local` y completar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` —
   están en Project Settings → API de tu proyecto de Supabase.
5. **Crear al menos un usuario a mano** en el dashboard de Supabase (Authentication → Users → Add user, con
   email + contraseña). Esto es necesario porque "Nuevo usuario" en el panel de admin todavía es mock — no
   crea la cuenta real en Supabase, así que sin este paso no hay con qué loguearse.
6. Si querés ver las pantallas de `/admin` (Usuarios, Casillas), a ese usuario hay que asignarle el rol a
   mano: en el SQL Editor de Supabase,
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
   where email = 'tu-email@ejemplo.com';
   ```
   Sin esto, `lib/auth/session.ts` lo trata como `role: "user"` por default y el middleware te redirige de
   `/admin` a `/inbox`. Esto es un parche manual para poder probar — el mecanismo real (un Auth Hook que
   calcule el rol automáticamente al loguearse) todavía no está armado, queda para el backend.
7. `npm run dev` y entrar con ese email/contraseña.

**Qué vas a poder probar de verdad:** login real (con ese usuario), logout, y toda la navegación /
formularios / modales / estados del resto de la app. **Qué vas a ver pero no es real todavía:** los mensajes
del inbox, los usuarios y casillas de `/admin`, y cualquier alta/baja/edición ahí — son todos datos mock en
`lib/api/` que vuelven a su estado inicial cada vez que reiniciás el servidor (no hay ninguna base de datos
detrás todavía, eso es justamente el backend que sigue).

## Admin: Usuarios y Casillas

```
app/(dashboard)/admin/
  users/page.tsx + loading.tsx           Server Component: getUsers() + <UsersTable/>
  mailboxes/page.tsx + loading.tsx       Server Component: getMailboxConnections() + <MailboxesTable/>

components/admin/
  users-table.tsx                        Server Component; en <md renderiza tarjetas apiladas
                                          (ver "Responsive de las tablas de Admin" más abajo), en md+ la tabla completa
  mailboxes-table.tsx                    Mismo patrón para casillas
  user-row-actions.tsx                   Client: <ActionsMenu/> + <ConfirmDialog/> + Server Actions + toast
  mailbox-row-actions.tsx                Ídem para casillas

lib/
  types/admin.ts                         AdminUser, AdminMailbox, UserStatus, MailboxConnectionStatus
  api/admin.ts                           Capa de datos MOCK (mismo patrón que lib/api/mail.ts)
  actions/users.ts                       Server Actions: deactivateUser, deleteUser, resendInvite
  actions/mailboxes.ts                   Server Action: disconnectMailbox

components/ui/ (nuevos, genéricos — no específicos de admin)
  badge.tsx                              Estados con color con significado (activo/invitado/inactivo, conectada/reconectar)
  actions-menu.tsx                       Menú de 3 puntos: cierra con click afuera o Escape
  confirm-dialog.tsx                     Reservado para acciones irreversibles (eliminar, desconectar)
  toast/toast-context.tsx                Provider + useToast(), montado una vez en <DashboardShell/>
```

**Server Actions, no mocks del lado del cliente:** desactivar, eliminar y desconectar usan `"use server"` +
`revalidatePath()` — es el patrón correcto de Next.js para mutaciones, en vez de un `fetch` disparado desde
el cliente que después tiene que refrescar la lista a mano. `reconnectMailbox` sigue como acción del cliente
mockeada porque en producción abre el consentimiento de Google en el navegador, no es una mutación de servidor pura.

## Nuevo usuario y Conectar casilla

```
components/ui/dialog.tsx                 Shell genérico de modal (backdrop + Escape + panel),
                                          usado por estos dos — ConfirmDialog y ComposeModalShell
                                          mantienen su propio markup, ya en uso

components/admin/
  new-user-dialog.tsx                    Form: nombre, email, rol (radio con estilo segmented control),
                                          y permisos canSend/canRead por casilla (register dinámico)
  new-user-button.tsx                    Trigger client-side chico: sólo maneja el estado open/close
  connect-mailbox-dialog.tsx             Form: email + nombre visible + "Continuar con Google"
  connect-mailbox-button.tsx             Trigger, mismo patrón

lib/
  validations/admin.ts                   newUserSchema, connectMailboxSchema
  actions/users.ts                       + createUser
  actions/mailboxes.ts                   + connectMailbox
```

**Decisión de patrón:** a diferencia de "Redactar" (intercepting route, porque el sidebar lo linkea como
una URL propia y compartible), estos dos son modales de acción disparados desde un botón dentro de una
página que ya existe — no necesitan URL propia, así que usan un `<Dialog/>` simple del lado del cliente,
mismo patrón que `ConfirmDialog`. Es la tercera/cuarta vez que se repite ese esqueleto (backdrop + Escape +
panel), así que lo extraje a `components/ui/dialog.tsx` en vez de copiarlo de nuevo.

**Qué queda mockeado:** `createUser` y `connectMailbox` son Server Actions con `revalidatePath()`, pero el
cuerpo simula la llamada al backend (ver `TODO` en cada archivo). El botón "Continuar con Google" en
producción es una redirección real del navegador al consentimiento OAuth, no algo que una server action
resuelva — por ahora el formulario solo guarda email + nombre visible para poder ver el estado "conectada"
en la tabla.

## Inbox responsive (drill-down en mobile)

```
components/inbox/mailbox-split-view.tsx    Layout de dos paneles (lista + detalle). En md+ ambos
                                            conviven lado a lado. En <md se ve uno solo por vez,
                                            decidido por si hay :messageId en la URL actual
                                            (useParams(), mismo mecanismo que ya usaba MessageList
                                            para el resaltado de la fila activa).
```

Antes el inbox tenía el layout de dos paneles fijo sin importar el viewport — en mobile eso dejaba la
lista de mensajes comprimida en una franja angosta al lado del detalle. Con `MailboxSplitView`, en mobile
se navega a `/inbox/:mailboxId/:messageId` y ahí se ve solo el detalle, con un link "Volver a la bandeja"
(`md:hidden`) en `app/(dashboard)/inbox/[mailboxId]/[messageId]/page.tsx`.

## Loading overlay bloqueante

```
components/ui/loading-overlay.tsx    Overlay absoluto sobre un ancestro `relative`, con spinner + label
```

Página del PDF que no se había construido en la ronda anterior. Se usa en dos lugares donde bloquear toda
la pantalla durante el submit tiene sentido porque hay algo "pesado" en vuelo: `ConnectMailboxDialog`
(esperando el handshake con Google) y `ComposeForm`, pero en este último **solo cuando hay adjuntos** — para
un mail de puro texto el spinner del botón de envío ya alcanza, y tapar toda la pantalla sería una
interrupción de más para algo que tarda una fracción de segundo. `Dialog` ahora acepta `preventClose` para
que el backdrop/Escape no puedan cerrar el modal mientras el overlay está activo.

## Responsive de las tablas de Admin (Usuarios y Casillas)

En `<md` cada fila se renderiza como una tarjeta (nombre/email arriba junto al menú de acciones, el resto de
los datos como pares label:valor debajo), en vez de la tabla con columnas ocultas que había antes. Es el
patrón que ya pedía el PDF de especificación, y al revisarlo se confirmó que era la decisión correcta:
con nombre + rol + estado + botón de 3 puntos compartiendo ~360px de ancho, los badges y el menú de
acciones quedaban muy cerca entre sí, y una de las acciones detrás de ese menú es destructiva (eliminar
usuario, desconectar casilla). Para el volumen de datos real acá (la comisión directiva de una ONG, no
miles de filas) prioriza claridad y separación de los botones tocables por sobre la densidad de una tabla,
que sí tiene sentido en desktop donde el espacio horizontal sobra.

## Editar permisos, Editar nombre visible, Ver usuarios con acceso, Reconectar

Los cuatro ítems del menú de 3 puntos que hasta esta ronda solo mostraban un toast "vista pendiente" ya
tienen su pantalla real:

```
components/admin/
  edit-permissions-dialog.tsx      Rol + permisos canSend/canRead por casilla, precargado con el acceso
                                    actual del usuario. No es "NewUserDialog en modo edición": acá no se
                                    tocan nombre ni email (esta persona ya existe), así que es un diálogo
                                    propio en vez de mostrar campos deshabilitados que no aportan nada.
  edit-mailbox-name-dialog.tsx     Un solo campo (nombre visible), precargado. La dirección real de la
                                    casilla no se edita acá — es su identidad en Google.
  reconnect-mailbox-dialog.tsx     No es un form: ya se sabe la dirección, solo falta que el dueño de la
                                    casilla vuelva a autorizar el acceso en Google. Mismo LoadingOverlay +
                                    preventClose que ConnectMailboxDialog, mismo motivo (espera real).
  mailbox-users-dialog.tsx         Solo lectura — lista quién tiene acceso a esa casilla y con qué permisos
                                    (Enviar/Leer). Cubre loading, error y empty además del estado con datos.

lib/
  types/admin.ts                   MailboxAccessSummary ahora incluye canSend/canRead (antes solo tenía
                                    mailboxId + email — no alcanzaba para precargar ni mostrar permisos reales)
  validations/admin.ts             + editPermissionsSchema, editMailboxNameSchema
  actions/users.ts                 + updateUserPermissions
  actions/mailboxes.ts             + updateMailboxDisplayName, reconnectMailbox, getMailboxAccessList
                                    (este último es una lectura, no una mutación — se dejó como Server Action
                                    igual, para que MailboxUsersDialog la llame on-demand al abrirse sin
                                    tener que traer una capa de fetch nueva para un solo uso)
```

`UsersTable` ahora recibe también `mailboxes` (antes solo `NewUserButton` los necesitaba) para poder pasárselos
a `EditPermissionsDialog` vía `UserRowActions`.

## Compose: el modal ya no se puede cerrar a mitad de un envío con adjuntos

Gap chico encontrado al revisar la completitud general: `ComposeModalShell` nunca se enteraba de que
`ComposeForm` estaba mostrando su `LoadingOverlay` bloqueante (envío con adjuntos), así que Escape o un
click en el backdrop lo cerraban igual, dejando ese envío colgado sin ninguna pantalla que lo representara.

```
components/compose/
  compose-blocking-context.tsx   Contexto chico: ComposeForm avisa "estoy bloqueando" (setBlocking),
                                  ComposeModalShell lo lee para desactivar Escape/backdrop/botón de cerrar
  compose-modal-shell.tsx         Envuelve a sus children en <ComposeBlockingProvider/>; el shell en sí
                                   vive en un componente interno porque no puede leer el contexto que él
                                   mismo provee
  compose-form.tsx                Sincroniza showBlockingOverlay hacia el contexto en un useEffect
```

En `mode="page"` (carga directa de `/compose`, sin modal) no hay `Provider`, así que el hook devuelve
`null` y no pasa nada — `ComposeForm` no necesita saber en qué contexto está.

## Pendiente

Todo lo que queda es explícitamente responsabilidad del backend, no front sin terminar: el envío/recepción
real de mails (Gmail API), la persistencia real detrás de cada Server Action en `lib/actions/` y función en
`lib/api/` (hoy todas mockeadas con un `delay()` — ver los `TODO` en cada archivo), y el Auth Hook de
Supabase que calcula el rol real (`lib/auth/session.ts` ya asume su forma pero no existe todavía). El
frontend cubre todas las vistas, componentes y estados del PDF de especificación aprobado, con cada acción
del flujo llevando a algo real — lo que sigue es construir ese backend en NestJS.
