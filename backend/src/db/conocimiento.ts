/**
 * Acceso a la base de conocimiento conversacional.
 *
 * Mismo patron que `db/catalogo.ts`: dos origenes con la misma interfaz.
 *   - `neon` : tablas `kb_*` reales (indice trigram de `pg_trgm`).
 *   - `seed` : espejo en memoria (`src/seed/conocimiento.ts`).
 *
 * Que la consulta se resuelva en Neon o en el catalogo local no cambia el
 * resultado: `similarity()` de `pg_trgm` y `similitudTrigram()` implementan el
 * mismo coeficiente sobre los mismos trigramas, de modo que los umbrales se
 * comportan igual en ambos modos.
 *
 * Ninguna consulta de este archivo devuelve texto de respuesta: solo claves.
 * El texto se recupera despues con `obtenerRespuesta()` / `obtenerOpcion()`,
 * que son las unicas vias autorizadas para emitir contenido institucional.
 */

import { query, getPool } from './pool.js';
import { seedData } from './catalogo.js';
import { seedKb } from '../seed/conocimiento.js';
import { similitudTrigram } from '../utils/normalizar.js';

/** Intencion + pregunta + variante que casan con la consulta. */
export interface CandidatoKb {
  intentKey: string;
  intentName: string;
  domain: 'administrativo' | 'academico';
  /** Opcion del menu que produce la misma respuesta autorizada. */
  opcionClave: string;
  /** Respuesta autorizada asociada a la pregunta (puede ser null). */
  respuestaId: number | null;
  preguntaId: number;
  question: string;
  priority: number;
  minimumThreshold: number;
  originalText: string;
  normalizedText: string;
  weight: number;
  /** Similitud 0..1 (pg_trgm en Neon, su equivalente en memoria). */
  similarity: number;
}

interface RawCandidato {
  intent_key: string;
  intent_name: string;
  domain: 'administrativo' | 'academico';
  opcion_clave: string | null;
  respuesta_id: number | null;
  pregunta_id: number;
  question: string;
  priority: number;
  minimum_threshold: string | number;
  original_text: string;
  normalized_text: string;
  weight: string | number;
  similarity: string | number;
}

const num = (v: string | number | null | undefined, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
};

/** Limite de candidatos que se traen de la base. La KB es chica; es un tope. */
const LIMITE_CANDIDATOS = 12;

/* ==========================================================================
 * Neon
 * ======================================================================== */

// El esquema usa nombres en castellano (`clave`, `nombre`, `pregunta`) y el
// seed de TypeScript nombres en ingles (`key`, `name`, `question`): se aliasea
// en el SELECT para que `RawCandidato` sea el mismo en los dos origenes.
const SQL_EXACTO = `
  SELECT i.clave    AS intent_key,
         i.nombre  AS intent_name,
         i.domain,
         i.opcion_clave,
         p.id      AS pregunta_id,
         p.pregunta AS question,
         p.priority,
         p.minimum_threshold,
         p.respuesta_id,
         v.original_text,
         v.normalized_text,
         v.weight,
         1.0::float8 AS similarity
    FROM kb_pregunta_variante v
    JOIN kb_pregunta  p ON p.id = v.pregunta_id AND p.activo
    JOIN kb_intencion i ON i.id = p.intencion_id AND i.activo
   WHERE v.activo
     AND v.normalized_text = $1
   ORDER BY p.priority DESC, v.weight DESC
   LIMIT $2`;

const SQL_SIMILARES = `
  SELECT i.clave    AS intent_key,
         i.nombre  AS intent_name,
         i.domain,
         i.opcion_clave,
         p.id      AS pregunta_id,
         p.pregunta AS question,
         p.priority,
         p.minimum_threshold,
         p.respuesta_id,
         v.original_text,
         v.normalized_text,
         v.weight,
         similarity(v.normalized_text, $1)::float8 AS similarity
    FROM kb_pregunta_variante v
    JOIN kb_pregunta  p ON p.id = v.pregunta_id AND p.activo
    JOIN kb_intencion i ON i.id = p.intencion_id AND i.activo
   WHERE v.activo
     AND similarity(v.normalized_text, $1) >= $2
   ORDER BY similarity DESC, p.priority DESC, v.weight DESC
   LIMIT $3`;

