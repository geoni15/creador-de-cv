import { localFetch } from "./localApi.js";

const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export const IS_LOCAL_MODE = import.meta.env.VITE_LOCAL_MODE === "1";

export async function apiFetch(path, options = {}) {
  if (IS_LOCAL_MODE) return localFetch(path, options);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "No se pudo completar la solicitud");
  }
  return data;
}
