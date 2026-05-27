import { useQuery } from "@tanstack/react-query";
import { DateRange, MensajesQuery } from "@app-types/api";
import { apiClient } from "@services/apiClient";

const REFRESH_INTERVAL_MS = 15000;

export const queryKeys = {
  mensajes: (query: MensajesQuery) => ["mensajes", query] as const,
  sentimientos: () => ["sentimientos"] as const,
  temas: () => ["temas"] as const,
  temasRango: (range: DateRange) => ["temas-rango", range] as const,
};

export const useMensajesQuery = (query: MensajesQuery) => {
  return useQuery({
    queryKey: queryKeys.mensajes(query),
    queryFn: () => apiClient.getMensajes(query),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
};

export const useSentimientosQuery = () => {
  return useQuery({
    queryKey: queryKeys.sentimientos(),
    queryFn: () => apiClient.getSentimientos(),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
};

export const useTemasQuery = () => {
  return useQuery({
    queryKey: queryKeys.temas(),
    queryFn: () => apiClient.getTemas(),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
};
