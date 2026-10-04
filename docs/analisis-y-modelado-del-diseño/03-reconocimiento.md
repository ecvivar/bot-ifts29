# 3. Fase de Reconocimiento

## 1. Definición del Problema o Necesidad

### Contexto Actual

La institución IFTS N.°29 enfrenta una problemática recurrente en el proceso de orientación de estudiantes ingresantes:

- **Alto volumen de consultas repetitivas**: Los estudiantes de primer año replican preguntas sobre procesos administrativos, acceso a plataformas y cronogramas
- **Dispersión de información**: La información está distribuida entre campus virtual (Moodle), documentos PDF, correos y diferentes áreas institucionales
- **Falta de uniformidad en respuestas**: Distintas áreas responden con distintas formulaciones, generando confusión
- **Sobrecarga de personal no docente**: Bedelía, tutores y asesoría pedagógica dedican tiempo a responder las mismas preguntas

### Diferenciación Propuesta

Se realizó una primer propuesta con un asistente que **solo ofreciera menú guiado**. La retroalimentación fue que sería equivalente a un Genially o documento interactivo estático. Es necesario un salto cualitativo surge de la **capacidad de interpretar consultas en lenguaje natural (texto libre)**: el estudiante formula su pregunta como la piensa, y el sistema la mapea inteligentemente a respuestas en la base de conocimiento. Esto replica el comportamiento de una persona consultando, no una navegación menu-driven.

### Pregunta Central

*"¿Cómo centralizar y estructurar la información para ingresantes de forma que sea accesible 24/7, confiable, y reduzca la carga operativa — permitiendo que los estudiantes consulten de forma natural (menú guiado O texto libre) sin diferencia de experiencia?"*

---

## 2. Estudio de Viabilidad

### Viabilidad Técnica

**Pregunta:** ¿Es posible desarrollar el software con tecnologías actuales?

**Análisis:**
- React, Express, PostgreSQL son stack maduros y ampliamente utilizados
- PostgreSQL soporta búsqueda de similitud nativa (extensión pg_trgm)
- Google Drive API es estable y accesible
- Vercel ofrece hosting serverless sin necesidad de administración de infraestructura

**Conclusión:** **VIABLE** — Todas las tecnologías son probadas y cuentan con comunidades activas

### Viabilidad Económica

**Preguntas:** ¿Cuánto tiempo llevará? ¿Cuál es el costo estimado? ¿Qué licencia usar?

**Análisis:**
- **Herramientas:** 100% gratuitas (React, Express, PostgreSQL, Google Drive)
- **Hosting:** Vercel (tier gratuito cubre el MVP); Neon PostgreSQL (tier gratuito disponible)
- **Costo anual:** $0 - $50 USD (mantenible con presupuesto institucional)
- **Tiempo:** ~11 semanas (27 ago - 15 nov 2026) con equipo de 5 personas
- **Licencia:** MIT (código abierto, permite reutilización y modificación)

**Conclusión:** **VIABLE** — Costos mínimos, herramientas gratuitas

### Viabilidad Operativa

**Pregunta:** ¿El sistema se integrará efectivamente en las operaciones del IFTS?

**Análisis:**
- **Integración con Moodle:** Múltiples opciones
  - Opción 1: Enlace directo en curso (garantizada, sin permisos especiales)
  - Opción 2: Widget embebido como iframe (a validar con admin de Moodle)
  - Opción 3: Widget flotante campus-wide (futura, requiere admin)
- **Mantenimiento:** Personal no técnico puede reportar cambios sin conocimiento de programación
- **Actualización de contenido:** Proceso definido, no depende de deployments
- **Performance:** Serverless garantiza escalabilidad en picos (ingreso marzo/agosto)

**Conclusión:** **VIABLE** — Integración no requiere cambios profundos en infraestructura

---

## 3. Análisis de Competencia (Benchmark)

### Metodología

Se relevaron **7 instituciones de educación superior** con chatbots/asistentes virtuales para ingresantes:
- UBA Económicas
- UNC
- UTN FRLP
- FACEN
- UNAJ
- UBA Rectorado
- Universidad de la Ciudad de Buenos Aires

### Hallazgos Clave

