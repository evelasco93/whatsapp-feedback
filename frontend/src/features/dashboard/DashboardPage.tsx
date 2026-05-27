import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  BadgeCheck,
  Coffee,
  Frown,
  Meh,
  Menu,
  Smile,
  UserCircle2,
  X,
} from "lucide-react";
import { FeedItemCard } from "@components/feed/FeedItemCard";
import { DateRangeControls } from "@components/dashboard/DateRangeControls";
import { SentimentPieChart } from "@components/dashboard/SentimentPieChart";
import { TopicBarChart } from "@components/dashboard/TopicBarChart";
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

type DashboardTab = "dashboard" | "analisis" | "ajustes";

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "analisis", label: "Analisis" },
  { id: "ajustes", label: "Ajustes" },
];

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
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    const temasItems = temasQuery.data?.items ?? [];
    const totalTemas = temasItems.reduce((acc, item) => acc + item.total, 0);

    const topTema = [...temasItems].sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      return a.valor.localeCompare(b.valor, "es");
    })[0];

    return {
      topTemaLabel: topTema?.valor ?? "Sin datos",
      topTemaPct: toPct(topTema?.total ?? 0, totalTemas),
    };
  }, [temasQuery.data?.items]);

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
    <div className="app-shell">
      <header className="top-nav">
        <div className="top-nav-brand">
          <img className="top-nav-logo" src="/logo.png" alt="Logo FeedBean" />
          <strong>FeedBean</strong>
        </div>
        <nav className="top-nav-tabs" aria-label="Navegacion principal">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "is-active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <button type="button" className="top-nav-user" aria-label="Perfil">
          <UserCircle2 size={28} />
        </button>
        <button
          type="button"
          className="top-nav-burger"
          aria-label="Abrir menu"
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-nav-drawer"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu size={26} />
        </button>
      </header>

      <AnimatePresence>
        {mobileNavOpen ? (
          <>
            <motion.div
              key="mobile-nav-overlay"
              className="mobile-nav-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              key="mobile-nav-drawer"
              id="mobile-nav-drawer"
              className="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navegacion"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="mobile-nav-header">
                <div className="top-nav-brand">
                  <img
                    className="top-nav-logo"
                    src="/logo.png"
                    alt="Logo FeedBean"
                  />
                  <strong>FeedBean</strong>
                </div>
                <button
                  type="button"
                  className="mobile-nav-close"
                  aria-label="Cerrar menu"
                  onClick={() => setMobileNavOpen(false)}
                >
                  <X size={22} />
                </button>
              </div>
              <nav className="mobile-nav-tabs" aria-label="Navegacion">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={activeTab === tab.id ? "is-active" : ""}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileNavOpen(false);
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <button
                type="button"
                className="mobile-nav-profile"
                onClick={() => setMobileNavOpen(false)}
              >
                <UserCircle2 size={22} />
                <span>Perfil</span>
              </button>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className="page-shell">
        {hasError ? (
          <div className="state-error" role="alert">
            Ocurrio un error cargando datos. Verifica que el backend este en
            ejecucion.
          </div>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "dashboard" ? (
            <motion.div
              key="tab-dashboard"
              className="tab-panel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <section className="hero-grid" aria-label="Pulso e insight">
                <article className="sentiment-gauge card">
                  <h2>Satisfacción</h2>
                  <div className="sentiment-meter-visual" role="presentation">
                    <div
                      className={`sentiment-meter-face-icon mood-${sentimentMeter.mood}`}
                      aria-hidden
                    >
                      <MoodIcon size={56} strokeWidth={2.1} />
                    </div>
                    <div className="sentiment-meter-track" aria-hidden />
                    <div
                      className={`sentiment-meter-arrow mood-${sentimentMeter.mood}`}
                      style={{
                        left: `${clamp(sentimentMeter.indicatorPct, 2, 98)}%`,
                      }}
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
                </article>

                <article className="insight-card card">
                  <p className="insight-kicker">Key Insight</p>
                  <h3>{resumenPildoras.topTemaLabel}</h3>
                  <div className="insight-icon" aria-hidden>
                    <Coffee size={46} strokeWidth={2} />
                    <BadgeCheck size={28} strokeWidth={2.2} />
                  </div>
                  <p className="insight-total">
                    {resumenPildoras.topTemaPct}% del total
                  </p>
                </article>
              </section>

              <section className="dashboard-grid">
                <ChartCard
                  titulo="Distribucion de sentimientos"
                  descripcion="Resumen global de mensajes clasificados."
                >
                  {sentimientosQuery.isLoading && !sentimientosQuery.data ? (
                    <div className="state-loading">
                      Cargando sentimientos...
                    </div>
                  ) : sentimientosQuery.data?.items.length ? (
                    <SentimentPieChart
                      items={sentimientosQuery.data.items}
                      activeKey={sentimientoFilter}
                      onSelect={(key) =>
                        setSentimientoFilter((current) =>
                          current === key ? undefined : key,
                        )
                      }
                    />
                  ) : (
                    <div className="state-empty">
                      Aun no hay datos de sentimientos.
                    </div>
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
                    <div className="state-loading">
                      Cargando temas por rango...
                    </div>
                  ) : temasQuery.data?.items.length ? (
                    <TopicBarChart
                      items={temasQuery.data.items}
                      activeValue={temaFilter}
                      onSelect={(value) =>
                        setTemaFilter((current) =>
                          current === value ? undefined : value,
                        )
                      }
                    />
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
                  subtitulo="Haz clic en una porción del pastel, una barra o un chip para filtrar el feed."
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

                {!mensajesQuery.isLoading &&
                !mensajesQuery.data?.items.length ? (
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
            </motion.div>
          ) : null}

          {activeTab === "analisis" ? (
            <motion.section
              key="tab-analisis"
              className="analysis-section tab-panel"
              aria-label="Panel de analisis"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <SectionHeader
                titulo="Analisis IA"
                subtitulo="Revision de sentimiento, tema y salida original por mensaje."
              />

              <div className="analysis-list">
                {mensajesQuery.data?.items.map((mensaje) => (
                  <article key={mensaje.id} className="analysis-item card">
                    <p className="analysis-message">{mensaje.texto_mensaje}</p>
                    <div className="analysis-fields">
                      <span>
                        Sentimiento:{" "}
                        <strong>{mensaje.sentimiento ?? "Pendiente"}</strong>
                      </span>
                      <span>
                        Tema: <strong>{mensaje.tema ?? "Pendiente"}</strong>
                      </span>
                      <span>
                        Resumen:{" "}
                        <strong>{mensaje.resumen ?? "Pendiente"}</strong>
                      </span>
                      <span>
                        Estado: <strong>{mensaje.estado_analisis}</strong>
                      </span>
                    </div>
                    <details className="analysis-details">
                      <summary>Respuesta original</summary>
                      <pre>
                        {JSON.stringify(
                          {
                            sentimiento: mensaje.sentimiento,
                            tema: mensaje.tema,
                            resumen: mensaje.resumen,
                            metadata: mensaje.metadata,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  </article>
                ))}
              </div>
            </motion.section>
          ) : null}

          {activeTab === "ajustes" ? (
            <motion.section
              key="tab-ajustes"
              className="settings-section state-empty tab-panel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              Panel de ajustes visual en prototipo.
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="app-footer-brand">
            <img
              className="app-footer-logo"
              src="/logo.png"
              alt="Logo FeedBean"
            />
            <strong>FeedBean</strong>
          </div>
          <p className="app-footer-copy">
            © {new Date().getFullYear()} FeedBean. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};
