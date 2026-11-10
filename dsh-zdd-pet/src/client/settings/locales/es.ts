/**
 * 设置页西班牙语文案；键集与 zh 完全一致。
 */
import type { Key } from './zh.ts';

export const es: Record<Key, string> = {
  nav: 'Configuración de mascotas',
  intro:
    'Gestiona varias mascotas: cada una tiene su propio tamaño y posición (se aplica al instante después de guardar).',
  // 卡片标题与卡片级说明；说明统一进问号气泡。
  petCardTitle: 'Mascota',
  avatarLabel: 'Avatar',
  avatarHint:
    'La imagen pequeña que aparece junto a los mensajes de esta mascota en el panel de chat. Sin subir nada se usa el logotipo predeterminado del plugin; al subir una imagen se aplica al instante y reemplaza la anterior, sin pulsar "Guardar".',
  avatarUpload: 'Subir avatar',
  avatarChange: 'Cambiar',
  avatarUploading: 'Subiendo…',
  avatarUploaded: 'Avatar actualizado',
  petCardHint:
    'Ajustes por mascota: nombre / tamaño / visualización / esquina / márgenes / los cuatro interruptores de funciones. Pulsa "Guardar" abajo para aplicar al instante.',
  globalTitle: 'Interruptores globales',
  globalHint:
    'Compartidos por todas las mascotas (un pet pack puede sobrescribirlos en el archivo de su propio tipo). Estos interruptores solo cambian el estado local y se escriben en la configuración del usuario al "Guardar" (nunca al instante); las notificaciones del sistema se vuelven a leer justo después de guardar, sin necesidad de recargar la página.',
  cornerHint:
    'En qué esquina de la pantalla se pega la mascota (en escritorio se calcula por el área de trabajo de cada monitor).',
  marginXHint: 'Distancia horizontal desde la esquina elegida (px); puede ser cualquier número.',
  marginYHint: 'Distancia vertical desde la esquina elegida (px); puede ser cualquier número.',
  // 「/」命令菜单的行标题（图标由 app.ts 经 command-faces.ts 补上）。
  'cmd.chat': 'Chat',
  'cmd.pet': 'Mascota',
  'cmd.balance': 'Saldo',
  'shortcut.open': 'Abrir el chat de la mascota',
  'shortcut.chat': 'Abrir la ventana de chat',
  'shortcut.hear': 'Entrada de voz',
  'shortcut.capture': 'Captura de pantalla al chat',
  shortcutCardTitle: 'Atajos',
  shortcutCardHint: 'Al expandir hay dos grupos: atajos de la mascota y atajos globales.',
  shortcutRowChat: 'Abrir chat',
  shortcutRowHold: 'Mantener para hablar',
  shortcutRowHear: 'Entrada de voz',
  shortcutRowCapture: 'Captura de pantalla',
  shortcutRowPaste: 'Pegar imagen',
  shortcutRowTodo: 'Tareas',
  shortcutRowSleep: 'Dormir / despertar',
  shortcutRowDisplay: 'Posición de visualización',
  shortcutRowSidebar: 'Abrir el chat lateral',
  shortcutGroupPet: 'Atajos de la mascota',
  shortcutGroupPetHint:
    'En la web basta con pasar el puntero sobre la mascota. En la ventana del escritorio hay que hacer clic en la mascota para que reciba el foco del teclado.',
  shortcutGroupGlobal: 'Atajos globales',
  shortcutGroupGlobalHint:
    'Los distribuye DSH en la web y en la ventana del escritorio; se cambian en Ajustes → General → Atajos.',
  petsLabel: 'Mascotas',
  add: 'Agregar mascota',
  remove: 'Eliminar',
  confirmRemove: '¿Eliminar la mascota "{id}"?',
  confirmTitle: 'Confirmar acción',
  cancel: 'Cancelar',
  ok: 'Entendido',
  atLeastOne: 'Debe quedar al menos una mascota.',
  emptyPets: 'Aún no hay mascotas; haz clic en "Agregar mascota" para crear una.',
  sizeLabel: 'Tamaño (ancho px)',
  sizeHint: 'La altura es automática = ancho × 9/16.',
  sizePercentLabel: 'Ancho de pantalla máx. (%)',
  sizePercentHint:
    'Cuánto del ancho de pantalla puede ocupar la mascota: 100 = nunca más ancha que una pantalla (igual que px en ventanas anchas); 30–40 la hace claramente más pequeña en el móvil sin cambiar el escritorio. Se calcula una vez al cargar; recarga tras redimensionar.',
  nameLabel: 'Nombre',
  nameHint:
    'Se muestra al pasar el cursor y se añade a las personas de la IA ("tu nombre es X"). Se permiten duplicados; si se deja vacío, se usa el id de la mascota.',
  personaLabel: 'Persona (opcional)',
  personaHint:
    'Solo afecta a esta mascota. Déjalo vacío para seguir la persona de la entrada: el texto gris del cuadro es exactamente ese contenido. El system que se envía al modelo = este texto + una línea añadida con "tu nombre es <nombre>" + el contexto de la hora actual, así que no repitas aquí el nombre ni la fecha.',
  personaCount: '{n} caracteres',
  balanceEnabled: 'Saldo',
  balanceEnabledHint: 'Cuando está activado, esta mascota reproduce animaciones de saldo y muestra el globo de saldo.',
  whisperEnabled: 'Susurros',
  whisperEnabledHint:
    'Cuando está activado, esta mascota genera periódicamente una frase con IA y reproduce la animación de susurro (la persona está en el campo de abajo; vacío sigue la entrada).',
  workStatusEnabled: 'Estado de trabajo',
  workStatusEnabledHint:
    'Cuando está activado, esta mascota sigue el estado de trabajo de DSH: pensando / trabajando / esperando confirmación / terminado / error cambian la animación y muestran globos (el pool está en la configuración de nivel superior; solo escucha, no llama al modelo).',
  fixedEnabled: 'Fijar en el sitio',
  fixedEnabledHint:
    'Cuando está activado, la cadena aleatoria ya no gira ni aleja a esta mascota: solo se reproducen acciones de reposo y en el sitio. Las selecciones con clic derecho, los disparos por API y las animaciones de saldo / susurro / estado de trabajo no se ven afectados.',
  displayLabel: 'Visualización',
  displayHint: 'web = solo navegador / desktop = solo escritorio / both = ambos / none = ninguno',
  'display.web': 'Solo navegador',
  'display.desktop': 'Solo escritorio',
  'display.both': 'Ambos',
  'display.none': 'Ninguno',
  cornerLabel: 'Posición',
  'corner.top-left': 'Arriba a la izquierda',
  'corner.top-right': 'Arriba a la derecha',
  'corner.bottom-left': 'Abajo a la izquierda',
  'corner.bottom-right': 'Abajo a la derecha',
  marginX: 'Margen horizontal',
  marginY: 'Margen vertical',
  save: 'Guardar',
  saveHotkey: 'Ctrl+S / Cmd+S',
  sync: 'Sincronizar',
  confirmSync:
    '¿Sincronizar? Esto sobrescribe la configuración del usuario con la configuración predeterminada incluida (todos los campos + comentarios); las personalizaciones actuales se perderán.',
  corruptTitle: 'La configuración del usuario está dañada; no se guardó',
  corruptConfirm: 'Guardar de todos modos',
  corruptBody:
    'No se puede analizar el archivo de configuración del usuario (dañado, no es JSON/JSONC válido): {path}. Si guardas ahora, se reconstruirá desde la lista blanca: todo lo que hay actualmente en ese archivo (animations / physics / memes…) se perderá. Cancelar = no tocar el archivo (corrígelo y vuelve a guardar); Confirmar = guardar de todos modos (descartar lo que hay en el archivo).',
  syncHint:
    '"Sincronizar" escribe la configuración predeterminada incluida (con comentarios y todos los campos avanzados) en el archivo de configuración del usuario, sobrescribiendo tus personalizaciones actuales; después el archivo se puede editar directamente. Dos advertencias: (1) una vez creado, ese archivo es una capa de sobrescritura explícita: los cambios posteriores en los valores predeterminados incluidos no se aplicarán automáticamente (hasta que vuelvas a sincronizar o borres el archivo); (2) al pulsar "Guardar" en esta página se reescribe el archivo desde una lista blanca: los valores de los campos se conservan, pero los comentarios se pierden.',
  configMeta: 'Avanzado (archivos)',
  configMetaHint:
    'La configuración del usuario puede sobrescribir las mascotas / los pools de animación / los pesos; recarga o reinicia para aplicarlo: recarga la página en el navegador, o haz clic derecho en una mascota de escritorio → "Recargar configuración" (reconstruye todas las ventanas de mascotas de escritorio). La configuración predeterminada es la referencia completa.',
  defaultConfig: 'Configuración predeterminada (solo lectura, referencia completa)',
  userConfig: 'Configuración del usuario (sobrescrituras personalizadas)',
  todosFile:
    'Datos de tareas (texto de la lista, hora de vencimiento y estado de completado; borrarlo vacía todas las tareas)',
  animationDir: 'Directorio de recursos de animación (añade o personaliza animaciones aquí)',
  memesDir: 'Directorio de imágenes de memes (añade o personaliza imágenes aquí)',
  logFile: 'Archivo de registro (para diagnóstico; se puede vaciar)',
  logFileNote:
    'La versión de escritorio no tiene consola, así que todos los registros de ejecución del plugin (inicio, fallos y reinicios de la mascota de escritorio, errores y advertencias) van a este único archivo; adjúntalo al reportar un problema. El límite por archivo es de 1 MB; al llenarse solo se conservan los últimos 512 KB.',
  saved: 'Guardado: las mascotas se actualizaron al instante.',
  loadError: 'No se pudo cargar la configuración',
  saveError:
    'No se pudo guardar la configuración. Revisa la conexión con el servidor, los permisos de escritura del directorio de configuración y el registro del servidor.',
  saveInvalid: 'No se pudo guardar la configuración: el contenido no es válido. Revísalo e inténtalo de nuevo.',
  syncError:
    'No se pudo sincronizar la configuración. Revisa la conexión con el servidor y los permisos de escritura del directorio de configuración.',
  loading: 'Cargando configuración…',
  retry: 'Reintentar',
  invalid: 'Revisa los datos: el tamaño debe ser positivo; los márgenes pueden ser cualquier número.',
  busy: 'Guardando…',
  extraPetsHint:
    'Otras {n} variantes provienen de archivos del directorio pet/ (<nombre>-config.json + <nombre>-animation/). Cambia a ellas en la fila Tipos de arriba; Guardar escribe en la configuración de cada pack, nunca en main-config.jsonc.',
  kindLabel: 'Tipos',
  kindMain: 'Integrado',
  lastOfKind:
    '«{entry}» solo tiene esta mascota; si la eliminas, desaparece todo el tipo. Para quitarlo por completo, borra los archivos del pack de la mascota.',
  savePartial:
    'Las mascotas principales se guardaron, pero {names} no se pudo escribir de vuelta: revisa que la configuración del pack sea válida y que el directorio tenga permisos de escritura.',
  notifyToggle: 'Notificaciones del sistema',
  notifyToggleHint:
    'Avisos del sistema operativo (abajo a la derecha del escritorio) al completarse una conversación, si falla la generación, cuando se solicita permiso o cuando hay que elegir; solo mientras esta ventana no tiene el foco.',
  clickSoundToggle: 'Sonido al hacer clic',
  clickSoundToggleHint:
    'Reproduce el sonido de clic integrado (assets/sound/click-duck.wav, volumen 0.5) al hacer clic en una mascota; los clics repetidos en menos de 100 ms solo suenan una vez, así que varias mascotas nunca se superponen. Desactívalo para silencio total. Se escribe en la configuración del usuario al Guardar.',
  whisperImageToggle: 'Imágenes en susurros',
  whisperImageToggleHint:
    'Adjunta un meme aleatorio del pool a cada susurro (el mapeo de imágenes está en el campo `memes` de la configuración de nivel superior). Tokens: un susurro ya llama al modelo en cada ciclo, así que la imagen solo añade el nombre + la descripción de ese meme (~100 caracteres / ~60 tokens) a la misma solicitud: insignificante.',
  chatImageToggle: 'Imágenes en el chat',
  chatImageToggleHint:
    'Deja que la IA elija un meme del pool que encaje con el contexto actual (opcional; el mapeo está en el campo `memes` de la configuración de nivel superior). Tokens: cada mensaje lleva el catálogo completo, unos 1.1k caracteres (~650 tokens, unas 11 veces el caso de los susurros) y crece con el número de imágenes; si lo desactivas, no se adjunta ni un carácter.',
  chatAnimationToggle: 'Acciones en el chat',
  chatAnimationToggleHint:
    'Cuando está activado, la petición de chat lleva la lista de animaciones que se pueden representar (todas las acciones de animations.categories): si el modelo considera que la frase realmente representa una, la mascota la ejecuta en el acto; si no, responde solo con texto. Tokens: cada mensaje lleva la lista completa; desactivado no se adjunta nada. Valor predeterminado global para todas las mascotas (un pet pack puede sobrescribirlo en su propio archivo de configuración).',
  confineToggle: 'Limitar a la pantalla actual',
  confineToggleHint:
    'Varios monitores: cuando está activado, la mascota solo se mueve dentro de la pantalla en la que está: una mascota lanzada rebota únicamente dentro de la pantalla donde se soltó (las uniones entre pantallas actúan como muros, así que nunca vuela al monitor vecino), y el vagabundeo autónomo solo camina dentro de la pantalla actual (el paso que cruzaría la unión se cancela). Desactívalo para permitir vuelos y caminatas entre pantallas. Solo afecta al modo escritorio: el overlay del navegador ya se queda dentro del viewport.',
  trayToggle: 'Bandeja del sistema',
  trayToggleHint:
    'Muestra un icono en la bandeja (área de notificaciones en Windows, barra de menús en macOS) cuando el modo escritorio está activo. Lista todas las mascotas de la configuración y alterna cada una entre escritorio y web/ninguno, incluidas las que ahora no están en el escritorio y no tienen ventana donde hacer clic derecho. Con esto desactivado, para devolver una mascota al escritorio hay que abrir el navegador (la página de configuración o el clic derecho sobre la mascota web). Windows ya oculta los iconos de terceros en «iconos ocultos». Solo afecta al modo escritorio.',
  voiceTitle: 'Voz',
  voiceHint:
    'Cuatro interruptores y una voz: cada tipo de locución tiene su propio interruptor y ninguno depende de otro. Todo desactivado por defecto; se escribe en la configuración del usuario al "Guardar" (nunca al instante).',
  voiceEnabled: 'Locutar susurros manuales',
  voiceEnabledHint:
    'Locuta los susurros lanzados desde el menú contextual o un comando de barra, y también las respuestas del chat. El botón de altavoz del panel de chat locuta una sola frase en cuanto lo pulsas. Solo afecta a si se produce sonido: los globos, la memoria del chat y las notificaciones emergentes del sistema no cambian; un fallo de síntesis se registra y nunca interrumpe la conversación.',
  voiceWhisperEnabled: 'Locutar susurros',
  voiceWhisperEnabledHint:
    'Locuta el susurro generado periódicamente. Desactivado por defecto: los susurros son narración de fondo y no deberían sonar sin pedirlo.',
  voiceTodoEnabled: 'Locutar recordatorios de tareas',
  voiceTodoEnabledHint:
    'Locuta el recordatorio de una tarea cuando vence (el globo sigue apareciendo; esto solo decide si se locuta). Desactivado por defecto.',
  voiceNotifyEnabled: 'Locutar estado de trabajo',
  voiceNotifyEnabledHint:
    'Locuta una frase configurada de estado de trabajo cuando una tarea termina, falla o espera tu confirmación. Igual que las notificaciones del sistema, solo locuta cuando no estás en esta página (otra aplicación, sin foco, minimizada): no interrumpe mientras miras la pantalla. Solo se locuta la frase configurada, nunca el detalle de la tarea. Desactivado por defecto.',
  voiceNameLabel: 'Voz',
  voiceVolumeLabel: 'Volumen',
  voiceVolumeHint:
    'Volumen de reproducción como decimal 0–1: 1 es el volumen máximo (100 %) y 0 silencia. Solo cambia la intensidad y no vuelve a sintetizar el audio, así que ajustarlo no tiene coste extra. Los cuatro tipos de locución comparten este mismo volumen.',
  physicsTitle: 'Física (sensación al arrastrar y lanzar)',
  physicsHint:
    'Valor predeterminado global, compartido por todas las mascotas (un pet pack puede sobrescribirlo en el archivo de su propio tipo); se escribe en la configuración del usuario al "Guardar" (nunca al instante). En el navegador se aplica al instante; en el escritorio se aplica cuando Guardar recarga las ventanas de mascotas.',
  mobileTitle: 'Efectos móviles',
  mobileHint:
    'Solo tienen sentido en el navegador del móvil: la vibración necesita motor, los dos interruptores de movimiento necesitan sensores de inclinación/aceleración, y los sensores exigen HTTPS o localhost.',
  'physics.gravity': 'Gravedad',
  'physics.gravityHint': 'px/s²: cuanto mayor, más rápido cae; 0 = sin gravedad (vuela en línea recta para siempre)',
  'physics.restitution': 'Rebote',
  'physics.restitutionHint':
    '0–1, velocidad que se conserva al rebotar en una pared o el suelo (1 = completamente elástico, 0 = se detiene en seco)',
  'physics.groundFriction': 'Fricción de contacto',
  'physics.groundFrictionHint':
    'por segundo, amortiguación a lo largo de cualquier superficie (pared, suelo, techo); 0 = hielo en todas',
  'physics.throwPower': 'Fuerza de lanzamiento',
  'physics.throwPowerHint':
    '> 0, multiplicador general del seguimiento con resorte y de la velocidad de salida (1 = predeterminado; más alto = sigue más pegado y lanza más fuerte)',
  physicsCeilingBounce: 'Rebote en el techo',
  physicsCeilingBounceHint:
    'Desactívalo para que un lanzamiento pueda salir por la parte superior de la pantalla (la gravedad sigue tirando de él hacia abajo)',
  physicsPetCollision: 'Colisiones entre mascotas',
  physicsPetCollisionHint: 'Una mascota en vuelo rebota contra las demás conservando el momento (masa ∝ tamaño²)',
  physicsHaptic: 'Vibración al chocar',
  physicsHapticHint:
    'Una vibración por impacto (paredes, suelo, techo, otras mascotas). Funciona en Chrome/Edge; no en iOS ni en navegadores WebView como Via. El modo No molestar la bloquea.',
  physicsTilt: 'Gravedad por inclinación',
  physicsTiltHint:
    'Inclina el móvil y la gravedad lo sigue (magnitud = el valor de arriba); con gravedad en 0 la inclinación no hace nada. Requiere HTTPS/localhost.',
  physicsShake: 'Agitar para lanzar',
  physicsShakeHint:
    'Agita para lanzar la mascota en la dirección del gesto; la fuerza escala con throwPower. No depende de la gravedad, así que funciona con gravedad 0. Requiere HTTPS/localhost.',
  invalidPhysics:
    'Revisa los parámetros de física: gravedad / fricción con el suelo ≥ 0, rebote 0–1, fuerza de lanzamiento > 0.',
  fontTitle: 'Apariencia y fuente',
  fontHint:
    'La familia se aplica a todos los textos que ahora usan la fuente candy: globo de la mascota, tooltip al pasar el cursor, ventana de chat y ventana de puntuación. El tamaño solo se aplica al globo de la mascota y al tooltip (las ventanas de chat y de puntuación conservan su tamaño). Valor predeterminado global, compartido por todas las mascotas (un pet pack puede sobrescribirlo en el archivo de su propio tipo); se escribe en la configuración del usuario al "Guardar": al instante en el navegador y, en el escritorio, cuando Guardar recarga las ventanas de mascotas.',
  fontFamilyLabel: 'Fuente',
  fontFamilyHint:
    '«Candy (integrada)» viene con el plugin; las demás son fuentes del sistema. Si una fuente no está instalada en esta máquina, se usa la siguiente de la pila (nunca queda en blanco ni da error).',
  fontSizeLabel: 'Tamaño de fuente (px)',
  fontSizeHint:
    'Tamaño del texto del globo; el tooltip y las líneas pequeñas dentro del globo se escalan en proporción. Rango 4–200.',
  fontFollowToggle: 'Escalar la fuente con el tamaño de la mascota',
  fontFollowToggleHint:
    'Activado (predeterminado): la fuente crece con la mascota; con 462 px de ancho es exactamente el tamaño de arriba. Desactivado: el tamaño queda fijo sin importar el tamaño de la mascota.',
  invalidFont:
    'Revisa la configuración de la fuente: la familia debe estar en la lista y el tamaño debe ser un número entre 4 y 200.',
  'font.candy': 'Candy (integrada)',
  'font.yahei': 'Microsoft YaHei / PingFang',
  'font.youyuan': 'YouYuan',
  'font.kaiti': 'KaiTi',
  'font.simsun': 'SimSun',
  'font.comic': 'Comic Sans MS',
  'font.system': 'Predeterminada del sistema',
  modelTitle: 'Chat y modelos',
  modelHint:
    'Qué modelo usa cada uno de susurros y chat, y cuánto historial lleva cada solicitud de chat. "Seguir la conversación actual" usa el modelo de tu conversación actual (predeterminado). Valor predeterminado global: se aplica a todas las mascotas y un pet pack puede sobrescribirlo en el archivo de su propio tipo. Las opciones vienen de la misma fuente que el selector de modelos de DSH y el host las sirve en vivo.',
  modelFollow: 'Seguir la conversación actual',
  modelSearch: 'Buscar modelos…',
  modelEmpty: 'No hay modelos que coincidan.',
  modelNoModels: 'No hay modelos disponibles.',
  modelLoading: 'Actualizando la lista de modelos…',
  modelTriggerAria: 'Seleccionar modelo, actual {model}',
  modelUnknown: ' (configuración actual, no está en la lista)',
  modelNone: 'Este proveedor no tiene modelos disponibles',
  whisperModelLabel: 'Modelo de susurros',
  chatModelLabel: 'Modelo de chat',
  modelFieldHint:
    '"Seguir la conversación actual" usa el modelo de la conversación; si el modelo elegido falla, se vuelve al modelo de la conversación y se reintenta una vez.',
  invalidModel:
    'Revisa la configuración del modelo: elige proveedor y modelo, o deja ambos vacíos (seguir la conversación actual).',
  modelCatalogFailed:
    'No se pudo cargar la lista de modelos (recarga la página para reintentar); tus valores actuales se conservan tal cual.',
  chatMemory: 'Rondas de historial del chat',
  chatMemoryHint:
    'Cuántas rondas recientes lleva cada solicitud de chat (1 ronda = 1 pregunta + 1 respuesta; 0 = sin historial, cada mensaje empieza de cero). La memoria en sí lo guarda todo: esto solo decide cuánto entra en el contexto; más rondas recuerdan más y gastan más tokens. Valor predeterminado global, compartido por todas las mascotas (un pet pack puede sobrescribirlo en el archivo de su propio tipo).',
  invalidChatMemory: 'Revisa las rondas de historial del chat: debe ser un número ≥ 0.',
  chatImageLimit: 'Límite de imágenes en el chat',
  chatImageLimitHint:
    'Cuántos memes como máximo se listan al modelo durante el chat ("los primeros N" = los N que escribiste primero en la configuración; mueve al frente los que quieras enviar). Esa lista completa se adjunta a cada mensaje y los tokens crecen de forma lineal con la cantidad, así que una lista larga es puro gasto; limitarla a los primeros N hace que el modelo elija solo entre esos. 0 = sin límite (enviar todo). Valor integrado predeterminado: 10. Valor predeterminado global, compartido por todas las mascotas (un pet pack puede sobrescribirlo en el archivo de su propio tipo). Solo afecta a la selección de imágenes del chat: un susurro lleva solo el meme que sacó.',
  invalidChatImageLimit: 'Revisa el límite de imágenes del chat: debe ser un número ≥ 0 (0 = sin límite).',
  notifyTest: 'Probar notificación',
  notifyTestOk: 'Notificación de prueba enviada; mírala abajo a la derecha del escritorio.',
  notifyDenyUnsupported: 'Este entorno no admite notificaciones del sistema (no hay API Notification).',
  notifyDenyBlocked: 'El navegador tiene bloqueado el permiso de notificaciones.',
  notifyDenyRejected: 'Elegiste «Bloquear» en el aviso de permiso.',
  notifyDenyError: 'Error al solicitar permiso',
  notifyGuide:
    'Guía: haz clic en el icono 🔒/ⓘ junto a la barra de direcciones → Configuración del sitio → Notificaciones → cámbialo a «Permitir» y luego recarga la página y reintenta.',
  storageTitle: 'Desinstalación y almacenamiento',
  storageHint:
    'Todas las ubicaciones que escribe este plugin. Borrar las cachés no rompe nada (se vuelven a descargar/reconstruir); borrar los «datos de usuario del plugin» pierde la configuración y la memoria del chat.',
  'storage.userData':
    'Datos de usuario del plugin: configuración personalizada main-config.jsonc, memoria del chat memory.json, recursos de animación personalizados main-animation/, mascotas de archivo pet/',
  'storage.electron':
    'Runtime de Electron que usa la mascota de escritorio (grande; se vuelve a descargar automáticamente la próxima vez que se active el modo escritorio)',
  'storage.desktopCache':
    'Caché de las ventanas de mascotas de escritorio y caché de escala del monitor principal (se puede borrar, se reconstruye automáticamente)',
  'storage.electronCache':
    'Caché de descarga del instalador de Electron (se puede borrar, se vuelve a descargar cuando haga falta)',
  'storage.package':
    'El plugin en sí (instalado desde código local: la dependencia del profile apunta a un directorio local dsh-zdd-pet-install; cómo desinstalarlo, más abajo)',
  storageMissing: ' (aún no se ha creado)',
  uninstallTitle: 'Cómo desinstalar',
  uninstallStep1:
    '1. Cierra DSH primero (la mascota de escritorio se cierra con él); no borres estos archivos mientras la mascota esté en ejecución.',
  uninstallStep2:
    '2. Quita el plugin — preferiblemente desde la página «Administrador de plugins» de DSH, desinstalando {name} (lo más fácil; también lo quita de las dependencias del profile y de la capa de bundles); o ejecuta el comando de abajo en una terminal:',
  uninstallStep3:
    '3. Si no hay ningún comando dsh utilizable (habitual cuando DSH se ejecuta dentro de la app de escritorio), desinstálalo a mano: edita {profileDir}/package.json — quita "{name}" de dependencies y "{name}" de dsh.profile.bundles; borra el directorio node_modules/{name}; y reinicia DSH.',
  motionTitle: 'Frecuencia de acciones',
  motionHint:
    'Cuatro casillas: espera / giro / movimiento son editables; la acción aleatoria se calcula (100 − las otras tres). Valor global para todas las mascotas; un pet pack puede sobrescribirlo en su archivo de tipo.',
  'motion.idle': 'En espera',
  'motion.turn': 'Giro',
  'motion.move': 'Movimiento',
  'motion.action': 'Acción aleatoria',
  uninstallCmd: 'dsh plugin --profile {profile} remove {name}',
  // ── 本 fork 追加：心情 / 亲密度 / 番茄钟 / 随机小事件 / 主动关心 / 任务完成提示 / 气泡表情包 ──
  bubbleImageToggle: 'Memes en las burbujas',
  bubbleImageToggleHint:
    'Interruptor general: controla si todas las burbujas llevan imagen — los susurros, el chat, el pomodoro, los easter eggs de las tareas, el aviso de saldo bajo y el saludo de inicio la siguen. Apagado = solo texto en todas partes (más silencioso, ahorra tokens); encendido = cada función adjunta sus memes según su propia lógica (el mapeo está en el campo `memes` de la configuración de nivel superior).',
  pomodoroTitle: 'Pomodoro / recordatorio de movimiento',
  pomodoroHint:
    'A intervalos fijos la mascota dice algo (sin tokens). Valor global para todas las mascotas (un pet pack puede sobrescribirlo en su archivo de tipo); se escribe al guardar: al instante en el navegador, tras recargar en el escritorio.',
  pomodoroLabel: 'Recordatorio de movimiento',
  pomodoroLabelHint:
    'Elige «Desactivado» para pararlo; elige un número de minutos para activarlo y que la mascota te invite a levantarte con esa frecuencia.',
  pomodoroOff: 'Desactivado',
  pomodoroEvery: 'Cada {n} min',
  pomodoroBreakLabel: 'Duración del descanso',
  pomodoroBreakHint: 'Cuánto descansar tras cada sesión de concentración.',
  pomodoroLongBreakLabel: 'Duración del descanso largo',
  pomodoroLongBreakHint: 'Un descanso más largo tras varias rondas de concentración.',
  pomodoroRoundsLabel: 'Rondas por descanso largo',
  pomodoroRoundsHint: 'Cuántas rondas de concentración antes de un descanso largo (1–24).',
  pomodoroAutoBreak: 'Empezar el descanso automáticamente',
  pomodoroAutoBreakHint:
    'Con esta opción, al terminar la concentración arranca sola la cuenta atrás del descanso; si está apagada, la reanudas desde el menú.',
  pomodoroAutoFocus: 'Empezar la siguiente concentración automáticamente',
  pomodoroAutoFocusHint: 'Con esta opción, al terminar el descanso arranca sola la siguiente sesión de concentración.',
  invalidPomodoro: 'Revisa el pomodoro: el intervalo debe ser un número entre 1 y 1440.',
  greetingTitle: 'Saludo de inicio',
  greetingHint:
    'En cada arranque de DSH la mascota dice una frase de buena suerte (con meme). Si el modelo no está disponible, usa unas frases integradas.',
  greetingEnabled: 'Activar el saludo de inicio',
  greetingMode: 'Modo de generación',
  greetingModeHint:
    'Pool: genera un lote por adelantado y lo guarda en local, y cada vez escoge una al azar (ahorra tokens); Live: llama al modelo en cada arranque.',
  greetingModePool: 'Pool (generar por adelantado, elegir al azar)',
  greetingModeLive: 'Live (en cada arranque)',
  greetingPoolSize: 'Tamaño del pool',
  greetingPoolSizeHint: 'Cuántas frases generar por adelantado (1~200); solo se usa en el modo Pool.',
  invalidGreeting: 'Revisa el saludo: el tamaño del pool debe ser un entero entre 1 y 200.',
  moodTitle: 'Ánimo / afecto',
  moodHint:
    'Acariciarla la anima; dejarla mucho tiempo sin atención la aburre. El nivel afecta a las frases al hacer clic y al comportamiento en reposo (contenta se hace la interesante, deprimida suspira o echa una siesta antes). El valor se guarda en local por mascota. Valor global para todas las mascotas; se escribe al guardar: al instante en el navegador, tras recargar en el escritorio.',
  moodEnabled: 'Activar el sistema de ánimo',
  moodEnabledHint:
    'Si está apagado, el ánimo deja de acumularse: las frases al hacer clic usan directamente clickTexts y el comportamiento en reposo ignora el ánimo.',
  moodInitial: 'Ánimo inicial',
  moodInitialHint: 'El valor con el que empieza la mascota la primera vez (0–100).',
  moodTouchGain: 'Cuánto sube por caricia',
  moodTouchGainHint: 'Cuántos puntos suma cada clic en la mascota (0–100).',
  moodDecay: 'Caída por hora',
  moodDecayHint: 'Cuántos puntos se pierden por cada hora sin interacción (0–100).',
  moodLow: 'Umbral bajo',
  moodLowHint: 'Por debajo de este valor se considera «un poco apagada» (0–100).',
  moodHigh: 'Umbral alto',
  moodHighHint: 'Por encima de este valor se considera «de muy buen humor» (0–100).',
  invalidMood: 'Revisa el ánimo: los cinco valores deben estar entre 0 y 100.',
  intimacyTitle: 'Niveles de afecto',
  intimacyHint:
    'Divide el ánimo en cuatro etapas (desconocido / conocido / cercano / cómplice); cuanto más cercano, más cariñosas son las frases al hacer clic. Cada etapa tiene un aniversario que dispara una actuación especial en su fecha. Para personalizar las frases o los aniversarios, edita intimacy.stages en main-config.jsonc.',
  intimacyEnabled: 'Activar los niveles de afecto',
  intimacyEnabledHint:
    'Si está apagado, solo quedan los tres niveles de ánimo; no hay actuaciones de etapa desbloqueada ni de aniversario.',
  intimacyFestivalPrefix: 'Aniversario: ',
  idleEventsTitle: 'Mini-aleatorios en reposo',
  idleEventsHint:
    'Cuando está en reposo, de vez en cuando la mascota hace algo por su cuenta (estirarse / mirar alrededor / bostezar…), a veces con una frase. Para personalizar la lista de eventos, edita idleEvents.events en main-config.jsonc.',
  idleEventsEnabled: 'Activar los mini-aleatorios en reposo',
  idleEventsEnabledHint: 'Si está apagado, la mascota deja de entretenerse por su cuenta mientras está en reposo.',
  idleEventsMin: 'Intervalo mínimo (s)',
  idleEventsMinHint: 'El intervalo más corto entre dos mini-aleatorios (20–86400).',
  idleEventsMax: 'Intervalo máximo (s)',
  idleEventsMaxHint: 'El intervalo más largo entre dos mini-aleatorios (20–86400).',
  invalidIntimacy: 'Revisa el afecto: el formato no es válido.',
  invalidIdleEvents: 'Revisa los mini-aleatorios en reposo: los intervalos deben estar entre 20 y 86400 segundos.',
  proactiveTitle: 'Cuidado proactivo / memoria a largo plazo',
  proactiveHint:
    'La mascota se pone a hablar sola cuando lleva un rato sin que le hables, cuando es tarde y sigues trabajando, o justo al terminar una sesión de concentración (esto llama al modelo). La memoria a largo plazo extrae de las conversaciones los «datos del usuario» (identidad, proyectos en curso, preferencias) y los recuerda, para que la próxima conversación pueda retomar el hilo.',
  proactiveEnabled: 'Activar el cuidado proactivo',
  proactiveEnabledHint: 'Si está apagado, la mascota solo habla cuando le hablas tú.',
  proactiveCooldown: 'Intervalo mínimo (horas)',
  proactiveCooldownHint: 'El intervalo mínimo entre dos mensajes proactivos de la misma mascota (1–720).',
  proactiveIdle: 'Umbral de inactividad (horas)',
  proactiveIdleHint: 'Después de estas horas sin interacción puede dispararse un mensaje de cuidado (1–720).',
  proactiveLateFrom: 'Madrugada desde (0–23)',
  proactiveLateHint: 'Inicio de la franja de madrugada; puede cruzar la medianoche (p. ej. 23).',
  proactiveLateTo: 'Madrugada hasta (0–23)',
  proactiveLongMemory: 'Activar la memoria a largo plazo',
  invalidProactive:
    'Revisa el cuidado proactivo: los intervalos deben ser de 1 a 720 horas y las horas de madrugada, enteros de 0 a 23.',
  completionTitle: 'Aviso de fin de tarea',
  completionHint:
    'Cuando una tarea termina o falla, la mascota muestra una burbuja con el resultado. Por defecto, al pasar el ratón por encima de la mascota se oculta (además hay un cierre automático de unos 20 s); o desactiva ese cierre automático para que se quede hasta que el siguiente mensaje la sobrescriba.',
  completionEnabled: 'Activar el aviso de fin de tarea',
  completionEnabledHint:
    'Si está apagado, no se muestra burbuja al completar ni al fallar (las notificaciones del sistema y los easter eggs no cambian).',
  completionHoldUntilFocus: 'Ocultar al pasar el ratón',
  completionHoldUntilFocusHint:
    'Activado: al pasar el ratón por encima de la mascota se oculta y además desaparece sola tras unos 20 s. Desactivado: se queda hasta el siguiente mensaje o hasta que la borres a mano.',
  invalidCompletion: 'Revisa el aviso de fin de tarea: el formato no es válido.',
  uninstallStep4:
    '4. Borra las ubicaciones de arriba según necesites: las cachés (runtime de Electron / caché del escritorio / caché de descargas) no hacen daño y se vuelven a descargar o reconstruir; borrar los «datos de usuario del plugin» pierde la configuración y la memoria del chat (haz una copia de main-config.jsonc si quieres conservarla).',
};
