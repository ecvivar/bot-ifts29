/**
 * Handler serverless para Vercel.
 *
 * Vercel detecta el `export default` de una app Express y la invoca
 * directamente, sin necesidad de `listen`. El catch-all de `vercel.json`
 * (`/api/(.*) -> /api/index`) hace que todas las rutas de la API lleguen
 * aquí.
 */

import { app } from '../backend/src/app.js';

export default app;
