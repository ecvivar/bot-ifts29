# 6. Análisis del Diseño y Requerimientos

## Requerimientos Funcionales (RF)

### Consultas e información

| ID | Requerimiento |
|----|----|
| RF01 | Responder consultas sobre inscripción, documentación, certificados, procedimientos administrativos, uso del SIU, diferencias entre SIU y campus virtual, canales de contacto de las áreas, y fechas/plazos institucionales. |
| RF02 | Responder consultas académicas básicas sobre las 4 materias del cuatrimestre: modalidad de cursada, docentes responsables, comisión, cronograma, programa, horarios/encuentros sincrónicos, prácticas formativas obligatorias y canales de consulta. Las condiciones de aprobación solo se incluyen si están explícitas en documentación oficial; no deben inferirse. |
| RF03 | Responder consultas sobre la modalidad virtual: acceso al campus, ingreso a aulas, descarga de materiales, foros, encuentros sincrónicos, canales institucionales, y funciones de docentes/tutores/bedelía/asesoría pedagógica. |
| RF04 | Cuando el estudiante no encuentra lo que busca en las categorías anteriores ("No encontré lo que busco"), mostrar el contacto de la persona o área correspondiente (nombre, rol, mail y/o enlace de perfil) junto con el motivo. La derivación es siempre asincrónica: el sistema no inicia ni gestiona una conversación en tiempo real, ni envía nada en nombre del estudiante. |
| RF05 | El estudiante puede consultar de dos formas: (1) menú guiado por niveles (categoría → subcategoría → respuesta), o (2) texto libre (el sistema interpreta la intención y mapea a respuestas del menú existente). No genera respuestas nuevas; reinterpreta la consulta contra la base de conocimiento del menú. |
| RF06 | Cuando la respuesta dependa de datos contextuales (materia, comisión, docente, tipo de trámite, momento de la cursada), solicitarlos al estudiante mediante el propio menú, sin pedir datos personales o sensibles. |

### Fuentes y confiabilidad de las respuestas

| ID | Requerimiento |
|----|----|
| RF07 | Poder proporcionar información de documentos institucionales vigentes (programas, cronogramas, instructivos, presentaciones, PDF, Word, planillas, material de familiarización), diferenciando siempre el contenido vigente del histórico, reemplazado o usado como ejemplo, y ofreciendo el archivo o enlace original cuando corresponda. |

### Contenido y mantenimiento

| ID | Requerimiento |
|----|----|
| RF08 | Permitir actualizar la base de conocimiento a partir de documentos alojados en Drive (pdf, Excel, slides), sin intervención técnica. La carga puede apoyarse en IA para estructurar/etiquetar documentos fuente que no vengan normalizados. |
| RF09 | Mecanismo simple para que personal no técnico (bedelía/tutores/asesoría pedagógica) incorpore, reemplace, elimine y actualice contenido, preguntas/respuestas, fechas, contactos y procedimientos, organizado por materia/comisión/categoría. |

---

## Requerimientos No Funcionales (RNF)

### Disponibilidad y rendimiento

| ID | Requerimiento |
|----|----|
| RNF01 | Disponibilidad 24/7, dado que la cursada es a distancia. |
| RNF02 | Soportar los picos de las cohortes de ingreso (marzo/agosto), de ~300 a 440 estudiantes. Esa cifra es el tamaño de cohorte, no la concurrencia simultánea; la cantidad de usuarios concurrentes queda pendiente de estimación (por ejemplo, mediante prueba de carga) y no debe darse por definida en 400. |
| RNF03 | Responder en un tiempo que mantenga la interacción fluida; el umbral máximo debe definirse con un criterio medible (ej. % de respuestas dentro de N segundos). |

### Seguridad

| ID | Requerimiento |
|----|----|
| RNF04 | Comunicaciones cifradas en tránsito (HTTPS) por defecto en cualquier canal. |
| RNF05 | El acceso no requiere registro ni login: la interacción es anónima, no identifica al estudiante y no almacena datos personales. No hay sesión que validar porque no existe integración de inicio de sesión (SSO) con el campus; el enlace es de acceso público, y al ser información institucional de solo lectura sin datos sensibles, no representa un riesgo si accede alguien fuera del universo de ingresantes. Se almacena únicamente la información mínima necesaria para generar métricas y mejorar la base de conocimiento. |

### Usabilidad y accesibilidad

| ID | Requerimiento |
|----|----|
| RNF06 | La interfaz debe ser utilizable sin necesidad de capacitación técnica: los estudiantes deben poder resolver una consulta sin instrucciones extensas, y el personal que administra el contenido (bedelía/tutores/asesoría pedagógica) debe poder hacerlo sin conocimientos de programación. |

### Compatibilidad e integración

| ID | Requerimiento |
|----|----|
| RNF07 | El sistema se implementará en etapas según el nivel de acceso disponible: (1) enlace directo publicado en el curso de familiarización — no requiere permisos especiales y es la opción garantizada para el MVP; (2) embebido dentro de una página del curso de familiarización, si el editor de contenido de Moodle lo permite sin intervención de administración de plataforma — a confirmar; (3) widget flotante visible en todo el campus, como mejora de largo plazo, condicionada a contar con acceso de administrador de la plataforma. No debe asumirse acceso directo al contenido interno de Moodle. |
| RNF08 | Seguir los lineamientos de imagen institucional del ministerio, la Agencia de Habilidades para el Futuro y la Tecnicatura, incorporando además identidad propia de la Tecnicatura en Desarrollo de Software. |
| RNF09 | Compatibilidad con computadoras, celulares y navegadores modernos — los mismos entornos desde los que se accede habitualmente al campus. |

### Mantenibilidad y escalabilidad

| ID | Requerimiento |
|----|----|
| RNF10 | La actualización de contenido cuatrimestral (cronograma, condiciones de aprobación, docentes) debe poder realizarse sin intervención del equipo de desarrollo, y el diseño debe permitir una ampliación progresiva (nuevas materias, estudiantes avanzados, egresados, otras carreras) sin rehacer la arquitectura. |
| RNF11 | Utilizar exclusivamente herramientas gratuitas o de código abierto. |
| RNF19 | Priorizar herramientas gratuitas, de código abierto o de costo compatible con los recursos del instituto; costo máximo e infraestructura a confirmar con el cliente. |

---

## Restricciones y Guardrails de Diseño

| Restricción | Razón | Implementación |
|-------------|-------|-----------------|
| No usar LLM generativo | Evitar alucinaciones; garantizar trazabilidad; limitar costos operativos | Motor determinístico (exact + trigram) |
| No acceder a datos personales | Privacidad estudiantil | No hay login; no hay consulta a SIU |
| No gestionar trámites | Fuera de alcance; requiere autenticación | Solo información + derivación |
| No enviar mails automáticos | Requiere consentimiento; complejidad técnica | Solo mostrar contacto |
| Búsqueda exacta en Drive | Evitar PDF equivocado en materia similar | No match = sin enlace (no inventa) |
| Derivación asincrónica | Evitar gestión en tiempo real | Mostrar contacto; estudiante inicia |
