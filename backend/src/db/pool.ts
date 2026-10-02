/**
 * Acceso a Neon PostgreSQL con el driver serverless.
 *
 * Por qué `@neondatabase/serverless` y no `pg`:
 *  - Neon autentica con SCRAM-SHA-256, que `node-postgres` no soporta. El
 *    driver serverless resuelve SCRAM con WebCrypto y habla HTTP directo
 *    (sin sockets TCP persistentes), que es lo que necesita un runtime
 *    serverless como el de Vercel.
 *  - No hace falta `pgPool` ni configuración de pool: cada consulta es un
 *    request HTTPS. Para transacciones interactivas Neon ofrece `Pool` sobre
 *    WebSocket, que no es necesario en este proyecto (todo son lecturas
 *    simples más un UPSERT de métricas).
 *
 * Si no hay `DATABASE_URL`, `getPool()` devuelve `null` y la capa de datos usa
 * el catálogo semilla local (modo demo), de modo que el proyecto se puede
 * levantar y demostrar sin infraestructura.
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { env, hasDatabase } from '../utils/env.js';

let sql: NeonQueryFunction<false, false> | null = null;
let warned = false;

export function getPool(): NeonQueryFunction<false, false> | null {
  if (!hasDatabase()) return null;
  if (!sql) {
    sql = neon(env.databaseUrl);
  }
  return sql;
}

export interface Resultado<T> {
  rows: T[];
  rowCount: number;
}

/**
 * Consulta parametrizada. Todas las llamadas del proyecto usan parámetros
 * `$1..$n`: no se concatena SQL con valores entrants.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<Resultado<T>> {
  const s = getPool();
  if (!s) {
    throw new Error('DATABASE_URL no configurada: se debe usar la capa de catálogo con semilla.');
  }

  const resultado = await s.query(text, params as never[]);
  const rows = (Array.isArray(resultado) ? resultado : resultado) as unknown as T[];
  return { rows, rowCount: rows.length };
}

/** Comprueba conectividad y existencia del esquema. */
export async function checkDatabase(): Promise<{ ok: boolean; detalle?: string }> {
  const s = getPool();
  if (!s) return { ok: false, detalle: 'DATABASE_URL no configurada (modo semilla)' };

  try {
    await s`SELECT 1`;
    const r = await query<{ n: number }>(
      `SELECT count(*)::int AS n
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('categoria','opcion_menu','respuesta','documento','contacto','contexto')`,
    );
    const total = r.rows[0]?.n ?? 0;
    if (total < 6) {
      return {
        ok: true,
        detalle: `Esquema incompleto: ${total}/6 tablas. Ejecutar db/001_schema.sql y db/002_seed.sql.`,
      };
    }
    return { ok: true, detalle: 'Esquema completo' };
  } catch (err) {
    return { ok: false, detalle: err instanceof Error ? err.message : 'Error desconocido' };
  }
}

/** El driver serverless no mantiene conexiones abiertas: no hay nada que cerrar. */
export async function closePool(): Promise<void> {
  sql = null;
}

export function logDbMode(): void {
  if (hasDatabase()) {
    console.log('[db] origen de datos: Neon PostgreSQL (@neondatabase/serverless)');
  } else if (!warned) {
    warned = true;
    console.warn('[db] DATABASE_URL no configurada -> usando catálogo semilla local (modo demo).');
  }
}
