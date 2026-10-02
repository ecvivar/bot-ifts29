INFORME DE AUDITORÍA INTEGRAL — PROYECTO ASISTENTE VIRTUAL IFTS N.º29
1. Resumen ejecutivo
El proyecto actual es un asistente guiado por menú (botones/opciones predefinidas), implementado con React/Vite, Express/TypeScript, PostgreSQL (Neon) con fallback a un catálogo semilla en memoria, y preparado para desplegarse en Vercel como aplicación monorrepo (frontend estático + API serverless). La interacción actual no acepta texto libre: el endpoint POST /api/chat valida que el cuerpo incluya una clave de opción existente (opcion) y rechaza cualquier otro formato (validación explícita con errores VALIDATION_ERROR/NOT_FOUND).

El nuevo requerimiento propone pasar a una interacción conversacional acotada al dominio (lenguaje natural) pero sin convertirlo en un chatbot de propósito general ni permitir que invente respuestas. Esta auditoría concluye que:

Gran parte del trabajo existente es reutilizable: capa de dominio (menú/respuestas/documentos/contactos), esquema de datos, servicios, tipos compartidos, widget embebible, seguridad (CORS/CSP), métricas anónimas y la política de "no inventar URLs/documentación" (RF07).
El cambio es principalmente en la capa de interpretación (entrada de lenguaje natural → intención → búsqueda controlada → respuesta autorizada) y en la interfaz (input de texto + historial conversacional). El modelo de respuesta controlada (nodo/respuesta/derivación) puede mantenerse.
La opción más adecuada y defendible académicamente es una arquitectura híbrida A+B (matching directo + búsqueda por similitud semántica con umbral de confianza y solicitud de aclaración). No se recomienda adoptar un LLM de propósito general abierto. En caso de evaluarse LLM, debería aplicarse RAG estrictamente restringido (solo recuperación desde la base de conocimiento autorizada, sin generación libre fuera de los ítems recuperados) y con fuertes guardrails.
Google Sheets resulta útil como fuente de edición no técnica (carga/curación del conocimiento), pero no conviene consumirlo directamente en tiempo de respuesta por disponibilidad/latencia/seguridad/versionado. Se recomienda importar/sincronizar Sheets hacia la base de datos propia (o bien mantener el conocimiento exclusivamente en BD y exportar a Sheets para edición).
Memoria conversacional no es estrictamente necesaria para el alcance actual, pero sí conveniente para preguntas encadenadas (ej. "¿y los sábados?"). Si se incorpora, debe ser efímera (sesión/pestaña), sin PII y con límite de turnos/contexto explícito.
Principio rector verificado en el código: el sistema responde únicamente con información autorizada y no inventa enlaces ni documentos cuando no están sincronizados con Drive. Ese principio debe mantenerse intacto en el nuevo modelo.

