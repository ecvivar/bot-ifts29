# AUDITORÍA INTEGRAL DEL PROYECTO — ADAPTACIÓN A NUEVOS REQUERIMIENTOS

## CONTEXTO

Este proyecto corresponde al Proyecto Integrador de una Tecnicatura.

La primera versión del proyecto fue diseñada bajo un esquema de interacción principalmente estructurado, mediante opciones preestablecidas, botones, menús y/o flujos previamente definidos.

Los requerimientos fueron modificados.

El nuevo requerimiento establece que la interacción con el usuario debe ser **conversacional**, pero NO se busca construir un chatbot completamente libre ni un sistema de IA generativa que pueda responder cualquier cosa.

La conversación debe estar **acotada a un dominio, una base de conocimiento y un conjunto explícito de parámetros y restricciones**.

La idea conceptual que estamos evaluando es:

* El usuario escribe una pregunta o consulta en lenguaje natural.
* El sistema interpreta la consulta.
* Busca una coincidencia o una respuesta apropiada dentro de una base de conocimiento controlada.
* La base de conocimiento podría inicialmente estar implementada mediante una Google Sheet, aunque debemos evaluar si esta decisión es conveniente.
* Si existe una pregunta/respuesta equivalente o suficientemente similar, el sistema devuelve la respuesta correspondiente.
* Si no existe información suficiente o la consulta está fuera del dominio definido, el sistema debe responder explícitamente que no dispone de esa información.
* El sistema NO debe inventar respuestas.
* El sistema NO debe completar información utilizando conocimiento externo no autorizado.
* El sistema NO debe transformarse en un chatbot de propósito general.
* Las respuestas deben estar condicionadas por reglas, parámetros y restricciones definidos por el proyecto.

Necesitamos adaptar el proyecto existente a este nuevo requerimiento sin descartar innecesariamente el trabajo ya realizado.

---

# OBJETIVO DE ESTA TAREA

Realizar una **AUDITORÍA COMPLETA DEL PROYECTO ACTUAL** para determinar:

1. Qué tenemos actualmente.
2. Qué partes cumplen todavía con los nuevos requerimientos.
3. Qué partes deben modificarse.
4. Qué partes podrían reutilizarse.
5. Qué partes deberían eliminarse o reemplazarse.
6. Qué arquitectura sería conveniente para incorporar la interacción conversacional controlada.
7. Qué cambios serían necesarios en frontend, backend, base de datos, lógica de negocio y estructura general.
8. Qué riesgos técnicos o conceptuales existen.
9. Qué estrategia de implementación conviene seguir.
10. Qué debería quedar documentado para justificar las decisiones ante el equipo docente.

IMPORTANTE:

**ESTA ETAPA ES EXCLUSIVAMENTE DE AUDITORÍA Y DISEÑO.**

NO modificar código.

NO crear archivos nuevos salvo que sea estrictamente necesario para documentar el resultado de la auditoría.

NO ejecutar refactors.

NO instalar dependencias.

NO cambiar la base de datos.

NO eliminar componentes.

NO realizar cambios irreversibles.

Primero necesitamos comprender el estado real del proyecto y definir la estrategia.

---

# 1. INSPECCIÓN COMPLETA DEL PROYECTO

Analizá el repositorio completo.

Antes de sacar conclusiones, inspeccioná:

* README
* package.json
* estructura de carpetas
* frontend
* backend
* componentes
* páginas
* rutas
* servicios
* controladores
* modelos
* esquemas
* base de datos
* APIs
* configuración
* variables de entorno
* lógica de interacción
* manejo de estados
* documentación existente
* archivos de configuración
* tests, si existen
* datos de prueba
* cualquier integración externa existente

No asumas cómo funciona algo por el nombre del archivo.

Verificá el flujo real leyendo el código.

---

# 2. RECONSTRUIR EL FUNCIONAMIENTO ACTUAL

Documentá cómo funciona actualmente el sistema de punta a punta.

Explicá:

### Frontend

* Cómo ingresa el usuario.
* Qué pantalla utiliza.
* Qué opciones tiene.
* Cómo se generan las interacciones.
* Qué componentes intervienen.
* Cómo se mantiene el estado.
* Cómo se realizan las llamadas al backend.
* Cómo se muestran las respuestas.

### Backend

* Qué endpoints existen.
* Qué recibe cada endpoint.
* Qué procesa.
* Qué devuelve.
* Qué reglas de negocio existen.
* Qué información consulta.
* Qué información persiste.

### Datos

Identificá:

* base de datos
* tablas/colecciones
* relaciones
* datos estáticos
* archivos
* APIs externas
* fuentes de conocimiento existentes

