import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import type { DailyForecast } from "../ha/useForecast";
import { formatCondition, weatherIcon } from "../ha/weatherIcons";

function formatHour(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}${suffix}`;
}

function round(v: number | null | undefined): string {
  return v != null && !Number.isNaN(v) ? `${Math.round(v)}°` : "--";
}

export function HourlyForecastModal({
  hourly,
  onClose,
}: {
  hourly: DailyForecast[];
  onClose: () => void;
}) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="hourly-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hourly-modal-header">
          <div className="hourly-modal-title">Hourly Forecast</div>
          <button className="hourly-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="hourly-modal-list">
          {hourly.map((hour) => (
            <div className="hourly-modal-row" key={hour.datetime}>
              <div className="hourly-modal-time">{formatHour(hour.datetime)}</div>
              <Icon path={weatherIcon(hour.condition)} size="32px" />
              <div className="hourly-modal-condition">{formatCondition(hour.condition)}</div>
              <div className="hourly-modal-rain">
                {hour.precipitation_probability != null
                  ? `${Math.round(hour.precipitation_probability)}%`
                  : ""}
              </div>
              <div className="hourly-modal-temp">{round(hour.temperature)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
