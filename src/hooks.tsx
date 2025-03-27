import { useState, useEffect } from "react";
import { fetchWeatherApi } from "openmeteo";
import { useQuery } from "@tanstack/react-query";

export const useSyncedLocalStorage = <T extends string | null>(
  key: string,
  initialValue: T = null as T,
): [T, (value: T) => void] => {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorage.getItem(key);
    return storedValue !== null ? storedValue as T : initialValue;
  });

  useEffect(() => {
    if (value === null) {
      localStorage.removeItem(key); // Remove the key if value is null
    } else {
      localStorage.setItem(key, value); // Store the updated value
    }
  }, [key, value]);

  return [value, setValue];
};

export const useGadmen = (): JSX.Element | null => {
  const [latestImageUrl, setLatestImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestImage = async () => {
      try {
        const response = await fetch(
          "https://images.bergfex.at/ajax/webcamsarchive/?id=11008&date=2024-12-04&size=6",
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: Array<{
          hour: number;
          min: number;
          filetime: number;
          src: string;
          sfiletime: string;
        }> = await response.json();

        if (data.length > 0) {
          const latestImage = data.reduce((latest, current) =>
            current.filetime > latest.filetime ? current : latest,
          );
          setLatestImageUrl(latestImage.src);
        }
      } catch (error) {
        console.error("Failed to fetch webcam image:", error);
      }
    };

    fetchLatestImage();
  }, []);

  if (!latestImageUrl) return null;

  return (
    <img src={latestImageUrl} className="w-full object-cover" alt="Gadmen" />
  );
};

// TODO: can probably split this out further

// Example and explanation of how to use the openmeteo API
// https://open-meteo.com/en/docs#latitude=46.537&longitude=8.126&current=&minutely_15=&hourly=wind_speed_800hPa,wind_speed_700hPa,wind_speed_600hPa&daily=&models=

export interface WeatherResponse {
  current: {
    time: Date;
    value: number;
  };
  hourly: {
    time: Date[];
    windSpeed800hPa: number[]; // Corresponds to 2000m
    windSpeed700hPa: number[]; // Corresponds to 3000m
    windSpeed600hPa: number[]; // Corresponds to 4000m
  };
  daily: {
    time: Date[];
    values: number[];
  };
}

// Helper function to form time ranges
const range = (start: number, stop: number, step: number): number[] =>
  Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

// Utility function to safely ensure number[]
const toNumberArray = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "number" ? v : Number.NaN))
      .filter((v) => !Number.isNaN(v));
  }
  return [];
};

// Wow this resp data is annoying to deal with

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const processWeatherData = (response: any): WeatherResponse => {
  const utcOffsetSeconds = response.utcOffsetSeconds?.() || 0;
  const current = response.current?.();
  const hourly = response.hourly?.();
  const daily = response.daily?.();

  console.log({ hourly: hourly.variables(0).valuesArray() });

  return {
    current: {
      time: new Date((Number(current?.time?.()) + utcOffsetSeconds) * 1000),
      value: Number(current?.variables?.(0)?.value?.()) || 0,
    },
    hourly: {
      time: range(
        Number(hourly.time()),
        Number(hourly.timeEnd()),
        hourly.interval(),
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      windSpeed800hPa: hourly.variables(0)!.valuesArray()!,
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      windSpeed700hPa: hourly.variables(1)!.valuesArray()!,
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      windSpeed600hPa: hourly.variables(2)!.valuesArray()!,
    },
    daily: {
      time: range(
        Number(daily?.time?.()),
        Number(daily?.timeEnd?.()),
        daily?.interval?.() || 1,
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
      values: toNumberArray(daily?.variables?.(0)?.valuesArray?.()),
    },
  };
};

// Hook implementation
export const useWeatherData = (latitude: number, longitude: number) => {
  return useQuery<WeatherResponse>({
    queryKey: ["weatherData", latitude, longitude],
    queryFn: async () => {
      const params = {
        latitude,
        longitude,
        hourly: ["wind_speed_800hPa", "wind_speed_700hPa", "wind_speed_600hPa"],
      };
      const url = "https://api.open-meteo.com/v1/forecast";
      const responses = await fetchWeatherApi(url, params);
      return processWeatherData(responses[0]);
    },
  });
};