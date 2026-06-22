# JMA UV Index (Mobile)

A mobile-friendly, static single-page view of the [Japan Meteorological Agency
(JMA) UV index forecast](https://www.data.jma.go.jp/env/uvindex/en/uvtrans.html).

Pick a **chart type**, **region**, and **city**; the forecast chart for **today**
(Japan Standard Time) is shown. There is no server — the page links directly to
JMA's published chart images.

## Controls

- **Chart** — UV Index Forecast, Clear Sky UV Index Forecast, or UV Index Estimate.
- **Region** — Japan (all cities) or a specific JMA region; selecting a region
  filters the city list.
- **City** — Tokyo, Osaka, and Kyoto are pinned to the top; the rest are
  alphabetical. Defaults to **Tokyo** with the **Japan** region.

The date is always today (the "Valid for" line), matching JMA's daily chart.

## How it works

JMA publishes each chart as a date-stamped PNG, e.g.
`…/imgs/graph/YYYYMMDD/en/Tokyo_U20260622_e.png`, where the trailing letter is
the chart type (`U`, `C`, or `A`). The page computes today's date in JST and
builds that URL directly. JMA serves these images with
`Access-Control-Allow-Origin: *` and no hotlink protection, so they load fine
from GitHub Pages.

Region/city codes and names in `data.js` are generated from JMA's own
`area.js` and `chiten_en.js`.

If a chart isn't published yet for the chosen city (estimates appear later in the
day), a notice is shown instead of a broken image.

## Files

- `index.html` — markup and control layout
- `styles.css` — mobile-first styling (light/dark)
- `app.js` — dropdown population, ordering, and chart URL logic
- `data.js` — generated region/city data

## Deploying to GitHub Pages

The site is served directly from the `main` branch (no build step):

1. In the repository, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Set **Branch** to `main` and the folder to **/ (root)**, then **Save**.

The site then publishes at `https://<owner>.github.io/<repo>/` within a minute
or two.
