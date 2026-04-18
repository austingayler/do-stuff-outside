import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type { Feature, FeatureCollection } from "geojson";
import regionsData from "../assets/regions_subset.json";

const XCTHERM_DATA_BASE =
  "https://raw.githubusercontent.com/austingayler/do-stuff-outside/refs/heads/xctherm-data/server/xctherm/forecasts";

interface RegionInfo {
  forecastId: number;
  oneway: number;
  return: number;
  climb: number;
}

interface SummaryDay {
  date: string;
  regions: Record<string, RegionInfo>;
}

const DEFAULT_STYLE: PathOptions = {
  fillColor: "#e879a8",
  fillOpacity: 0.15,
  color: "#888888",
  weight: 1.5,
};

const HOVER_STYLE: PathOptions = {
  fillColor: "#e879a8",
  fillOpacity: 0.65,
  color: "#e879a8",
  weight: 2.5,
};

const SELECTED_STYLE: PathOptions = {
  fillColor: "#e879a8",
  fillOpacity: 0.75,
  color: "#e879a8",
  weight: 2.5,
};

function thermalStyle(oneway: number): PathOptions {
  const ratio = Math.min(1, Math.max(0, oneway / 250));
  return { ...DEFAULT_STYLE, fillOpacity: 0.1 + ratio * 0.55 };
}

function getLocalDateStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDayLabel(dateStr: string): string {
  const d = dateStr.slice(0, 10);
  if (d === getLocalDateStr(0)) return "Today";
  if (d === getLocalDateStr(1)) return "Tomorrow";
  const [year, month, day] = d.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function isDayAvailable(day: SummaryDay): boolean {
  return day.date.slice(0, 10) >= getLocalDateStr(0) && Object.keys(day.regions).length > 0;
}

type StyledLayer = Layer & {
  setStyle: (style: PathOptions) => void;
  bindTooltip: (content: string | (() => string), options?: object) => void;
};

function SvgChart({ svg, loading }: { svg: string; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = svg;
    const svgEl = ref.current.querySelector("svg");
    if (svgEl) {
      svgEl.setAttribute("width", "100%");
      svgEl.setAttribute("height", "auto");
      svgEl.style.display = "block";
    }
  }, [svg]);
  return <div ref={ref} style={{ width: "100%", opacity: loading ? 0.4 : 1, transition: "opacity 0.2s" }} />;
}

