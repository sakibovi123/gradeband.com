/**
 * Browser-side helper for talking to the Express backend (:4099).
 * Server secrets never touch this file — only the public API URL is used.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4099";

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Fetch JSON from the backend. Pass `accessToken` (Supabase) to authenticate.
 * Throws ApiClientError with a user-readable message on non-2xx responses.
 */
export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  const { accessToken, headers, ...rest } = opts;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && String(body.error)) ||
      `Request failed (${res.status})`;
    throw new ApiClientError(res.status, message, (body as { details?: unknown })?.details);
  }
  return body as T;
}
