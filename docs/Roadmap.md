FASE 0 — CIERRE DE DECISIONES
Objetivo

Cerrar arquitectura, alcance y reglas antes de modificar el sistema.

Incluye
modelo híbrido;
texto libre;
menú existente;
PostgreSQL como fuente de verdad;
pg_trgm;
ausencia de LLM;
ausencia de embeddings;
ausencia de memoria obligatoria;
ausencia de Google Sheets runtime;
política anti-invención;
política de documentos;
política de rechazo;
compatibilidad hacia atrás.
Entregables
F0_DECISIONES.md
F0_ALCANCE.md
F0_CRITERIOS_ACEPTACION.md
Gate

No pasar a F1 hasta que todas las decisiones estén cerradas.

FASE 1 — DISEÑO DE LA BASE DE CONOCIMIENTO

Esta será una de las fases más importantes.

No conviene empezar por el frontend. Primero necesitamos definir qué sabe realmente el asistente.

Objetivo

Convertir la información institucional actual en una estructura capaz de responder tanto al menú como al lenguaje natural.

Tareas
1. Auditar el esquema existente

Revisar:

categoria
opcion_menu
respuesta
documento
contacto
contexto
opcion_contacto
respuesta_documento
contexto_opcion
metrica_opcion
2. Definir intenciones

Ejemplo:

acceso_aula_virtual
inicio_cursada
programa_materia
cronograma_materia
dias_horarios
condiciones_cursada
contacto_administrativo
contacto_docente
3. Definir preguntas principales

Ejemplo:

¿Cómo ingreso al aula virtual?
¿Cuándo comienzan las clases?
¿Dónde está el programa?
¿Cuál es el cronograma?
4. Definir variantes

Por ejemplo:

¿Cómo entro al aula?
¿Dónde ingreso al aula?
No sé cómo entrar al aula virtual
¿Cómo accedo al aula?

Todas apuntarían a una misma intención.

5. Asociar respuestas

Cada intención deberá terminar en una respuesta autorizada.

6. Asociar documentación

Cuando corresponda:

respuesta
   ↓
documento
7. Asociar contactos

Cuando corresponda:

respuesta
   ↓
contacto
Base de datos

Agregar estructuras nuevas solamente cuando sean necesarias.

Probablemente:

kb_intencion
kb_pregunta
kb_pregunta_variante
kb_regla
Entregables
F1_MODELO_KB.md
F1_DIAGRAMA_KB.md
migration/xxx_kb.sql
seed/kb.seed.ts
Criterio de finalización

Debe poder tomarse una pregunta real y determinar:

pregunta
   ↓
intención
   ↓
respuesta autorizada
   ↓
documentos/contactos

sin generar contenido nuevo.

FASE 2 — MOTOR DE COMPRENSIÓN

Aquí empieza realmente la parte “inteligente”.

Objetivo

Transformar:

"no sé cuando tengo programación"

en algo como:

intent = dias_horarios
matchType = similar
confidence = X

y posteriormente obtener la respuesta autorizada.

Etapa 1 — Normalización

Implementar:

lowercase;
eliminación de acentos;
espacios;
puntuación;
caracteres innecesarios;
normalización básica.

Ejemplo:

"¿Cuándo empiezan las clases?"

→

cuando empiezan las clases
Etapa 2 — Exact match

Buscar coincidencia contra:

pregunta principal;
variantes.
Etapa 3 — Similaridad

Incorporar:

pg_trgm

con índices adecuados.

Etapa 4 — Ranking

Los candidatos deberán ordenarse considerando:

similitud;
prioridad;
estado activo;
dominio;
contexto;
intención.
Etapa 5 — Umbrales

Inicialmente:

>= 0.90
   respuesta

0.70–0.89
   aclaración

< 0.70
   no disponible

Pero estos valores deberán calibrarse.

Entregables
normalizer
matcher
similarity service
confidence service
unit tests
Criterio de finalización

Dado un conjunto de consultas de prueba, el motor debe:

encontrar las correctas;
detectar ambiguas;
rechazar desconocidas;
no devolver respuestas inventadas.
FASE 3 — API CONVERSACIONAL
Objetivo

Ampliar /api/chat sin romper el funcionamiento existente.

Actualmente
{
  "opcion": "..."
}
Futuro
{
  "message": "¿Cuándo empiezan las clases?"
}

o:

{
  "opcion": "programacion"
}
Pipeline
POST /api/chat
       │
       ▼
validación
       │
       ▼
¿opcion?
 ├── sí → flujo existente
 │
 └── no
       │
       ▼
normalización
       │
       ▼
matching
       │
       ▼
resultado
 ├── respuesta
 ├── aclaración
 └── no disponible
Nuevos tipos
nodo
respuesta
derivacion
aclaracion
no_disponible
No romper
GET /menu
GET /menu/:clave
GET /menu?mapa=1
POST /chat/documento
GET /health
GET /metricas
POST /sync

según corresponda al estado actual del proyecto.

Criterio de finalización

Las pruebas antiguas deben continuar pasando.

FASE 4 — FRONTEND CONVERSACIONAL

Esta fase transforma la experiencia del estudiante.

Objetivo

Mantener el menú pero agregar una entrada natural.

La interfaz podría evolucionar hacia:

