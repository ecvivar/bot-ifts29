/**
 * Tests de la base de conocimiento en modo semilla (sin `DATABASE_URL`).
 *
 * Comprueban los dos niveles de matching y, sobre todo, que la ambiguedad se
 * PRESERVE: una variante generica compartida tiene que devolver varias
 * intenciones (para que el motor pida aclaracion) y una consulta calificada con
 * la materia tiene que devolver una sola.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Debe ir primero: vacia DATABASE_URL antes de que se importe la capa de datos.
import './solo-semilla.js';
import { buscarExacto, buscarSimilares } from '../src/db/conocimiento.js';
import { normalizar } from '../src/utils/normalizar.js';
import { hasDatabase } from '../src/utils/env.js';

const claves = (c: Array<{ intentKey: string }>): string[] => [...new Set(c.map((x) => x.intentKey))].sort();

test('los tests se ejecutan contra el catálogo semilla, no contra la base', () => {
  // Guarda contra regresiones: si un `.env` con DATABASE_URL se colara en la
  // suite, estos tests estarian midiendo Neon y no el modo demo.
  assert.equal(hasDatabase(), false, 'la suite debe correr sin DATABASE_URL');
});

test('las variantes genericas devuelven varias intenciones (aclaracion)', async () => {
  const caso = await buscarExacto(normalizar('programa'));
  assert.equal(claves(caso).length, 4);
  assert.deepEqual(claves(caso), ['programa_ABD', 'programa_EAM', 'programa_LC', 'programa_TP']);

  const dias = await buscarExacto(normalizar('¿Cuándo empiezan las clases?'));
  assert.deepEqual(claves(dias), [
    'dias_cursada_ABD',
    'dias_cursada_EAM',
    'dias_cursada_LC',
    'dias_cursada_TP',
  ]);

  const condiciones = await buscarExacto(normalizar('condiciones de aprobación'));
  assert.equal(claves(condiciones).length, 4);
});

test('el nombre de una materia abre los cuatro temas de esa materia', async () => {
  const caso = await buscarExacto(normalizar('Técnicas de Programación'));
  assert.deepEqual(claves(caso), [
    'condiciones_TP',
    'cronograma_TP',
    'dias_cursada_TP',
    'programa_TP',
  ]);
});

test('la consulta larga con materia resuelve un unico tema', async () => {
  const caso = await buscarExacto(normalizar('¿Cuándo empiezan las clases de Técnicas de Programación?'));
  assert.deepEqual(claves(caso), ['dias_cursada_TP']);

  const programa = await buscarExacto(normalizar('¿Cuál es el programa de Técnicas de Programación?'));
  assert.deepEqual(claves(programa), ['programa_TP']);

  const cronograma = await buscarExacto(normalizar('cronograma de Lógica Computacional'));
  assert.deepEqual(claves(cronograma), ['cronograma_LC']);
});

test('la coincidencia exacta es igualdad de texto normalizado', async () => {
  // Mismo conjunto de trigramas que "Técnicas de Programación" pero distinto
  // texto: NO es una coincidencia exacta (tampoco en Neon).
  const caso = await buscarExacto(normalizar('programacion de tecnicas'));
  assert.equal(caso.length, 0);
});

test('las consultas fuera del dominio no llegan a candidatos', async () => {
  for (const texto of ['¿Quién va a ganar el mundial?', 'cuánto cuesta la carrera', 'quién es mi profesor']) {
    const similares = await buscarSimilares(normalizar(texto), 0.7);
    assert.equal(similares.length, 0, `candidatos inesperados para: ${texto}`);
  }
});

test('un error de tipeo encuentra la variante por similitud', async () => {
  const similares = await buscarSimilares(normalizar('cuando empiesan las clases de tecnicas de programacion'), 0.7);
  assert.equal(claves(similares)[0], 'dias_cursada_TP');
});

test('toda intencion apunta a una opcion y a una respuesta autorizada', async () => {
  const casos = await buscarExacto(normalizar('inscripción a materias'));
  assert.ok(casos.length > 0);
  for (const c of casos) {
    assert.ok(c.opcionClave.length > 0, `${c.intentKey} sin opcion de menu`);
    assert.ok(c.respuestaId !== null, `${c.intentKey} sin respuesta asociada`);
  }
});