import { useState, useEffect } from "react";
import {
  getJungfraujochForecast,
  type JungfraujochForecastResponse,
  type JungfraujochForecastDay,
} from "../api";

type FlyCondition = "green" | "yellow" | "red";

/**
 * Determines flying condition based on wind speed, direction, and gusts.
 *
 * Direction: Must be WNW to NNW (285° to 337.5°). Perfect is NW (315°).
 * Anything outside this range is a dealbreaker (red).
 *
 * Speed & Gusts:
 * - 20 km/h avg with gusts up to 30 km/h = good (green)
 * - 30 km/h avg with gusts up to 40 km/h = maybe (yellow)
 * - Any gusts above 40 km/h = dangerous (red)
 * - Gusts more than 10 km/h above average at lower speeds = concerning
 */
function getFlyCondition(
  windSpeed: number,
  windDirection: number,
  windGusts?: number,
): FlyCondition {
  const gusts = windGusts ?? windSpeed;

  // Direction check: WNW (292.5°) to NNW (337.5°) - we'll use 285° to 340° for some tolerance
  // Perfect NW is 315°
  const isGoodDirection = windDirection >= 285 && windDirection <= 340;

  // Direction is a dealbreaker - if not in range, it's red
  if (!isGoodDirection) {
    return "red";
  }

  // Absolute gust limit - anything over 40 km/h is dangerous
  if (gusts > 40) {
    return "red";
  }

  // Check conditions based on wind speed ranges
  if (windSpeed <= 20) {
    // At 20 km/h or less, gusts up to 30 are fine
    if (gusts <= 30) {
      return "green";
    }
    // Gusts 30-40 at low speed is marginal
    return "yellow";
  }

  if (windSpeed <= 30) {
    // At 20-30 km/h, gusts up to 40 is maybe
    if (gusts <= 40) {
      return "yellow";
    }
    return "red";
  }

  // Wind speed over 30 km/h is too strong
  return "red";
}

/**
 * Converts wind direction in degrees to a compass direction string.
 * Uses 16-point compass for more granular directions.
 */
function getWindDirectionLabel(degrees: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Gets the best condition for a day based on daytime hours (9am-5pm).
 * Priority: green > yellow > red
 */
function getDayBestCondition(day: JungfraujochForecastDay): FlyCondition {
  let hasGreen = false;
  let hasYellow = false;

  const daytimeHours = day.hours.filter((h) => {
    const hour = new Date(h.time).getHours();
    return hour >= 9 && hour <= 17;
  });

  for (const hour of daytimeHours) {
    const condition = getFlyCondition(
      hour.windSpeed,
      hour.windDirection,
      hour.windGusts,
    );
    if (condition === "green") hasGreen = true;
    if (condition === "yellow") hasYellow = true;
  }

  if (hasGreen) return "green";
  if (hasYellow) return "yellow";
  return "red";
}

/**
 * Gets wind summary values for a day during flying hours (9am-5pm).
 */
function getDayWindSummary(day: JungfraujochForecastDay): {
  minSpeed: number;
  maxSpeed: number;
  minGusts: number;
  maxGusts: number;
  directions: Set<string>;
} {
  const flyingHours = day.hours.filter((h) => {
    const hour = new Date(h.time).getHours();
    return hour >= 9 && hour <= 17;
  });

  const hoursToUse = flyingHours.length > 0 ? flyingHours : day.hours;

  const speeds = hoursToUse.map((h) => h.windSpeed);
  const gusts = hoursToUse.map((h) => h.windGusts);
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);
  const minGusts = Math.min(...gusts);
  const maxGusts = Math.max(...gusts);
  
  // Collect all unique 8-point compass directions for the day
  const directions = new Set<string>();
  for (const h of hoursToUse) {
    directions.add(get8PointDirection(h.windDirection));
  }

  return {
    minSpeed: Math.round(minSpeed),
    maxSpeed: Math.round(maxSpeed),
    minGusts: Math.round(minGusts),
    maxGusts: Math.round(maxGusts),
    directions,
  };
}

/**
 * Converts degrees to 8-point compass direction for the compass display.
 */
