# PROMPT MAESTRO — FASE 0
# CIERRE DE DECISIONES ARQUITECTÓNICAS

**Proyecto:** Asistente Virtual IFTS N.º29  
**Fase:** Fase 0 — Exclusivamente Diseño y Toma de Decisiones  
**Estado:** Sin modificaciones de código  

---

## 1. CONTEXTO

El proyecto Asistente Virtual del IFTS N.º29 cuenta actualmente con:

- Frontend React + Vite
- Backend Node.js + Express + TypeScript
- PostgreSQL/Neon con modo semilla (fallback)
- Despliegue en Vercel (frontend estático + API serverless)
- Widget integrable en Moodle
- Menú guiado mediante opciones/botones
- Respuestas institucionales almacenadas en base de datos
- Documentos y contactos asociados a respuestas
- Métricas anónimas
- CORS, CSP, rate limiting y controles de seguridad
- Seed/catálogo para funcionamiento inicial
- Compatibilidad con el flujo actual basado en opcion

La auditoría integral determinó la evolución hacia un modelo híbrido: navegación guiada + consulta en lenguaje natural con interpretación controlada, recuperación exclusiva desde una base de conocimiento autorizada, respuestas institucionales previamente definidas, rechazo explícito fuera de dominio y solicitud de aclaración ante ambigüedad.

---

## 2. OBJETIVO DE LA FASE 0

El objetivo de esta fase es **cerrar formalmente todas las decisiones arquitectónicas y funcionales** que regirán las fases posteriores. No debe modificarse código, crear tablas, endpoints, componentes, dependencias ni realizar cambios destructivos en la base de datos existente.

El resultado debe ser este documento de decisiones, aprobado y utilizado como referencia inmutable durante el desarrollo. Cualquier desviación futura deberá documentarse, justificarse y formalizarse.

---

## 3. DECISIONES ARQUITECTÓNICAS

### D01 — MODELO HÍBRIDO

Se adopta un modelo híbrido que combina dos formas de interacción simultáneas:

**A. Navegación guiada (existente):** El usuario podrá continuar utilizando botones, categorías, opciones, documentos, contactos y toda la navegación jerárquica actual. El flujo basado en opcion se mantiene intacto y con total retrocompatibilidad.

**B. Consulta mediante lenguaje natural (nueva):** El usuario podrá escribir consultas libres (p. ej.: *"¿Cuándo empiezan las clases?"*, *"¿Dónde veo el cronograma de Programación?"*, *"Necesito contactar a Bedelía"*). Esta interacción no convierte al sistema en un chatbot de propósito general. Todas las consultas deben mantenerse dentro del dominio institucional autorizado del IFTS N.º29.

**Decisión:** Aprobado. Ambas modalidades coexisten y son intercambiables.

---

### D02 — FUENTE DE VERDAD

**PostgreSQL** será la única fuente de verdad en producción. Las respuestas institucionales deben existir previamente en la Base de Conocimiento autorizada.

**Google Sheets** NO será utilizado como fuente de consulta en tiempo real durante el MVP. En caso de incorporarse en fases posteriores, únicamente se utilizará como herramienta de **edición, carga, actualización, importación o exportación** (batch). PostgreSQL continuará siendo la fuente operativa consultada por el asistente en cada request.

**Decisión:** Aprobado.

---

### D03 — NO UTILIZAR LLM EN EL MVP

El MVP **no utilizará** modelos de lenguaje generativos para construir respuestas. La interpretación se basa exclusivamente en: normalización, coincidencia exacta, variantes conocidas, similaridad controlada, reglas y contexto (cuando exista).

La respuesta final siempre deberá corresponder a una **respuesta institucional previamente autorizada y registrada** en la Base de Conocimiento.

Si en una fase futura se evalúa la incorporación de un LLM, deberá realizarse una nueva evaluación arquitectónica, de seguridad y de defensa académica. En ese caso hipotético, cualquier LLM deberá operar con **recuperación exclusivamente restringida** a la Base de Conocimiento autorizada (retrieval-only), sin acceso a conocimiento externo.

**Decisión:** Aprobado. Fuera del alcance del MVP.

---

### D04 — MOTOR DE MATCHING

El motor de interpretación utilizará **dos niveles** de búsqueda, aplicados de forma secuencial:

**Nivel A — Coincidencia exacta y variantes.** La consulta normalizada se compara contra preguntas principales, variantes, términos equivalentes, expresiones habituales y errores frecuentes conocidos.

**Nivel B — Similitud controlada.** Se empleará **PostgreSQL pg_trgm** para obtener candidatos y calcular similitud. Se definen los siguientes umbrales **iniciales** (sujetos a calibración con consultas reales):

