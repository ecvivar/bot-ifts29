/** Error de negocio con status HTTP asociado. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown): HttpError =>
  new HttpError(400, 'BAD_REQUEST', message, details);

/**
 * Entrada invalida en el cuerpo de la peticion.
 *
 * Codigo propio (`VALIDATION_ERROR`) para poder distinguir un `message` mal
 * formado de un error generico, sin cambiar el status ni el formato de la
 * respuesta que ya consume el widget.
 */
export const validationError = (message: string, details?: unknown): HttpError =>
  new HttpError(400, 'VALIDATION_ERROR', message, details);

export const notFound = (message = 'Recurso no encontrado'): HttpError =>
  new HttpError(404, 'NOT_FOUND', message);

export const unauthorized = (message = 'No autorizado'): HttpError =>
  new HttpError(401, 'UNAUTHORIZED', message);

export const tooManyRequests = (message = 'Demasiadas consultas, probá en un momento.'): HttpError =>
  new HttpError(429, 'RATE_LIMITED', message);