function get8PointDirection(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Mini compass component showing wind directions for the day.
 */
const WindCompass: React.FC<{ directions: Set<string> }> = ({ directions }) => {
  const allDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const size = 32;
  const center = size / 2;
  const outerRadius = 14;
  const innerRadius = 5;

  // Create path for each compass segment (pizza slice)
  const getSegmentPath = (index: number): string => {
    const startAngle = (index * 45 - 22.5 - 90) * (Math.PI / 180);
    const endAngle = (index * 45 + 22.5 - 90) * (Math.PI / 180);
    
    const x1 = center + innerRadius * Math.cos(startAngle);
    const y1 = center + innerRadius * Math.sin(startAngle);
    const x2 = center + outerRadius * Math.cos(startAngle);
    const y2 = center + outerRadius * Math.sin(startAngle);
    const x3 = center + outerRadius * Math.cos(endAngle);
    const y3 = center + outerRadius * Math.sin(endAngle);
    const x4 = center + innerRadius * Math.cos(endAngle);
    const y4 = center + innerRadius * Math.sin(endAngle);
    
    return `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1} Z`;
  };

  return (
    <svg width={size} height={size} className="shrink-0" aria-label="Wind directions compass">
      <title>Wind directions</title>
      {allDirections.map((dir, i) => {
        const isActive = directions.has(dir);
        return (
          <path
            key={dir}
            d={getSegmentPath(i)}
            fill={isActive ? "#3b82f6" : "#e5e7eb"}
            stroke="#fff"
            strokeWidth="0.5"
          />
        );
      })}
      {/* Center circle */}
      <circle cx={center} cy={center} r={innerRadius - 1} fill="#fff" />
    </svg>
  );
};

function formatDate(dateString: string, index: number): string {
  const date = new Date(dateString);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (index === 0) {
    return "Today";
  }
  if (index === 1) {
    return "Tomorrow";
  }
  return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
}

const conditionColors: Record<FlyCondition, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

const conditionLabels: Record<FlyCondition, string> = {
  green: "Good",
  yellow: "Maybe",
  red: "Poor",
};

const JungfraujochForecast: React.FC = () => {
  const [forecast, setForecast] = useState<JungfraujochForecastResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    async function fetchForecast() {
      try {
        setLoading(true);
        const data = await getJungfraujochForecast();
        setForecast(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load forecast",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <h3 className="text-xl font-bold mb-4">
          Can you fly from Jungfraujoch?
        </h3>
        <div className="text-gray-500">Loading forecast...</div>
      </div>
    );
  }

  if (error || !forecast) {
    return (
      <div className="p-4">
        <h3 className="text-xl font-bold mb-4">
          Can you fly from Jungfraujoch?
        </h3>
        <div className="text-red-500">{error || "Failed to load forecast"}</div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full max-w-4xl mx-auto">
      <h3 className="text-xl font-bold mb-2">Can you fly from Jungfraujoch?</h3>
      <p className="text-sm text-gray-600 mb-4">
        5-day forecast at 3,466m • Good: ≤20 km/h, gusts ≤30, WNW-NNW wind
      </p>

      <div className="flex flex-col gap-2">
        {forecast.days.map((day, index) => {
          const condition = getDayBestCondition(day);
          const summary = getDayWindSummary(day);
          const isExpanded = expandedDay === index;

          return (
            <div key={day.date} className="w-full">
              {/* Day summary row */}
              <button
                type="button"
                onClick={() => setExpandedDay(isExpanded ? null : index)}
                className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors"
                style={{
                  backgroundColor: isExpanded ? "#f3f4f6" : "transparent",
                }}
              >
                {/* Condition indicator */}
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: conditionColors[condition] }}
                >
                  <span className="text-white text-xs font-bold">
                    {conditionLabels[condition]}
                  </span>
                </div>

                {/* Day info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base">
                    {formatDate(day.date, index)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 truncate">
                    {summary.minSpeed}-{summary.maxSpeed} km/h • Gusts:{" "}
                    {summary.minGusts}-{summary.maxGusts} km/h
                  </div>
                </div>

                {/* Wind direction compass */}
                <WindCompass directions={summary.directions} />

                {/* Expand icon */}
                <div className="text-gray-400 text-sm sm:text-base">
                  {isExpanded ? "▲" : "▼"}
                </div>
              </button>

              {/* Expanded hourly view */}
              {isExpanded && (
                <div className="mt-2 mb-4 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1 w-full">
                  {day.hours
                    .filter((h) => {
                      const hour = new Date(h.time).getHours();
                      return hour >= 9 && hour <= 17;
                    })
                    .map((hour) => {
                      const hourCondition = getFlyCondition(
                        hour.windSpeed,
                        hour.windDirection,
                        hour.windGusts,
                      );
                      const hourTime = new Date(hour.time).getHours();

                      return (
                        <div
                          key={hour.time}
                          className="p-1.5 sm:p-2 rounded text-xs flex items-center gap-1"
                          style={{
                            backgroundColor: conditionColors[hourCondition],
                            color: "white",
                          }}
                        >
                          {/* Content */}
                          <div className="flex-1 text-center">
                            <div className="font-bold">{hourTime}:00</div>
                            <div>{Math.round(hour.windSpeed)} ({Math.round(hour.windGusts)})</div>
                            <div>
                              {getWindDirectionLabel(hour.windDirection)}
                            </div>
                          </div>
                          {/* Wind direction arrow */}
                          <div
                            className="flex items-center justify-center shrink-0"
                            style={{
                              opacity: 0.7,
                              transform: `rotate(${hour.windDirection}deg)`,
                            }}
                          >
                            <span className="text-xl sm:text-2xl">↓</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Data: MeteoSwiss ICON-CH via Open-Meteo
      </div>
    </div>
  );
};

export default JungfraujochForecast;
