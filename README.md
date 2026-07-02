# Minimal Dashboard

A Home Assistant dashboard built for a 2000×1200 landscape tablet running
Fully Kiosk Browser. Talks to HA directly over the WebSocket API (live
entity state) and REST (calendar events); no Lovelace, no YAML dashboard
config, no shadow DOM digging when you want to change something. It's a
small React + TypeScript app you build and drop into HA's `www` folder.

Shows: current weather + tap-for-hourly forecast, a 7-day calendar agenda
merged from multiple calendars, a top alert bar (bin day, pet reminders,
meal of the day), a garage door status banner, a rotating joke, and a
second swipe-away page with two simple daily-habit trackers for kids
(reading streak + a behaviour checklist) backed by real HA helpers instead
of local storage.

Everything it reads is listed in one place — [src/config.ts](src/config.ts)
— and every entity is described below so you can wire up your own instance.

![Dashboard screenshot](docs/screenshot.jpg)

## 1. Create a long-lived access token

In Home Assistant: click your profile (bottom left) → **Security** tab →
scroll to **Long-lived access tokens** → **Create token**. Name it
something like `minimal-dashboard`, copy the token immediately — HA only
shows it once.

## 2. Configure the app

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_HA_URL=http://<your-ha-ip>:8123
VITE_HA_TOKEN=<the token from step 1>
```

Use the IP address rather than `homeassistant.local` if the tablet has ever
had trouble resolving `.local` hostnames on your network — Android WebViews
(which is what Fully Kiosk uses) are sometimes unreliable with mDNS.

## 3. Point the entity IDs at your own setup

Open [src/config.ts](src/config.ts) — every entity ID the dashboard reads
is listed there. Nothing else in the app needs to change once these match
your instance. Here's what each one is, what I personally use for it, and
how to get your own version working:

| Config key | Entity | What it needs |
| --- | --- | --- |
| `ENTITIES.weather` | a `weather.*` entity | Any weather integration that supports `weather.get_forecasts` (daily + hourly). I use [Pirate Weather](https://github.com/Pirate-Weather/pirateweather-ha) — Met.no and OpenWeatherMap work the same way. |
| `ENTITIES.minutelySummary` | any `sensor.*` | Optional — a short text string shown under the current condition (e.g. "Drizzle starting in 20 min"). I use Pirate Weather's minutely-summary sensor for this; skip it or point it at any sensor whose state is a short string. |
| `ENTITIES.climate` | a `climate.*` entity | I use [Tado](https://www.home-assistant.io/integrations/tado/) — reads `attributes.current_temperature`, so any thermostat integration works the same way. |
| `ENTITIES.targetTemperature` | an `input_number.*` | Whatever you use to show/set your target temperature. |
| `ENTITIES.recyclingBin` | any `sensor.*` | I use the [UK Bin Collection Data](https://github.com/robbrad/UKBinCollectionData) HACS integration, which exposes `attributes.next_collection` as an ISO date — that's read first, falling back to a `days`/`daysUntilCollection` attribute, then to looking for "today"/"tomorrow"/"in N days" in the state text, so most other bin-collection integrations should work too. |
| `ENTITIES.dadJoke` | any `sensor.*` | State is just shown as-is at the bottom of the screen. I use a REST sensor hitting the free [icanhazdadjoke.com](https://icanhazdadjoke.com) API — see example below. |
| `ENTITIES.garageDoor` | a `cover.*` entity | I use a [Shelly](https://www.home-assistant.io/integrations/shelly/) relay wired into the garage door motor, exposed as a cover entity — any cover entity works the same way. The banner reacts to `open`/`opening`/`closing`/`unknown` states and calls the generic `cover.toggle` service when tapped. |
| `ENTITIES.mealSchedule` | a `calendar.*` entity | I keep a dedicated "Meals" calendar in Google Calendar, synced into HA via the built-in Google Calendar integration, and use its all-day event title as today's meal. Any calendar entity works the same way — shows today's event (via `attributes.message` if present, else the event summary) in the top-right corner. |
| `ENTITIES.petAFedMorning` / `petAFedEvening` / `petAFleaTablet` / `petBFleaTablet` | `input_boolean.*` | Optional pet-care reminders — each shows as a top-bar alert when `off`, and clears itself (toggles to `on`) when tapped. Add/remove/rename these to match how many pets (if any) you actually have — see [AlertsBar.tsx](src/components/AlertsBar.tsx). |
| `AGENDA_CALENDARS` | `calendar.*` entities | Every calendar listed here gets merged into one agenda list in the right-hand column — I merge everyone's personal Google Calendars plus a shared household one. Add as many as you like. |

### Example REST sensor for the joke

```yaml
sensor:
  - platform: rest
    name: Dad Joke
    resource: https://icanhazdadjoke.com/
    headers:
      Accept: text/plain
    value_template: "{{ value }}"
    scan_interval: 3600