2. Estado actual del proyecto
2.1 Documentación y configuración
README.md (existente, completo y actualizado): describe arquitectura, modo demo (seed), Neon/Drive, despliegue Vercel, inserción en Moodle, privacidad. Coincide con el estado real.
package.json (raíz): workspaces backend, frontend. Scripts: dev:api, dev:web, build, typecheck, db:push, db:reset. TypeScript + tsx para desarrollo.
vercel.json: frontend en frontend/dist, función api/index.ts (maxDuration 30s, memory 1024). Rewrites API y fallback SPA. Headers globales con CSP (frame-ancestors 'self' https://aulasvirtuales.bue.edu.ar https://chatbot-ifts29.vercel.app), CORS no forzado globalmente (la API aplica allowlist propia). Correcto.
.env.example: variables backend/frontend, Drive, CORS/IFRAME_ANCESTORS, rate limit. Limpio (sin variables obsoletas).
2.2 Backend (Express + TypeScript)
Estructura:

api/index.ts: handler serverless (Vercel). Crea app Express, aplica middlewares (securityHeaders, corsMiddleware, rateLimit), monta rutas (/api/menu, /api/chat, /api/*), maneja preflight y errores.
backend/src/index.ts: arranque local (npm run dev:api), puerto 3000, logs de modo DB/seed.
backend/src/app.ts: configuración de app (mismos middlewares/rutas).
Rutas:
routes/menu.routes.ts: GET /menu, GET /menu/:clave, GET /menu?mapa=1
routes/chat.routes.ts: POST /chat, POST /chat/documento
routes/system.routes.ts: GET /health, GET /metricas, POST /sync
Servicios:
services/chat.service.ts: navegación (nodo/responder/derivar), construcción de respuestas, contactos, documentos, contexto. Lógica determinística por clave de opción.
services/drive.service.ts: sincronización Drive (solo lectura), emparejamiento exacto por nombre/fileId, enlaces canónicos, sin inventar URLs.
services/metricas.service.ts: conteo anónimo de selecciones (metrica_opcion, UPSERT por (opcion_clave, evento, fecha)).
Middleware: cors.ts (allowlist estricta por origen, Vary: Origin, CSP frame-ancestors dinámico), rateLimit.ts, error.ts.
Utils: env.ts (lectura centralizada), errors.ts (HttpError).
Endpoints relevantes (estado actual):

Ruta	Método	Recibe	Procesa	Devuelve
/api/menu	GET	?mapa=1 opcional	Obtiene árbol desde BD/seed (vista o construcción)	Raíz + opciones o mapa completo
/api/menu/:clave	GET	clave	Busca nodo/opción	Nodo o 404
/api/chat	POST	{ opcion: string }	Valida opción, navega (navegar→nodo, responder→respuesta+documentos, derivar→derivación+contactos)	`{ origen, tipo: 'nodo'
/api/chat/documento	POST	{ claveDocumento: string }	Registra apertura (métricas/telemetría anónima)	{ ok }
/api/metricas	GET	?dias=7	Top de selecciones agregadas	{ origen, top[] }
/api/sync	POST	{ carpetaId?, dryRun? } + header X-Sync-Secret	Sincroniza fichas documento con Drive	ResultadoSync
/api/health	GET	—	Estado API/DB/Drive	Health
Validación POST /api/chat (real): espera opcion (string). Si viene texto, body vacío o tipo inválido → VALIDATION_ERROR ("Se esperaba la clave de una opción del menú."). Si opcion no existe → NOT_FOUND. No acepta lenguaje natural. (Confirmado en pruebas: rechaza {"texto":"hola"} con error.)

2.3 Capa de datos
Esquema (db/001_schema.sql):

Entidades: categoria, opcion_menu, respuesta, documento, contacto, contexto. Relaciones: opcion_contacto, respuesta_documento, contexto_opcion. Métricas: metrica_opcion (PK (opcion_clave, evento, fecha), total incremental). Vista v_arbol_menu para mantenimiento. Trigger touch_actualizado_en() para updated_at.

Contenido (db/002_seed.sql): árbol completo (RAÍZ → ADMINISTRATIVAS/ACADÉMICAS → 4 materias → Programa/Cronograma/Condiciones/Días). 12 documentos (aislados por materia), 3 contactos (Tutora MG María González, Bedelía, Asesoría), contextos. Idempotente.

Acceso (backend/src/db/pool.ts): @neondatabase/serverless (Neon HTTP). query<T> parametrizada ($1..$n). getPool() devuelve null si !DATABASE_URL → modo seed. checkDatabase() valida esquema.

Catálogo semilla (backend/src/seed/catalogo.ts): réplica exacta en memoria (mismo contenido/clave). Usado cuando no hay BD. Alineado con SQL (claves DOC_*_PROGRAMA|CRONOGRAMA|CONDICIONES).

Push (backend/src/db/push.ts): aplica DDL+seed con fallback robusto (divide sentencias respetando $tag$...$tag$, quita BEGIN/COMMIT en reintento por sentencia). Útil para Neon HTTP.

2.4 Frontend (React + Vite)
src/App.tsx: renderiza ChatWidget (detecta ?embed=1 para modo embebido).
src/components/ChatWidget.tsx: componente principal. Estado conversacional vía useChat(). Modo embebido: publica postMessage({ type: 'ifts29:alto', alto }, origenPadre) para ajustar altura del iframe. Escucha mensajes padre (ifts:abrir/cerrar/reiniciar). Header, cuerpo scroll, pie con "Reiniciar". No tiene input de texto libre (solo renderiza opciones, burbujas, documentos, contactos).
src/hooks/useChat.ts: estado (historial, nodoActual, respuestaActual, derivacionActual, cargando, error). API: iniciar(), seleccionar(opcion), reiniciar(), registrarApertura(clave). Todas las acciones del usuario son selecciones de opcion (botones). No envía texto libre.
src/components/DocumentCard.tsx: muestra ficha sin enlace si !doc.url (o no sincronizado) + aviso ("Documento en preparación..."). Nunca inventa URL (cumple RF07). Muestra estado, vigente, fecha.
src/components/ContactCard.tsx: contactos de derivación (tutora primero).
src/api/client.ts: fetchJSON con VITE_API_BASE_URL. Endpoints usados: GET /api/menu, POST /api/chat, POST /api/chat/documento.
src/types.ts: tipos alineados al contrato API (TipoNodo, Respuesta, Derivacion, Documento, Contacto).
public/widget.js: inyector para Moodle. Crea lanzador flotante o modo inline (data-ifts-container). API pública window.IFTS29Asistente (abrir/cerrar/alternar/reiniciar/destruir). Comunicación postMessage con targetOrigin explícito (origen Moodle/app). Sintaxis válida, build copia a dist/widget.js (10KB).
2.5 Datos y fuentes de conocimiento
Fuente única actual de conocimiento autorizado: catálogo (BD 001/002 o seed/catalogo.ts). No existe Google Sheets, no existe RAG, no existe LLM. Documentos referenciados por metadatos + drive_file_id/enlaces reales (Drive). Conocimiento está contenido, versionado en SQL/TS y controlado por seed/DDL.

2.6 Flujo punta a punta (actual)
Usuario
→ Frontend (ChatWidget, sin input texto)
→ hace clic en opción (etiqueta) → llama useChat.seleccionar(clave)
→ POST /api/chat { opcion: clave }
→ chat.service.ts: valida, busca opción (join categoría), determina tipo (navegar/responder/derivar)
  - navegar: carga categoría destino → devuelve tipo='nodo' + nodoActual (opciones + mensaje)
  - responder: carga respuesta + documentos (JOIN respuesta_documento+documento) → tipo='respuesta'
  - derivar: carga contactos (opcion_contacto+contacto) → tipo='derivacion'
→ Frontend recibe respuesta → actualiza estado → renderiza burbujas (bot/user), opciones o respuesta+docs+contactos
→ Usuario elige siguiente opción
Características clave del flujo actual:

Determinístico, sin ambigüedad (ruta única por clave).
Sin entrada libre → superficie de ataque reducida, control total.
100% basado en opciones preestablecidas (botones). No hay parsing de lenguaje natural.
Respuestas controladas (siempre provienen de BD/seed). No inventa.
Trazabilidad: documentos sin enlace → aviso, nunca URL inventada.
Sin memoria conversacional persistente (historial vive solo en estado React, se pierde al recargar/reiniciar). No hay conversationId ni almacenamiento en backend.
3. Identificación del modelo actual de interacción
Tipo de interacción	Presente	Observación
Botón/opción preestablecida	Sí (100%)	Única vía. Cada clic envía opcion válida.
Menú	Sí	Jerárquico (RAÍZ → ramas → materias).
Formulario	No	No existe.
Selección	Sí	Lista de opciones con etiquetas.
Búsqueda	No	No hay buscador de texto.
Texto libre	No	Rechazado explícitamente por validación.
Conversación	No	No hay turnos en lenguaje natural, es navegación guiada.
Flujo condicional	Parcial	Depende del tipo de opción (navegar/responder/derivar). Condicionales fijos (no dinámicos por parámetros libres).
Otro	No	—
Estimación: ~100% opciones preestablecidas, ~0% lenguaje natural.

Lógica reutilizable para interpretar consultas: chat.service.ts (mapeo clave→contenido, construcción de respuesta/derivación, aislamiento por categoría/materia, validación). El esquema (opcion_menu, respuesta, documento, contacto, contexto, relaciones) es muy reutilizable para modelar Intenciones/Preguntas/Respuestas/Reglas.

4. Comparación con el nuevo requerimiento
Requerimiento	Situación actual	Cumple	Cambio necesario	Prioridad
Interacción conversacional	Solo menús/botones. Sin turnos en lenguaje natural.	No	Incorporar entrada de texto, historial de mensajes (user/bot), gestión de turnos. Reutilizar renderizado de burbujas (ya existe).	Alta
Lenguaje natural	No aceptado. Rechazado por validación.	No	Nuevo endpoint/flujo: POST /api/chat debe aceptar { message: string, conversationId?, context? }. Añadir normalización + búsqueda (directa/semántica).	Alta
Base de conocimiento	Fija (SQL/seed). Solo lectura, versionada.	Parcial	Mantener fuente autorizada única. Permitir curación (DB). Evaluar importación desde Google Sheets (no consumo directo en runtime).	Alta
Respuestas controladas	Sí. Siempre desde seed/BD. Nunca inventa URLs.	Sí	Debe conservarse. Cualquier respuesta generada debe estar vinculada a ítems autorizados (no generación libre).	Crítica
No inventar información	Sí (principio RF07). Documentos sin sync → aviso, sin enlace.	Sí	Mantener guardrail: si confianza < umbral o sin match suficiente → no inventar, informar explícitamente.	Crítica
Manejo de consultas desconocidas	Solo 404 por opción inexistente (texto libre no llega).	Parcial	Definir respuestas estándar: "No dispongo de información suficiente para responder esa consulta dentro del dominio autorizado.", + solicitar aclaración cuando ambiguo.	Alta
Restricción al dominio	Dominio explícito (académico/administrativo IFTS29). Árbol acotado.	Sí	Debe reforzarse (clasificación de intención/domino permitido). Rechazar fuera de dominio explícitamente.	Alta
Parámetros y restricciones	Implícitos (ramas/materias). Sin validación de parámetros libres.	Parcial	Modelar parámetros requeridos/opcionales, validarlos, pedir aclaración si faltan. Mapear a contexto existente (contexto, contexto_opcion).	Alta
Trazabilidad de respuestas	Parcial. Documentos con clave, id, estado, sync. Respuestas por clave.	Parcial	Añadir source (origen KB: pregunta_id/respuesta_id, tabla, archivo), confidence, matchType (exacto/similar/regla), intent. No exponer trazabilidad interna innecesaria al usuario.	Media/Alta
Persistencia de conversación	Solo estado cliente (React). Sin backend. Anónima por diseño.	Parcial	Evaluar memoria efímera (ver sección 11). Si se persiste, solo metadatos anónimos (turnos, IDs, no PII). Cumple RNF05.	Baja/Media
Requisitos a confirmar:

Umbral de confianza y política (¿rechazo directo vs. "¿Te referís a...?"?). Marcar como DECISIÓN PENDIENTE.
Formato/estructura de KB para preguntas variantes (¿tabla pregunta + pregunta_variante + respuesta?). DECISIÓN PENDIENTE.
Memoria conversacional: ¿obligatoria o opcional para el alcance académico? DECISIÓN PENDIENTE.
Uso eventual de LLM: ¿permitido con RAG estricto o debe evitarse? DECISIÓN PENDIENTE (académico).
5. ¿Qué significa "conversacional" en este proyecto?
El requerimiento no implica chatbot abierto. Significa diálogo acotado: interpretación → búsqueda controlada → respuesta autorizada → aclaración o rechazo. Se evalúan alternativas:

Alternativa	Descripción	Complejidad	Control	Riesgo alucinaciones	Demostrabilidad	Mantenimiento	Adecuación académica	Recomendación
A. Matching directo	Normalizar pregunta → comparar con pregunta/variantes exactas (case-insensitive, sin acentos, tokens).	Baja	Máximo	Cero	Muy alta (trazable)	Muy fácil	Óptima	Base obligatoria
B. Matching semántico	Embeddings (local, p.ej. sentence-transformers ligero o modelos ONNX) + similitud coseno sobre KB autorizada. Umbral + fallback aclaración/rechazo.	Media	Alto	Muy bajo (solo recupera ítems KB)	Alta	Fácil/medio	Muy buena	Recomendada (complementa A)
C. LLM restringido (RAG estricto)	Retriever exclusivo (KB autorizada, top-K), prompt con sistema "solo usar contexto, si no hay info suficiente → decirlo, no inventar", citations, temperature 0, grounding estricto. Sin tools externos.	Media/Alta	Medio-Alto (requiere guardrails)	Bajo (con grounding correcto)	Buena	Medio	Buena (defendible si justifica restricciones)	Solo si se justifica. Requiere validación rigurosa.
D. Híbrida (A+B)	Intento A (exacto) → si no supera, B (semántico con umbrales) → si ambiguo → pedir aclaración → si < umbral → "no dispongo...". Sin LLM.	Media	Máximo	Cero	Muy alta	Fácil	Óptima	Recomendada
Conclusión conceptual: "conversacional controlado" = A+B + reglas + aclaraciones. No requiere generación libre. El modelo actual de tipo = nodo/respuesta/derivacion es perfectamente compatible con este enfoque (la "respuesta" puede provenir de búsqueda, no solo de opción).

6. Evaluación de Google Sheets
Aspecto	Ventajas	Desventajas	Conclusión
Edición	No técnica, colaborativo, histórico de cambios, fácil curación	—	Útil
Separación código/contenido	Reduce deploys por cambios de texto	—	Útil
Disponibilidad/latencia	—	Límite cuota, rate, posibles timeouts, dependencia externa	Riesgoso en runtime
Seguridad	—	Service Account/credenciales, exposición, control de acceso	Requiere cuidado
Versionado/validación	—	Difícil validar esquemas, duplicados, referencias rotas	Mejor en BD
Consistencia	—	Posibles formatos inconsistentes	Mejor con constraints
Concurrencia	—	Conflictos/lecturas parciales	BD superior
Recomendación sobre Sheets:

No usar Google Sheets como fuente de lectura en tiempo real (cada request). Latencia + disponibilidad + límites + trazabilidad.
Sí usarlo como fuente de importación/curación (batch). Workflow: editar en Sheets → sincronizar hacia BD (sync_kb o script) → servir desde BD (rápido, transaccional, con índices).
Opción mixta (prototipo → estable): MVP con BD únicamente. Si se requiere edición no técnica, añadir import/export Sheets (unidireccional hacia BD en producción, o bidireccional controlado).
Preferible: mantener KB en PostgreSQL (coherente con esquema actual). Sheets = herramienta de administración, no origen runtime.
Respuesta: Usaríamos BD como origen de verdad. Google Sheets como herramienta de carga/edición no técnica (sincronización batch), NO como consulta directa por request.

7. Modelo propuesto de base de conocimiento
Mantener arquitectura actual (controlada) y extender con entidades de conocimiento conversacional (aditivas, sin romper existente). No eliminar tablas actuales (reutilizables).

7.1 Entidades propuestas (conceptuales)
Tabla	Propósito	Campos (mínimos)	Justificación
kb_intencion	Clasifica consulta (dominio acotado)	id, clave (única), nombre, dominio (acad/adm/general), activo	Restricción de dominio, enrutamiento. Reutiliza categorías existentes.
kb_pregunta	Ítem de conocimiento autorizado	id, intencion_id, pregunta_principal (texto), respuesta_id (FK a respuesta existente o nueva), prioridad (int), activo, umbral_minimo (num)	Núcleo. Vincula a respuestas ya modeladas (respuesta). Evita duplicar texto.
kb_pregunta_variante	Formas equivalentes (ortografía, sinónimos, coloquial)	id, pregunta_id, texto (normalizado + original), peso (0-1), activo	Fundamental para matching directo (A). Permite cobertura sin duplicar respuesta.
kb_respuesta	(extiende actual)	Reutilizar respuesta existente. Añadir opcional fuente, notas	Evitar romper contrato (tipo=respuesta con documentos). Reutilización máxima.
kb_regla	Reglas/condiciones por parámetros	id, intencion_id, condicion (JSON), accion (JSON), orden, activo	Soporta "parámetros requeridos", validaciones, ramificaciones controladas.
kb_synset	Sinónimos controlados (dominio)	id, termino, sinonimos (array/texto)	Reduce falsos negativos sin abrir vocabulario.
kb_conversacion	(opcional, efímera)	id (uuid), anonimo (bool), contexto (JSON), turnos (int), creado_en, expira_en	Solo si hay memoria (sección 11). No guardar PII. TTL obligatorio.
kb_turno	(opcional)	id, conversacion_id, rol (user/bot), mensaje, source, confidence, matchType, intencion_id	Trazabilidad/auditoría interna. Anónimo.
Notas de diseño:

Reutilizar respuesta, documento, contacto existentes (no duplicar). kb_pregunta.respuesta_id puede apuntar a respuestas actuales (Programa/Días/Condiciones) o nuevas.
Normalización obligatoria: almacenar versión normalizada (lowercase, sin acentos, espacios, signos) para comparar eficientemente (columna derivada o índice funcional).
Activo/inactivo + vigencia (añadir vigente_desde/hasta opcional) para controlar desactualizaciones.
Índices: GIN/trigram (pg_trgm) en textos normalizados para búsqueda por similitud (Postgres nativo) o embeddings externos. Evita dependencia innecesaria si se usa B.
Justificación campos: mínimos, controlados, trazables. Sin campos innecesarios.

8. Modelo de conversación controlada
8.1 Nuevo contrato API (propuesto, aditivo)
Mantener /api/chat actual (opción) por compatibilidad hacia atrás (no romper widget actual si se reutiliza parcialmente). Añadir variante conversacional o ampliar contrato con retrocompatibilidad:

Propuesta (compatible):

// Request
{
  message?: string,        // nuevo: lenguaje natural
  opcion?: string,         // existente: compatibilidad
  conversationId?: string, // opcional (UUID)
  context?: Record<string, unknown> // opcional
}

// Response
{
  origen: 'seed'|'neon',
  tipo: 'nodo'|'respuesta'|'derivacion'|'aclaracion'|'no_disponible',
  claveOpcion?: string,
  nodo?: NodoActual,
  respuesta?: Respuesta,
  derivacion?: Derivacion,
  aclaracion?: {
    pregunta: string,
    opciones?: Array<{ clave: string, etiqueta: string }>, // sugerencias controladas
    motivo: 'ambigua'|'parametros_faltantes'
  },
  noDisponible?: {
    mensaje: string,
    sugerencias?: string[]
  },
  intent?: string,
  confidence?: number,      // 0-1
  source?: string,          // p.ej. "kb:pregunta:15" o "regla:3"
  matchType?: 'exacto'|'similar'|'regla'|'ninguno'
}
Nota: tipo se amplía con aclaracion y no_disponible (no rompen consumidores existentes si no los usan). Frontend actual solo espera los 3 tipos; interfaz conversacional leerá nuevos.

8.2 Flujo de interpretación (controlado)
Usuario (texto NL)
↓
Normalización (minúsculas, quitar acentos, signos, espacios múltiples)
↓
1. Intento A – Matching directo
   - Buscar kb_pregunta_variante.texto_normalizado == normalizado (exacto)
   o LIKE/trigram con igualdad alta
↓ si match exacto (confidence ~1.0) → obtener respuesta autorizada (source + matchType='exacto')
↓
2. Si no → Intento B – Similitud semántica (controlada)
   - Recuperar candidatos (top-N, p.ej. N<=20) de KB activa (solo dominio permitido)
   - Calcular similitud coseno (embeddings locales). Filtrar por dominio/intención
   - Mejor candidato >= umbral_alto (p.ej. 0.90) → matchType='similar', usar respuesta
   - Entre umbral_bajo y alto (p.ej. 0.70–0.89) → tipo='aclaracion' (ambiguo) con sugerencias controladas (máx. 3)
   - < umbral_bajo (p.ej. < 0.70) → tipo='no_disponible'
↓
3. Validación de parámetros (kb_regla)
   - Si intención requiere parámetros → verificar context/conversationId
   - Faltantes → aclaracion (parametros_faltantes)
↓
4. Respuesta controlada
   - Siempre resolver a ítem autorizado (respuesta + documentos/contactos si aplica)
   - No generar texto libre fuera de KB
↓
Usuario recibe respuesta/aclaración/rechazo explícito
Umbrales propuestos (valores iniciales, calibrables):

Rango similitud (coseno)	Acción	Razón
>= 0.90	Responder (similar)	Alta certeza, riesgo nulo si solo KB
0.70 – 0.89	Solicitar aclaración ("¿Te referís a...?" con hasta 3 opciones controladas)	Evita falso positivo, cumple "no inventar"
< 0.70	No disponible (mensaje explícito + sugerencias opcionales)	Insuficiente información
DECISIÓN PENDIENTE: confirmar umbrales exactos (calibración con casos reales). No fijarlos como inamovibles.

8.3 Garantías para "no inventar respuestas"
Fuente única autorizada: toda respuesta debe mapear a kb_pregunta.respuesta_id → respuesta (+ documentos vía respuesta_documento). Nunca template libre + LLM.
Retrieval-only: si se usa embeddings, búsqueda solo sobre KB activa (no corpus externo). Candidatos limitados a ítems autorizados.
Grounding obligatorio: respuesta construida exclusivamente desde el ítem recuperado (no completada externamente).
Umbral + aclaración: incertidumbre → pedir aclaración o rechazar, nunca adivinar.
Sistema de rechazo explícito: mensaje tipo "No dispongo de esa información dentro del dominio autorizado del IFTS N.º29. Podés reformular la consulta o elegir una de las opciones sugeridas."
Sin generación libre (principio): evitar temperature>0 + generación abierta. Si C, exigir only use provided context, cite sources, refuse if missing, y validar que respuesta no contiene tokens fuera de contexto (difícil 100%). Por eso D (A+B) es más seguro y demostrable.
Trazabilidad (source, matchType, confidence, intent) para auditoría (no expuesta al usuario).
9. Parámetros y restricciones
"Atado a parámetros y restricciones" significa:

Dominio acotado: solo intenciones con dominio permitido (académico/administrativo). Fuera → no_disponible.
Parámetros requeridos: p.ej. "¿cuál es el cronograma?" puede necesitar materia/comisión → kb_regla define obligatorios. Si faltan → aclaracion (parametros_faltantes) con opciones controladas (volver a menú/materias).
Parámetros opcionales: refinan respuesta (no bloquean).
Validación estricta: valores solo del catálogo (materias, comisiones, tipos). No aceptar libres.
Contexto conversacional acotado: solo lo necesario (últimos N turnos, intenciones previas). Nunca almacenar consulta completa con datos sensibles.
Restricciones por rol/ámbito: si aplica, modelar en reglas (no por usuario identificado, sistema anónimo).
Mapeo a existente: contexto y contexto_opcion ya existen (RF06). Reutilizables para poblar parámetros requeridos.

Casos definidos (comportamiento esperado)
Caso	Comportamiento	Tipo respuesta
Exacta	Coincidencia directa	respuesta (matchType=exacto, confidence~1.0)
Equivalente	Variantes reconocidas	respuesta (exacto/similar alto)
Error ortográfico	Normalización + similitud	Según umbral (alto→respuesta, medio→aclaración, bajo→no_disponible)
Incompleta	Falta parámetro obligatorio	aclaracion (parametros_faltantes) con opciones controladas
Ambigua	Varios candidatos 0.70–0.89	aclaracion (ambigua) máx. 3 sugerencias (todas del KB)
Fuera de dominio	Intención no permitida o < umbral	no_disponible (mensaje explícito, sin inventar)
Sin información suficiente	< umbral_bajo	no_disponible
Parcialmente relacionada	Mejor candidato < umbral	no_disponible (no forzar)
Varias respuestas posibles	Ambigüedad → aclaración (nunca elegir arbitrariamente)	aclaracion
Parámetros inválidos	Valor fuera de catálogo	aclaracion con valores válidos sugeridos
Desactualizada/inactiva	Solo activo=true y vigente	Ignorada en búsqueda
10. Memoria conversacional
Análisis:

Necesaria: preguntas encadenadas ("¿y los sábados?"), referencias anafóricas ("ese cronograma"), mantener materia seleccionada implícitamente.
No necesaria: consultas aisladas (caso mayoritario). MVP actual no la requiere.
Principio RNF05: sin datos personales. Historial cliente OK.
Recomendación:

Incorporar memoria efímera (contexto de conversación). No persistente entre sesiones largas innecesarias.
Almacenamiento: backend opcional con conversationId (UUID anónimo), TTL (p.ej. 30–60 min o hasta reinicio). O solo frontend (más simple, cumple privacidad). Preferible frontend + backend mínimo (contexto JSON ligero).
Qué persistir: intencion_id, respuesta_id usada, parámetros resueltos (materia, rama), últimos 2–3 turnos, turnos. Nunca texto completo innecesario, nunca PII.
Limpieza: expira_en, reiniciar conversación (botón existente "Reiniciar") borra contexto. Nueva consulta sin conversationId → nueva conversación.
Contaminación: forzar nuevo conversationId al "Reiniciar", caducidad por inactividad, límite de turnos (p.ej. 20).
Conclusión: Recomendada pero no bloqueante (MVP sin memoria → añadir en Fase 5 si necesario). Justificable para mejorar UX conversacional sin comprometer privacidad.

11. Arquitectura objetivo
11.1 Diagrama conceptual (propuesto)
Usuario (NL + opcional botones)
↓
Frontend (ChatWidget): input texto + burbujas + opciones controladas
↓
POST /api/chat { message, opcion?, conversationId?, context? }
↓
ChatController (validación + rate limit)
↓
NLInterpreter (normalización)
  ├─ A: Exact match (kb_pregunta_variante)
  └─ B: Semantic search (embeddings locales, solo KB) + umbrales
↓
IntentResolver (kb_intencion + dominio)
↓
ParamValidator (kb_regla) → ¿parámetros OK?
  ├─ NO → tipo='aclaracion' (opciones controladas)
  └─ SÍ → continuar
↓
KnowledgeResolver → obtiene kb_pregunta + respuesta (autorizada)
  ├─ Match → tipo='respuesta'|'nodo'|'derivacion' (reutiliza chat.service existente)
  └─ Ninguno → tipo='no_disponible'
↓
ConversationContext (lectura/escritura efímera, TTL)
↓
Respuesta controlada (con source/confidence/matchType)
↓
Frontend renderiza (mismo modelo de componentes)
11.2 Si se propone LLM (restricciones obligatorias)
Solo considerar C si A+B insuficiente. Requisitos estrictos:

Retriever exclusivo: vector search sobre únicamente ítems KB (filtro activo+dominio). Sin internet, sin documentos externos.
System prompt hermético: "Responde ÚNICAMENTE con información contenida en el contexto proporcionado. Si la información no está presente, di explícitamente que no dispones de esa información. NO inventes, completes ni infieras fuera del contexto. NO uses conocimiento general. Cita el source_id cuando uses un ítem. Rechaza consultas fuera del dominio."
Grounding forzado: temperature=0, top_p conservador, max_tokens acotado, sin tools, sin function calling abierto, sin búsqueda web.
Validación post-respuesta: detectar desviaciones (hallucination guardrail) → rechazar y caer a A+B/no_disponible.
Modelo local (on-prem) preferido sobre API externa (privacidad, control, costos). Embeddings también locales.
Conclusión: No recomendado para MVP. Complejidad + riesgo de demostración académica. A+B cumple principio con máximo control.

12. Cambios necesarios (clasificación)
Elemento	Estado actual	Acción	Motivo
POST /api/chat (contrato)	Solo {opcion}	Adaptar (extender con campos opcionales + nuevos tipos)	Retrocompatible. Añadir NL sin romper existente.
chat.service.ts	Navegación determinística	Adaptar	Extraer resolverRespuestaAutorizada() reutilizable (por respuesta_id). Añadir interpretarMensaje() (A+B). Mantener lógica nodo/responder/derivar.
Rutas chat	Valida opción estricta	Adaptar	Branch: si message presente → flujo NL; si opcion → flujo actual (compatibilidad).
KB (entidades)	Solo esquema operativo	Incorporar	Añadir tablas kb_* (migración aditiva, no destructiva). Reutilizar respuesta/documento/contacto.
Normalización/búsqueda	Ninguna	Incorporar	Utilidades: normalizar, trigram (pg_trgm), embeddings opcionales (local).
Embeddings (opcional B)	No	Incorporar (opcional)	Solo si se elige B. Preferible Postgres pg_trgm + similitud (similarity) para MVP (sin deps pesadas).
Frontend ChatWidget	Sin input texto	Adaptar	Añadir <input> (textarea) + botón Enviar, historial user/bot, estados aclaración/no_disponible, deshabilitar mientras carga. Reutilizar burbujas/DocumentCard/ContactCard.
useChat hook	Solo seleccionar(opcion)	Adaptar	Añadir enviarMensaje(texto), manejar aclaracion/noDisponible, conversationId, contexto. Mantener reiniciar() (limpia contexto).
Tipos (types.ts)	Tipos actuales	Adaptar	Añadir tipos Aclaracion, NoDisponible, ampliar ChatResponse/TipoNodo.
Métricas	Solo selecciones (opción)	Mantener (+adaptar opcional)	Añadir evento consulta_nl anónimo (matchType, intent) sin PII.
Drive/service	Solo lectura, estricto	Mantener	Principio RF07 intacto.
Seed/catalogo	Catálogo operativo	Mantener	Reutilizar para poblar KB inicial (preguntas variantes por ramas/materias).
CORS/CSP/RateLimit	Correctos	Mantener	No cambiar.
Widget.js	Embebido OK	Mantener	Compatible (postMessage).
Componentes obsoletos	Ninguno evidente	Ninguno	Todo reutilizable.
Reemplazar/Eliminar: Ninguno propuesto. Estrategia evolutiva (aditiva), no big-bang destructivo.

13. Cambios por capa
13.1 Frontend
ChatWidget.tsx: añadir barra de entrada (form con textarea/input, Enter para enviar, Shift+Enter salto). Mostrar mensajes user/bot con roles. Renderizar aclaracion (botones sugeridos controlados) y noDisponible (texto + sugerencias). Mantener opciones existentes cuando tipo='nodo'.
useChat.ts: nuevo método enviarMensaje(mensaje: string), gestión conversationId (uuid v4 cliente, anónimo), context ligero. reiniciar() limpia conversación + contexto.
MessageBubble.tsx (existente): reutilizar para user/bot. Añadir variantes para aclaracion/info si necesario (mínimo cambio).
Tipos: ampliar ChatResponse con nuevos campos/tipos. No romper existentes.
UX: indicar "Escribí tu consulta..." (placeholder), deshabilitar input durante cargando, evitar enviar vacío. Clarificar: sistema responde dentro de dominio (texto de ayuda opcional, no invasivo).
13.2 Backend
Nuevo/extendido nlInterpreter.ts (servicio): normalización, A (trigram/exacto), B (similitud). Solo candidatos activos+dominio. Umbrales configurables por env.
kb.service.ts: consultas a tablas KB (lectura). Índices trigram (pg_trgm extensión) para A/B ligero.
chat.service.ts: refactor menor: separar resolverPorOpcion() y resolverPorMensaje() (comparten construcción respuesta/derivación). Reutilizar 100% lógica existente de documentos/contactos.
Rutas: ampliar validación (acepta message OR opcion, no ambos ambiguos). Validar longitud, trim, caracteres básicos (sanitizar sin alterar NL).
Rate limiting: mantener (120 req/min). Aplicar por IP (ya existe).
Logging: añadir logs anónimos (matchType, confidence, intent, source) para métricas/debug, sin mensaje completo ni PII.
13.3 Base de datos
Migraciones aditivas (DDL nuevo):

-- Extensiones útiles (opcional)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Intenciones
CREATE TABLE IF NOT EXISTS kb_intencion (
  id SERIAL PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  dominio TEXT NOT NULL CHECK (dominio IN ('academico','administrativo','general')),
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Pregunta KB
CREATE TABLE IF NOT EXISTS kb_pregunta (
  id SERIAL PRIMARY KEY,
  intencion_id INT REFERENCES kb_intencion(id) ON DELETE RESTRICT,
  pregunta_principal TEXT NOT NULL,
  respuesta_id INT REFERENCES respuesta(id) ON DELETE RESTRICT,
  prioridad INT NOT NULL DEFAULT 0,
  umbral_minimo NUMERIC(3,2) DEFAULT 0.70,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Variantes
CREATE TABLE IF NOT EXISTS kb_pregunta_variante (
  id SERIAL PRIMARY KEY,
  pregunta_id INT REFERENCES kb_pregunta(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  texto_normalizado TEXT NOT NULL,
  peso NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (pregunta_id, texto_normalizado)
);

-- Reglas
CREATE TABLE IF NOT EXISTS kb_regla (
  id SERIAL PRIMARY KEY,
  intencion_id INT REFERENCES kb_intencion(id) ON DELETE CASCADE,
  condicion JSONB NOT NULL DEFAULT '{}',
  accion JSONB NOT NULL DEFAULT '{}',
  orden INT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Conversación efímera (opcional)
CREATE TABLE IF NOT EXISTS kb_conversacion (
  id UUID PRIMARY KEY,
  anonimo BOOLEAN NOT NULL DEFAULT TRUE,
  contexto JSONB NOT NULL DEFAULT '{}',
  turnos INT NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_en TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '60 minutes',
  activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS kb_turno (
  id BIGSERIAL PRIMARY KEY,
  conversacion_id UUID REFERENCES kb_conversacion(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('user','bot')),
  mensaje TEXT NOT NULL,
  source TEXT,
  confidence NUMERIC(4,3),
  matchType TEXT CHECK (matchType IN ('exacto','similar','regla','ninguno')),
  intencion_id INT REFERENCES kb_intencion(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kb_variante_norm ON kb_pregunta_variante (texto_normalizado);
CREATE INDEX IF NOT EXISTS idx_kb_variante_trgm ON kb_pregunta_variante USING gin (texto_normalizado gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kb_pregunta_activa ON kb_pregunta (activo, prioridad DESC);
CREATE INDEX IF NOT EXISTS idx_kb_conv_expira ON kb_conversacion (expira_en) WHERE activa;
Notas DB:

Aditivas (no tocan categoria/opcion_menu/respuesta/documento/...). Compatible 100% con estado actual.
pg_trgm habilitado para búsqueda por similitud léxica (Postgres nativo, sin dependencias externas). Suficiente para MVP (A+B con trigram + opcional embeddings locales después).
Conversaciones con expira_en + índice de limpieza (job opcional, no necesario MVP: borrar expiradas en lectura o cron ligero).
Población inicial KB: mapear preguntas frecuentes (días de cursada, programa, cronograma, condiciones, inscripciones, exámenes, SIU, derivación) a variantes. Reutilizar respuesta existentes (evita duplicar contenido).

14. Seguridad
Riesgo	Evaluación actual	Mitigación propuesta
Acceso KB	Solo lectura vía servicios, sin exposición directa	Mantener (rutas controladas, sin endpoint público de listado KB).
Credenciales Sheets	No existen	Si se usa import, Service Account con scopes mínimos (drive.readonly, sheets.readonly). Nunca en frontend.
Prompt injection (LLM)	N/A (sin LLM propuesto)	Si C: system prompt hermético, retrieval-only, denylist, validación grounding, temperature 0, sin tools. Recomendado evitar C en MVP.
Manipulación parámetros	Validación estricta por opciones	Añadir validación whitelist (valores catálogo), JSON schema por request.
Consultas maliciosas	Rate limit + validación	Limitar longitud mensaje (p.ej. 500–800 chars), trim, normalizar, rechazar payloads anómalos.
Información no autorizada	Principio RF07 + seed controlado	Solo ítems activo=true, dominio permitido, source obligatorio.
Fuga PII	Diseño anónimo (RNF05)	No loggear mensaje completo, anonimo en conversación, TTL, sin campos nombre/mail. Revisar logs.
Conclusión seguridad: arquitectura actual sólida. Extensión NL no degrada si se mantiene whitelist + umbrales + rechazo explícito.

15. Testing
Plan específico para conversación controlada:

Caso	Entrada	Resultado esperado	Verificación
Exacta	"¿Cuál es el programa de Técnicas de Programación?"	tipo=respuesta, documentos Programa TP, matchType=exacto, confidence>=0.95	Traza source correcto
Equivalente	"programa de técnicas" / "quiero ver el programa de tp"	Mismo resultado, matchType exacto/similar alto	Aislamiento materia OK
Error ortográfico	"prgrama tecnicas programacion"	Respuesta válida si >=umbral_alto, o aclaración si medio	Normalización funciona
Sinónimos	"cronograma de lógica"	Cronograma LC	Variantes cubren
Incompleta	"¿cuál es el horario?" (sin materia)	tipo=aclaracion (parametros_faltantes), sugiere materias	No inventa
Ambigua	"condiciones" (genérico)	Aclaración con materias (máx. 3)	Nunca elige arbitrario
Fuera de dominio	"¿qué tiempo hace hoy?" / "dame chistes"	tipo=no_disponible, mensaje explícito, sin inventar	Fuera dominio
Sin información	"¿hay pasantías?" (si no existe)	no_disponible	No completa externo
Encadenadas	"programa de ABD" → "¿y condiciones?"	Usa contexto (materia ABD), responde condiciones ABD	Memoria efímera OK
Parámetros inválidos	"programa de XYZ"	Aclaración/sugerencias válidas	Whitelist
Faltantes	"días de cursada"	Aclaración (materia o lista)	Parámetros requeridos
Texto libre rechazado (compat)	{"texto":"hola"} (flujo antiguo)	Sigue rechazando (VALIDATION_ERROR)	Retrocompatibilidad
Opción sigue funcionando	{"opcion":"TP_OP_PROG"}	Igual comportamiento (regresión)	0 regresiones
Aislamiento documentos	Pregunta TP no trae PDF ABD	Correcto	RF estricto
Sin URL inventada	Doc sin sync	Tarjeta sin enlace + aviso	RF07 mantenido
Reiniciar	Reiniciar conversación	Limpia context + conversationId	Sin contaminación
16. Criterios de aceptación
Criterio	Verificable	Estado objetivo
Usuario escribe consulta NL	Input texto presente, envía mensaje	Cumple
Reconoce preguntas equivalentes/variantes	Tests equivalencia OK	Cumple
Respuestas exclusivamente desde KB autorizado	source presente, sin tokens externos en respuesta controlada	Cumple
No inventa información	Casos < umbral → no_disponible (no respuesta inventada)	Cumple
Consultas fuera dominio → rechazadas correctamente	no_disponible explícito	Cumple
Ambiguas → solicitan aclaración	tipo=aclaracion, opciones controladas (<=3)	Cumple
Parámetros obligatorios validados	Faltantes → aclaración, inválidos → sugerencias válidas	Cumple
Trazabilidad de respuestas	source, intent, confidence, matchType en respuesta (interno)	Cumple
KB actualizable sin modificar código	Tablas KB + import Sheets (batch)	Cumple (DB)
Retrocompatibilidad flujo opciones	Tests regresión menú 100% OK	Cumple
Privacidad (sin PII, memoria efímera)	Sin logs mensaje completo, TTL, anónimo	Cumple
RF07 mantenido (sin URLs inventadas)	Documentos sin sync → aviso	Cumple
Seguridad (CORS/CSP, rate limit)	Headers + límites OK	Cumple
17. Riesgos
Riesgo	Probabilidad	Impacto	Mitigación
Complejidad vs tiempo académico	Media	Medio	A+B (sin LLM). MVP incremental Fases 1–8.
Calibración umbrales	Media	Bajo	Ajustables (env/config), dataset de pruebas, iteración controlada. DECISIÓN PENDIENTE valores.
Cobertura variantes KB	Media	Bajo	Curación iterativa (Sheets→import). Métricas consultas sin match (no_disponible) para mejorar.
Regresión flujo menú	Baja	Alto	Mantener rama opcion intacta + tests regresión completos (56 casos validados).
Dependencia externa (Sheets runtime)	Alta (si directo)	Medio-Alto	Evitar lectura directa por request. Usar import batch únicamente.
Embeddings locales (tamaño)	Baja/Media	Bajo	Postgres pg_trgm suficiente MVP. Embeddings ONNX ligeros opcionales después.
Memoria contamina conversación	Baja	Medio	conversationId nuevo en Reiniciar, TTL, límite turnos, contexto acotado.
Falsos positivos similitud	Media	Medio	Umbral alto (>=0.90) para responder, rango medio → aclaración (conservador).
Defensa académica (LLM)	Media	Medio	Priorizar A+B. Si C, documentar grounding exhaustivo + límites.
18. Decisiones pendientes
Ítem	Decisión pendiente	Justificación
1. Umbrales confianza	Valores exactos (alto/medio/bajo)	Calibrar con casos reales (dataset de preguntas). Propuesta 0.90/0.70 inicial.
2. ¿LLM permitido?	¿RAG estricto autorizado o prohibido?	Impacta complejidad/defensa. Recomendado no para MVP.
3. Memoria conversacional	¿Obligatoria u opcional?	Preguntas encadenadas vs simplicidad. Propuesta: opcional (MVP sin, añadir si UX requiere).
4. KB origen runtime	¿Sheets directo vs BD + import?	Recomendado BD + import batch. Confirmar si edición no técnica exige lectura directa (no recomendable).
5. Embeddings vs trigram	¿Incluir embeddings locales desde inicio?	Trigram (Postgres) suficiente A+B. Embeddings post-MVP.
6. TTL conversación	30/60/120 min o por inactividad	Balance privacidad vs UX. Sugerido 60 min + inactividad 15 min.
7. Mensajes rechazo	Texto exacto usuario-visible	Debe ser claro, institucional, sin técnico. Propuesto estándar dominio acotado.
19. Recomendación final
19.1 ¿Qué conservaríamos?
Arquitectura monorepo Vercel (frontend+API) y widget embebible.
Modelo de respuesta controlada (tipo nodo/respuesta/derivación) + documentos sin URL inventada (RF07).
Esquema + seed + Neon dual mode. Excelente base.
Seguridad (CORS allowlist, CSP frame-ancestors, rate limit, solo lectura Drive).
Métricas anónimas, sin PII (RNF05).
Componentes UI (burbuja, DocumentCard, ContactCard, reiniciar) — reutilizables 100%.
19.2 ¿Qué cambiaríamos?
Extender POST /api/chat para aceptar message (NL) manteniendo opcion (retrocompatible).
Añadir capa NL (A+B) con umbrales + aclaración/rechazo. Sin generación libre.
Añadir tablas kb_* (aditivas). Reutilizar respuesta/documento.
19.3 ¿Qué eliminaríamos?
Nada. Estrategia evolutiva.

19.4 ¿Qué agregaríamos?
Servicio nlInterpreter + kb.service.
Input de texto en ChatWidget + enviarMensaje.
Índice pg_trgm, normalización, umbrales configurables.
(Opcional) memoria efímera con TTL.
19.5 Arquitectura propuesta
Híbrida A+B (matching directo + similitud controlada + reglas + aclaración). Sin LLM de propósito general. Máximo control, demostrable académicamente.

19.6 Google Sheets
Como herramienta de edición/import batch. NO como origen runtime. BD = verdad única.

19.7 Base de datos
PostgreSQL (mantener Neon). Extender con kb_intencion/pregunta/variante/regla + opcional kb_conversacion/turno (efímeros).

19.8 ¿Necesitamos LLM?
No, para MVP. A+B cumple todos los criterios. Si se evalúa, únicamente RAG estrictamente restringido + grounding obligatorio (riesgo/complexidad superiores).

19.9 ¿Embeddings/búsqueda semántica?
Opcional. Postgres pg_trgm cubre MVP. Añadir embeddings locales (ONNX) post-MVP si cobertura insuficiente.

19.10 ¿Memoria conversacional?
Recomendada (efímera, anónima, TTL). MVP puede iniciar sin ella, incorporarla en Fase 5.

19.11 ¿Garantizar que no invente respuestas?
Fuente única (KB autorizado → respuesta_id)
Retrieval-only (solo candidatos KB)
Umbral + aclaración/rechazo (nunca adivinar)
Sin generación libre
Trazabilidad source/confidence/matchType
Principio RF07 mantenido
19.12 ¿Manejo consultas desconocidas?
< umbral_bajo o sin match → tipo=no_disponible (mensaje explícito, sin inventar)
Ambiguas (rango medio) → tipo=aclaracion (máx. 3 sugerencias controladas)
Parámetros faltantes → aclaracion (parametros_faltantes)
Fuera dominio → no_disponible
19.13 MVP
A (exacto + variantes + trigram básico) + validación parámetros + aclaración + no_disponible. Sin embeddings, sin memoria obligatoria. Reutiliza 90% código existente. Demostrable, seguro, defendible.

19.14 ¿Qué agregar posteriormente?
Memoria efímera, embeddings locales, import/export Sheets completo, métricas NL ampliadas, dataset calibración umbrales.

20. Roadmap de implementación (por etapas)
Fase	Objetivo	Alcance	Entregable	Estado
Fase 1	Auditoría y definición	Validar decisiones pendientes (sección 18) con equipo/docente. Aprobar arquitectura.	Este informe (aprobado)	Completa
Fase 2	Modelo KB + DDL aditivo	Crear tablas kb_*, índices pg_trgm, poblar KB inicial (mapear ramas/materias/preguntas frecuentes a variantes). Reutilizar respuesta.	DDL + seed KB (aditivo), validado con 003_verificacion.	Diseño listo (sin ejecutar)
Fase 3	Motor NL (A + trigram)	nlInterpreter.ts (normalización, exacto + similitud trigram), umbrales, tipos aclaracion/no_disponible. Tests unitarios casos sección 15.	Servicio + tests	Diseño
Fase 4	API conversacional	Extender /api/chat (retrocompatible). chat.service bifurca por message/opcion. Integrar KB + conservar lógica existente.	Endpoints + validaciones	Diseño
Fase 5	Memoria efímera (opcional)	conversationId + contexto TTL + límite turnos. Solo si aprobado Fase 1.	Contexto ligero	Opcional
Fase 6	Frontend conversacional	Input texto + historial + render aclaración/no_disponible. Mantener flujo botones (nodo). useChat.enviarMensaje.	UI actualizada (mínimo cambio)	Diseño
Fase 7	Validaciones + seguridad	Rate limit, longitudes, whitelist, logs anónimos, pruebas regresión menú (56 casos).	Suite tests	Diseño
Fase 8	Testing integral + documentación	Ejecutar matriz sección 15, calibrar umbrales (dataset), ajustar variantes KB, documentar decisiones.	Informe validación + KB curado	Diseño
Nota: ninguna fase implica modificar código irreversible antes de aprobación (principio auditoría). Todas aditivas y con regresión garantizada.

21. Conclusión
El proyecto actual está muy bien estructurado y su modelo de respuestas controladas + sin inventar URLs es un excelente punto de partida. La transición a conversación controlada no requiere reescritura, sino extensión evolutiva.

Recomendación técnica definitiva: adoptar arquitectura híbrida A+B (matching directo + similitud con umbrales + aclaración obligatoria ante incertidumbre), mantener KB en PostgreSQL con Google Sheets solo como import batch (edición no técnica), no incorporar LLM de propósito general en MVP, y añadir memoria efímera opcional.

Este enfoque cumple estrictamente el principio: "El sistema debe responder únicamente dentro del conocimiento y las reglas autorizadas para el proyecto", garantiza trazabilidad, es demostrable académicamente, fácil de testear y minimiza riesgos manteniendo la totalidad del trabajo ya realizado.

Hechos observados vs. Propuestas: todo lo anterior separa hechos (secciones 2–3) de propuestas (4–20). Las decisiones marcadas como DECISIÓN PENDIENTE (sección 18) deben resolverse antes de pasar a implementación, conforme a lo solicitado.