import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card } from "@components/ui/Card";

type ChartCardProps = {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  action?: ReactNode;
};

export const ChartCard = ({
  titulo,
  descripcion,
  children,
  action,
}: ChartCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Card className="chart-card">
        <header className="chart-card-header">
          <div className="chart-card-title-block">
            <h3>{titulo}</h3>
            {descripcion ? <p>{descripcion}</p> : null}
          </div>
          {action ? <div className="chart-card-action">{action}</div> : null}
        </header>
        <div className="chart-card-body">{children}</div>
      </Card>
    </motion.div>
  );
};