```

## 4. Set up the kids' charts (optional)

The second swipe page is two independent daily-habit trackers — a reading
streak (star grid, resets every 7 days, big milestone every 28) and a
behaviour checklist (a day only counts once every item on the list is
checked). Both are entirely optional; if you don't want this page, remove
the second `<KidsPage />` slide in [App.tsx](src/App.tsx) and drop the
`swipe-*` CSS down to a single page.

If you do want it, add these helpers to `configuration.yaml` (restart HA
afterwards — `counter`/`input_datetime` helpers only load on restart, not
a config reload):

```yaml
counter:
  kids_reading_days:
    name: Kids Reading Days
    initial: 0
    step: 1
  kids_behaviour_days:
    name: Kids Behaviour Days
    initial: 0
    step: 1

input_datetime:
  kids_reading_last_day:
    name: Kids Reading Last Day
    has_date: true
    has_time: false
  kids_behaviour_last_completed_day:
    name: Kids Behaviour Last Completed Day
    has_date: true
    has_time: false

  # One per behaviour category — must match src/config.ts's
  # BEHAVIOUR_CATEGORIES exactly (input_datetime.kids_behaviour_<slug>_last_marked).
  # Add/remove pairs here and in that file together if you change the categories.
  kids_behaviour_kind_words_last_marked:
    name: Kids Behaviour Kind Words Last Marked
    has_date: true
    has_time: false
  kids_behaviour_listening_last_marked:
    name: Kids Behaviour Listening Last Marked
    has_date: true
    has_time: false
  kids_behaviour_tidy_last_marked:
    name: Kids Behaviour Tidy Last Marked
    has_date: true
    has_time: false
  kids_behaviour_brushing_teeth_last_marked:
    name: Kids Behaviour Brushing Teeth Last Marked
    has_date: true
    has_time: false
```

Safe to inspect/reset any of these any time from **Developer Tools →
States** — e.g. set a counter back to `0` there if you want to start over.

## 5. Run it locally to check it against real data

```bash
npm install
npm run dev
```

Open the printed `localhost` URL — you should see your actual alerts,
weather, heating, and calendar (restart `npm run dev` after editing `.env`,
Vite only reads it at startup).

## 6. Build it

```bash
npm run build
```

This produces a `dist/` folder — a handful of static HTML/JS/CSS files.
That's the entire deployable app.

## 7. Deploy it into Home Assistant

The simplest option: put it in HA's own `www` folder, so it's served from
the same origin as HA itself (this matters — it avoids CORS entirely,
since the dashboard's REST calendar requests and WebSocket connection are
then same-origin).

Via SSH/Samba into your HA config directory:

```bash
mkdir -p /config/www/minimal-dashboard
# copy the *contents* of dist/ (not the dist folder itself) into /config/www/minimal-dashboard/
```

That's why `vite.config.ts` has `base: '/local/minimal-dashboard/'` baked
in for production builds — HA serves anything in `/config/www/` at
`/local/`, so the built asset paths need to match that prefix or the JS/CSS
won't load. If you rename the folder, update `base` in `vite.config.ts` to
match and rebuild.

No HA restart needed — `/config/www/` is served live.

## 8. Point Fully Kiosk at it

In Fully Kiosk Browser's settings, change the **Start URL** to:

```
http://<your-ha-ip>:8123/local/minimal-dashboard/index.html
```

Fullscreen, no navigation bar — same kiosk settings as any other
start-URL change.

## Updating it later

Any time you change something: `npm run build`, then copy the new `dist/`
contents over the old ones in `/config/www/minimal-dashboard/`, then reload
the page on the tablet.

## If calendar events or alerts don't show up

Alerts that toggle (pet reminders) call `<domain>.toggle` over the
websocket connection, which only needs the token from step 1 — no extra
config. If calendar events don't show up, check the browser console
(`Fully Kiosk → Settings → Web content → enable remote debugging`, or just
test in a desktop browser first) for a 401/403 from `/api/calendars/...`,
which usually means the token was pasted wrong or has since been revoked.

## Design notes

Built for a fixed 2000×1200 resolution rather than being responsive — the
whole point was a wall-mounted tablet with one known screen size, so
`vh`/`vw` units mostly gave way to fixed pixel values, and the type scale
is constrained to five sizes (see the `--fs-*` variables at the top of
[src/index.css](src/index.css)).
