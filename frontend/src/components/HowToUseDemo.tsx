import { motion } from "framer-motion";
import { Card } from "@components/ui/Card";
import { SectionHeader } from "@components/ui/SectionHeader";

export const HowToUseDemo = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="how-to-card">
        <SectionHeader
          titulo="Como usar este demo"
          subtitulo="Envia mensajes por WhatsApp y observa como se actualiza el dashboard en tiempo real."
        />
        <ol className="how-to-list">
          <li>
            Escribe al numero de sandbox de Twilio:{" "}
            <strong>+14155238886</strong>.
          </li>
          <li>
            Si es tu primera vez, envia el codigo:{" "}
            <strong>join solid-track</strong>.
          </li>
          <li>
            Luego manda cualquier feedback. El panel lo mostrara en vivo via{" "}
            <strong>SSE</strong> y, si hay cortes, se recupera por{" "}
            <strong>polling cada 15 segundos</strong>.
          </li>
        </ol>
      </Card>
    </motion.section>
  );
};
