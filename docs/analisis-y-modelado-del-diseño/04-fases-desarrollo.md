# 4. Fases del Desarrollo

## Estructura de Fases

El desarrollo se realiza en **7 fases iterativas** con entregas incrementales, validación continua con el cliente, y ajustes según feedback.

---

## Fase 1: Análisis y Requerimientos

**Duración estimada:** 2-3 semanas

### Actividades

- **Relevamiento de requisitos** con IFTS N.°29 (reuniones con bedelía, tutores, asesoría pedagógica)
- **Documentación de funcionalidades** que el sistema debe soportar
- **Especificación clara** de límites de alcance
- **Identificación de necesidades** institucionales específicas
- **Definición de casos de uso** para cada tipo de usuario

### Entregables

- Documento de requerimientos funcionales (RF) y no funcionales (RNF)
- Lista de casos de uso validados
- Matriz de trazabilidad requerimientos-tests
- Documento de restricciones técnicas y operativas

### Responsables

- Analista Funcional (liderador)
- Coordinadora (facilita comunicación)
- Diseñador (valida feasibilidad técnica)

---

## Fase 2: Diseño del Sistema

**Duración estimada:** 3-4 semanas

### Actividades

- **Definición de arquitectura técnica** (frontend, backend, BD, integraciones)
- **Modelado de datos:** Diseño de tablas, relaciones, índices
- **Diagramación UML:** Casos de uso, clases, secuencia, componentes, despliegue
- **Diseño de interfaz:** Wireframes, flujos de navegación, prototipos en Figma
- **Especificación de APIs:** Endpoints REST, payloads, errores
- **Plan de integración con Google Drive**

### Entregables

- Diagrama de arquitectura del sistema
- Modelo Entidad-Relación de base de datos
- Diagramas UML completos
- Wireframes y prototipo de interfaz
- Especificación de APIs REST
- Documento de decisiones de arquitectura

### Responsables

- Diseñador (liderador)
- Analista Funcional (valida contra requerimientos)
- Desarrollador (input de factibilidad técnica)

---

## Fase 3: Desarrollo e Implementación

**Duración estimada:** 5-7 semanas

### Actividades

**Backend:**
- Configuración de repo y estructura del proyecto
- Implementación de APIs REST (menú, chat, sincronización)
- Integración con PostgreSQL
- Integración con Google Drive API
- Implementación del motor de búsqueda (exact match + trigram)
- Manejo de errores y validaciones

**Frontend:**
- Configuración de React + TypeScript + Vite
- Componentes de interfaz (ChatWidget, Menu, MessageBubbles, etc.)
- Flujos de navegación
- Integración con backend
- Responsive design
- Gestión de estado

**DevOps:**
- Configuración de Vercel
- Configuración de variables de entorno
- Setup de GitHub Actions (CI/CD)
- Configuración de base de datos Neon

### Entregables

- Código fuente en GitHub (versionado)
- API funcional en endpoint de testing
- Frontend funcional en ambiente de desarrollo
- Documentación técnica de código (README, inline comments)

### Responsables

- Desarrollador (liderador)
- Diseñador (validaciones de UI/UX)

---

## Fase 4: Pruebas y Control de Calidad

**Duración estimada:** 2-3 semanas (paralela a última parte de Fase 3)

### Actividades

- **Testing funcional:** Validar todos los RF contra casos de prueba
- **Testing de seguridad:** Verificar no hay exposición de datos personales
- **Testing de performance:** Carga con N usuarios concurrentes
- **Testing de integración:** Google Drive, Moodle, Vercel
- **Testing de usabilidad:** Estudiantes ingresantes usan el sistema
- **Documentación de bugs** y ejecución de correcciones

### Tipos de Pruebas

| Tipo | Scope | Responsable |
|------|-------|-------------|
| Unitarias | Funciones individuales | Desarrollador |
| Integración | APIs + BD + Drive | Desarrollador + Testing |
| Funcionales | Casos de uso completos | Testing (liderador) |
| Seguridad | Datos sensibles, inyecciones | Testing |
| Performance | Carga, latencia | Desarrollador + Testing |
| Usabilidad | UX con estudiantes reales | Testing + Asesoría Pedagógica |

### Entregables

