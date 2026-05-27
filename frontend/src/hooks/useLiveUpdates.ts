import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@services/apiClient";

const IGNORED_EVENTS = new Set(["heartbeat"]);

export const useLiveUpdates = (): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const stream = new EventSource(`${apiClient.baseUrl}/api/stream`);

    const refresh = (): void => {
      void queryClient.invalidateQueries({ queryKey: ["mensajes"] });
      void queryClient.invalidateQueries({ queryKey: ["sentimientos"] });
      void queryClient.invalidateQueries({ queryKey: ["temas"] });
    };

    const onEvent = (eventName: string): void => {
      if (!IGNORED_EVENTS.has(eventName)) {
        refresh();
      }
    };

    stream.onmessage = () => onEvent("message");
    stream.addEventListener("mensaje_ingresado", () =>
      onEvent("mensaje_ingresado"),
    );
    stream.addEventListener("mensaje_actualizado", () =>
      onEvent("mensaje_actualizado"),
    );
    stream.addEventListener("heartbeat", () => onEvent("heartbeat"));
    stream.onerror = () => {
      stream.close();
    };

    return () => {
      stream.close();
    };
  }, [queryClient]);
};
