(function () {
  "use strict";

  var D = window.JMA_DATA;
  var IMG_BASE = "https://www.data.jma.go.jp/env/uvindex/imgs/graph/";

  // Chart types. typeChar maps to the JMA image filename letter;
  // elementCode is used only to link back to the matching JMA page.
  var CHART_TYPES = [
    { id: "U", label: "UV Index Forecast", elementCode: 0 },
    { id: "C", label: "Clear Sky UV Index Forecast", elementCode: 1 },
    { id: "A", label: "UV Index Estimate", elementCode: 3 }
  ];

  // Cities pinned to the top of the city dropdown, in this order.
  var PINNED = ["Tokyo", "Osaka", "Kyoto"];

  var DEFAULT_REGION_CODE = "000"; // Japan (all cities)
  var DEFAULT_CITY = "Tokyo";
  var DEFAULT_CITY_IDX = D.placeName.indexOf(DEFAULT_CITY);
  var DEFAULT_TYPE = "U";

  var els = {
    type: document.getElementById("select-type"),
    region: document.getElementById("select-region"),
    city: document.getElementById("select-city"),
    validDate: document.getElementById("valid-date"),
    chart: document.getElementById("chart"),
    status: document.getElementById("chart-status"),
    sourceLink: document.getElementById("source-link")
  };

  // --- Date helpers (JMA publishes by Japan Standard Time) ---------------
  function jstNow() {
    var now = new Date();
    var utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + 9 * 3600000);
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var today = jstNow();
  var fileDate = today.getFullYear() + pad2(today.getMonth() + 1) + pad2(today.getDate());
  var validLabel = pad2(today.getDate()) + " " + MONTHS[today.getMonth()] + " " + today.getFullYear();

  // --- City ordering -----------------------------------------------------
  // Pin Tokyo/Osaka/Kyoto (when present), then the rest alphabetically.
  function orderCities(indices) {
    var pinned = [];
    PINNED.forEach(function (name) {
      var i = D.placeName.indexOf(name);
      if (i !== -1 && indices.indexOf(i) !== -1) pinned.push(i);
    });
    var rest = indices
      .filter(function (i) { return pinned.indexOf(i) === -1; })
      .sort(function (a, b) {
        return D.placeName[a].localeCompare(D.placeName[b]);
      });
    return pinned.concat(rest);
  }

  function cityIndicesForRegion(regionCode) {
    var list = D.areaPlace[String(parseInt(regionCode, 10))];
    return list ? list.slice() : [];
  }

  // --- URL state (query params for bookmarking) --------------------------
  // chart=U|C|A, region=<3-digit code>, city=<place index>
  function getParam(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function readState() {
    var type = getParam("chart");
    if (!CHART_TYPES.some(function (t) { return t.id === type; })) {
      type = DEFAULT_TYPE;
    }

    var region = getParam("region");
    if (!D.regions.some(function (r) { return r.code === region; })) {
      region = DEFAULT_REGION_CODE;
    }

    var regionCities = cityIndicesForRegion(region);
    var city = parseInt(getParam("city"), 10);
    if (isNaN(city) || regionCities.indexOf(city) === -1) {
      city = regionCities.indexOf(DEFAULT_CITY_IDX) !== -1
        ? DEFAULT_CITY_IDX
        : (regionCities.length ? regionCities[0] : null);
    }

    return { type: type, region: region, city: city };
  }

  // Reflect the current selection in the URL without adding history entries.
  function writeState() {
    var params = "?chart=" + els.type.value +
      "&region=" + els.region.value +
      "&city=" + els.city.value;
    window.history.replaceState(null, "", params);
  }

  // --- Dropdown population ------------------------------------------------
  function populateTypes() {
    CHART_TYPES.forEach(function (t) {
      var o = document.createElement("option");
      o.value = t.id;
      o.textContent = t.label;
      els.type.appendChild(o);
    });
  }

  function populateRegions() {
    D.regions.forEach(function (r) {
      var o = document.createElement("option");
      o.value = r.code;
      o.textContent = r.name;
      els.region.appendChild(o);
    });
    els.region.value = DEFAULT_REGION_CODE;
  }

  function populateCities(preferredIdx) {
    var ordered = orderCities(cityIndicesForRegion(els.region.value));
    els.city.innerHTML = "";
    ordered.forEach(function (i) {
      var o = document.createElement("option");
      o.value = String(i);
      o.textContent = D.placeName[i];
      els.city.appendChild(o);
    });

    // Keep the preferred city when the region still contains it,
    // otherwise fall back to the first entry.
    if (preferredIdx != null && ordered.indexOf(preferredIdx) !== -1) {
      els.city.value = String(preferredIdx);
    } else {
      els.city.value = els.city.options.length ? els.city.options[0].value : "";
    }
  }

  // --- Rendering ---------------------------------------------------------
  function currentType() {
    return CHART_TYPES.filter(function (t) { return t.id === els.type.value; })[0];
  }

  function setStatus(message, isError) {
    if (!message) {
      els.status.hidden = true;
      els.status.textContent = "";
      return;
    }
    els.status.hidden = false;
    els.status.textContent = message;
    els.status.classList.toggle("is-error", !!isError);
  }

  function updateSourceLink() {
    var t = currentType();
    var placeIdx = parseInt(els.city.value, 10);
    var regionIdx = els.region.selectedIndex;
    els.sourceLink.href =
      "https://www.data.jma.go.jp/env/uvindex/en/uvtrans.html?elementCode=" +
      t.elementCode + "&areaCode=" + regionIdx + "&placeCode=" + placeIdx;
  }

  function render() {
    els.validDate.textContent = validLabel;
    updateSourceLink();
    writeState();

    var placeIdx = parseInt(els.city.value, 10);
    if (isNaN(placeIdx)) {
      els.chart.classList.add("is-hidden");
      setStatus("Select a city to view the forecast.", false);
      return;
    }

    var t = currentType();
    var imgName = D.placeImgName[placeIdx] + "_" + t.id + fileDate + "_e.png";
    var url = IMG_BASE + fileDate + "/en/" + imgName;

    setStatus("Loading…", false);
    els.chart.classList.add("is-hidden");
    els.chart.alt = t.label + " for " + D.placeName[placeIdx] + ", " + validLabel;
    els.chart.src = url;
  }

  els.chart.addEventListener("load", function () {
    els.chart.classList.remove("is-hidden");
    setStatus("", false);
  });
  els.chart.addEventListener("error", function () {
    els.chart.classList.add("is-hidden");
    setStatus(
      "Today's " + currentType().label.toLowerCase() +
        " isn't available yet for this city. JMA updates forecasts at 06:00 and 18:00 JST, and estimates later in the day.",
      true
    );
  });

  // --- Wiring ------------------------------------------------------------
  els.type.addEventListener("change", render);
  els.region.addEventListener("change", function () {
    // Preserve the selected city across region changes when possible.
    var currentIdx = els.city.value !== "" ? parseInt(els.city.value, 10) : null;
    populateCities(currentIdx);
    render();
  });
  els.city.addEventListener("change", render);

  // Initialise from the URL so bookmarked selections are restored.
  var state = readState();
  populateTypes();
  populateRegions();
  els.type.value = state.type;
  els.region.value = state.region;
  populateCities(state.city);
  render();
})();
