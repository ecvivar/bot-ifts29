# 1. Alcance del Proyecto

## Objetivo del Software

Desarrollar un **asistente virtual institucional web** para el IFTS N.°29 que proporcione información académica, administrativa y sobre la modalidad virtual de manera centralizada, verificada y permanentemente disponible, sin requerir registro ni datos personales.

El sistema está orientado específicamente a **estudiantes ingresantes del primer año, primer cuatrimestre** de la Tecnicatura Superior en Desarrollo de Software, permitiendo una escalabilidad progresiva a otras cohortes y carreras.

---

## Características Principales

### 1. Consultas e Información (RF01, RF02, RF03)

El asistente responde consultas en tres áreas:

| Área | Contenido | Fuentes |
|------|----------|---------|
| **Administrativa** | Inscripción, documentación, certificados, procedimientos, SIU Guaraní, Moodle, canales de contacto, fechas/plazos | Documentación oficial institucional |
| **Académica** | Modalidad de cursada, docentes, comisiones, cronograma, programa, horarios, prácticas, canales de consulta (por materia) | Programas, cronogramas, presentaciones |
| **Virtual** | Acceso al campus, ingreso a aulas, descarga de materiales, foros, encuentros sincrónicos, funciones de roles | FAQs, guías de familiarización |

**Materias del MVP (Cuatrimestre 1):**
- Administración de Bases de Datos
- Elementos de Análisis Matemático
- Lógica Computacional
- Técnicas de Programación

### 2. Interacción Híbrida (RF05)

El bot responde consultas de dos formas:

- **Menú guiado**: Navegación por categorías/subcategorías → respuesta directa
- **Texto libre**: El estudiante escribe su pregunta → el sistema interpreta la intención y devuelve la respuesta del menú

**Importante**: El texto libre **no genera respuestas nuevas**; reinterpreta la consulta contra la base de conocimiento existente.

### 3. Derivación Asincrónica (RF04)

Cuando el bot no puede resolver una consulta o requiere datos personales:
- Identifica el área responsable (Bedelía, Tutores, Asesoría Pedagógica)
- Muestra datos de contacto específicos: nombre, rol, email, teléfono, horarios, motivo
- **No inicia gestión de trámites ni envía información en nombre del estudiante**

### 4. Contexto y Personalización (RF06)

Para respuestas que dependen de datos contextuales (materia, comisión, docente), el menú solicita clarificación sin pedir datos personales o sensibles.

### 5. Documentos Institucionales Vigentes (RF07)

- Todas las respuestas enlaza o identifica el documento fuente oficial vigente
- Diferencia contenido vigente del histórico/de prueba
- Ofrece enlace o archivo cuando corresponde
- Sincronización automática con Google Drive

### 6. Actualización Simplificada de Contenido (RF08, RF09)

- Base de conocimiento se estructura en documentos alojados en Drive
- Personal no técnico (Bedelía, Tutores, Asesoría) puede reportar cambios
- Proceso de carga: editar TypeScript → regenerar SQL → empujar a BD
- **Nota**: Interfaz de carga autónoma es mejora futura (Fase 2)

### 7. Registro de Consultas para Mejora Continua (RF10)

- Sistema registra todas las consultas (texto libre y menú) realizadas por estudiantes
- Información agregada y anónima: qué se consultó, cuándo, con qué frecuencia
- **Acceso:** Asesoría Pedagógica analiza el registro para identificar gaps en la base de conocimiento
- **Uso:** Informar decisiones de actualización de contenido y mejoras en la estructura del menú
- No almacena datos personales ni identifica al estudiante individual

---

## Plataformas

| Plataforma | Soporte |
|---|---|
| **Web (Responsive)** | PC, tablet, navegadores modernos |
| **Mobile** | Web responsiva cubre Android e iOS |
| **Desktop** | Navegador estándar |

---

## Usuarios Objetivo

### 1. Estudiantes Ingresantes (Usuario Primario)

**Perfil:**
- Estudiantes de primer año, primer cuatrimestre
- Tecnicatura Superior en Desarrollo de Software
- Matriculados en IFTS N.°29
- Participantes del aula de familiarización
- Rango de edad: 18+

**Necesidades:**
- Información clara y confiable sobre procesos administrativos
- Orientación sobre uso de plataformas (SIU, Moodle)
- Datos de contacto de áreas institucionales
- Información académica por materia

**Comportamiento esperado:**
- Acceso desde Moodle o enlace directo
- Consultas repetitivas que podrían resolver autónomamente
- Navegación intuitiva sin capacitación técnica
- Dispositivo: PC, tablet o celular

### 2. Personal Institucional (Usuario Secundario - Administrador)

**Actores:**
- Bedelía
- Tutores académicos
- Asesoría Pedagógica

**Responsabilidades:**
- Reportar cambios de contenido
- Validar información vigente
- Proporcionar documentos fuente para sincronización
- Capacitar estudiantes en caso de dudas

**Acceso:**
- Rol administrativo en repos/procedimiento de actualización
- No requiere acceso directo a código; cambios documentados

### 3. Desarrolladores (Usuario Terciario - Mantenimiento)

**Responsabilidades:**
- Mantener infraestructura
- Implementar cambios técnicos
- Sincronización y CI/CD
- Monitoreo de performance

---

## Fuera de Alcance (MVP)

- Gestión/tramitación de procesos — solo información  
- Acceso a datos personales/académicos individuales  
- Inscripción automática a materias o exámenes  
- Integración con SIU Guaraní  
- Soporte a aspirantes (pre-ingresantes)  
- Reemplazo de docentes/tutores/bedelía  
- Evaluación de satisfacción del usuario (posible Fase 2)  
- Notificación automática a áreas (solo muestra contacto)  

---

## Resumen del Alcance

| Aspecto | Alcance |
|--------|---------|
| **Usuarios** | Ingresantes 1er año, 1er cuatrimestre + personal institucional |
| **Información** | 4 materias + administrativa + virtual |
| **Consultas** | Menú guiado + texto libre |
| **Documentos** | Sincronización desde Google Drive |
| **Derivación** | Asincrónica a áreas institucionales |
| **Datos** | Anónimo, solo lectura, sin datos personales |
| **Plataformas** | Web responsiva (PC, tablet, celular) |
| **Despliegue** | Enlace directo o embebido en Moodle (a validar) |
