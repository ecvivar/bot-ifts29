# PROMPT MAESTRO DE IMPLEMENTACIÓN
# Evolución del Asistente Virtual IFTS N.º29
## Modelo híbrido: menú guiado + lenguaje natural controlado

**Versión:** 1.0  
**Fecha:** 02/10/2026  
**Estado:** Solo instrucciones (sin modificar código aún)  
**Alcance:** MVP incremental y conservador sobre el código existente

---

## 0. INSTRUCCIÓN PRINCIPAL

Estamos evolucionando un proyecto existente. NO construir un proyecto nuevo. NO reemplazar la arquitectura actual. NO eliminar funcionalidades existentes. NO realizar una refactorización general del proyecto.

La implementación debe realizarse de forma incremental y conservadora sobre el código actual.

El objetivo inmediato es incorporar una nueva modalidad de interacción:

> MENÚ GUIADO + CONSULTA EN LENGUAJE NATURAL

manteniendo completamente operativo el comportamiento actual basado en opciones/botones.

La prioridad es disponer cuanto antes de un MVP funcional, pero sin sacrificar:

- trazabilidad;
- seguridad;
- compatibilidad;
- control de las respuestas;
- posibilidad de corregir y ampliar posteriormente.

---

## 1. CONTEXTO DEL PROYECTO

Proyecto: Asistente Virtual Institucional para estudiantes del IFTS N.º29.

Stack actual confirmado: Frontend React + Vite, Backend Node.js + Express + TypeScript, PostgreSQL/Neon, Deploy Vercel, Widget Moodle, Menú guiado, Respuestas institucionales, Documentos, Contactos, Contextos, Métricas anónimas, Seed/catálogo, CORS, CSP, Rate limiting.

El endpoint conversacional trabaja con `{"opcion":"..."}` y debe evolucionar para aceptar también `{"message":"..."}` manteniendo compatibilidad total.

---

## 2. OBJETIVO DEL MVP

Permitir que el usuario elija una opción o escriba una consulta, con interpretación controlada (coincidencia exacta, variantes, similaridad, aclaración o no disponible) y respuesta autorizada. Sistema de dominio restringido, no chatbot generalista.

---

## 3. REGLA FUNDAMENTAL

> EL SISTEMA PUEDE INTERPRETAR LA CONSULTA, PERO NO PUEDE INVENTAR LA RESPUESTA.

Queda prohibido inventar fechas, horarios, docentes, contactos, documentos, URLs, usar conocimiento externo, navegar Internet o utilizar LLM para generar respuestas en este MVP. Toda respuesta debe derivar de información autorizada existente en la Base de Conocimiento.

---

## 4. ESTRATEGIA DE IMPLEMENTACIÓN

Niveles: **A)** Coincidencia exacta y variantes. **B)** Similaridad controlada mediante PostgreSQL `pg_trgm`. **C)** Reglas/contexto. **D)** Aclaración. **E)** No disponible.

No implementar embeddings, LLM, memoria conversacional obligatoria ni Google Sheets como fuente runtime.

---

## 5. REGLA DE ORO PARA EL DESARROLLO

Antes de modificar cualquier archivo: inspeccionar repositorio, identificar implementación existente, rutas, esquema, seeds, servicios, tests, configuración y deploy. No asumir estructuras inexistentes, no duplicar, no reemplazar innecesariamente, no modificar código no relacionado.

---

## 6. PRIMER PASO OBLIGATORIO: AUDITORÍA LOCAL

Inspeccionar al menos: `api/index.ts`, `backend/src/index.ts`, `backend/src/app.ts`, `backend/src/routes/`, `backend/src/services/`, `backend/src/middleware/`, `frontend/src/`, `frontend/public/`, `package.json`, `vercel.json`, `tsconfig.json`. Identificar `chat.routes.ts`, `chat.service.ts`, `menu.routes.ts`, `system.routes.ts`, `metricas.service.ts`, `drive.service.ts`, `api/client.ts`, `useChat.ts`, `ChatWidget.tsx`, `types.ts`, `DocumentCard.tsx`, `ContactCard.tsx`, `widget.js` si existen.

---

## 7. NO MODIFICAR TODAVÍA

Conservar íntegramente: menú, opciones, navegación, respuestas existentes, documentos, contactos, métricas, widget, endpoints existentes, seed existente y catálogo existente. La funcionalidad actual debe seguir operativa.

---

## 8. DISEÑO DEL NUEVO REQUEST

Compatibilidad hacia atrás: aceptar `opcion` (existente) o `message` (NL). Lógica: si existe `opcion` → flujo existente. Si existe `message` → flujo conversacional NL. Si no existe ninguno → `VALIDATION_ERROR`. No romper clientes existentes.

---

## 9. NORMALIZACIÓN DEL TEXTO

Función reutilizable y aislada: lowercase, eliminación de acentos, normalización de espacios, eliminación de puntuación innecesaria, trim y tratamiento razonable de repeticiones. No destruir palabras ni alterar significado.

---

## 10. BASE DE CONOCIMIENTO

