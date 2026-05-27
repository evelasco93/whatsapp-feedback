export type Sentimiento = "positivo" | "negativo" | "neutro";

export type Mensaje = {
  id: string;
  texto_mensaje: string;
  numero_remitente: string;
  timestamp_epox: number;
  sentimiento: Sentimiento | null;
  tema: string | null;
  resumen: string | null;
  estado_analisis: string;
  metadata: Record<string, unknown>;
};

export type ConteoBucket = {
  valor: string;
  total: number;
};

export type MensajesResponse = {
  items: Mensaje[];
  count: number;
};

export type ConteosResponse = {
  items: ConteoBucket[];
};

export type MensajesQuery = {
  sentimiento?: Sentimiento;
  tema?: string;
  desde?: number;
  hasta?: number;
  limit?: number;
};

export type DateRange = {
  desde: string;
  hasta: string;
};