export function RegionForecastMap() {
  const [days, setDays] = useState<SummaryDay[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [chart, setChart] = useState<string | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  const selectedDayRef = useRef(0);
  const selectedRegionRef = useRef<string | null>(null);
  const daysRef = useRef<SummaryDay[]>([]);
  const thermalStyleMap = useRef(new Map<string, PathOptions>());
  const layerMap = useRef(new Map<string, StyledLayer>());

  // Fetch summary on mount
  useEffect(() => {
    fetch(`${XCTHERM_DATA_BASE}/summary_latest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { days?: SummaryDay[] } | null) => {
        if (!data?.days?.length) return;
        daysRef.current = data.days;
        setDays(data.days);
        const todayStr = getLocalDateStr(0);
        const todayIndex = data.days.findIndex((d: SummaryDay) => d.date.slice(0, 10) === todayStr);
        const firstAvailable = data.days.findIndex((d: SummaryDay) => isDayAvailable(d));
        const initial = todayIndex !== -1 ? todayIndex : firstAvailable !== -1 ? firstAvailable : 0;
        selectedDayRef.current = initial;
        setSelectedDayIndex(initial);
      })
      .catch(() => {});
  }, []);

  // Re-shade map when day changes or selected region changes
  useEffect(() => {
    const dayRegions = days[selectedDayIndex]?.regions;
    if (!dayRegions) return;
    for (const [name, layer] of layerMap.current) {
      if (name === selectedRegion) {
        layer.setStyle(SELECTED_STYLE);
      } else {
        const info = dayRegions[name];
        const style = info ? thermalStyle(info.oneway) : DEFAULT_STYLE;
        thermalStyleMap.current.set(name, style);
        layer.setStyle(style);
      }
    }
  }, [days, selectedDayIndex, selectedRegion]);

  // Fetch chart when region or day changes
  useEffect(() => {
    if (!selectedRegion) { setChart(null); return; }
    const forecastId = daysRef.current[selectedDayIndex]?.regions[selectedRegion]?.forecastId;
    if (!forecastId) { setChart(null); return; }
    setChartLoading(true);
    fetch(`${XCTHERM_DATA_BASE}/${forecastId}_latest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { chart?: string } | null) => setChart(data?.chart ?? null))
      .catch(() => setChart(null))
      .finally(() => setChartLoading(false));
  }, [selectedRegion, selectedDayIndex]);

  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    const name = feature.properties?.name as string;
    const l = layer as StyledLayer;
    layerMap.current.set(name, l);

    l.bindTooltip(
      () => {
        const info = daysRef.current[selectedDayRef.current]?.regions[name];
        return info != null ? `${name} (${info.oneway}km)` : name;
      },
      { sticky: true, className: "region-tooltip" }
    );

    l.on({
      mouseover() {
        if (name !== selectedRegionRef.current) l.setStyle(HOVER_STYLE);
      },
      mouseout() {
        if (name !== selectedRegionRef.current) {
          l.setStyle(thermalStyleMap.current.get(name) ?? DEFAULT_STYLE);
        }
      },
      click() {
        const prev = selectedRegionRef.current;
        if (prev && prev !== name) {
          layerMap.current.get(prev)?.setStyle(thermalStyleMap.current.get(prev) ?? DEFAULT_STYLE);
        }
        selectedRegionRef.current = name;
        l.setStyle(SELECTED_STYLE);
        setSelectedRegion(name);
      },
    });
  }, []);

  const currentDayRegions = days[selectedDayIndex]?.regions ?? {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Compact map + day buttons */}
      <div style={{ width: "100%" }}>
        {days.length > 0 && (
          <div className="flex gap-2 justify-center flex-wrap mb-2">
            {days.map((day, i) => {
              const available = isDayAvailable(day);
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={!available}
                  onClick={() => {
                    selectedDayRef.current = i;
                    setSelectedDayIndex(i);
                  }}
                  className={`${
                    i === selectedDayIndex ? "bg-purple-500" : available ? "bg-gray-500" : "bg-gray-700 opacity-40 cursor-not-allowed"
                  } ${available ? "hover:bg-purple-700" : ""} text-white font-bold py-2 px-4 rounded`}
                >
                  {formatDayLabel(day.date)}
                </button>
              );
            })}
          </div>
        )}
        <MapContainer
          center={[46.55, 7.9]}
          zoom={8}
          style={{ height: "clamp(320px, 60vw, 600px)", width: "100%", borderRadius: 6, cursor: "pointer" }}
          scrollWheelZoom={false}
          zoomControl={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          keyboard={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <GeoJSON
            data={regionsData as FeatureCollection}
            style={DEFAULT_STYLE}
            onEachFeature={onEachFeature}
          />
        </MapContainer>
      </div>

      {/* Inline chart */}
      <div style={{ width: "100%", textAlign: "center" }}>
        {selectedRegion ? (
          <>
            <div style={{ marginBottom: 8, fontWeight: 600, color: "#e879a8" }}>
              {selectedRegion}
              {currentDayRegions[selectedRegion] && (
                <span style={{ color: "#aaa", fontWeight: "normal", fontSize: "0.85em", marginLeft: 10 }}>
                  {currentDayRegions[selectedRegion].oneway}km oneway &middot;{" "}
                  {currentDayRegions[selectedRegion].return}km return
                </span>
              )}
            </div>
            {chart && <SvgChart svg={chart} loading={chartLoading} />}
            {!chartLoading && !chart && <p style={{ color: "#555" }}>No chart available.</p>}
          </>
        ) : (
          <p style={{ color: "#555", fontSize: "0.9em" }}>Click a region to view the forecast</p>
        )}
      </div>
    </div>
  );
}