- Plan de pruebas documentado
- Casos de prueba ejecutados
- Reporte de bugs encontrados y resueltos
- Evidencia de testing (logs, screenshots)
- Documento de aceptación por cliente

### Responsables

- Responsable de Testing (liderador)
- Desarrollador (correcciones)
- Coordinadora (validación con cliente)

---

## Fase 5: Preparación de Capacitación

**Duración estimada:** 1-2 semanas (final de Fase 4)

### Actividades

- **Elaboración de manual de usuario** para estudiantes
- **Manual de administrador** para personal institucional (bedelía, tutores, asesoría pedagógica)
- **Guía de procedimientos** de actualización de contenido
- **Guía de tono y estilo** para redacción de respuestas
- **Diseño de sesiones de capacitación**

### Contenido de Manuales

- Cómo acceder al asistente
- Cómo formular consultas (menú vs. texto libre)
- Qué esperar de respuestas derivadas
- Procedimiento de actualización de contenido
- Contacto para soporte técnico

### Entregables

- Manual del usuario (PDF + web)
- Manual del administrador (PDF + web)
- Guía de tono y estilo para contenido
- Presentación de capacitación (slides)
- Video tutorial de uso (opcional)

### Responsables

- Analista Funcional (contenido educativo)
- Coordinadora (facilita con cliente)

---

## Fase 6: Manual y Soporte

**Duración estimada:** Continuo (inicio al final de Fase 5)

### Documentación Técnica

- **README** del repositorio con instalación y configuración
- **Arquitectura documentada** (decisiones, trade-offs)
- **API documentada** (OpenAPI/Swagger)
- **Procedimientos de despliegue** en Vercel
- **Guía de troubleshooting** para problemas comunes
- **Documentación de base de datos** (DDL, índices)

### Soporte a Usuarios

- **Primer nivel:** FAQ y documentación disponible
- **Segundo nivel:** Soporte vía email/ticket a Syntax SRL
- **Escalation:** Involucra coordinador de proyecto si es necesario

### Entregables

- Documentación técnica completa en repo
- FAQ públicamente accesible
- Procedimiento de reporte de bugs
- SLA de respuesta a incidentes

### Responsables

- Analista Funcional + Desarrollador (documentación técnica)
- Coordinadora (coordinación de soporte)

---

## Fase 7: Mantenimiento

**Duración estimada:** Continuo (post-MVP)

### Actividades de Mantenimiento Preventivo

- **Monitoreo** de performance y availability (uptime 99.5%+)
- **Actualización de dependencias** (security patches, actualizaciones menores)
- **Backups** de base de datos
- **Análisis de logs** en busca de anomalías

### Actividades de Mantenimiento Correctivo

- Resolución de bugs reportados
- Actualización de contenido institucional
- Sincronización de documentos con Drive
- Ajustes menores de UX

### Mejoras Evolutivas (Fase 2+)

- Agregar nuevas materias
- Agregar nuevas cohortes
- Expandir a otras carreras
- Interfaz de carga de contenido no técnica
- Análisis avanzado de métricas

### Entregables

- Documentación de cambios (changelog)
- Reporte de estado mensual
- Reporte de métricas de uso

### Responsables

- Desarrollador (liderador técnico)
- Coordinadora (coordinación)

---

## Timeline Real (MVP)

**Período:** 27 de agosto de 2026 → 15 de noviembre de 2026

```
Semana  1-3 (27 ago - 16 sep): Análisis y Requerimientos
Semana  4-5 (17 sep - 04 oct): Diseño del Sistema (cierre 04/10)
Semana  6-10 (05 oct - 09 nov): Desarrollo e Implementación
Semana 11 (10-15 nov):          Testing intensivo, Capacitación y Go-Live
```

**Hito de Go-Live:** 15 de noviembre de 2026

---

## Criterios de Aceptación por Fase

| Fase | Criterio de Aceptación |
|------|------------------------|
| 1 | Documento de requisitos validado por cliente |
| 2 | Diagramas revisados y aprobados por stakeholders |
| 3 | Funcionalidades desarrolladas según especificación |
| 4 | 100% de RF testeados; 0 bugs críticos abiertos |
| 5 | Capacitación completada; material entregado |
| 6 | Documentación publicada; soporte operativo |
| 7 | Sistema en producción; métricas de uso disponibles |

