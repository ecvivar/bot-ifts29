-- ============================================================================
--  Asistente Virtual Institucional - IFTS N.29 (Syntax SRL)
--  004_kb_schema.sql - Base de conocimiento conversacional
--
--  Que resuelve:
--    El menu guiado obliga al estudiante a recorrer un arbol de categorias.
--    Estas tablas permiten ADEMAS aceptar consultas escritas: el sistema
--    interpreta el texto, ubica la intencion y devuelve la MISMA opcion del
--    menu que ya existia. No se guarda ni se genera ninguna respuesta nueva.
--
--  Principios de diseño (mismos que 001_schema.sql):
--   * Toda intencion esta atada a una opcion de `opcion_menu` y a una
--     `respuesta` ya validada por la institucion: el texto libre no puede
--     inventar contenido, solo localizarlo.
--   * `normalized_text` es el texto ya normalizado por el MISMO normalizador
--     que usa la API, para que el indice y los umbrales sean comparables.
--   * Versionado con `activo`: desactivar una variante la saca de la busqueda
--     sin borrar el historial.
--
--  Indices:
--   * B-tree sobre `normalized_text` para la coincidencia EXACTA (Nivel A).
--   * GIN con `gin_trgm_ops` para la similitud (Nivel B, `pg_trgm`).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 1. KB_INTENCION  ->  a que tipo de consulta responde cada opcion del menu
--    `clave` es la identidad estable (no el id) para que el seed sea
--    idempotente y para poder comparar con el catalogo local.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kb_intencion (
    id              SERIAL PRIMARY KEY,
    clave           TEXT        NOT NULL UNIQUE,
    nombre          TEXT        NOT NULL,
    domain          TEXT        NOT NULL DEFAULT 'administrativo'
                            CHECK (domain IN ('administrativo', 'academico')),
    opcion_clave    TEXT        NOT NULL REFERENCES opcion_menu (clave)
                            ON UPDATE CASCADE ON DELETE RESTRICT,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  kb_intencion                IS 'Intenciones conversacionales; cada una reusa una opcion del menu (no inventan respuestas).';
COMMENT ON COLUMN kb_intencion.clave          IS 'Identidad estable de la intencion (ej: dias_cursada_TP).';
COMMENT ON COLUMN kb_intencion.domain         IS 'administrativo (trámites) | academico (materias).';
COMMENT ON COLUMN kb_intencion.opcion_clave   IS 'Opcion del menu que emite la respuesta autorizada.';
COMMENT ON COLUMN kb_intencion.activo         IS 'FALSE = fuera de la busqueda, sin borrar el registro.';

-- ---------------------------------------------------------------------------
-- 2. KB_PREGUNTA  ->  la formulacion canonica de la consulta
--    Una intencion puede tener varias preguntas (por ejemplo, una por materia
--    o una version corta y una larga); el ranking usa `priority`.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kb_pregunta (
    id                SERIAL PRIMARY KEY,
    intencion_id      INTEGER     NOT NULL REFERENCES kb_intencion (id) ON DELETE CASCADE,
    pregunta          TEXT        NOT NULL,
    respuesta_id      INTEGER     REFERENCES respuesta (id) ON DELETE SET NULL,
    priority          INTEGER     NOT NULL DEFAULT 0,
    minimum_threshold NUMERIC(4,3) NOT NULL DEFAULT 0.700
                              CHECK (minimum_threshold >= 0 AND minimum_threshold <= 1),
    activo            BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT kb_pregunta_uniq UNIQUE (intencion_id, pregunta)
);

CREATE INDEX IF NOT EXISTS kb_pregunta_intencion_idx ON kb_pregunta (intencion_id);

COMMENT ON TABLE  kb_pregunta                IS 'Formulaciones canonicas de una intencion.';
COMMENT ON COLUMN kb_pregunta.respuesta_id   IS 'Respuesta autorizada a emitir; NULL deriva en la opcion del menu.';
COMMENT ON COLUMN kb_pregunta.priority       IS 'Orden de presentacion cuando hay que pedir aclaracion (mayor primero).';
COMMENT ON COLUMN kb_pregunta.minimum_threshold IS 'Corte inferior de similitud para esta pregunta (calibrable, D04).';

-- ---------------------------------------------------------------------------
-- 3. KB_PREGUNTA_VARIANTE  ->  las formas en que se puede escribir
--    Una misma pregunta admite varias redacciones; `weight` pondera la
--    variante en el ranking. Las variantes genericas (sin materia, por
--    ejemplo "dias de cursada") se repiten en varias preguntas a proposito:
--    son las que permiten pedir aclaracion en vez de adivinar (D06).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kb_pregunta_variante (
    id              SERIAL PRIMARY KEY,
    pregunta_id     INTEGER     NOT NULL REFERENCES kb_pregunta (id) ON DELETE CASCADE,
    original_text   TEXT        NOT NULL,
    normalized_text TEXT        NOT NULL,
    weight          NUMERIC(3,2) NOT NULL DEFAULT 1.00
                            CHECK (weight > 0 AND weight <= 1),
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT kb_variante_uniq UNIQUE (pregunta_id, normalized_text)
);

-- Nivel A: coincidencia exacta por igualdad del texto normalizado.
CREATE INDEX IF NOT EXISTS kb_variante_normalized_idx
    ON kb_pregunta_variante (normalized_text);

-- Nivel B: similitud. El GIN acelera el filtro por `similarity(...) >= x`.
CREATE INDEX IF NOT EXISTS kb_variante_trgm_idx
    ON kb_pregunta_variante USING GIN (normalized_text gin_trgm_ops);

COMMENT ON TABLE  kb_pregunta_variante         IS 'Redacciones alternate de una pregunta, ya normalizadas.';
COMMENT ON COLUMN kb_pregunta_variante.weight IS 'Peso de la variante en el ranking (1.00 = formulacion canonica).';

-- ---------------------------------------------------------------------------
-- 4. Mantenimiento de `actualizado_en` en las tablas nuevas
--    Mismo trigger que 001_schema.sql, aplicado solo a las tablas KB para no
--    modificar el DDL original.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['kb_intencion', 'kb_pregunta', 'kb_pregunta_variante'] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_touch ON %1$I', t);
        EXECUTE format(
            'CREATE TRIGGER trg_%1$s_touch BEFORE UPDATE ON %1$I
             FOR EACH ROW EXECUTE FUNCTION touch_actualizado_en()', t);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Metricas: eventos del flujo de texto libre
--    Se amplian los valores admitidos por `metrica_opcion.evento`. Se borra
--    cualquier CHECK existente sobre esa columna antes de crear el nuevo, para
--    que el script sea idempotente y no dependa del nombre automatico.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    c TEXT;
    att SMALLINT;
BEGIN
    SELECT attnum INTO att
      FROM pg_attribute
     WHERE attrelid = 'metrica_opcion'::regclass
       AND attname  = 'evento';

    FOR c IN
        SELECT conname
          FROM pg_constraint
         WHERE conrelid = 'metrica_opcion'::regclass
           AND contype   = 'c'
           AND conkey    = ARRAY[att]
    LOOP
        EXECUTE format('ALTER TABLE metrica_opcion DROP CONSTRAINT %I', c);
    END LOOP;
END $$;

ALTER TABLE metrica_opcion
    ADD CONSTRAINT metrica_opcion_evento_ck
    CHECK (evento IN (
        'seleccion', 'documento_abierto', 'derivacion', 'reinicio', 'error',
        'texto_exacto', 'texto_similar', 'texto_regla', 'aclaracion', 'no_disponible'
    ));

COMMENT ON COLUMN metrica_opcion.evento IS
    'Resultado del turno: navegacion del menu o desenlace de una consulta escrita '
    '(texto_exacto, texto_similar, texto_regla, aclaracion, no_disponible).';

-- ---------------------------------------------------------------------------
-- 6. Vista de mantenimiento: que consultas se resuelven y cuales no
--    No guarda texto de los estudiantes: solo el origen del acierto.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_kb_resolucion AS
SELECT
    i.clave            AS intencion_clave,
    i.nombre           AS intencion_nombre,
    i.domain,
    i.opcion_clave     AS opcion_clave,
    p.priority         AS priority,
    p.minimum_threshold,
    p.pregunta,
    count(v.id)        AS variantes
FROM kb_intencion i
JOIN kb_pregunta p          ON p.intencion_id = i.id
LEFT JOIN kb_pregunta_variante v ON v.pregunta_id = p.id AND v.activo
WHERE i.activo AND p.activo
GROUP BY i.clave, i.nombre, i.domain, i.opcion_clave, p.id, p.priority, p.minimum_threshold, p.pregunta
ORDER BY i.domain, i.clave, p.priority DESC;

COMMENT ON VIEW v_kb_resolucion IS 'Cobertura de la base de conocimiento por intencion y pregunta.';