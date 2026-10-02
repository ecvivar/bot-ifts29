/**
 * Genera `db/005_kb_seed.sql` a partir de `seedKb` (`src/seed/conocimiento.ts`).
 *
 *   npm run db:kb --workspace backend
 *
 * Por que existe: el contenido de la KB vive en dos formatos (SQL para Neon y
 * TypeScript para el modo demo) porque la API tiene que funcionar sin
 * `DATABASE_URL`. Escribir las 120 variantes a mano en los dos lados es la
 * forma mas rapida de que se desalineen; este script las escribe una sola vez
 * desde la fuente TS.
 *
 * Es idempotente: el SQL generado usa `ON CONFLICT DO UPDATE`, asi que se puede
 * volver a aplicar sobre una base ya cargada.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { seedKb } from '../seed/conocimiento.js';

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = join(aqui, '..', '..', '..', 'db', '005_kb_seed.sql');

/** Literal SQL: duplica las comillas simples. */
const q = (s: string): string => `'${s.replace(/'/g, "''")}'`;
const n2 = (n: number): string => n.toFixed(2);
const n3 = (n: number): string => n.toFixed(3);

const preguntasPorId = new Map(seedKb.preguntas.map((p) => [p.id, p]));
const intencionesPorId = new Map(seedKb.intenciones.map((i) => [i.id, i]));
const claveDeIntencion = (id: number): string => intencionesPorId.get(id)!.key;

const L: string[] = [];

L.push('-- ============================================================================');
L.push('--  Asistente Virtual Institucional - IFTS N.29 (Syntax SRL)');
L.push('--  005_kb_seed.sql - Contenido inicial de la base de conocimiento');
L.push('--');
L.push('--  ESPEJO de `backend/src/seed/conocimiento.ts`, igual que `002_seed.sql` es');
L.push('--  espejo de `backend/src/seed/catalogo.ts`: sin `DATABASE_URL` la API resuelve');
L.push('--  con el catalogo local y los umbrales se comportan igual que en Neon.');
L.push('--');
L.push('--  GENERADO con `npm run db:kb --workspace backend`. No editar a mano:');
L.push('--  `backend/test/kb-seed.test.ts` falla si este archivo y el seed TS no');
L.push('--  coinciden exactamente.');
L.push('--');
L.push('--  Idempotente: se puede volver a aplicar sin duplicar filas.');
L.push('-- ============================================================================');
L.push('');
L.push('BEGIN;');
L.push('');
L.push('-- ---------------------------------------------------------------------------');
L.push(`-- 1. Intenciones (${seedKb.intenciones.length})`);
L.push('--    Cada una reusa una opcion del menu ya cargada por 002_seed.sql: el texto');
L.push('--    libre no agrega respuestas, localiza las existentes.');
L.push('-- ---------------------------------------------------------------------------');
L.push('INSERT INTO kb_intencion (clave, nombre, domain, opcion_clave, activo)');
L.push('VALUES');
L.push(
  seedKb.intenciones
    .map((i) => `    (${q(i.key)}, ${q(i.name)}, ${q(i.domain)}, ${q(i.opcion_clave)}, TRUE)`)
    .join(',\n') +
    '\nON CONFLICT (clave) DO UPDATE' +
    '\n   SET nombre       = EXCLUDED.nombre,' +
    "\n       domain       = EXCLUDED.domain," +
    '\n       opcion_clave = EXCLUDED.opcion_clave,' +
    '\n       activo       = TRUE;',
);
L.push('');
L.push('-- ---------------------------------------------------------------------------');
L.push(`-- 2. Preguntas (${seedKb.preguntas.length})`);
L.push('-- ---------------------------------------------------------------------------');
L.push('INSERT INTO kb_pregunta (intencion_id, pregunta, respuesta_id, priority, minimum_threshold, activo)');
L.push('SELECT i.id, d.pregunta, r.id, d.priority, d.minimum_threshold, TRUE');
L.push('  FROM (VALUES');
L.push(
  seedKb.preguntas
    .map(
      (p) =>
        `    (${q(claveDeIntencion(p.intencion_id))}::text, ${q(p.question)}::text, ` +
        `${q(p.respuesta_clave)}::text, ${p.priority}::integer, ${n3(p.minimum_threshold)}::numeric(4,3))`,
    )
    .join(',\n'),
);
L.push('  ) AS d(intencion_clave, pregunta, respuesta_clave, priority, minimum_threshold)');
L.push('  JOIN kb_intencion i    ON i.clave = d.intencion_clave');
L.push('  LEFT JOIN respuesta r ON r.clave = d.respuesta_clave AND r.activo');
L.push('ON CONFLICT (intencion_id, pregunta) DO UPDATE');
L.push('   SET respuesta_id      = EXCLUDED.respuesta_id,');
L.push('       priority          = EXCLUDED.priority,');
L.push('       minimum_threshold = EXCLUDED.minimum_threshold,');
L.push('       activo            = TRUE;');
L.push('');
L.push('-- ---------------------------------------------------------------------------');
L.push(`-- 3. Variantes (${seedKb.variantes.length})`);
L.push('--    `normalized_text` es el resultado del normalizador de la API');
L.push('--    (`backend/src/utils/normalizar.ts`): sin acentos, sin puntuacion, con');
L.push('--    espacios colapsados. Es el campo que indexan el b-tree (exacto) y el GIN');
L.push('--    trigram (similar).');
L.push('--');
L.push('--    Las variantes genericas estan repetidas en varias preguntas a proposito:');
L.push('--    son las que hacen que el motor pida ACLARACION en vez de adivinar (D06).');
L.push('-- ---------------------------------------------------------------------------');
L.push('INSERT INTO kb_pregunta_variante (pregunta_id, original_text, normalized_text, weight, activo)');
L.push('SELECT p.id, d.original_text, d.normalized_text, d.weight, TRUE');
L.push('  FROM (VALUES');
L.push(
  seedKb.variantes
    .map((v) => {
      const p = preguntasPorId.get(v.pregunta_id)!;
      return (
        `    (${q(claveDeIntencion(p.intencion_id))}::text, ${q(p.question)}::text, ` +
        `${q(v.original_text)}::text, ${q(v.normalized_text)}::text, ${n2(v.weight)}::numeric(3,2))`
      );
    })
    .join(',\n'),
);
L.push('  ) AS d(intencion_clave, pregunta, original_text, normalized_text, weight)');
L.push('  JOIN kb_intencion i ON i.clave    = d.intencion_clave');
L.push('  JOIN kb_pregunta  p ON p.pregunta = d.pregunta AND p.intencion_id = i.id');
L.push('ON CONFLICT (pregunta_id, normalized_text) DO UPDATE');
L.push('   SET original_text = EXCLUDED.original_text,');
L.push('       weight        = EXCLUDED.weight,');
L.push('       activo        = TRUE;');
L.push('');
L.push('COMMIT;');
L.push('');

await writeFile(destino, L.join('\n'), 'utf8');

console.log(
  `005_kb_seed.sql generado: ${seedKb.intenciones.length} intenciones, ` +
    `${seedKb.preguntas.length} preguntas, ${seedKb.variantes.length} variantes.`,
);