const toCandidato = (r: RawCandidato): CandidatoKb => ({
  intentKey: r.intent_key,
  intentName: r.intent_name,
  domain: r.domain,
  opcionClave: r.opcion_clave ?? '',
  respuestaId: r.respuesta_id,
  preguntaId: r.pregunta_id,
  question: r.question,
  priority: num(r.priority),
  minimumThreshold: num(r.minimum_threshold, 0.7),
  originalText: r.original_text,
  normalizedText: r.normalized_text,
  weight: num(r.weight, 1),
  similarity: num(r.similarity),
});

/* ==========================================================================
 * Seed
 * ======================================================================== */

/** Respuestas del catalogo local, para traducir `respuesta.clave` a id. */
function idRespuestaLocal(respuestaClave: string | null): number | null {
  if (!respuestaClave) return null;
  const r = seedData.respuestas.find((x) => x.clave === respuestaClave && x.activo);
  return r?.id ?? null;
}

/**
 * Ranqueo en memoria.
 *
 * `soloExactos` replica el `WHERE v.normalized_text = $1` de Neon. No se puede
 * implementarlo como "similitud >= 1": dos textos distintos con los mismos
 * trigramas dan 1 (p. ej. "tecnicas de programacion" y "programacion de
 * tecnicas"), y en Neon eso NO es una coincidencia exacta.
 */
function candidatosSeed(
  normalizado: string,
  minimo: number,
  soloExactos = false,
): CandidatoKb[] {
  const preguntasPorId = new Map(seedKb.preguntas.map((p) => [p.id, p]));
  const intencionesPorId = new Map(seedKb.intenciones.map((i) => [i.id, i]));

  const salida: CandidatoKb[] = [];
  for (const v of seedKb.variantes) {
    if (!v.activo) continue;
    const esExacto = v.normalized_text === normalizado;
    if (soloExactos && !esExacto) continue;

    const p = preguntasPorId.get(v.pregunta_id);
    if (!p || !p.activo) continue;
    const i = intencionesPorId.get(p.intencion_id);
    if (!i || !i.activo) continue;

    const similarity = esExacto ? 1 : similitudTrigram(normalizado, v.normalized_text);
    if (!soloExactos && similarity < minimo) continue;

    salida.push({
      intentKey: i.key,
      intentName: i.name,
      domain: i.domain,
      opcionClave: i.opcion_clave,
      respuestaId: idRespuestaLocal(p.respuesta_clave),
      preguntaId: p.id,
      question: p.question,
      priority: p.priority,
      minimumThreshold: p.minimum_threshold,
      originalText: v.original_text,
      normalizedText: v.normalized_text,
      weight: v.weight,
      similarity,
    });
  }

  return salida.sort(
    (a, b) => b.similarity - a.similarity || b.priority - a.priority || b.weight - a.weight,
  );
}

/* ==========================================================================
 * API publica
 * ======================================================================== */

/**
 * Coincidencia exacta sobre el texto normalizado.
 *
 * Un mismo texto puede pertenecer a varias intenciones (las variantes
 * genericas se repiten en las cuatro materias): se devuelven TODAS para que el
 * motor pueda pedir aclaracion en vez de elegir una.
 */
export async function buscarExacto(normalizado: string): Promise<CandidatoKb[]> {
  if (normalizado.length === 0) return [];

  if (getPool()) {
    const r = await query<RawCandidato>(SQL_EXACTO, [normalizado, LIMITE_CANDIDATOS]);
    return r.rows.map(toCandidato);
  }

  return candidatosSeed(normalizado, 0, true).slice(0, LIMITE_CANDIDATOS);
}

/**
 * Candidatos por similitud trigram (Nivel B). `minimo` es el corte inferior:
 * lo que queda por debajo se considera "no disponible" y ni se rankea.
 */
export async function buscarSimilares(
  normalizado: string,
  minimo: number,
  limite = LIMITE_CANDIDATOS,
): Promise<CandidatoKb[]> {
  if (normalizado.length === 0) return [];

  if (getPool()) {
    const r = await query<RawCandidato>(SQL_SIMILARES, [normalizado, minimo, limite]);
    return r.rows.map(toCandidato);
  }

  return candidatosSeed(normalizado, minimo).slice(0, limite);
}
