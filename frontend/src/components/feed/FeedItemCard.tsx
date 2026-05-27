import { motion } from "framer-motion";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Mensaje, Sentimiento } from "@app-types/api";
import { formatRelativeTimeEs } from "@utils/time";
import { Card } from "@components/ui/Card";
import { StatChip } from "@components/ui/StatChip";

type FeedItemCardProps = {
  mensaje: Mensaje;
  onSelectSentimiento: (sentimiento: Sentimiento) => void;
  onSelectTema: (tema: string) => void;
};

const toSentimientoLabel = (sentimiento: Mensaje["sentimiento"]): string => {
  if (!sentimiento) {
    return "Sin clasificar";
  }

  if (sentimiento === "positivo") {
    return "Positivo";
  }

  if (sentimiento === "negativo") {
    return "Negativo";
  }

  return "Neutro";
};

const chipVariantBySentimiento = (sentimiento: Mensaje["sentimiento"]) => {
  if (sentimiento === "positivo") {
    return "positivo";
  }
  if (sentimiento === "negativo") {
    return "negativo";
  }
  if (sentimiento === "neutro") {
    return "neutro";
  }
  return "default";
};

const parseChannelAndNumber = (numeroRemitente: string) => {
  const [rawChannel, rawNumber = ""] = numeroRemitente.split(":");
  const channel = rawChannel
    ? rawChannel.charAt(0).toUpperCase() + rawChannel.slice(1).toLowerCase()
    : "Desconocido";

  const parsed = parsePhoneNumberFromString(rawNumber || numeroRemitente);
  const formattedNumber = parsed?.isValid()
    ? parsed.formatInternational()
    : rawNumber || numeroRemitente;

  return { channel, formattedNumber };
};

export const FeedItemCard = ({
  mensaje,
  onSelectSentimiento,
  onSelectTema,
}: FeedItemCardProps) => {
  const { channel, formattedNumber } = parseChannelAndNumber(
    mensaje.numero_remitente,
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="feed-item-card">
        <div className="feed-item-header">
          <div className="feed-item-chips">
            {mensaje.sentimiento ? (
              <StatChip
                label={toSentimientoLabel(mensaje.sentimiento)}
                variant={chipVariantBySentimiento(mensaje.sentimiento)}
                onClick={() => onSelectSentimiento(mensaje.sentimiento!)}
              />
            ) : (
              <StatChip label="Pendiente" />
            )}
            {mensaje.tema ? (
              <StatChip
                label={mensaje.tema}
                variant="tema"
                toneKey={mensaje.tema}
                onClick={() => onSelectTema(mensaje.tema!)}
              />
            ) : null}
          </div>
          <span className="feed-time">
            {formatRelativeTimeEs(mensaje.timestamp_epox)}
          </span>
        </div>
        <p className="feed-texto">{mensaje.texto_mensaje}</p>
        <p className="feed-origin">
          <span>
            Canal: <strong>{channel}</strong>
          </span>
          <span>
            Numero: <strong>{formattedNumber}</strong>
          </span>
        </p>
      </Card>
    </motion.div>
  );
};