Representá el flujo actual:

Usuario
→ Frontend
→ API
→ lógica de negocio
→ fuente de datos
→ respuesta
→ Frontend
→ Usuario

---

# 3. IDENTIFICAR EL MODELO ACTUAL DE INTERACCIÓN

Determiná exactamente cómo funciona actualmente la interacción.

Clasificá cada interacción como:

* botón/opción preestablecida
* menú
* formulario
* selección
* búsqueda
* texto libre
* conversación
* flujo condicional
* otro

Indicá qué porcentaje aproximado del comportamiento actual depende de opciones preestablecidas y qué parte ya utiliza lenguaje natural, si existe.

También identificá si actualmente existe alguna lógica que pueda reutilizarse para interpretar consultas.

---

# 4. COMPARACIÓN CON EL NUEVO REQUERIMIENTO

Construí una matriz de cumplimiento.

Usá una tabla similar a:

| Requerimiento                    | Situación actual | Cumple        | Cambio necesario | Prioridad       |
| -------------------------------- | ---------------- | ------------- | ---------------- | --------------- |
| Interacción conversacional       | ...              | Sí/Parcial/No | ...              | Alta/Media/Baja |
| Lenguaje natural                 | ...              | ...           | ...              | ...             |
| Base de conocimiento             | ...              | ...           | ...              | ...             |
| Respuestas controladas           | ...              | ...           | ...              | ...             |
| No inventar información          | ...              | ...           | ...              | ...             |
| Manejo de consultas desconocidas | ...              | ...           | ...              | ...             |
| Restricción al dominio           | ...              | ...           | ...              | ...             |
| Parámetros                       | ...              | ...           | ...              | ...             |
| Trazabilidad de respuestas       | ...              | ...           | ...              | ...             |
| Persistencia de conversación     | ...              | ...           | ...              | ...             |

No inventes requerimientos que no estén respaldados por el contexto del proyecto.

Si detectás requisitos implícitos que sería conveniente definir, marcarlos como:

**"Requisito a confirmar"**

---

# 5. DEFINIR QUÉ SIGNIFICA "CONVERSACIONAL" EN ESTE PROYECTO

Este punto es especialmente importante.

No asumir que "conversacional" significa necesariamente:

* ChatGPT
* LLM
* IA generativa
* respuestas abiertas
* generación libre de texto

Analizá diferentes alternativas para implementar una conversación controlada.

Como mínimo evaluá conceptualmente:

### Alternativa A — Matching directo

Pregunta del usuario
→ normalización
→ comparación con preguntas conocidas
→ respuesta almacenada

### Alternativa B — Matching semántico

Pregunta del usuario
→ procesamiento de lenguaje
→ búsqueda de preguntas/respuestas similares
→ cálculo de similitud
→ umbral mínimo
→ respuesta si supera el umbral

### Alternativa C — LLM restringido

Pregunta del usuario
→ modelo de lenguaje
→ recuperación exclusivamente desde una base de conocimiento autorizada
→ generación de respuesta basada únicamente en los resultados recuperados
→ rechazo si no existe información suficiente

### Alternativa D — Arquitectura híbrida

Combinar:

* reglas
* clasificación de intención
* parámetros
* búsqueda en base de conocimiento
* similitud semántica
* eventualmente LLM

Evaluá cada alternativa según:

* complejidad
* costo
* facilidad de implementación
* control
* riesgo de alucinaciones
* facilidad de demostrar el funcionamiento
* facilidad de testear
* adecuación académica
* mantenimiento
* escalabilidad

NO elegir todavía una alternativa únicamente porque sea técnicamente más avanzada.

La solución debe ser defendible desde el punto de vista académico y coherente con los requerimientos.

---

# 6. ANALIZAR LA IDEA DE GOOGLE SHEETS

Evaluá específicamente la posibilidad de utilizar una Google Sheet como base de conocimiento.

La idea inicial es tener algo conceptualmente similar a:

| ID | Pregunta | Variantes | Respuesta | Categoría | Parámetros | Activo |
| -- | -------- | --------- | --------- | --------- | ---------- | ------ |
| 1  | ...      | ...       | ...       | ...       | ...        | Sí     |
| 2  | ...      | ...       | ...       | ...       | ...        | Sí     |

Analizá:

### Ventajas

* facilidad de edición
* facilidad de carga por personas no técnicas
* rapidez para modificar conocimiento
* separación entre código y contenido
* facilidad para demostrar el funcionamiento

### Desventajas