┌───────────────────────────────┐
│ Asistente Virtual IFTS N.º29  │
├───────────────────────────────┤
│                               │
│ Hola, ¿en qué puedo ayudarte? │
│                               │
│ [Administración]              │
│ [Materias]                    │
│ [Aula virtual]                │
│                               │
│ ────────────────────────────  │
│ También podés escribir        │
│ directamente tu consulta.     │
│                               │
│ ┌───────────────────────────┐ │
│ │ ¿Cuándo empiezan las...? │ │
│ └───────────────────────────┘ │
│                         [➤]   │
└───────────────────────────────┘
Funcionalidades
input de texto;
envío;
respuesta;
indicador de procesamiento;
historial visual;
botones;
documentos;
contactos;
aclaraciones;
reiniciar conversación.
Importante

El frontend no debe implementar lógica institucional.

La inteligencia debe permanecer en backend.

FASE 5 — SEGURIDAD Y REGRESIÓN

Esta fase debería ser obligatoria antes de mostrar el sistema como terminado.

Seguridad

Verificar:

CORS;
CSP;
rate limiting;
longitud;
validación;
parámetros;
XSS;
URLs;
errores;
exposición de endpoints;
logs;
datos personales.
Casos de ataque

Probar entradas como:

<script>...</script>

consultas enormes, parámetros inválidos, JSON malformado, etc.

También comprobar que el usuario no pueda forzar al sistema a revelar información que no pertenece a la KB.

Regresión

Especialmente:

menú → respuesta
menú → documento
menú → contacto
derivación
reinicio
métricas
Criterio

La nueva funcionalidad no puede degradar la existente.

FASE 6 — INTEGRACIÓN MOODLE Y EXPERIENCIA DE USUARIO
Objetivo

Verificar que el asistente funcione realmente dentro del contexto Moodle.

Validar
iframe/widget;
tamaño;
responsive;
escritorio;
móvil;
apertura/cierre;
scroll;
postMessage;
origen permitido;
carga;
errores de red.
Especial atención

El asistente debe sentirse como una herramienta del aula, no como una página externa desconectada.

Pero sin resultar invasivo.

FASE 7 — PRUEBAS INTEGRALES Y CALIBRACIÓN

Esta fase es fundamental para justificar académicamente la parte de lenguaje natural.

Crear dataset

Por ejemplo:

100–300 consultas

clasificadas como:

intención correcta
intención incorrecta
ambigua
fuera de dominio
desconocida
Ejemplo
Consulta	Esperado
¿Cuándo empiezan las clases?	inicio_cursada
Cuando arrancan las clases	inicio_cursada
¿Cuándo inicia la cursada?	inicio_cursada
Necesito saber algo de programación	aclaración
¿Cuál es el clima hoy?	no_disponible
Dame mi nota	no_disponible
Medir
exact match;
similar match;
falsos positivos;
falsos negativos;
aclaraciones correctas;
rechazos correctos.
Calibrar

A partir de los resultados:

threshold alto
threshold medio

No fijarlos arbitrariamente.

FASE 8 — DOCUMENTACIÓN Y ENTREGA
Documentación técnica

Debería quedar:

README.md
ARCHITECTURE.md
DATABASE.md
API.md
KNOWLEDGE_BASE.md
SECURITY.md
TESTING.md
DEPLOYMENT.md
CHANGELOG.md
Documentación académica

Además:

Problema
Objetivos
Alcance
Usuarios
Requerimientos
Arquitectura
Diseño
Implementación
Pruebas
Resultados
Limitaciones
Trabajo futuro

Esto nos permitirá conectar directamente el desarrollo con las consignas del integrador.

3. FASES FUTURAS — NO PERTENECEN AL MVP

Hay tres extensiones que yo dejaría explícitamente como roadmap posterior.

FUTURA A — Memoria conversacional

Por ejemplo:

Usuario:
¿Cuándo tengo programación?

Asistente:
¿Qué información necesitás?

Usuario:
Los días.

Asistente:
Técnicas de Programación se dicta...

Para esto recién tendría sentido:

conversationId
context
TTL
kb_conversacion
kb_turno

Pero no lo agregaría todavía.

FUTURA B — Google Sheets

La idea sería:

Google Sheets
      │
      │ importación
      ▼
PostgreSQL
      │
      ▼
Asistente

Y no:

Usuario
   ↓
Asistente
   ↓
Google Sheets

Esto último generaría dependencia runtime, problemas de disponibilidad y mayor complejidad.

FUTURA C — Embeddings / LLM

Solamente cuando tengamos suficiente información para justificarlo.

Podría evolucionar a:

Usuario
   ↓
Normalización
   ↓
Exact Match
   ↓
pg_trgm
   ↓
Embeddings
   ↓
RAG
   ↓
Respuesta autorizada

Y eventualmente:

LLM
 │
 ├── recibe únicamente contexto autorizado
 ├── no navega libremente
 ├── no consulta fuentes externas
 ├── no inventa documentos
 └── responde bajo reglas estrictas

Pero no forma parte de nuestro MVP actual.

4. ORDEN REAL DE IMPLEMENTACIÓN

Para trabajar de manera incremental, yo usaría este orden:

              ┌──────────────┐
              │   FASE 0     │
              │ DECISIONES   │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   FASE 1     │
              │     KB       │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   FASE 2     │
              │   MATCHING   │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   FASE 3     │
              │     API      │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   FASE 4     │
              │   FRONTEND   │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   FASE 5     │
              │  SEGURIDAD   │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   FASE 6     │
              │    MOODLE    │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   FASE 7     │
              │   PRUEBAS    │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   FASE 8     │
              │   ENTREGA    │
              └──────────────┘
Regla de oro

No avanzar si la fase anterior no tiene su criterio de aceptación cumplido.

Eso nos evita terminar con algo que “funciona” pero después sea difícil de explicar, probar o defender.