- **>= 0,90:** Respuesta directa (confianza suficiente)
- **0,70 – 0,89:** Solicitar aclaración (consulta ambigua)
- **< 0,70:** No disponible (información insuficiente)

Estos valores no son definitivos. La calibración final deberá realizarse con un conjunto representativo de consultas de prueba antes de cerrar validaciones.

**Decisión:** Aprobado con carácter de umbrales iniciales y calibrables.

---

### D05 — RESPUESTA CONTROLADA

El principio fundamental es: **El sistema puede interpretar la consulta, pero NO puede inventar la respuesta.**

El flujo obligatorio es: Consulta → Interpretación → Intención/Candidato → Validación → Recuperación → **Respuesta autorizada** → Documentos/Contactos asociados → Respuesta al usuario.

Si no existe una respuesta autorizada con suficiente confianza, el sistema **nunca** debe inventar información. Deberá utilizar obligatoriamente una de estas dos acciones: **solicitar aclaración** o **informar que no dispone de esa información**.

**Decisión:** Aprobado. Principio rector inamovible.

---

### D06 — CONSULTAS AMBIGUAS

Ante la existencia de dos o más intenciones candidatas con similitud en el rango de aclaración, el sistema **no elegirá arbitrariamente**. Deberá solicitar una aclaración utilizando **opciones controladas** extraídas exclusivamente de la Base de Conocimiento.

Cuando sea posible, la aclaración ofrecerá **un máximo de tres (3) opciones**. Ejemplo: consulta genérica → sistema presenta opciones específicas autorizadas para que el usuario precise su consulta.

**Decisión:** Aprobado.

---

### D07 — CONSULTAS FUERA DEL DOMINIO

Las consultas que no correspondan al dominio institucional autorizado serán rechazadas explícitamente. Mensaje base aprobado:

*"No dispongo de esa información dentro del dominio autorizado del IFTS N.º29. Podés reformular la consulta o elegir una de las opciones sugeridas."*

El texto puede ajustarse en UX sin alterar la regla funcional.

**Decisión:** Aprobado.

---

### D08 — INFORMACIÓN DESCONOCIDA

La ausencia de información autorizada implica **NO INVENTAR**. Esto aplica a fechas, horarios, enlaces, nombres, trámites, docentes, teléfonos, documentos, procedimientos, datos académicos e información administrativa. Si el dato no está autorizado, registrado y disponible, el sistema debe indicar explícitamente que no dispone de esa información.

**Decisión:** Aprobado.

---

### D09 — DOCUMENTOS Y ENLACES

El asistente **jamás** construirá URLs de manera especulativa. Todos los enlaces deben provenir de registros autorizados, con sincronización válida, correspondiendo a URL canónica almacenada en la Base de Conocimiento.

**Regla obligatoria:** Si un documento existe pero no dispone de URL disponible (no sincronizado con Drive), el sistema deberá **mostrar la ficha del documento sin enlace** y con el aviso correspondiente, **sin inventar ninguna URL**. Se mantiene estrictamente el principio RF07 del proyecto.

**Decisión:** Aprobado.

---

### D10 — MEMORIA CONVERSACIONAL

La memoria conversacional **no es obligatoria** para el MVP. Inicialmente, las consultas podrán resolverse de manera independiente.

Su incorporación queda **postergada como fase opcional**. En caso de implementarse, deberá cumplir obligatoriamente con:

- Ser **anónima** (sin PII)
- Tener **TTL (Time To Live)** definido
- Tener **contexto limitado** (solo lo necesario para resolver referencias encadenadas)
- Permitir **reiniciar la conversación** en cualquier momento
- **No contaminar** otras sesiones/conversaciones
- Almacenar únicamente metadatos necesarios, **nunca** el contenido completo innecesario de todas las consultas

**Decisión:** Aprobado. Opcional, no bloqueante para el MVP.

---

### D11 — COMPATIBILIDAD HACIA ATRÁS

Se garantiza **retrocompatibilidad total** con el flujo actual. El endpoint POST /api/chat deberá continuar aceptando:

`json
{ "opcion": "..." }
`

La evolución agregará de forma opcional:

`json
{ "message": "..." }
`

Y, solo si existe memoria conversacional habilitada:

`json
{ "conversationId": "...", "context": {} }
`

No se romperá el funcionamiento actual del menú guiado ni de ninguna funcionalidad ya implementada y validada.

**Decisión:** Aprobado.

---

### D12 — API (CONTRATO CONCEPTUAL)

El contrato de API evoluciona de forma **compatible y aditiva**:

**Request (conceptual):**
`json
{
  "message": "string | opcional",
  "opcion": "string | opcional",
  "conversationId": "UUID | opcional",
  "context": "object | opcional"
}
`

