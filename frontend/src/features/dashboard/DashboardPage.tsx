import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FeedItemCard } from "@components/feed/FeedItemCard";
import { DateRangeControls } from "@components/dashboard/DateRangeControls";
import { SentimentPieChart } from "@components/dashboard/SentimentPieChart";
import { TopicBarChart } from "@components/dashboard/TopicBarChart";
import { HowToUseDemo } from "@components/HowToUseDemo";
import { ChartCard } from "@components/ui/ChartCard";
import { SectionHeader } from "@components/ui/SectionHeader";
import { StatChip } from "@components/ui/StatChip";
import { useLiveUpdates } from "@hooks/useLiveUpdates";
import {
  useMensajesQuery,
  useSentimientosQuery,
  useTemasQuery,
} from "@services/queries";
import { ConteoBucket, DateRange, Mensaje, Sentimiento } from "@app-types/api";
import { toUnixRange } from "@utils/time";

const buildInitialRange = (): DateRange => {
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 6);

  return {
    desde: start.toISOString().slice(0, 10),
    hasta: now.toISOString().slice(0, 10),
  };
};

const aggregateTopics = (messages: Mensaje[]): ConteoBucket[] => {
  const bucket = messages.reduce<Record<string, number>>((acc, item) => {
    if (item.tema) {
      acc[item.tema] = (acc[item.tema] ?? 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(bucket)
    .map(([valor, total]) => ({ valor, total }))
    .sort((a, b) => b.total - a.total);
};

export const DashboardPage = () => {
  useLiveUpdates();

  const [sentimientoFilter, setSentimientoFilter] = useState<
    Sentimiento | undefined
  >(undefined);
  const [temaFilter, setTemaFilter] = useState<string | undefined>(undefined);
  const [range, setRange] = useState<DateRange>(buildInitialRange);

  const mensajesQuery = useMensajesQuery({
    sentimiento: sentimientoFilter,
    tema: temaFilter,
    limit: 50,
  });
  const sentimientosQuery = useSentimientosQuery();
  const temasQuery = useTemasQuery();
  const mensajesRangoQuery = useMensajesQuery({
    desde: toUnixRange(range.desde, false),
    hasta: toUnixRange(range.hasta, true),
    limit: 200,
  });

  const temasPorRango = useMemo(() => {
    if (!mensajesRangoQuery.data?.items?.length) {
      return temasQuery.data?.items ?? [];
    }
    return aggregateTopics(mensajesRangoQuery.data.items);
  }, [mensajesRangoQuery.data?.items, temasQuery.data?.items]);

  const hasError =
    mensajesQuery.isError ||
    sentimientosQuery.isError ||
    temasQuery.isError ||
    mensajesRangoQuery.isError;

  return (
    <div className="page-shell">
      <header className="hero">
        <p className="brand">Café de El Salvador</p>
        <h1>FeedBean</h1>
      </header>

      {hasError ? (
        <div className="state-error" role="alert">
          Ocurrio un error cargando datos. Verifica que el backend este en
          ejecucion.
        </div>
      ) : null}

      <section className="dashboard-grid">
        <ChartCard
          titulo="Distribucion de sentimientos"
          descripcion="Resumen global de mensajes clasificados."
        >
          {sentimientosQuery.isLoading && !sentimientosQuery.data ? (
            <div className="state-loading">Cargando sentimientos...</div>
          ) : sentimientosQuery.data?.items.length ? (
            <SentimentPieChart items={sentimientosQuery.data.items} />
          ) : (
            <div className="state-empty">Aun no hay datos de sentimientos.</div>
          )}
        </ChartCard>

        <ChartCard
          titulo="Frecuencia de temas por rango de fechas"
          descripcion="Selecciona un periodo y revisa los temas mas mencionados."
          action={<DateRangeControls value={range} onChange={setRange} />}
        >
          {mensajesRangoQuery.isLoading && !mensajesRangoQuery.data ? (
            <div className="state-loading">Cargando temas por rango...</div>
          ) : temasPorRango.length ? (
            <TopicBarChart items={temasPorRango} />
          ) : (
            <div className="state-empty">
              No hay temas para el rango seleccionado.
            </div>
          )}
        </ChartCard>
      </section>

      <section className="feed-section">
        <SectionHeader
          titulo="Feed reciente"
          subtitulo="Haz clic en los chips de sentimiento o tema para filtrar el feed."
          accion={
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setSentimientoFilter(undefined);
                setTemaFilter(undefined);
              }}
            >
              Limpiar filtros
            </button>
          }
        />

        <div className="active-filters">
          {sentimientoFilter ? (
            <StatChip
              label={`Sentimiento: ${sentimientoFilter}`}
              variant={sentimientoFilter}
              active
              onClick={() => setSentimientoFilter(undefined)}
            />
          ) : null}
          {temaFilter ? (
            <StatChip
              label={`Tema: ${temaFilter}`}
              variant="tema"
              active
              onClick={() => setTemaFilter(undefined)}
            />
          ) : null}
        </div>

        {mensajesQuery.isLoading && !mensajesQuery.data ? (
          <div className="state-loading">Cargando mensajes...</div>
        ) : null}

        {!mensajesQuery.isLoading && !mensajesQuery.data?.items.length ? (
          <div className="state-empty">
            No hay mensajes recientes para esos filtros.
          </div>
        ) : null}

        <motion.div layout className="feed-list">
          <AnimatePresence>
            {mensajesQuery.data?.items.map((mensaje) => (
              <FeedItemCard
                key={mensaje.id}
                mensaje={mensaje}
                onSelectSentimiento={(sentimiento) =>
                  setSentimientoFilter(sentimiento)
                }
                onSelectTema={(tema) => setTemaFilter(tema)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      <HowToUseDemo />
    </div>
  );
};