| Aspecto | Patrón Observado | Relevancia para IFTS |
|--------|------------------|---------------------|
| **Acceso** | Login vs. sin login | Sin login es preferible (integración Moodle aún pendiente) |
| **Canal** | Web vs. WhatsApp | Web en sitio institucional es más controlado |
| **Formato** | Menú rígido vs. IA conversacional | UNAJ: ~50% de consultas se resuelven con menú + FAQs |
| **Derivación** | Asincrónica vs. en tiempo real | Asincrónica es estándar (sin gestión de trámites) |
| **Seguridad** | Explícita sobre límites de IA | UNC: "no tengo acceso a datos personales" |
| **Actualización** | Manual vs. automática | Todas requieren actualización manual |

### Conclusiones del Benchmark

1. **Sin login para MVP** — Sigue patrón de UNC/FACEN/UNAJ (evita depender de integración Moodle aún no resuelta)

2. **Menú guiado + conversación libre** — Patrón UNAJ demostró que ~50% de consultas se resuelven con accesos rápidos; conversación libre cubre variaciones

3. **Derivación estructurada y asincrónica** — Modelo estándar: mostrar contacto sin iniciar gestión en tiempo real

4. **Tono y seguridad explícitos** — Referencia UNC: comunicar claramente qué no puede el bot (datos personales, trámites)

5. **Mantenimiento por perfil no técnico** — Sin antecedentes directos; requiere diseño propio para IFTS

---

## 4. Selección del Tipo de Proyecto

### Clasificación

**Tipo:** Desarrollo web a medida para soporte informativo institucional

**Características:**
- Sistema informático nuevo (greenfield)
- Scope acotado en MVP (1 cohorte, 4 materias, 1 cuatrimestre)
- Arquitectura preparada para escalabilidad (múltiples cohortes, carreras)
- Modalidad: SaaS institucional (alojado en infraestructura de IFTS)

### Justificación

- No existe solución genérica que se adapte a necesidades específicas de IFTS
- Requiere integración con Google Drive institucional
- Necesita procesos de actualización simplificados para personal no técnico
- Disponibilidad 24/7 es requisito crítico (educación virtual)

---

## 5. Establecimiento de Objetivos

### Objetivo General

*"Desarrollar un asistente virtual institucional que centralice y proporcione información académica, administrativa y sobre modalidad virtual de manera clara, verificada y permanentemente disponible para estudiantes ingresantes del IFTS N.°29, reduciendo consultas repetitivas y mejorando la experiencia de adaptación al entorno virtual."*

### Objetivos Específicos (SMART)

| # | Objetivo | Métrica | Target |
|---|----------|---------|--------|
| **O1** | Centralizar información de ingreso | % de consultas resueltas sin derivación | 70% |
| **O2** | Garantizar consistencia de respuestas | Respuestas diferentes por área para misma pregunta | 0 casos |
| **O3** | Facilitar acceso sin capacitación | Estudiantes que resuelven consulta en primer intento | 80%+ |
| **O4** | Permitir actualización sin técnicos | Cambios de contenido sin intervención de desarrollo | 100% de actualizaciones |
| **O5** | Mantener disponibilidad 24/7 | Uptime del servicio | 99.5%+ |
| **O6** | Escalar sin rehacer arquitectura | Agregar nueva materia sin cambios en sistema | Modular, sin breaking changes |

### Indicadores de Éxito

- Sistema en producción, accesible desde Moodle
- Metricas de uso muestran adopción por estudiantes
- Personal institucional reporte reducción en consultas repetitivas
- Cero exposición de datos personales
- Documentación lista para mantenimiento

---

## Conclusiones de Reconocimiento

| Aspecto | Hallazgo |
|--------|----------|
| **Viabilidad Técnica** | Comprobada — stack maduro, sin depencias problemáticas |
| **Viabilidad Económica** | Comprobada — costo anual mínimo, ROI positivo en reducción de consultas |
| **Viabilidad Operativa** | Comprobada — integración posible sin cambios de infraestructura |
| **Benchmarking** | Solución se alinea con prácticas de instituciones similares |
| **Mercado** | No hay solución genérica; desarrollo a medida justificado |
