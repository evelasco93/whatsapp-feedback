import {
  ConteosResponse,
  MensajesQuery,
  MensajesResponse,
} from "@app-types/api";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

const toQueryString = (
  params: Record<string, string | number | undefined>,
): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const result = search.toString();
  return result ? `?${result}` : "";
};

const request = async <T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> => {
  const query = params ? toQueryString(params) : "";
  const response = await fetch(`${API_BASE_URL}${path}${query}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }

  return (await response.json()) as T;
};

export const apiClient = {
  baseUrl: API_BASE_URL,
  getMensajes: (query: MensajesQuery): Promise<MensajesResponse> => {
    return request<MensajesResponse>("/api/mensajes", {
      sentimiento: query.sentimiento,
      tema: query.tema,
      desde: query.desde,
      hasta: query.hasta,
      limit: query.limit ?? 50,
    });
  },
  getSentimientos: (): Promise<ConteosResponse> => {
    return request<ConteosResponse>("/api/sentimientos");
  },
  getTemas: (): Promise<ConteosResponse> => {
    return request<ConteosResponse>("/api/temas");
  },
};