Revisar exhaustivamente tablas existentes (`categoria, opcion_menu, respuesta, documento, contacto, contexto, opcion_contacto, respuesta_documento, contexto_opcion, metrica_opcion`). Reutilizar lo máximo posible. Extender aditivamente con `kb_intencion`, `kb_pregunta`, `kb_pregunta_variante`, `kb_regla` únicamente si necesario. Cada `kb_pregunta` debe apuntar a una respuesta autorizada (`response_id` → `respuesta` existente).

---

## 11–14. TABLAS Y EXTENSIÓN PG_TRGM

Modelos conceptuales mínimos (solo si no cubiertos): `kb_intencion(id,key,name,domain,active,created_at,updated_at)`, `kb_pregunta(id,intent_id,question,response_id,priority,minimum_threshold,active,created_at,updated_at)`, `kb_pregunta_variante(id,question_id,original_text,normalized_text,weight,active,created_at,updated_at)`, `kb_regla` opcional. Agregar `CREATE EXTENSION IF NOT EXISTS pg_trgm` e índices sobre `normalized_text` con `gin_trgm_ops`. Migraciones 100% aditivas, sin eliminar datos.

---

## 15–23. MOTOR DE MATCHING

Servicio aislado (`nl.service.ts`/`knowledge.service.ts`/`matching.service.ts`). Flujo: validación → normalización → match exacto → variantes → pg_trgm → ranking → respuesta|aclaración|no_disponible. Umbrales iniciales (configurables, calibrables): `>= 0.90` → respuesta, `0.70–0.89` → aclaración, `< 0.70` → no disponible. Ambigüedad (múltiples candidatos en rango medio) → aclaración con **máx. 3 opciones controladas** (nunca elección arbitraria). `no_disponible` con mensaje institucional base. Metadatos internos: `intent, confidence, source, matchType` (no obligatorio exponer al usuario). Fuente (`source`): `menu/kb_question/kb_variant/rule/none`.

---

## 24–29. FRONTEND, UX, DOCUMENTOS, CONTACTOS, SHEETS, LLM, EMBEDDINGS

Frontend (`ChatWidget`, `useChat`, `api/client`, `types`): añadir input de texto + botón Enviar, conservar botones existentes, reiniciar, documentos, contactos y navegación. UX: indicar posibilidad de escribir consulta. Documentos/contactos: reutilizar sistema actual, **nunca inventar URLs ni datos**. Si documento sin URL válida → comportamiento existente ("sin enlace + aviso"). Fuera de MVP: Google Sheets runtime, LLM, embeddings, memoria conversacional persistente.

---

## 30–36. VALIDACIÓN, SEGURIDAD, TESTS

Validar `message/opcion/context/conversationId`. Longitud inicial 500–800 caracteres (calibrable). Seguridad: CORS/CSP/rate limit/HTTPS, sin loggear texto completo, sin exponer KB completa, sin PII. Tests backend: exacto, variante, acentos/redacción, error tipográfico, ambigüedad, fuera de dominio, información inexistente, vacío, demasiado largo, parámetro inválido. Regresión obligatoria: `/menu`, `/menu/:clave`, `/menu?mapa=1`, `POST /chat` (opción), `POST /chat/documento`, `/health`, `/metricas`, `/sync`, flujo botón→respuesta, widget (abrir/cerrar/resize/postMessage/reiniciar/docs/contactos).

---

## 37–55. ORDEN, PROHIBICIONES, CRITERIO DE ÉXITO

**Orden de ejecución (obligatorio):** 1. Inspección 2. Diagnóstico (archivos a modificar/nuevos/migraciones/riesgos/conservados) 3. Revisar esquema 4. KB mínima 5. Migración aditiva 6. Seed mínimo 7. Normalizador 8. Exact match 9. Variantes 10. `pg_trgm` 11. Ranking/thresholds 12. Aclaración 13. `no_disponible` 14. Integración `/api/chat` 15. Tests backend 16. Frontend 17. Build/tests 18. Regresión menú 19. Widget 20. Documentación cambios.

**Prohibido:** rehacer proyecto, cambiar frameworks/BD, LLM/embeddings/Sheets runtime, eliminar menú/endpoints/tablas/seeds existentes, generar respuestas libres, inventar datos/URLs, consultar Internet, guardar PII, memoria persistente, refactor general no relacionado.

**Criterio de éxito MVP (todos):** acepta NL + mantiene `opcion`, reconoce exacto/variantes, tolera diferencias, A+B con umbrales, aclaración ante ambigüedad, rechaza fuera dominio, no disponible sin inventar, solo KB autorizado, retrocompatibilidad total, seguridad intacta, RF07 mantenido, trazabilidad (`source/matchType/intent/confidence`), supera regresión.

**Primer objetivo práctico:** hacer funcionar ciclo punta a punta con **1 consulta válida**. No completar KB completo. Minimizar cambios, reutilizar máximo, conservar compatibilidad.

> EL SISTEMA PUEDE INTERPRETAR LA CONSULTA, PERO NO PUEDE INVENTAR LA RESPUESTA.
