-- ============================================================================
--  Asistente Virtual Institucional - IFTS N.29 (Syntax SRL)
--  001_schema.sql - Esquema relacional para Neon PostgreSQL
--
--  Principios de diseño:
--   * No se almacenan datos personales ni identificadores de estudiantes.
--     El sistema es público, anónimo y de solo lectura (RNF05).
--   * Todo el contenido institucional es versionable: cada tabla tiene
--     activo / vigencia para distinguir contenido vigente del histórico (RF07).
--   * El menú es un árbol genérico (categoria -> opcion -> respuesta) para
--     poder sumar materias, cuatrimestres o carreras sin rehacer el
--     esquema (RNF10).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. CATEGORIA  ->  nodos del árbol conversacional
--    Una categoría agrupa opciones y define el mensaje del bot al entrar.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categoria (
    id              SERIAL PRIMARY KEY,
    clave           TEXT        NOT NULL UNIQUE,
    nombre          TEXT        NOT NULL,
    mensaje         TEXT,
    orden           INTEGER     NOT NULL DEFAULT 0,
    es_raiz         BOOLEAN     NOT NULL DEFAULT FALSE,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  categoria              IS 'Nodos del arbol del menu guiado (RF05).';
COMMENT ON COLUMN categoria.mensaje       IS 'Mensaje del bot que se muestra al entrar a la categoria.';
COMMENT ON COLUMN categoria.es_raiz       IS 'TRUE solo para la categoria inicial que muestra el saludo.';

-- ---------------------------------------------------------------------------
-- 2. OPCION_MENU  ->  botones que el estudiante puede tocar
--    tipo = 'navegar'   -> abre otra categoria (subnivel)
--    tipo = 'responder'  -> muestra el texto de una RESPUESTA (+ documentos)
--    tipo = 'derivar'    -> muestra contactos de derivacion asincronica (RF04)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opcion_menu (
    id                  SERIAL PRIMARY KEY,
    clave               TEXT        NOT NULL UNIQUE,
    categoria_id        INTEGER     NOT NULL REFERENCES categoria (id) ON DELETE CASCADE,
    etiqueta            TEXT        NOT NULL,
    descripcion         TEXT,
    tipo                TEXT        NOT NULL DEFAULT 'navegar'
                            CHECK (tipo IN ('navegar', 'responder', 'derivar')),
    categoria_destino_id INTEGER    REFERENCES categoria (id) ON DELETE RESTRICT,
    respuesta_id        INTEGER,
    es_volver           BOOLEAN     NOT NULL DEFAULT FALSE,
    icono               TEXT,
    orden               INTEGER     NOT NULL DEFAULT 0,
    activo              BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT opcion_menu_destino_ck
        CHECK (
            (tipo = 'navegar'   AND categoria_destino_id IS NOT NULL AND respuesta_id IS NULL)
         OR (tipo = 'responder' AND respuesta_id         IS NOT NULL AND categoria_destino_id IS NULL)
         OR (tipo = 'derivar'   AND categoria_destino_id IS NULL)
        )
);

CREATE INDEX IF NOT EXISTS opcion_menu_categoria_idx ON opcion_menu (categoria_id, orden);
CREATE UNIQUE INDEX IF NOT EXISTS opcion_menu_navegar_uniq
    ON opcion_menu (categoria_id, categoria_destino_id)
    WHERE tipo = 'navegar' AND categoria_destino_id IS NOT NULL;

COMMENT ON TABLE  opcion_menu               IS 'Opciones seleccionables del menu (sin campo de texto libre, RF05).';
COMMENT ON COLUMN opcion_menu.tipo            IS 'navegar = subnivel; responder = respuesta con adjuntos; derivar = contactos (RF04).';
COMMENT ON COLUMN opcion_menu.es_volver     IS 'TRUE para la opcion "< Volver al menu anterior".';
COMMENT ON COLUMN opcion_menu.categoria_destino_id IS 'Subnivel al que navega la opcion.';
COMMENT ON COLUMN opcion_menu.respuesta_id   IS 'Respuesta a mostrar. En tipo derivar es opcional (texto introductorio).';

-- ---------------------------------------------------------------------------
-- 3. RESPUESTA  ->  texto institutionally validado que muestra el bot
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS respuesta (
    id              SERIAL PRIMARY KEY,
    clave           TEXT        NOT NULL UNIQUE,
    texto           TEXT        NOT NULL,
    orden           INTEGER     NOT NULL DEFAULT 0,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE respuesta IS 'Respuestas predefinidas validadas por la institucion.';

-- FK diferida: se agrega despues de crear respuesta para mantener el DDL lineal.
ALTER TABLE opcion_menu
    DROP CONSTRAINT IF EXISTS opcion_menu_respuesta_fk;
ALTER TABLE opcion_menu
    ADD CONSTRAINT opcion_menu_respuesta_fk
    FOREIGN KEY (respuesta_id) REFERENCES respuesta (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 4. DOCUMENTO  ->  ficha del archivo institucional alojado en Google Drive
--    Nunca se guarda el binario: solo el fileId y la metadata de vigencia.
--    (RF07: diferenciar vigente de histórico / reemplazado / de ejemplo)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documento (
    id                  SERIAL PRIMARY KEY,
    clave               TEXT        NOT NULL UNIQUE,
    nombre              TEXT        NOT NULL,
    descripcion         TEXT,
    tipo                TEXT        NOT NULL DEFAULT 'documento'
                            CHECK (tipo IN ('programa', 'cronograma', 'condiciones_aprobacion',
                                            'instructivo', 'presentacion', 'planilla', 'documento')),
    drive_file_id       TEXT        UNIQUE,
    drive_nombre_archivo TEXT,
    mime_type           TEXT        NOT NULL DEFAULT 'application/pdf',
    drive_url           TEXT,
    drive_view_url      TEXT,
    drive_md5           TEXT,
    drive_modified_time TIMESTAMPTZ,
    Drive_Carpeta       TEXT,
    vigente             BOOLEAN     NOT NULL DEFAULT TRUE,
    estado              TEXT        NOT NULL DEFAULT 'vigente'
                            CHECK (estado IN ('borrador', 'revision', 'vigente', 'reemplazado', 'archivado')),
    vigencia_desde      DATE,
    vigencia_hasta      DATE,
    observaciones       TEXT,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    sincronizado_en     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS documento_vigente_idx  ON documento (vigente, estado);
CREATE INDEX IF NOT EXISTS documento_tipo_idx      ON documento (tipo);

COMMENT ON TABLE  documento                   IS 'Documentos institucionales referenciados desde Drive (solo lectura).';
COMMENT ON COLUMN documento.drive_file_id     IS 'Identificador del archivo en Google Drive.';
COMMENT ON COLUMN documento.drive_view_url    IS 'Enlace publico de lectura generado/verificado por la sincronizacion.';
COMMENT ON COLUMN documento.estado            IS 'Ciclo de vida: borrador -> revision -> vigente -> reemplazado/archivado.';

-- ---------------------------------------------------------------------------
-- 5. RESPUESTA_DOCUMENTO  ->  documentos adjuntos a una respuesta
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS respuesta_documento (
    respuesta_id  INTEGER NOT NULL REFERENCES respuesta (id) ON DELETE CASCADE,
    documento_id  INTEGER NOT NULL REFERENCES documento (id) ON DELETE CASCADE,
    orden         INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (respuesta_id, documento_id)
);

CREATE INDEX IF NOT EXISTS respuesta_documento_doc_idx ON respuesta_documento (documento_id);

COMMENT ON TABLE respuesta_documento IS 'Adjuntos (PDF/planilla/slide) vinculados a una respuesta.';

-- ---------------------------------------------------------------------------
-- 6. CONTACTO  ->  derivacion asincronica (RF04)
--    El sistema solo MUESTRA los datos; no envia nada ni gestiona tramites.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacto (
    id          SERIAL PRIMARY KEY,
    clave       TEXT        NOT NULL UNIQUE,
    nombre      TEXT        NOT NULL,
    rol         TEXT,
    area        TEXT,
    email       TEXT,
    telefono    TEXT,
    url_perfil  TEXT,
    motivo      TEXT,
    horario     TEXT,
    orden       INTEGER     NOT NULL DEFAULT 0,
    activo      BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  contacto            IS 'Persona o area a la que se deriva la consulta (RF04).';
COMMENT ON COLUMN contacto.motivo     IS 'Motivo de la derivacion, mostrado junto al contacto.';

CREATE TABLE IF NOT EXISTS opcion_contacto (
    opcion_id    INTEGER NOT NULL REFERENCES opcion_menu (id) ON DELETE CASCADE,
    contacto_id  INTEGER NOT NULL REFERENCES contacto (id)  ON DELETE CASCADE,
    orden        INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (opcion_id, contacto_id)
);

CREATE INDEX IF NOT EXISTS opcion_contacto_contacto_idx ON opcion_contacto (contacto_id);

-- ---------------------------------------------------------------------------
-- 7. CONTEXTO  ->  datos contextuales versionados (RF06 / RNF10)
--    Store clave/valor con ambito opcional (materia, comision, cuatrimestre).
--    Ej: dias_cursada | comision_a  -> "Lunes y Miercoles de 18:00 a 21:00 hs ..."
--    Se usa para (a) completar textos y (b) armar submenus de seleccion
--    cuando la respuesta depende de la comision o del momento de la cursada.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contexto (
    id            SERIAL PRIMARY KEY,
    clave         TEXT        NOT NULL,
    nombre        TEXT        NOT NULL,
    valor         TEXT,
    ambito_tipo   TEXT        CHECK (ambito_tipo IN ('global', 'materia', 'comision', 'cuatrimestre', 'area')),
    ambito_clave  TEXT,
    grupo         TEXT,
    orden         INTEGER     NOT NULL DEFAULT 0,
    activo        BOOLEAN     NOT NULL DEFAULT TRUE,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT contexto_ambito_ck
        CHECK ((ambito_tipo IS NULL AND ambito_clave IS NULL) OR (ambito_tipo IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS contexto_ambito_uniq
    ON contexto (clave, COALESCE(ambito_tipo, 'global'), COALESCE(ambito_clave, ''));

CREATE INDEX IF NOT EXISTS contexto_grupo_idx ON contexto (grupo, orden);

COMMENT ON TABLE  contexto            IS 'Datos contextuales (comisiones, cuatrimestre, URLs y contacts institucionales).';
COMMENT ON COLUMN contexto.ambito_tipo IS 'NULL/global = institucional; materia/comision/cuatrimestre = acotado.';

-- ---------------------------------------------------------------------------
-- 8. OPCION_CONTEXTO  ->  valores de contexto ofrecidos como submenu
--    Si la opcion tiene contextos, la API responde con una pregunta y la
--    lista de valores; al elegir uno se resuelve la respuesta final.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opcion_contexto (
    opcion_id   INTEGER NOT NULL REFERENCES opcion_menu (id) ON DELETE CASCADE,
    contexto_id INTEGER NOT NULL REFERENCES contexto (id)  ON DELETE CASCADE,
    PRIMARY KEY (opcion_id, contexto_id)
);

CREATE INDEX IF NOT EXISTS opcion_contexto_ctx_idx ON opcion_contexto (contexto_id);

-- ---------------------------------------------------------------------------
-- 9. RESPUESTA_PLANTILLA  ->  texto con marcadores {contexto.clave}
--    Permite que un mismo texto se especialice por comision sin duplicar
--    la respuesta (ej: "Las clases de {materia} en la {comision} son ...").
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contexto_opcion (
    id            SERIAL PRIMARY KEY,
    opcion_id     INTEGER NOT NULL REFERENCES opcion_menu (id) ON DELETE CASCADE,
    contexto_id   INTEGER NOT NULL REFERENCES contexto (id)  ON DELETE CASCADE,
    etiqueta      TEXT        NOT NULL,
    orden         INTEGER     NOT NULL DEFAULT 0,

    CONSTRAINT contexto_opcion_uniq UNIQUE (opcion_id, contexto_id)
);

COMMENT ON TABLE contexto_opcion IS 'Opciones del submenu contextual (comision, cuatrimestre) con su etiqueta visible.';

-- ---------------------------------------------------------------------------
-- 10. METRICA_ANONIMA  ->  contadores agregados, sin datos personales (RNF05)
--     Solo se guarda la categoria/opcion alcanzada y un hash rotativo de
--     sesionanonima. No hay IP, ni DNI, ni legajo, ni texto libre.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS metrica_opcion (
    opcion_clave    TEXT        NOT NULL,
    categoria_clave TEXT,
    evento          TEXT        NOT NULL DEFAULT 'seleccion'
                        CHECK (evento IN ('seleccion', 'documento_abierto', 'derivacion', 'reinicio', 'error')),
    fecha           DATE        NOT NULL DEFAULT CURRENT_DATE,
    total           INTEGER     NOT NULL DEFAULT 0 CHECK (total >= 0),

    PRIMARY KEY (opcion_clave, evento, fecha)
);

COMMENT ON TABLE metrica_opcion IS 'Metricas agregadas y anonimas para detectar vacios en la base de conocimiento.';

-- ---------------------------------------------------------------------------
-- 11. SESION_CONTEXTO  ->  selections del estudiante dentro de una sesion
--     Solo claves de opcion; se purga periodicamente. Nunca PII.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesion_contexto (
    id            SERIAL PRIMARY KEY,
    sesion_id     TEXT        NOT NULL,
    clave         TEXT        NOT NULL,
    valor         TEXT,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sesion_contexto_sesion_idx ON sesion_contexto (sesion_id, creado_en);

-- ---------------------------------------------------------------------------
-- 12. Trigger de mantenimiento: actualizado_en
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_actualizado_en() RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'categoria', 'opcion_menu', 'respuesta',
        'documento', 'contacto', 'contexto'
    ] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_touch ON %1$I', t);
        EXECUTE format(
            'CREATE TRIGGER trg_%1$s_touch BEFORE UPDATE ON %1$I
             FOR EACH ROW EXECUTE FUNCTION touch_actualizado_en()', t);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 13. Vista de lectura para el equipo de mantenimiento (RNF09)
--     Un solo SELECT muestra el arbol completo con sus adjuntos.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_arbol_menu AS
SELECT
    c.clave              AS categoria_clave,
    c.nombre             AS categoria_nombre,
    o.clave              AS opcion_clave,
    o.etiqueta           AS opcion_etiqueta,
    o.tipo               AS opcion_tipo,
    o.es_volver          AS es_volver,
    o.orden              AS orden,
    cd.clave             AS destino_clave,
    cd.nombre            AS destino_nombre,
    cd.mensaje           AS destino_mensaje,
    r.clave              AS respuesta_clave,
    r.texto              AS respuesta_texto,
    d.clave              AS documento_clave,
    d.nombre             AS documento_nombre,
    d.drive_view_url     AS documento_url,
    d.estado             AS documento_estado
FROM opcion_menu o
JOIN categoria   c  ON c.id = o.categoria_id
LEFT JOIN categoria cd ON cd.id = o.categoria_destino_id
LEFT JOIN respuesta  r  ON r.id = o.respuesta_id
LEFT JOIN respuesta_documento rd ON rd.respuesta_id = r.id
LEFT JOIN documento d ON d.id = rd.documento_id
WHERE o.activo AND c.activo
ORDER BY c.orden, o.orden, rd.orden;
