# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A zero-dependency, no-build static single-page app that displays JMA (Japan Meteorological Agency) UV index forecast charts. It is served directly from the `main` branch via GitHub Pages — there is no build step, no package manager, no framework, and no server.

Live site: https://only1thor.github.io/uv_forecast_jma/

## Running locally

Open `index.html` directly in a browser, or use any static file server:

```sh
python3 -m http.server
npx serve .
```

There are no tests, no linter, and no CI pipeline.

## Architecture

The app is four files that load in sequence:

1. **`data.js`** — exposes `window.JMA_DATA`, a single large object containing:
   - `placeName[]` — display names for all ~142 cities
   - `placeImgName[]` — JMA image filename stems (same index as `placeName`)
   - `regions[]` — JMA region objects `{idx, code, name}`
   - `areaPlace{}` — map from region code (numeric string) to arrays of city indices

2. **`app.js`** — IIFE that reads `window.JMA_DATA`, populates the three `<select>` dropdowns, and renders the forecast image. Key responsibilities:
   - Computes today's date in JST (UTC+9) to build the chart URL
   - Manages URL query-param state (`?chart=U&region=000&city=47`) via `history.replaceState` so selections are bookmarkable
   - Builds JMA image URLs in the form: `{IMG_BASE}{YYYYMMDD}/en/{placeImgName}_{typeChar}{YYYYMMDD}_e.png`
   - Handles the unavailable-chart case (image `error` event shows a user-facing notice)

3. **`index.html`** — markup only; all dropdown `<option>` elements are injected by `app.js` at runtime.

4. **`styles.css`** — mobile-first, light/dark (via `prefers-color-scheme`). The dark-mode rule adds a white background to chart images because JMA publishes white PNGs.

## Key conventions

**`data.js` is generated.** Region/city codes mirror JMA's own `area.js` and `chiten_en.js`. Do not hand-edit the data object — regenerate it from JMA source files when it needs updating.

**City indices are stable cross-file.** `placeName[i]`, `placeImgName[i]`, and the values stored in `areaPlace` all use the same integer index `i`. Any code that touches city selection must preserve this alignment.

**Three chart types** are defined by a single-letter suffix in the image filename:
- `U` — UV Index Forecast
- `C` — Clear Sky UV Index Forecast
- `A` — UV Index Estimate

**JST date computation** in `app.js` is manual (no `Intl` API) because the page must work on older iOS WebViews. Keep it that way.

**`app.js` uses ES5** (`var`, `function`, no arrow functions, no template literals) to stay compatible with the same target environments. Maintain this style when editing `app.js`.

## Deployment

Push to `main`. GitHub Pages serves the root directory directly — no build action needed.
