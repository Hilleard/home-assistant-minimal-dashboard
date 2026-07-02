import { useEffect, useState } from "react";
import { getConnection, isHaConfigured } from "./connection";
import { ENTITIES, FORECAST_REFRESH_MS } from "../config";

export interface DailyForecast {
  datetime: string;
  condition: string;
  temperature: number | null;
  templow: number | null;
  precipitation_probability: number | null;
}

interface ForecastResponse {
  response: {
    [entityId: string]: { forecast: DailyForecast[] };
  };
}

// weather.get_forecasts is a service call, not entity state, so it has to be
// polled — Home Assistant recommends every 30 min for daily forecasts.
export function useForecast(): DailyForecast[] {
  const [forecast, setForecast] = useState<DailyForecast[]>([]);

  useEffect(() => {
    if (!isHaConfigured()) return;
    let cancelled = false;

    async function fetchForecast() {
      try {
        const conn = await getConnection();
        const result = await conn.sendMessagePromise<ForecastResponse>({
          type: "call_service",
          domain: "weather",
          service: "get_forecasts",
          service_data: { type: "daily" },
          target: { entity_id: ENTITIES.weather },
          return_response: true,
        });
        if (!cancelled) {
          setForecast(result.response?.[ENTITIES.weather]?.forecast ?? []);
        }
      } catch (err) {
        console.error("Failed to fetch forecast", err);
      }
    }

    fetchForecast();
    const interval = setInterval(fetchForecast, FORECAST_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return forecast;
}
