import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Frown, Meh, Smile } from "lucide-react";
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
import {
  AggregateQuery,
  DateRange,
  PeriodoFiltro,
  Sentimiento,
} from "@app-types/api";
import { toUnixRange } from "@utils/time";

const VALID_SENTIMIENTOS = ["positivo", "negativo", "neutro"] as const;
const VALID_PERIODOS: PeriodoFiltro[] = [
  "all",
  "30d",
  "15d",
  "7d",
  "ayer",
  "hoy",
  "rango",
];

const toISODate = (value: Date): string => value.toISOString().slice(0, 10);

const buildDefaultCustomRange = (): DateRange => {
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 6);

  return {
    desde: toISODate(start),
    hasta: toISODate(now),
  };
};

const isDateISO = (value: string | null): value is string => {
  if (!value) {
    return false;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const parseSentimiento = (value: string | null): Sentimiento | undefined => {
  if (!value) {
    return undefined;
  }
  if (VALID_SENTIMIENTOS.includes(value as Sentimiento)) {
    return value as Sentimiento;
  }
  return undefined;
};

const parsePeriodo = (value: string | null): PeriodoFiltro => {
  if (!value) {
    return "all";
  }
  if (VALID_PERIODOS.includes(value as PeriodoFiltro)) {
    return value as PeriodoFiltro;
  }
  return "all";
};

const resolveTimeframeRange = (periodo: PeriodoFiltro, custom: DateRange) => {
  if (periodo === "all") {
    return {};
  }

  const end = new Date();
  const start = new Date(end);

  if (periodo === "30d") {
    start.setDate(end.getDate() - 29);
  } else if (periodo === "15d") {
    start.setDate(end.getDate() - 14);
  } else if (periodo === "7d") {
    start.setDate(end.getDate() - 6);
  } else if (periodo === "ayer") {
    start.setDate(end.getDate() - 1);
    end.setDate(end.getDate() - 1);
  }

  if (periodo === "rango") {
    return {
      desde: toUnixRange(custom.desde, false),
      hasta: toUnixRange(custom.hasta, true),
    };
  }

  return {
    desde: toUnixRange(toISODate(start), false),
    hasta: toUnixRange(toISODate(end), true),
  };
};

const readInitialFilters = () => {
  const params = new URLSearchParams(window.location.search);
  const defaultRange = buildDefaultCustomRange();
  const periodo = parsePeriodo(params.get("periodo"));
  const desdeParam = params.get("desde");
  const hastaParam = params.get("hasta");

  return {
    sentimiento: parseSentimiento(params.get("sentimiento")),
    tema: params.get("tema") || undefined,
    periodo,
    range:
      periodo === "rango" && isDateISO(desdeParam) && isDateISO(hastaParam)
        ? { desde: desdeParam, hasta: hastaParam }
        : defaultRange,
  };
};

const toPct = (value: number, total: number) => {
  if (total <= 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const DashboardPage = () => {
  useLiveUpdates();

  const initialFilters = useMemo(() => readInitialFilters(), []);

  const [sentimientoFilter, setSentimientoFilter] = useState<
    Sentimiento | undefined
  >(initialFilters.sentimiento);
  const [temaFilter, setTemaFilter] = useState<string | undefined>(
    initialFilters.tema,
  );
  const [periodo, setPeriodo] = useState<PeriodoFiltro>(initialFilters.periodo);
  const [range, setRange] = useState<DateRange>(initialFilters.range);

  const timeframeQuery = useMemo<AggregateQuery>(() => {
    return resolveTimeframeRange(periodo, range);
  }, [periodo, range]);

  const mensajesQuery = useMensajesQuery({
    sentimiento: sentimientoFilter,
    tema: temaFilter,
    ...timeframeQuery,
    limit: 50,
  });
  const sentimientosQuery = useSentimientosQuery(timeframeQuery);
  const temasQuery = useTemasQuery(timeframeQuery);

  useEffect(() => {
    const params = new URLSearchParams();
    if (sentimientoFilter) {
      params.set("sentimiento", sentimientoFilter);
    }
    if (temaFilter) {
      params.set("tema", temaFilter);
    }
    params.set("periodo", periodo);
    if (periodo === "rango") {
      params.set("desde", range.desde);
      params.set("hasta", range.hasta);
    }

    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, [periodo, range.desde, range.hasta, sentimientoFilter, temaFilter]);

  const hasError =
    mensajesQuery.isError || sentimientosQuery.isError || temasQuery.isError;

  const resumenPildoras = useMemo(() => {
    const sentimientoItems = sentimientosQuery.data?.items ?? [];
    const temasItems = temasQuery.data?.items ?? [];

    const totalSentimientos = sentimientoItems.reduce(
      (acc, item) => acc + item.total,
      0,
    );
    const totalTemas = temasItems.reduce((acc, item) => acc + item.total, 0);

    const topTema = [...temasItems].sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      return a.valor.localeCompare(b.valor, "es");
    })[0];

    const getSentCount = (key: string) =>
      sentimientoItems.find((item) => item.valor === key)?.total ?? 0;

    return {
      topTemaLabel: topTema?.valor ?? "Sin datos",
      topTemaPct: toPct(topTema?.total ?? 0, totalTemas),
      positivoPct: toPct(getSentCount("positivo"), totalSentimientos),
      negativoPct: toPct(getSentCount("negativo"), totalSentimientos),
      neutroPct: toPct(getSentCount("neutro"), totalSentimientos),
    };
  }, [sentimientosQuery.data?.items, temasQuery.data?.items]);

  const sentimentMeter = useMemo(() => {
    const sentimientoItems = sentimientosQuery.data?.items ?? [];
    const getSentCount = (key: string) =>
      sentimientoItems.find((item) => item.valor === key)?.total ?? 0;

    const positivo = getSentCount("positivo");
    const negativo = getSentCount("negativo");
    const neutro = getSentCount("neutro");
    const total = positivo + negativo + neutro;

    if (total <= 0) {
      return {
        indicatorPct: 50,
        mood: "neutro" as const,
        summary: "Sin datos suficientes",
      };
    }

    const score = (positivo - negativo) / total;
    const indicatorPct = Math.round(((score + 1) / 2) * 100);

    if (indicatorPct < 40) {
      return {
        indicatorPct,
        mood: "negativo" as const,
        summary: "Predomina sentimiento negativo",
      };
    }

    if (indicatorPct <= 60) {
      return {
        indicatorPct,
        mood: "neutro" as const,
        summary: "Sentimiento balanceado",
      };
    }

    return {
      indicatorPct,
      mood: "positivo" as const,
      summary: "Predomina sentimiento positivo",
    };
  }, [sentimientosQuery.data?.items]);

  const MoodIcon =
    sentimentMeter.mood === "negativo"
      ? Frown
      : sentimentMeter.mood === "neutro"
        ? Meh
        : Smile;

  return (
    <div className="page-shell">
      <header className="hero">
        <div className="hero-brand-row">
          <div>
            <p className="brand">Café de El Salvador</p>
            <h1>FeedBean</h1>
          </div>
          <img className="hero-logo" src="/logo.png" alt="Logo FeedBean" />
        </div>
      </header>

      {hasError ? (
        <div className="state-error" role="alert">
          Ocurrio un error cargando datos. Verifica que el backend este en
          ejecucion.
        </div>
      ) : null}

      <section className="sentiment-meter" aria-label="Pulso de sentimiento">
        <div className="sentiment-meter-head">
          <h2>Pulso de sentimiento</h2>
        </div>
        <div className="sentiment-meter-visual" role="presentation">
          <div
            className={`sentiment-meter-face-icon mood-${sentimentMeter.mood}`}
            aria-hidden
          >
            <MoodIcon size={64} strokeWidth={2.2} />
          </div>
          <div
            className="sentiment-meter-track"
            aria-label={`Indicador de sentimiento en ${sentimentMeter.indicatorPct}%`}
          />
          <div
            className={`sentiment-meter-arrow mood-${sentimentMeter.mood}`}
            style={{ left: `${clamp(sentimentMeter.indicatorPct, 2, 98)}%` }}
            aria-hidden
          >
            <ArrowUp size={20} strokeWidth={2.4} />
          </div>
        </div>
        <div className="sentiment-meter-scale" aria-hidden>
          <span>Negativo</span>
          <span>Neutro</span>
          <span>Positivo</span>
        </div>
      </section>

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
          action={
            <DateRangeControls
              periodo={periodo}
              value={range}
              onPeriodoChange={setPeriodo}
              onRangeChange={setRange}
            />
          }
        >
          {temasQuery.isLoading && !temasQuery.data ? (
            <div className="state-loading">Cargando temas por rango...</div>
          ) : temasQuery.data?.items.length ? (
            <TopicBarChart items={temasQuery.data.items} />
          ) : (
            <div className="state-empty">
              No hay temas para el rango seleccionado.
            </div>
          )}
        </ChartCard>
      </section>

      <section className="summary-pills" aria-label="Resumen de indicadores">
        <button
          type="button"
          className={`summary-pill summary-pill-tema${
            temaFilter && temaFilter === resumenPildoras.topTemaLabel
              ? " is-active"
              : ""
          }`}
          onClick={() => {
            if (resumenPildoras.topTemaLabel === "Sin datos") {
              return;
            }
            setTemaFilter((current) =>
              current === resumenPildoras.topTemaLabel
                ? undefined
                : resumenPildoras.topTemaLabel,
            );
          }}
          disabled={resumenPildoras.topTemaLabel === "Sin datos"}
        >
          <p className="summary-pill-label">Tema con mayor conteo</p>
          <p className="summary-pill-value">{resumenPildoras.topTemaLabel}</p>
          <p className="summary-pill-meta">
            {resumenPildoras.topTemaPct}% del total
          </p>
        </button>
        <button
          type="button"
          className={`summary-pill summary-pill-positivo${
            sentimientoFilter === "positivo" ? " is-active" : ""
          }`}
          onClick={() =>
            setSentimientoFilter((current) =>
              current === "positivo" ? undefined : "positivo",
            )
          }
        >
          <p className="summary-pill-label">Positivos</p>
          <p className="summary-pill-value">{resumenPildoras.positivoPct}%</p>
        </button>
        <button
          type="button"
          className={`summary-pill summary-pill-negativo${
            sentimientoFilter === "negativo" ? " is-active" : ""
          }`}
          onClick={() =>
            setSentimientoFilter((current) =>
              current === "negativo" ? undefined : "negativo",
            )
          }
        >
          <p className="summary-pill-label">Negativos</p>
          <p className="summary-pill-value">{resumenPildoras.negativoPct}%</p>
        </button>
        <button
          type="button"
          className={`summary-pill summary-pill-neutro${
            sentimientoFilter === "neutro" ? " is-active" : ""
          }`}
          onClick={() =>
            setSentimientoFilter((current) =>
              current === "neutro" ? undefined : "neutro",
            )
          }
        >
          <p className="summary-pill-label">Neutros</p>
          <p className="summary-pill-value">{resumenPildoras.neutroPct}%</p>
        </button>
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
              toneKey={temaFilter}
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