* seguridad
* autenticación
* disponibilidad
* latencia
* consistencia
* control de versiones
* dependencia externa
* límites de API
* concurrencia
* validación de datos

Determiná si conviene:

1. utilizar Google Sheets directamente como fuente;
2. utilizar Google Sheets como fuente de carga y sincronizar hacia una base propia;
3. utilizar inicialmente Google Sheets para el prototipo y posteriormente migrar;
4. utilizar directamente una tabla de base de datos.

No decidas solamente por conveniencia técnica: considerá también la presentación académica del proyecto.

---

# 7. DISEÑAR EL CONCEPTO DE BASE DE CONOCIMIENTO

Proponé qué información debería contener cada conocimiento.

Por ejemplo:

* pregunta principal
* preguntas alternativas
* respuesta
* categoría
* intención
* palabras clave
* parámetros requeridos
* parámetros opcionales
* restricciones
* prioridad
* nivel de confianza
* estado activo/inactivo

Pero NO agregues campos innecesarios.

Justificá cada campo propuesto.

Evaluá también si conviene separar:

### Intenciones

de

### Preguntas/ejemplos

de

### Respuestas

de

### Reglas

de

### Parámetros

---

# 8. PARAMETROS Y RESTRICCIONES

Este es uno de los puntos centrales del nuevo requerimiento.

Identificá qué significa que la conversación esté "atada a parámetros y restricciones".

Proponé un modelo conceptual donde una consulta pueda requerir determinados datos.

Ejemplo conceptual:

Usuario:
"¿Cuál es el horario de atención?"

Sistema:
→ identifica intención "horarios"
→ verifica parámetros
→ consulta conocimiento
→ devuelve respuesta autorizada.

Otro ejemplo:

Usuario:
"¿Puedo realizar X?"

Sistema:
→ identifica intención
→ verifica si X pertenece al dominio permitido
→ busca información
→ responde únicamente con información disponible.

Analizá también qué debería suceder cuando:

* falta un parámetro
* el parámetro es inválido
* hay múltiples interpretaciones
* la consulta es ambigua
* la pregunta está fuera del dominio
* no existe información
* existe información parcialmente relacionada
* existen varias respuestas posibles

Proponer reglas claras para cada caso.

---

# 9. UMBRAL DE CONFIANZA

Analizá cómo debería determinarse si una pregunta es suficientemente similar a algo conocido.

Ejemplo conceptual:

similaridad >= 0.85
→ responder

similaridad entre 0.60 y 0.84
→ pedir aclaración

similaridad < 0.60
→ informar que no se dispone de esa información

NO establecer valores arbitrarios como definitivos.

Proponé cómo podrían determinarse y calibrarse esos umbrales mediante pruebas.

---

# 10. MANEJO DE CONSULTAS DESCONOCIDAS

Diseñá el comportamiento cuando el sistema no encuentra una respuesta.

Debe quedar explícitamente definido que:

**El sistema NO debe inventar una respuesta.**

Analizá diferentes casos:

### Caso A

No existe ninguna coincidencia.

### Caso B

Existe una coincidencia débil.

### Caso C

Existen varias coincidencias similares.

### Caso D

La consulta está fuera del dominio.

### Caso E

Faltan parámetros.

### Caso F

La información existe pero está desactualizada o inactiva.

Proponé el comportamiento esperado para cada caso.

---

# 11. MEMORIA CONVERSACIONAL

Analizá si realmente necesitamos memoria conversacional.

Ejemplo:

Usuario:
"¿Cuál es el horario de atención?"

Sistema:
"El horario es de 8 a 14."

Usuario:
"¿Y los sábados?"

La segunda consulta depende del contexto anterior.

Evaluá:

* si necesitamos almacenar contexto;
* qué datos deberían persistirse;
* durante cuánto tiempo;
* qué información debería formar parte del contexto;
* cómo evitar que una conversación anterior contamine una nueva;
* si la memoria es necesaria para el alcance académico.

No agregar memoria simplemente porque "es un chatbot".

Justificar técnicamente si es necesaria o no.

---

# 12. ARQUITECTURA PROPUESTA

A partir de la auditoría, diseñá una arquitectura objetivo.

Como mínimo representar:

Usuario
↓
Interfaz conversacional
↓
Normalización de consulta
↓
Identificación de intención / búsqueda
↓
Validación de parámetros
↓
Consulta a base de conocimiento
↓
Evaluación de confianza
↓
Reglas de respuesta
↓
Respuesta controlada
↓
Usuario

Si se propone utilizar un LLM, indicar exactamente:

