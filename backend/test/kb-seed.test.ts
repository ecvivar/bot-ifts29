/**
 * Paridad entre las dos caras de la base de conocimiento.
 *
 * El contenido vive en `backend/src/seed/conocimiento.ts` (modo demo) y en
 * `db/005_kb_seed.sql` (Neon). Si se desalinean, el chatbot responde una cosa
 * en produccion y otra en la demo, que es justo lo que no debe pasar.
 *
 * Estos tests fallan si alguien edita un lado y olvida el otro.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { seedKb } from '../src/seed/conocimiento.js';
import { seedData } from '../src/db/catalogo.js';

const aqui = dirname(fileURLToPath(import.meta.url));
const sql = await readFile(join(aqui, '..', '..', 'db', '005_kb_seed.sql'), 'utf8');

const preguntasPorId = new Map(seedKb.preguntas.map((p) => [p.id, p]));
const intencionesPorId = new Map(seedKb.intenciones.map((i) => [i.id, i]));

test('el SQL contiene cada intencion', () => {
  for (const i of seedKb.intenciones) {
    assert.ok(
      sql.includes(`('${i.key}', '${i.name}', '${i.domain}', '${i.opcion_clave}',`),
      `falta la intencion ${i.key} en 005_kb_seed.sql`,
    );
  }
});

test('el SQL contiene cada pregunta con su umbral', () => {
  for (const p of seedKb.preguntas) {
    const clave = intencionesPorId.get(p.intencion_id)!.key;
    const fila =
      `('${clave}'::text, '${p.question}'::text, '${p.respuesta_clave}'::text, ` +
      `${p.priority}::integer, ${p.minimum_threshold.toFixed(3)}::numeric(4,3))`;
    assert.ok(sql.includes(fila), `falta la pregunta de ${clave}: ${p.question}`);
  }
});

test('el SQL contiene cada variante ya normalizada', () => {
  for (const v of seedKb.variantes) {
    const p = preguntasPorId.get(v.pregunta_id)!;
    const clave = intencionesPorId.get(p.intencion_id)!.key;
    const fila =
      `('${clave}'::text, '${p.question}'::text, '${v.original_text}'::text, ` +
      `'${v.normalized_text}'::text, ${v.weight.toFixed(2)}::numeric(3,2))`;
    assert.ok(sql.includes(fila), `falta la variante "${v.original_text}" de ${clave}`);
  }
});

test('el encabezado del SQL declara las cantidades reales', () => {
  assert.ok(sql.includes(`-- 1. Intenciones (${seedKb.intenciones.length})`));
  assert.ok(sql.includes(`-- 2. Preguntas (${seedKb.preguntas.length})`));
  assert.ok(sql.includes(`-- 3. Variantes (${seedKb.variantes.length})`));
});

test('toda intencion apunta a opciones y respuestas que ya existen', () => {
  const opciones = new Set(seedData.opciones.filter((o) => o.activo).map((o) => o.clave));
  const respuestas = new Set(seedData.respuestas.filter((r) => r.activo).map((r) => r.clave));

  for (const i of seedKb.intenciones) {
    assert.ok(opciones.has(i.opcion_clave), `${i.key}: opcion inexistente ${i.opcion_clave}`);
    assert.ok(respuestas.has(i.respuesta_clave), `${i.key}: respuesta inexistente ${i.respuesta_clave}`);
  }
  for (const p of seedKb.preguntas) {
    assert.ok(respuestas.has(p.respuesta_clave), `pregunta sin respuesta: ${p.question}`);
  }
});

test('no hay variantes duplicadas dentro de la misma pregunta', () => {
  // El indice unico es (pregunta_id, normalized_text): dos redacciones que
  // normalizan igual romperian el ON CONFLICT del seed.
  for (const p of seedKb.preguntas) {
    const norm = seedKb.variantes
      .filter((v) => v.pregunta_id === p.id)
      .map((v) => v.normalized_text);
    const repetidos = norm.filter((t, idx) => norm.indexOf(t) !== idx);
    assert.deepEqual(repetidos, [], `variantes repetidas en: ${p.question}`);
  }
});

test('cada INSERT del seed es idempotente', () => {
  // Sin `ON CONFLICT`, un segundo `npm run db:push` falla con
  // "duplicate key value violates unique constraint" y deja la base a medias.
  const inserts = [...sql.matchAll(/INSERT INTO\s+(\w+)[\s\S]*?;/g)];
  assert.equal(inserts.length, 3, 'se esperaban 3 sentencias INSERT en 005_kb_seed.sql');

  for (const coincidencia of inserts) {
    const [, tabla] = coincidencia;
    assert.ok(
      coincidencia[0].includes('ON CONFLICT'),
      `el INSERT de ${tabla} no tiene ON CONFLICT: db:push no seria idempotente`,
    );
  }

  // Y que los indices unicos que se usan sean los reales del esquema.
  assert.ok(sql.includes('ON CONFLICT (clave) DO UPDATE'));
  assert.ok(sql.includes('ON CONFLICT (intencion_id, pregunta) DO UPDATE'));
  assert.ok(sql.includes('ON CONFLICT (pregunta_id, normalized_text) DO UPDATE'));
});

test('el SQL no tiene BOM', () => {
  // Un BOM hace fallar `psql -f` y la carga multi-sentencia con un error de
  // sintaxis en un caracter invisible.
  assert.equal(sql.charCodeAt(0) === 0xfeff, false, '005_kb_seed.sql arranca con BOM');
});