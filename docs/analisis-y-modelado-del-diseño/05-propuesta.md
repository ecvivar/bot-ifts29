# 5. Presentación de la Propuesta

## Resumen Ejecutivo

Syntax SRL propone al IFTS N.°29 el desarrollo de un **asistente virtual institucional** accesible, anónimo y basado en un menú de categorías, que centralice la información de ingreso en un único canal de consulta permanentemente disponible.

La solución entrega respuestas verificadas contra fuentes institucionales vigentes y, cuando no existe una respuesta adecuada, informa contacto institucional preciso. De este modo:

- **Mejora la orientación inicial** sin gestionar trámites ni exponer datos personales
- **Reduce la carga operativa** del personal no docente
- **Garantiza consistencia** de respuestas entre áreas
- **Facilita la adaptación** de estudiantes al entorno virtual

El sistema está diseñado para iniciarse como MVP en una cohorte (ingreso 2026) y escalar progresivamente a múltiples cohortes y carreras sin rehacer la arquitectura.

---

## Objetivos y Requerimientos

*(Detalle completo en [Análisis del Diseño y Requerimientos](06-analisis-diseño.md))*

- **Estratégicos:** Centralizar información, garantizar vigencia y trazabilidad, facilitar uso sin capacitación, permitir mantenimiento no técnico, escalar sin rehacer arquitectura
- **Funcionales:** Menú guiado por niveles, interpretación de texto libre, sincronización automática desde Drive, derivación asincrónica, métricas sin datos personales
- **No Funcionales:** Disponibilidad 24/7, respuesta <2 seg, HTTPS, acceso anónimo, compatibilidad PC/tablet/móvil, escalabilidad para picos de ingreso

---

## Estimación de Recursos

### Recursos Humanos

| Rol | Dedicación | Duración |
|-----|-----------|----------|
| Coordinadora | 50% | 20 semanas |
| Analista Funcional | 60% | 20 semanas |
| Diseñador | 70% | 15 semanas |
| Desarrollador | 100% | 15 semanas |
| Testing | 80% | 10 semanas |
| **Esfuerzo Total** | — | **~340 persona/semana** |

### Recursos de Infraestructura

| Recurso | Costo (Año 1) | Notas |
|---------|---------------|-------|
| Hosting (Vercel) | $0-20 | Tier gratuito + posible upgrade |
| Base de Datos (Neon) | $0-30 | Tier gratuito + posible upgrade |
| Google Drive | $0 | API gratuita, solo lectura |
| GitHub | $0 | Repo público |
| Dominio | ~$12 | Si aplica (opcional) |
| **Total Anual** | **~$40-60** | Presupuesto mínimo |

### Herramientas de Desarrollo

| Herramienta | Licencia | Uso |
|-------------|----------|-----|
| GitHub | Gratuita (público) | Control de versiones |
| Figma | Gratuita (plan base) | Wireframes/prototipos |
| Lucidchart/Draw.io | Gratuita | Diagramas UML |
| Node.js | Open source | Runtime JavaScript |
| React | MIT | Frontend framework |
| Express | MIT | Backend framework |
| PostgreSQL | Open source | Base de datos |
| VSCode | Gratuita | IDE |

---

## Impacto y Beneficios Esperados

### Beneficios Cuantitativos

| Métrica | Situación Actual | Proyección Post-MVP | Impacto |
|---------|-----------------|-------------------|--------|
| Consultas repetitivas / semana a bedelía | ~50-100 | ~15-30 | -70% |
| Tiempo promedio de respuesta a consulta | 24-48 hs | <2 seg (bot) | -99% |
| Uniformidad de respuestas entre áreas | Inconsistente | Verificada (100%) | Mejora crítica |
| Disponibilidad de información | Oficina hs | 24/7 | Acceso continuo |
| Estudiantes adaptados al entorno virtual | ~50% en semana 1 | ~80% en semana 1 | +30% |

### Beneficios Cualitativos

1. **Experiencia de estudiante:** Orientación más clara y accesible sin depender de disponibilidad de personal
2. **Eficiencia operativa:** Personal no docente se enfoca en consultas complejas/personales, no repetitivas
3. **Calidad académica:** Reducción de atrasos por confusión de procesos
4. **Escalabilidad institucional:** Base para expandir a otras cohortes y carreras
5. **Seguridad:** Garantía de que información oficial se distribuye, no se infieren respuestas

---

## Cronograma de Entrega

*(Detalle de fases, timeline y criterios de aceptación en [Fases del Desarrollo](04-fases-desarrollo.md))*

**Período de Ejecución:** 27 de agosto → 15 de noviembre de 2026  
**Hito Go-Live MVP:** 15 de noviembre de 2026  
**Post-MVP (Fase 2):** Mejoras posteriores según priorización con cliente

---

## Costos de Proyecto

### Estimación de Inversión (MVP)

| Concepto | Costo |
|----------|-------|
| Desarrollo (340 persona/semana * tasa horaria) | $XX,XXX |
| Infraestructura Año 1 | $60 |
| Documentación y capacitación | Incluido |
| **TOTAL MVP** | **Depende de estructura de costos** |

*Nota: Costos específicos a definir entre Syntax SRL e IFTS N.°29*

### Costo de Mantenimiento Anual (Post-MVP)

| Concepto | Costo Anual |
|----------|-------------|
| Infraestructura | $60-100 |
| Soporte técnico (horas) | A definir |
| Actualizaciones de contenido (bedelía) | 0 (interno) |
| **TOTAL Mantenimiento** | **~$200-400/año** |

---

## Plan de Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|------------|--------|-----------|
| Cambios en alcance de IFTS | Alta | Alto | Validación semanal, documento de cambios |
| Permisos de Moodle para embed | Media | Medio | Opción 1 (enlace) garantizada; validar temprano |
| Rendimiento con picos de carga | Baja | Alto | Prueba de carga en semana 15 |
| Calidad de fuentes de Drive | Media | Medio | Proceso de validación antes de sync |
| Disponibilidad de Vercel | Baja | Alto | SLA con Vercel; plan B con proveedor alternativo |

---

## Próximos Pasos

1. **Validación del Alcance:** Cliente confirma objetivos y límites
2. **Firma de Contrato:** Acuerdos de términos y cronograma
3. **Kick-off:** Reunión de inicio de proyecto con equipo completo
4. **Fase 1:** Análisis y requerimientos detallados

**Fecha Propuesta de Inicio:** Según disponibilidad de IFTS N.°29