* dónde interviene;
* qué información recibe;
* qué información NO recibe;
* qué fuente puede utilizar;
* cómo se evita que responda fuera de la base de conocimiento;
* qué ocurre si no encuentra información.

El LLM NO debe ser considerado automáticamente como fuente de verdad.

---

# 13. CAMBIOS NECESARIOS EN EL PROYECTO ACTUAL

Clasificar los cambios en:

### Mantener

Componentes y funcionalidades que siguen siendo válidos.

### Adaptar

Componentes que pueden reutilizarse modificando su comportamiento.

### Reemplazar

Componentes cuyo diseño actual entra en conflicto con el nuevo modelo.

### Eliminar

Componentes que dejan de tener sentido.

### Incorporar

Componentes o servicios necesarios para la nueva arquitectura.

Presentar una tabla:

| Elemento | Estado actual | Acción | Motivo |
| -------- | ------------- | ------ | ------ |

---

# 14. FRONTEND

Determinar qué cambios serían necesarios para transformar la interfaz actual en una interfaz conversacional.

Analizar:

* componente Chat
* input de usuario
* historial
* mensajes del sistema
* mensajes del usuario
* estados de carga
* errores
* sugerencias
* preguntas de aclaración
* indicadores de información no disponible
* accesibilidad
* responsive

Pero evitar diseñar una interfaz innecesariamente compleja.

La UI debe demostrar claramente el concepto de conversación controlada.

---

# 15. BACKEND

Definir qué servicios/endpoints serían necesarios.

Por ejemplo, conceptualmente:

POST /api/chat

Request:

{
"message": "...",
"conversationId": "..."
}

Response:

{
"answer": "...",
"intent": "...",
"confidence": 0.92,
"source": "...",
"requiresClarification": false
}

Esto es solamente un ejemplo conceptual.

Adaptarlo a la arquitectura real del proyecto.

Analizar también:

* validación
* seguridad
* logging
* errores
* rate limiting si fuera necesario
* trazabilidad
* auditoría

---

# 16. BASE DE DATOS

Determinar si la estructura actual soporta el nuevo modelo.

Si no lo hace, proponer:

* nuevas tablas
* nuevas relaciones
* índices
* campos
* migraciones

Pero NO ejecutar modificaciones todavía.

Diferenciar claramente:

### conocimiento

de

### conversaciones

de

### mensajes

de

### parámetros

de

### configuración

si corresponde.

---

# 17. SEGURIDAD

Evaluar:

* acceso a la base de conocimiento
* credenciales de Google Sheets/API
* variables de entorno
* exposición de información
* prompt injection si se utiliza LLM
* manipulación de parámetros
* consultas maliciosas
* acceso a información no autorizada

Si se utiliza un modelo de lenguaje, analizar especialmente:

**¿Puede el usuario lograr que el modelo ignore las restricciones?**

Proponer mecanismos de defensa.

---

# 18. TESTING

Proponer una estrategia de pruebas específica para el nuevo modelo conversacional.

Debe incluir:

### Pregunta exacta

Pregunta registrada en la base.

### Pregunta equivalente

Misma intención expresada de otra forma.

### Error ortográfico

### Pregunta incompleta

### Pregunta ambigua

### Pregunta fuera de dominio

### Pregunta sin información disponible

### Intento de obtener información no autorizada

### Preguntas encadenadas

### Parámetros inválidos

### Parámetros faltantes

Definir qué resultado se espera en cada caso.

---

# 19. CRITERIOS DE ACEPTACIÓN

Proponer criterios verificables.

Ejemplo:

* El usuario puede realizar consultas en lenguaje natural.
* El sistema reconoce preguntas equivalentes.
* Las respuestas provienen exclusivamente de la base de conocimiento autorizada.
* El sistema no inventa información.
* Las consultas fuera del dominio son rechazadas correctamente.
* Las consultas ambiguas generan una solicitud de aclaración.
* Los parámetros obligatorios son validados.
* Las respuestas pueden ser trazadas hasta su fuente.
* La base de conocimiento puede actualizarse sin modificar el código, si la arquitectura elegida lo permite.

Adaptar estos criterios al proyecto real.

---

# 20. IMPACTO ACADÉMICO

Como se trata de un Proyecto Integrador de una Tecnicatura, analizar también:

* qué conocimientos técnicos demuestra el proyecto;
* qué conceptos de ingeniería de software intervienen;
* qué conceptos de bases de datos intervienen;
* qué conceptos de APIs intervienen;
* qué conceptos de IA/NLP, si corresponde;
* qué decisiones arquitectónicas pueden justificarse;
* qué aspectos serían difíciles de defender en una presentación.

La solución NO debe buscar simplemente utilizar la tecnología más sofisticada.

