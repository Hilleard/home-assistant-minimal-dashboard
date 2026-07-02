import { AlertsBar } from "./components/AlertsBar";
import { Masthead } from "./components/Masthead";
import { WeatherPanel } from "./components/WeatherPanel";
import { CalendarColumn } from "./components/CalendarColumn";
import { Joke } from "./components/Joke";
import { GarageDoorBanner } from "./components/GarageDoorBanner";
import { KidsPage } from "./components/KidsPage";
import { useEntities } from "./ha/useEntities";
import { useForecast } from "./ha/useForecast";
import { useCalendarEvents } from "./ha/useCalendarEvents";
import { useSwipePage } from "./hooks/useSwipePage";

function App() {
  const { entities, error } = useEntities();
  const forecast = useForecast();
  const agenda = useCalendarEvents();
  const swipe = useSwipePage();

  const renderSlide = (pageId: 0 | 1, key: number) =>
    pageId === 0 ? (
      <div className="swipe-slide body" key={key}>
        <div className="body-left">
          <Masthead entities={entities} />
          <WeatherPanel entities={entities} forecast={forecast} />
        </div>
        <div className="body-right">
          <CalendarColumn days={agenda} />
        </div>
      </div>
    ) : (
      <div className="swipe-slide" key={key}>
        <KidsPage entities={entities} />
      </div>
    );

  return (
    <div className="dashboard">
      {error && <div className="demo-banner demo-banner--error">Connection error: {error}</div>}

      <AlertsBar entities={entities} />

      <div
        className="swipe-viewport"
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        onMouseDown={swipe.onMouseDown}
      >
        <div
          className="swipe-track"
          style={{
            transform: `translateX(${swipe.trackPercent}%)`,
            transition:
              swipe.isDragging || !swipe.transitionEnabled ? "none" : "transform 0.25s ease",
          }}
        >
          {swipe.slots.map((pageId, i) => renderSlide(pageId, i))}
        </div>
      </div>

      <Joke entities={entities} />
      <GarageDoorBanner entities={entities} />
    </div>
  );
}

export default App;
