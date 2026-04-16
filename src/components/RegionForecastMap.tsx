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

interface Props {
  onRegionClick?: (regionName: string) => void;
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

const LOADING_STYLE: PathOptions = {
  fillColor: "#aaaaaa",
  fillOpacity: 0.4,
  color: "#888888",
  weight: 1.5,
};

/** Scale fillOpacity by oneway km: dim at 0km, saturated at 250km+. */
function thermalStyle(oneway: number): PathOptions {
  const ratio = Math.min(1, Math.max(0, oneway / 250));
  return { ...DEFAULT_STYLE, fillOpacity: 0.1 + ratio * 0.55 };
}

type StyledLayer = Layer & {
  setStyle: (style: PathOptions) => void;
  bindTooltip: (content: string | (() => string), options?: object) => void;
};

/** Renders a raw SVG string imperatively to avoid lint restrictions on dangerouslySetInnerHTML. */
function SvgChart({ svg }: { svg: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = svg;
  }, [svg]);
  return <div ref={ref} style={{ width: "100%", overflowX: "auto" }} />;
}

export function RegionForecastMap({ onRegionClick }: Props) {
  const [modalRegion, setModalRegion] = useState<string | null>(null);
  const [modalChart, setModalChart] = useState<string | null>(null);
  const [modalChartLoading, setModalChartLoading] = useState(false);
  const [forecastSummary, setForecastSummary] = useState<Record<string, RegionInfo> | null>(null);

  const loadingRegionRef = useRef<string | null>(null);
  const onRegionClickRef = useRef(onRegionClick);
  onRegionClickRef.current = onRegionClick;
  const forecastSummaryRef = useRef<Record<string, RegionInfo> | null>(null);
  const thermalStyleMap = useRef(new Map<string, PathOptions>());
  const layerMap = useRef(new Map<string, StyledLayer>());

  // Fetch thermal summary on mount for tooltip values + shading
  useEffect(() => {
    fetch(`${XCTHERM_DATA_BASE}/summary_latest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { regions?: Record<string, RegionInfo> } | null) => {
        if (!data?.regions) return;
        forecastSummaryRef.current = data.regions;
        setForecastSummary(data.regions);
      })
      .catch(() => {});
  }, []);

  // Apply thermal shading to all layers once summary is loaded
  useEffect(() => {
    if (!forecastSummary) return;
    for (const [name, layer] of layerMap.current) {
      const info = forecastSummary[name];
      if (info) {
        const style = thermalStyle(info.oneway);
        thermalStyleMap.current.set(name, style);
        if (loadingRegionRef.current !== name) {
          layer.setStyle(style);
        }
      }
    }
  }, [forecastSummary]);

  // Fetch SVG chart whenever the modal opens
  useEffect(() => {
    if (!modalRegion) {
      setModalChart(null);
      return;
    }
    const forecastId = forecastSummaryRef.current?.[modalRegion]?.forecastId;
    if (!forecastId) { setModalChart(null); return; }
    setModalChartLoading(true);
    fetch(`${XCTHERM_DATA_BASE}/${forecastId}_latest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { chart?: string } | null) => setModalChart(data?.chart ?? null))
      .catch(() => setModalChart(null))
      .finally(() => setModalChartLoading(false));
  }, [modalRegion]);

  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    const name = feature.properties?.name as string;
    const l = layer as StyledLayer;
    layerMap.current.set(name, l);

    const setLoading = (target: string | null) => {
      if (loadingRegionRef.current) {
        const prev = loadingRegionRef.current;
        layerMap.current.get(prev)?.setStyle(thermalStyleMap.current.get(prev) ?? DEFAULT_STYLE);
      }
      loadingRegionRef.current = target;
      if (target) {
        layerMap.current.get(target)?.setStyle(LOADING_STYLE);
      }
    };

    // Tooltip content is evaluated at mouseover time so it picks up async summary data
    l.bindTooltip(
      () => {
        const info = forecastSummaryRef.current?.[name];
        return info != null ? `${name} (${info.oneway}km)` : name;
      },
      { sticky: true, className: "region-tooltip" }
    );

    l.on({
      mouseover() {
        if (loadingRegionRef.current !== name) l.setStyle(HOVER_STYLE);
      },
      mouseout() {
        if (loadingRegionRef.current !== name) {
          l.setStyle(thermalStyleMap.current.get(name) ?? DEFAULT_STYLE);
        }
      },
      click() {
        if (loadingRegionRef.current) return;
        setModalRegion(name);
        const cb = onRegionClickRef.current;
        if (cb) {
          setLoading(name);
          Promise.resolve(cb(name)).finally(() => setLoading(null));
        }
      },
    });
  }, []);

  return (
    <>
      <MapContainer
        center={[46.6, 8.0]}
        zoom={8}
        style={{ height: 400, width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          data={regionsData as FeatureCollection}
          style={DEFAULT_STYLE}
          onEachFeature={onEachFeature}
        />
      </MapContainer>

      {modalRegion && (
        <div
          aria-label={`${modalRegion} forecast backdrop`}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setModalRegion(null)}
          onKeyDown={(e) => e.key === "Escape" && setModalRegion(null)}
        >
          <dialog
            open
            style={{
              background: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: 8,
              padding: 24,
              minWidth: 320,
              maxWidth: 700,
              width: "90%",
              color: "inherit",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, color: "#e879a8" }}>
              {modalRegion}
              {forecastSummary?.[modalRegion] && (
                <span
                  style={{
                    color: "#aaa",
                    fontWeight: "normal",
                    fontSize: "0.65em",
                    marginLeft: 12,
                  }}
                >
                  {forecastSummary[modalRegion].oneway}km oneway ·{" "}
                  {forecastSummary[modalRegion].return}km return
                </span>
              )}
            </h2>

            {modalChartLoading && <p style={{ color: "#aaa" }}>Loading forecast chart...</p>}
            {!modalChartLoading && !modalChart && (
              <p style={{ color: "#aaa" }}>No forecast data available yet.</p>
            )}
            {!modalChartLoading && modalChart && <SvgChart svg={modalChart} />}

            <button type="button" onClick={() => setModalRegion(null)} style={{ marginTop: 16 }}>
              Close
            </button>
          </dialog>
        </div>
      )}
    </>
  );
}
