import { useEffect, useState } from "react";
import {
  AGENDA_CALENDARS,
  AGENDA_CALENDAR_LABELS,
  AGENDA_DAYS,
  CALENDAR_REFRESH_MS,
  HA_TOKEN,
} from "../config";
import { isHaConfigured } from "./connection";

export interface AgendaEvent {
  title: string;
  start?: string; // "HH:mm", absent for all-day events
  end?: string;
  allDay: boolean;
}

export interface AgendaDay {
  label: string;
  events: AgendaEvent[];
}

interface RawCalendarEvent {
  summary?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}

interface SourcedCalendarEvent extends RawCalendarEvent {
  calendarId: string;
}

function startOfDay(offset: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

function dayLabel(offset: number): string {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  return startOfDay(offset).toLocaleDateString("en-GB", { weekday: "long" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

async function fetchCalendar(entityId: string, start: Date, end: Date): Promise<RawCalendarEvent[]> {
  // Relative path: same-origin in production (served by HA itself), and
  // proxied to the real HA instance by Vite's dev server in development
  // (see vite.config.ts) — either way, no CORS round trip through the browser.
  const url = `/api/calendars/${entityId}?start=${start.toISOString()}&end=${end.toISOString()}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${HA_TOKEN}` } });
  if (!res.ok) throw new Error(`${entityId}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function loadAgenda(): Promise<AgendaDay[]> {
  const rangeStart = startOfDay(0);
  const rangeEnd = startOfDay(AGENDA_DAYS);

  const results = await Promise.allSettled(
    AGENDA_CALENDARS.map((id) => fetchCalendar(id, rangeStart, rangeEnd)),
  );
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`Failed to fetch ${AGENDA_CALENDARS[i]}`, r.reason);
    }
  });

  const allEvents: SourcedCalendarEvent[] = results.flatMap((r, i) =>
    r.status === "fulfilled" ? r.value.map((e) => ({ ...e, calendarId: AGENDA_CALENDARS[i] })) : [],
  );

  const days: AgendaDay[] = [];
  for (let offset = 0; offset < AGENDA_DAYS; offset++) {
    const dayStart = startOfDay(offset);
    const dayEnd = startOfDay(offset + 1);

    const events = allEvents
      .filter((e) => {
        const startIso = e.start.dateTime ?? e.start.date;
        if (!startIso) return false;
        const eventStart = new Date(startIso);
        return eventStart >= dayStart && eventStart < dayEnd;
      })
      .map<AgendaEvent>((e) => {
        const allDay = !e.start.dateTime;
        const label = AGENDA_CALENDAR_LABELS[e.calendarId];
        const title = e.summary ?? "Untitled";
        // Some source calendars are already titled "Name - thing" — don't
        // double up the prefix in that case.
        const alreadyPrefixed = label && title.toLowerCase().startsWith(`${label.toLowerCase()} - `);
        return {
          title: label && !alreadyPrefixed ? `${label} - ${title}` : title,
          start: allDay ? undefined : formatTime(e.start.dateTime!),
          end: allDay ? undefined : e.end.dateTime ? formatTime(e.end.dateTime) : undefined,
          allDay,
        };
      })
      .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));

    days.push({ label: dayLabel(offset), events });
  }

  return days;
}

// Calendar events aren't exposed as entity state, so this hits the REST
// API directly (a websocket subscription equivalent doesn't exist) and
// polls on an interval.
export function useCalendarEvents(): AgendaDay[] {
  const [agenda, setAgenda] = useState<AgendaDay[]>([]);

  useEffect(() => {
    if (!isHaConfigured()) return;
    let cancelled = false;

    async function refresh() {
      try {
        const days = await loadAgenda();
        if (!cancelled) setAgenda(days);
      } catch (err) {
        console.error("Failed to fetch calendar events", err);
      }
    }

    refresh();
    const interval = setInterval(refresh, CALENDAR_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return agenda;
}
