import { useQuery } from "@tanstack/react-query";
import { AggregateQuery, MensajesQuery } from "@app-types/api";
import { apiClient } from "@services/apiClient";

const REFRESH_INTERVAL_MS = 15000;

export const queryKeys = {
  mensajes: (query: MensajesQuery) => ["mensajes", query] as const,
  sentimientos: (query: AggregateQuery) => ["sentimientos", query] as const,
  temas: (query: AggregateQuery) => ["temas", query] as const,
};

export const useMensajesQuery = (query: MensajesQuery) => {
  return useQuery({
    queryKey: queryKeys.mensajes(query),
    queryFn: () => apiClient.getMensajes(query),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
};

export const useSentimientosQuery = (query: AggregateQuery) => {
  return useQuery({
    queryKey: queryKeys.sentimientos(query),
    queryFn: () => apiClient.getSentimientos(query),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
};

export const useTemasQuery = (query: AggregateQuery) => {
  return useQuery({
    queryKey: queryKeys.temas(query),
    queryFn: () => apiClient.getTemas(query),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
};
