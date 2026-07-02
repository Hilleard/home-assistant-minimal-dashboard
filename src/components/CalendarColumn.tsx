import type { AgendaDay } from "../ha/useCalendarEvents";

export function CalendarColumn({ days }: { days: AgendaDay[] }) {
  return (
    <div className="calendar-column">
      {days.map((day, dayIndex) => (
        <div className="calendar-day" key={`${day.label}-${dayIndex}`}>
          <div className="calendar-day-label">{day.label}</div>
          {day.events.length === 0 ? (
            <div className="calendar-event">
              <div className="calendar-event-title">No events scheduled</div>
              <div className="calendar-event-time">Do something nice</div>
            </div>
          ) : (
            day.events.map((event, i) => (
              <div className="calendar-event" key={`${day.label}-${dayIndex}-${i}`}>
                <div className="calendar-event-title">{event.title}</div>
                <div className="calendar-event-time">
                  {event.allDay ? "All Day" : `${event.start}${event.end ? ` – ${event.end}` : ""}`}
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
