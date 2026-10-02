/**
 * Tests del motor de interpretacion (`interpretarConsulta`), de punta a punta
 * sobre el catalogo semilla.
 *
 * Verifica los cuatro desenlaces posibles y que NUNCA se emita una respuesta
 * inventada: el motor devuelve una intencion (o pide aclaracion), y el texto
 * institucional lo sigue emitiendo el flujo ya existente del menu.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Debe ir primero: vacia DATABASE_URL antes de que se importe la capa de datos.
import './solo-semilla.js';
import {
  MENSAJE_NO_DISPONIBLE,
  interpretarConsulta,
} from '../src/services/nl.service.js';
import { obtenerOpcion, seedData } from '../src/db/catalogo.js';

test('un saludo devuelve el menu raiz (respuesta autorizada, no generada)', async () => {
  const r = await interpretarConsulta('hola');
  assert.equal(r.clase, 'nodo');
  assert.equal(r.meta.source, 'rule');
  assert.equal(r.meta.matchType, 'regla');
  if (r.clase === 'nodo') {
    assert.ok(r.nodo.opciones.length > 0);
  }
});

test('una consulta exacta resuelve a la opcion del menu equivalente', async () => {
  const r = await interpretarConsulta('¿Cuándo empiezan las clases de Técnicas de Programación?');
  assert.equal(r.clase, 'opcion');
  assert.equal(r.meta.intent, 'dias_cursada_TP');
  assert.equal(r.meta.source, 'kb_question');
  assert.equal(r.meta.matchType, 'exacto');
  assert.equal(r.meta.confidence, 1);
  if (r.clase === 'opcion') {
    assert.equal(r.opcionClave, 'TP_OP_DIAS');
    assert.equal(r.evento, 'texto_exacto');
    // La opcion existe de verdad en el menu: no se inventan claves.
    const opcion = await obtenerOpcion(r.opcionClave);
    assert.equal(opcion.clave, 'TP_OP_DIAS');
    assert.notEqual(opcion.respuestaId, null);
  }
});

test('una consulta ambigua pide aclaracion con opciones reales del menu', async () => {
  const r = await interpretarConsulta('¿Cuándo empiezan las clases?');
  assert.equal(r.clase, 'aclaracion');
  assert.equal(r.meta.intent, null);
  if (r.clase === 'aclaracion') {
    assert.equal(r.aclaracion.opciones.length, 4);
    const clavesMenu = new Set(seedData.opciones.map((o) => o.clave));
    for (const op of r.aclaracion.opciones) {
      assert.ok(clavesMenu.has(op.clave), `opcion inexistente: ${op.clave}`);
    }
  }
});

test('la materia sola pide aclaracion entre los cuatro temas', async () => {
  const r = await interpretarConsulta('Técnicas de Programación');
  assert.equal(r.clase, 'aclaracion');
  if (r.clase === 'aclaracion') {
    const claves = r.aclaracion.opciones.map((o) => o.clave).sort();
    assert.deepEqual(claves, ['TP_OP_COND', 'TP_OP_CRONO', 'TP_OP_DIAS', 'TP_OP_PROG']);
  }
});

test('una consulta fuera del dominio responde que no hay informacion', async () => {
  for (const texto of ['¿Quién va a ganar el mundial?', 'cuánto cuesta la carrera', 'qué nota necesito para aprobar']) {
    const r = await interpretarConsulta(texto);
    assert.equal(r.clase, 'no_disponible', `se esperaba no_disponible para: ${texto}`);
    assert.equal(r.meta.confidence, 0);
    if (r.clase === 'no_disponible') {
      assert.equal(r.mensaje, MENSAJE_NO_DISPONIBLE);
    }
  }
});

test('el texto institucional solo sale del menu, nunca del motor', async () => {
  // El menu debe poder emitir la respuesta asociada a la opcion resuelta.
  const r = await interpretarConsulta('¿Cuál es el programa de Técnicas de Programación?');
  assert.equal(r.clase, 'opcion');
  if (r.clase !== 'opcion') return;

  const opcion = await obtenerOpcion(r.opcionClave);
  assert.equal(opcion.clave, 'TP_OP_PROG');
  assert.notEqual(opcion.respuestaId, null, 'la opcion resuelta no tiene respuesta institucional');
  assert.equal(r.meta.confidence, 1);
});