**Response (conceptual):**
`json
{
  "tipo": "nodo | respuesta | derivacion | aclaracion | no_disponible",
  "origen": "seed | neon",
  "claveOpcion": "string | opcional",
  "nodo": "object | opcional",
  "respuesta": "object | opcional",
  "derivacion": "object | opcional",
  "aclaracion": "object | opcional",
  "noDisponible": "object | opcional",
  "intent": "string | opcional",
  "confidence": "number | opcional",
  "source": "string | opcional",
  "matchType": "exacto | similar | regla | ninguno | opcional"
}
`

Los metadatos (intent, confidence, source, matchType) son **internos de trazabilidad** y no es obligatorio exponerlos íntegramente al usuario final. Su finalidad es auditoría, depuración y mejora de la Base de Conocimiento.

**Decisión:** Aprobado.

---

### D13 — VALIDACIÓN DE ENTRADA

Se establecen las siguientes validaciones obligatorias para el flujo NL:

- **Longitud máxima del mensaje:** Inicialmente **500–800 caracteres** (valor definitivo a validar en pruebas).
- **Normalización obligatoria:** minúsculas, eliminación de acentos, signos de puntuación superfluos, espacios múltiples, trimming.
- **Validación de tipo/formato:** rechazar entradas inválidas o vacías.
- **Control de parámetros:** validación estricta contra valores autorizados (whitelist) cuando existan parámetros requeridos.
- **Protección de carga:** evitar mensajes excesivamente largos o con patrones anómalos.
- **Rate limiting:** mantener el límite vigente (120 req/min por IP), aplicable a ambos flujos (opción y mensaje).
- **Minimización de datos:** no almacenar el texto completo innecesariamente en logs o estructuras persistentes.

**Decisión:** Aprobado (rango inicial calibrable).

---

### D14 — SEGURIDAD

Se mantienen y refuerzan todas las medidas de seguridad existentes:

- **CORS** con allowlist estricta (nunca *)
- **Content-Security-Policy** con rame-ancestors limitado a orígenes autorizados
- **Rate limiting** por IP
- **HTTPS** obligatorio en producción
- **Validación estricta de entrada y parámetros**
- **Ausencia de endpoints públicos innecesarios**
- **No exposición de la Base de Conocimiento completa**
- **Principio de mínimo privilegio**

No se introducirán dependencias externas innecesarias para el MVP. En caso de evaluarse integraciones futuras, se requerirá análisis de riesgo específico.

**Decisión:** Aprobado.

---

### D15 — BASE DE CONOCIMIENTO

La Base de Conocimiento se construirá **aprovechando y reutilizando** la estructura actual, sin reemplazar innecesariamente entidades existentes. Se prioriza la **extensión aditiva**.

Estructura conceptual aprobada (modelo base):

`	ext
kb_intencion
      │
      ├── kb_pregunta
      │       │
      │       └── kb_pregunta_variante
      │
      └── kb_regla

kb_pregunta
      │
      ▼
respuesta (existente)
      │
      ├── respuesta_documento
      │       │
      │       ▼
      │     documento (existente)
      └── opcion_contacto
              │
              ▼
            contacto (existente)
`

Se reutilizan obligatoriamente espuesta, documento, contacto y sus relaciones existentes. La estructura definitiva de tablas KB podrá ajustarse levemente antes de generar el DDL, siempre manteniendo este principio de **reutilización máxima y no destrucción** de lo ya implementado.

**Decisión:** Aprobado (esquema conceptual base).

---

### D16 — CAMBIOS DE BASE DE DATOS

Todo cambio de base de datos para las fases de evolución NL será **exclusivamente aditivo**:

- **Aditivo:** solo CREATE TABLE/INDEX/EXTENSION IF NOT EXISTS
- **Versionable:** trazable
- **Reversible cuando sea posible**
- **Compatible 100%** con el modelo actual

**Prohibido** eliminar tablas, columnas o datos existentes durante las fases cubiertas por este documento. Toda modificación de DDL deberá incluir: DDL, seed/actualización de catálogo, estrategia de rollback y validación/pruebas. Se utilizará la extensión pg_trgm (IF NOT EXISTS) para dar soporte al Nivel B de matching.

**Decisión:** Aprobado. Regla estricta de no-destructividad.

---

### D17 — MÉTRICAS

Las métricas continúan siendo **anónimas** y sin PII, conforme al diseño original. Se podrán incorporar métricas ampliadas para el flujo NL, incluyendo (sin almacenar contenido de consulta completo):

- Consultas recibidas (NL vs opción)
- Intenciones identificadas
- Tipo de resultado (espuesta/aclaracion/no_disponible/nodo/derivacion)
- matchType (exacto/similar/regla/ninguno)
- confidence (agregado, no por consulta individual identificable)
- Consultas con resolución / sin resolución (no disponibles)
- Aclaraciones solicitadas

