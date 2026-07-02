import { useState } from "react";
import type { HassEntities } from "home-assistant-js-websocket";
import { Icon } from "./Icon";
import { HourlyForecastModal } from "./HourlyForecastModal";
import { ENTITIES, FORECAST_UPCOMING_DAYS } from "../config";
import type { DailyForecast } from "../ha/useForecast";
import { useHourlyForecast } from "../ha/useHourlyForecast";
import { formatCondition, weatherIcon } from "../ha/weatherIcons";

function round(v: number | null | undefined): string {
  return v != null && !Number.isNaN(v) ? `${Math.round(v)}°` : "--";
}

export function WeatherPanel({
  entities,
  forecast,
}: {
  entities: HassEntities;
  forecast: DailyForecast[];
}) {
  const [hourlyOpen, setHourlyOpen] = useState(false);
  const hourly = useHourlyForecast(hourlyOpen);

  const weather = entities[ENTITIES.weather];
  const currentTemp = weather?.attributes?.temperature;
  const condition = formatCondition(weather?.state);
  const summary = entities[ENTITIES.minutelySummary]?.state;

  const today = forecast[0];
  const upcoming = forecast.slice(1, 1 + FORECAST_UPCOMING_DAYS);

  return (
    <div className="weather-panel">
      <button
        className="weather-today"
        onClick={() => setHourlyOpen(true)}
        aria-label="Show hourly forecast"
      >
        <div className="weather-today-top">
          <Icon path={weatherIcon(weather?.state)} size="4.8vh" />
          <span className="weather-today-temp">{round(currentTemp)}</span>
          <div className="weather-today-condition-col">
            <span className="weather-today-condition">{condition}</span>
            {summary && <div className="weather-today-summary">{summary}</div>}
          </div>
        </div>
        <div className="weather-today-detail">
          <div className="weather-today-hilo">
            <span className="weather-row-hi">{round(today?.temperature)}</span>{" "}
            <span className="weather-row-lo">{round(today?.templow)}</span>
          </div>
          {today?.precipitation_probability != null && (
            <div className="weather-today-rain">
              {Math.round(today.precipitation_probability)}% rain
            </div>
          )}
        </div>
      </button>

      {upcoming.map((day, i) => {
        const label =
          i === 0
            ? "Tomorrow"
            : new Date(day.datetime).toLocaleDateString("en-GB", { weekday: "long" });
        return (
          <div className="weather-row" key={day.datetime}>
            <div className="weather-row-label">{label}</div>
            <Icon path={weatherIcon(day.condition)} size="2.4vh" />
            <div className="weather-row-temps">
              <span className="weather-row-hi">{round(day.temperature)}</span>{" "}
              <span className="weather-row-lo">{round(day.templow)}</span>
            </div>
          </div>
        );
      })}

      {hourlyOpen && (
        <HourlyForecastModal hourly={hourly} onClose={() => setHourlyOpen(false)} />
      )}
    </div>
  );
}
