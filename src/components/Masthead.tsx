import type { HassEntities } from "home-assistant-js-websocket";
import { ENTITIES } from "../config";
import { useNow } from "../ha/useNow";

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function formatTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}:${m}${suffix}`;
}

function formatDate(d: Date): string {
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  return `${weekday}, ${ordinal(d.getDate())} ${month}`;
}

export function Masthead({ entities }: { entities: HassEntities }) {
  const now = useNow(1000);

  const time = formatTime(now);
  const date = formatDate(now);

  const climate = entities[ENTITIES.climate];
  const currentTemp = climate?.attributes?.current_temperature;
  const targetRaw = entities[ENTITIES.targetTemperature]?.state;
  const target = targetRaw != null ? Math.round(parseFloat(targetRaw)) : null;

  return (
    <div className="masthead">
      <div className="masthead-col">
        <div className="masthead-label">{date}</div>
        <div className="masthead-value">{time}</div>
      </div>
      <div className="masthead-col masthead-col--end">
        <div className="masthead-label">Heating set to {target ?? "--"}°</div>
        <div className="masthead-value">
          {currentTemp != null ? currentTemp.toFixed(1) : "--"}°
        </div>
      </div>
    </div>
  );
}
