import { auth } from "@/lib/firebase/client";
import { env } from "@/lib/config/env";

/**
 * Core API client - the ONLY place in the frontend that calls our FastAPI
 * backend directly. Every feature's lib/api/<feature>.ts file builds on
 * top of the functions exported here, rather than calling fetch() itself.
 *
 * Why centralize this:
 * 1. Auth - every authenticated request needs a fresh Firebase ID token
 *    attached as a Bearer header. Getting this right in one place means
 *    every feature gets it right automatically, instead of each feature
 *    file remembering to call getIdToken() itself (easy to forget, easy
 *    to get subtly wrong - e.g. using a stale cached token).
 * 2. Error normalization - the backend's exception handlers (see backend
 *    app/core/exceptions.py) return a consistent
 *    { error: { code, message, details } } JSON shape on failure. This
 *    client parses that shape once and throws a typed ApiError, so every
 *    feature's error handling looks the same regardless of which endpoint
 *    failed.
 * 3. Base URL - one place reads NEXT_PUBLIC_API_BASE_URL, not scattered
 *    across every feature file.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Thrown specifically when the network request itself fails (backend
 * unreachable, CORS misconfiguration, offline) - distinct from ApiError,
 * which means the backend WAS reached but returned an error response.
 * Features care about this distinction: "service is down" reads
 * differently in the UI than "your request was invalid." */
export class NetworkError extends Error {
  constructor(message = "Could not reach the server. Check your connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}

interface BackendErrorPayload {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

function isBackendErrorPayload(value: unknown): value is BackendErrorPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "object"
  );
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {};
  }
  // getIdToken() returns the cached token if it's still valid, and
  // transparently refreshes it if expired - we never need to manage
  // token expiry ourselves.
  const token = await currentUser.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

interface RequestOptions {
  /** Set false for endpoints that don't require auth (rare - most of
   * this app's backend routes require a signed-in user). */
  authenticated?: boolean;
  signal?: AbortSignal;
}

async function request<TResponse>(
  path: string,
  init: RequestInit,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { authenticated = true, signal } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body && !(init.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  if (authenticated) {
    Object.assign(headers, await getAuthHeader());
  }

  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
      ...init,
      headers,
      signal,
    });
  } catch {
    // fetch() throws (not rejects-with-a-response) when the network
    // request can't even complete - server down, no internet, CORS
    // preflight rejected, DNS failure, etc.
    throw new NetworkError();
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isBackendErrorPayload(payload)) {
      throw new ApiError(
        payload.error.message,
        payload.error.code,
        response.status,
        payload.error.details ?? {},
      );
    }
    // Backend returned a non-JSON or unexpected-shape error body (e.g.
    // a raw 502 from a proxy in front of the backend). Fall back to a
    // generic ApiError rather than crashing on payload.error access.
    throw new ApiError(
      "The server returned an unexpected error.",
      "UNKNOWN_ERROR",
      response.status,
    );
  }

  return payload as TResponse;
}

export const apiClient = {
  get<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
    return request<TResponse>(path, { method: "GET" }, options);
  },

  post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return request<TResponse>(
      path,
      { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined },
      options,
    );
  },

  /** For file uploads (e.g. disaster image analysis) - takes a FormData
   * body directly so the browser sets the correct multipart Content-Type
   * with boundary, which we must NOT override manually. */
  postFormData<TResponse>(
    path: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return request<TResponse>(path, { method: "POST", body: formData }, options);
  },

  patch<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return request<TResponse>(
      path,
      { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined },
      options,
    );
  },

  delete<TResponse = void>(path: string, options?: RequestOptions): Promise<TResponse> {
    return request<TResponse>(path, { method: "DELETE" }, options);
  },
};