Nunca se almacenará innecesariamente el texto completo de las consultas del usuario para fines de métricas.

**Decisión:** Aprobado. Respeta RNF05 (sin datos personales).

---

### D18 — CRITERIOS DE ÉXITO DEL MVP

El MVP se considera válido cuando cumpla **todos** los siguientes criterios verificables:

1. Acepta texto libre (NL) manteniendo simultáneamente el menú guiado (opcion).
2. Reconoce preguntas exactas y sus variantes.
3. Tolera diferencias razonables de escritura (normalización + coincidencia controlada).
4. Utiliza matching en dos niveles (A+B) con umbrales aplicados correctamente.
5. Solicita **aclaración** ante ambigüedad (nunca elige arbitrariamente).
6. Rechaza consultas **fuera del dominio** con mensaje explícito.
7. Informa **no disponible** cuando no existe información suficiente (sin inventar).
8. **No inventa respuestas ni URLs** en ningún caso.
9. Utiliza **exclusivamente** información autorizada de la Base de Conocimiento.
10. Mantiene **retrocompatibilidad total** con el flujo opcion (sin regresiones).
11. Conserva todas las medidas de seguridad (CORS/CSP/rate limit/validación).
12. Respeta RF07: documentos sin sincronización se muestran sin enlace + aviso.
13. Supera las pruebas de regresión del flujo guiado existentes y las pruebas del flujo NL definidas.
14. Garantiza trazabilidad (source, matchType, intent, confidence) cuando aplica.
15. Cumple con anonimización y minimización de datos.

**Decisión:** Aprobado. Lista de aceptación obligatoria para cierre de MVP.

---

## 4. ELEMENTOS FUERA DEL ALCANCE DEL MVP

Quedan **explícitamente fuera del MVP** y no serán considerados en las fases iniciales:

- LLM generativo (externo o abierto para generación libre)
- Embeddings vectoriales (se utilizará pg_trgm)
- Memoria conversacional persistente (solo opcional efímera, post-MVP si se aprueba)
- Integración directa con SIU u otros sistemas externos
- Consulta o almacenamiento de datos personales del estudiante
- Gestión de trámites o acciones que modifiquen estado institucional
- Acceso automático a información privada de Moodle/Campus
- Google Sheets como fuente de consulta en tiempo real
- Generación automática de respuestas institucionales (no autorizadas previamente)
- Agentes autónomos o ejecución de acciones fuera del dominio de consulta
- Navegación web para responder consultas

**Decisión:** Aprobado. Alcance acotado y defendible académicamente.

---

## 5. PRINCIPIO ARQUITECTÓNICO FUNDAMENTAL

> **EL SISTEMA PUEDE INTERPRETAR LA CONSULTA, PERO NO PUEDE INVENTAR LA RESPUESTA.**

La inteligencia del sistema se concentra en: comprender variantes, identificar intención, localizar información autorizada, detectar ambigüedad, detectar ausencia de información y orientar al estudiante. **No** consiste en generar contenido institucional no validado ni autorizado.

Este principio es **inamovible** y prevalece sobre cualquier otra consideración de conveniencia técnica.

**Decisión:** Aprobado.

---

## 6. REGLA DE GESTIÓN DE DESVIACIONES

Ninguna fase posterior podrá modificar las decisiones aquí establecidas de forma silenciosa. Si durante la implementación surge un conflicto con alguna decisión de esta Fase 0, se deberá obligatoriamente:

1. **Documentar** el conflicto de forma explícita
2. **Explicar** el motivo técnico o funcional que lo justifica
3. **Evaluar** el impacto (arquitectónico, seguridad, retrocompatibilidad)
4. **Proponer** la modificación con justificación
5. **Actualizar formalmente** esta decisión (versiónada)
6. **Aprobar** el cambio antes de implementar
7. **Recién entonces** proceder a la implementación

La presente Fase 0 constituye el **baseline arquitectónico** del proyecto y solo podrá modificarse siguiendo este procedimiento formal.

**Decisión:** Aprobado.

---

## 7. RESULTADO ESPERADO DE LA FASE 0

Este documento cumple con todos los puntos requeridos para cerrar la Fase 0: decisiones arquitectónicas, alcance del MVP, fuera de alcance, modelo de interacción, política de respuestas/rechazo/documentos/enlaces/memoria/seguridad, estrategia de Base de Conocimiento y matching, compatibilidad, criterios de aceptación, riesgos y elementos pendientes de calibración (umbrales y rangos de validación).

**Estado de la Fase 0:** **CERRADA — Lista para aprobación y transición a Fase 1.**

**Fecha de cierre propuesta:** 02/10/2026  
**Estado:** Sin modificaciones de código aplicadas. Únicamente documento de decisiones.