Debe buscar una relación razonable entre:

**complejidad + control + demostrabilidad + cumplimiento del requerimiento.**

---

# 21. RECOMENDACIÓN FINAL

Al finalizar la auditoría, presentar una recomendación concreta pero SIN modificar el proyecto.

La recomendación debe responder:

1. ¿Qué conservaríamos?
2. ¿Qué cambiaríamos?
3. ¿Qué eliminaríamos?
4. ¿Qué agregaríamos?
5. ¿Qué arquitectura proponemos?
6. ¿Usaríamos Google Sheets?
7. ¿Usaríamos una base de datos?
8. ¿Necesitamos un LLM?
9. ¿Necesitamos embeddings/búsqueda semántica?
10. ¿Necesitamos memoria conversacional?
11. ¿Cómo garantizamos que el sistema no invente respuestas?
12. ¿Cómo manejamos consultas desconocidas?
13. ¿Cuál sería el MVP?
14. ¿Qué podría agregarse posteriormente?

---

# 22. PLAN DE IMPLEMENTACIÓN POR ETAPAS

Proponer un roadmap.

Por ejemplo:

### Fase 1

Auditoría y definición funcional.

### Fase 2

Diseño de la base de conocimiento.

### Fase 3

Implementación del motor de consulta.

### Fase 4

API conversacional.

### Fase 5

Interfaz conversacional.

### Fase 6

Validaciones y restricciones.

### Fase 7

Testing.

### Fase 8

Documentación y presentación.

No asumir que estas fases son definitivas: adaptarlas a lo que surja de la auditoría.

---

# 23. RESULTADO ESPERADO

Entregá un informe estructurado con este formato:

## 1. Resumen ejecutivo

## 2. Estado actual del proyecto

## 3. Arquitectura actual

## 4. Flujo actual de interacción

## 5. Nuevos requerimientos interpretados

## 6. Matriz de cumplimiento

## 7. Brechas detectadas

## 8. Alternativas tecnológicas evaluadas

## 9. Evaluación de Google Sheets

## 10. Modelo propuesto de base de conocimiento

## 11. Modelo de conversación controlada

## 12. Parámetros y restricciones

## 13. Manejo de incertidumbre y consultas desconocidas

## 14. Memoria conversacional

## 15. Arquitectura objetivo

## 16. Cambios de frontend

## 17. Cambios de backend

## 18. Cambios de base de datos

## 19. Seguridad

## 20. Testing

## 21. Criterios de aceptación

## 22. Riesgos

## 23. Decisiones pendientes

## 24. Recomendación

## 25. Roadmap de implementación

---

# REGLAS IMPORTANTES PARA LA AUDITORÍA

1. NO modificar código.
2. NO instalar dependencias.
3. NO realizar migraciones.
4. NO asumir que una tecnología es necesaria solamente porque sea moderna.
5. NO convertir automáticamente el proyecto en un chatbot basado en LLM.
6. NO asumir que Google Sheets es necesariamente la solución definitiva.
7. NO inventar funcionalidades existentes.
8. Verificar el código antes de afirmar que algo existe.
9. Separar claramente hechos observados de propuestas.
10. Cuando una decisión dependa de un requerimiento que no está definido, marcarla como **DECISIÓN PENDIENTE**.
11. Priorizar soluciones controlables y demostrables.
12. Mantener como principio fundamental:

> El sistema debe responder únicamente dentro del conocimiento y las reglas autorizadas para el proyecto.

13. Si se propone IA generativa, explicar específicamente cómo se restringirá su comportamiento.
14. Identificar qué partes del trabajo existente pueden reutilizarse antes de proponer una reescritura.
15. No implementar ninguna de las recomendaciones hasta que el equipo haya revisado y aprobado la arquitectura propuesta.

---

# PRINCIPIO FUNCIONAL A VALIDAR

El concepto que queremos evaluar es el siguiente:

**No queremos un chatbot que "sepa de todo".**

Queremos un sistema conversacional de dominio acotado:

Usuario
→ pregunta en lenguaje natural
→ sistema interpreta
→ busca dentro del conocimiento autorizado
→ valida parámetros y restricciones
→ determina si existe información suficiente
→ responde con información autorizada

Si no existe información suficiente:

→ no inventa
→ no completa con conocimiento externo
→ informa que no dispone de esa información
→ eventualmente solicita una aclaración

La auditoría debe determinar cuál es la mejor forma de implementar este concepto sobre el proyecto existente.

**IMPORTANTE: primero comprender y documentar. Después decidir. Recién en una etapa posterior implementar.**
