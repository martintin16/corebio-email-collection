/**
 * Errores del backend, iguales en el servidor y en el navegador.
 *
 * El backend responde siempre `{ statusCode, message, code?, ... }`, con el
 * mensaje ya en español. `code` distingue los casos que el front muestra
 * distinto (ej. `RECIPIENT_LIMIT_EXCEEDED`, `TEMPLATE_NAME_TAKEN`,
 * `mailbox_needs_reconnect`); el resto de los campos (ej. `remaining`) van en
 * `details`.
 */

export interface ApiErrorInfo {
  status: number;
  code?: string;
  message: string;
  details: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details: Record<string, unknown>;

  constructor(info: ApiErrorInfo) {
    super(info.message);
    this.name = "ApiError";
    this.status = info.status;
    this.code = info.code;
    this.details = info.details;
  }

  get info(): ApiErrorInfo {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Resultado de una acción (enviar, guardar, borrar…). Las acciones no lanzan
 * el error: en producción Next oculta el mensaje de los errores que viajan del
 * servidor al navegador, y el formulario necesita el texto real del backend.
 */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: ApiErrorInfo };

/** Mensaje si el backend no mandó uno (o no se pudo leer). */
const FALLBACK_MESSAGES: Record<number, string> = {
  400: "Revisá los datos e intentá de nuevo.",
  401: "Tu sesión venció. Volvé a iniciar sesión.",
  403: "No tenés permiso para hacer esto.",
  404: "No encontramos lo que buscabas.",
  409: "No se pudo completar por un conflicto. Actualizá e intentá de nuevo.",
  413: "Los adjuntos superan los 20 MB en total.",
  429: "Hay demasiados pedidos seguidos. Probá en unos segundos.",
  502: "Google no respondió como se esperaba. Intentá de nuevo.",
  503: "El servicio no está disponible. Intentá de nuevo en un rato.",
};

const GENERIC_MESSAGE = "Algo salió mal. Intentá de nuevo.";

/** Lee la respuesta de error del backend y arma el ApiError. */
export async function apiErrorFrom(res: Response): Promise<ApiError> {
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await res.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    // Sin cuerpo JSON (ej. un proxy cortó la conexión): se usa el mensaje por defecto.
  }
  const { message, code, statusCode: _statusCode, error: _error, ...details } = body;
  // Las validaciones pueden venir como lista de mensajes.
  const text = Array.isArray(message)
    ? message.filter((m) => typeof m === "string").join(". ")
    : typeof message === "string"
      ? message
      : "";
  return new ApiError({
    status: res.status,
    code: typeof code === "string" ? code : undefined,
    message: text || FALLBACK_MESSAGES[res.status] || GENERIC_MESSAGE,
    details,
  });
}

/** Error de red (backend apagado, sin conexión). */
export function networkError(): ApiError {
  return new ApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message: "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.",
    details: {},
  });
}

/** La casilla necesita reconectarse con Google (token vencido o falta un permiso). */
export function isReconnectError(error: { code?: string }): boolean {
  return error.code === "mailbox_needs_reconnect" || error.code === "mailbox_missing_scope";
}
