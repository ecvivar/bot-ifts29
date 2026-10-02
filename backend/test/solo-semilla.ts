/**
 * Los tests corren SIEMPRE contra el catálogo semilla, nunca contra la base.
 *
 * Como `src/utils/env.ts` carga el `.env` de la raíz (para que el proyecto se
 * configure en un solo archivo), un `DATABASE_URL` presente ahí los mandaría a
 * Neon: los tests pasarían contra datos reales, dependerían de la red y no
 * podrían verificar el modo demo, que es justamente la mitad del contrato que
 * nos importa.
 *
 * `process.loadEnvFile()` no pisa las variables ya definidas en el entorno, así
 * que basta con vaciarla ANTES de que se importe cualquier módulo de la app.
 * En ESM el orden de evaluación de los `import` es el orden de declaración: por
 * eso este import tiene que ser el primero del archivo.
 *
 * Para probar la ruta de Neon: `npm run db:push` y `GET /api/health`.
 */

process.env.DATABASE_URL = '';