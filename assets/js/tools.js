// Engineering calculators. Each entry: inputs (rendered as a form) and calc(values) -> { out: [[value, label]], warn }.
// Pure functions live in CALCS so they can be tested with Node (see module.exports at the bottom).
(function (root) {
  "use strict";

  var R = 8.314462618; // J/(mol K)
  var M_O3 = 47.997; // g/mol
  var G = 9.80665; // m/s2

  // Molar volume in L/mol at temperature (deg C) and pressure (kPa).
  function molarVolume(tC, pkPa) {
    return (R * (tC + 273.15)) / pkPa; // kPa * L = J
  }
  // ppm (by volume) to mg/m3 and back.
  function ppmToMg(ppm, tC, pkPa) {
    return (ppm * M_O3) / molarVolume(tC, pkPa);
  }
  function mgToPpm(mg, tC, pkPa) {
    return (mg * molarVolume(tC, pkPa)) / M_O3;
  }

  // Metric coarse thread tensile stress areas, ISO 898-1 (mm2).
  var STRESS_AREA = { M6: 20.1, M8: 36.6, M10: 58.0, M12: 84.3, M14: 115, M16: 157, M20: 245, M24: 353, M30: 561 };
  // Proof stress Sp (MPa), ISO 898-1. Class 8.8 depends on diameter.
  function proofStress(cls, d) {
    if (cls === "8.8") return d <= 16 ? 580 : 600;
    if (cls === "10.9") return 830;
    return 970; // 12.9
  }
  // ISO 3320 cylinder bore series (mm), common sizes.
  var BORES = [25, 32, 40, 50, 63, 80, 100, 125, 140, 160, 180, 200, 250, 320];

  var CALCS = {
    "ozone-ct": {
      inputs: [
        { k: "c", label: "Ozone concentration", unit: "ppm", value: 300 },
        { k: "ct", label: "Target CT dose", unit: "ppm·min", value: 9000 },
        { k: "t", label: "Gas temperature", unit: "°C", value: 25 },
        { k: "p", label: "Pressure", unit: "kPa", value: 101.325 },
      ],
      calc: function (v) {
        if (v.c <= 0) return { warn: "Concentration must be above zero." };
        var mg = ppmToMg(v.c, v.t, v.p);
        return {
          out: [
            [fmt(v.ct / v.c, 1) + " min", "exposure time at this concentration"],
            [fmt(mg, 1) + " mg/m³", "concentration as mass per volume"],
            [fmt(ppmToMg(v.ct, v.t, v.p), 0) + " mg·min/m³", "target dose in mass units"],
            [fmt(ppmToMg(1, v.t, v.p), 3) + " mg/m³", "equal to 1 ppm at these conditions"],
          ],
        };
      },
    },

    "ozone-decay": {
      inputs: [
        { k: "c0", label: "Starting concentration", unit: "ppm", value: 300 },
        { k: "half", label: "Ozone half-life in the closed chamber", unit: "min", value: 20 },
        { k: "ach", label: "Removal by ventilation or destructor", unit: "air changes per hour", value: 0 },
        { k: "cs", label: "Concentration at which the door may open", unit: "ppm", value: 0.1 },
        { k: "t", label: "Elapsed time", unit: "min", value: 30 },
      ],
      calc: function (v) {
        if (v.half <= 0) return { warn: "Half-life must be above zero." };
        var k = Math.LN2 / v.half + v.ach / 60; // 1/min
        var out = [
          [fmt(v.c0 * Math.exp(-k * v.t), 2) + " ppm", "concentration after the elapsed time"],
          [fmt(Math.LN2 / k, 1) + " min", "effective half-life including removal"],
        ];
        if (v.cs > 0 && v.cs < v.c0) out.push([fmt(Math.log(v.c0 / v.cs) / k, 0) + " min", "time to fall to the door-opening level"]);
        return { out: out };
      },
    },

    "ozone-buildup": {
      inputs: [
        { k: "g", label: "Generator output", unit: "g O₃/h", value: 1 },
        { k: "vol", label: "Chamber volume", unit: "L", value: 100 },
        { k: "half", label: "Ozone half-life in the chamber", unit: "min", value: 20 },
        { k: "target", label: "Target concentration", unit: "ppm", value: 300 },
        { k: "t", label: "Gas temperature", unit: "°C", value: 25 },
        { k: "p", label: "Pressure", unit: "kPa", value: 101.325 },
      ],
      calc: function (v) {
        if (v.half <= 0 || v.vol <= 0) return { warn: "Volume and half-life must be above zero." };
        var k = Math.LN2 / v.half; // 1/min
        var gen = (v.g * 1000) / 60 / (v.vol / 1000); // mg/(m3 min)
        var cssMg = gen / k;
        var css = mgToPpm(cssMg, v.t, v.p);
        var out = [
          [fmt(css, 0) + " ppm", "steady-state concentration (well mixed)"],
          [fmt(3 / k, 0) + " min", "time to reach 95% of steady state"],
        ];
        var warn;
        if (v.target > 0 && v.target < css) out.push([fmt(-Math.log(1 - v.target / css) / k, 1) + " min", "time to reach the target"]);
        else if (v.target > 0) warn = "The target is above steady state. This generator cannot reach it in this chamber.";
        return { out: out, warn: warn };
      },
    },

    "hydraulic-cylinder": {
      inputs: [
        { k: "f", label: "Required push force", unit: "kN", value: 20 },
        { k: "p", label: "System pressure", unit: "bar", value: 160 },
        { k: "eta", label: "Mechanical efficiency", unit: "0 to 1", value: 0.9 },
        { k: "rod", label: "Rod diameter", unit: "mm", value: 36 },
        { k: "speed", label: "Extension speed", unit: "mm/s", value: 50 },
      ],
      calc: function (v) {
        if (v.p <= 0 || v.eta <= 0) return { warn: "Pressure and efficiency must be above zero." };
        var pMPa = v.p / 10;
        var dMin = Math.sqrt((4 * v.f * 1000) / (Math.PI * pMPa * v.eta)); // mm
        var bore = BORES.filter(function (b) { return b >= dMin; })[0];
        if (!bore) return { warn: "Required bore is above 320 mm. Raise the pressure or split the load." };
        var aPush = (Math.PI * bore * bore) / 4;
        var aPull = aPush - (Math.PI * v.rod * v.rod) / 4;
        var out = [
          [fmt(dMin, 1) + " mm", "minimum bore"],
          [bore + " mm", "next standard bore (ISO 3320)"],
          [fmt((aPush * pMPa * v.eta) / 1000, 1) + " kN", "push force with that bore"],
          [fmt((aPush * v.speed * 60) / 1e6, 2) + " L/min", "flow needed for the extension speed"],
        ];
        if (aPull > 0) out.splice(3, 0, [fmt((aPull * pMPa * v.eta) / 1000, 1) + " kN", "pull force (annulus side)"]);
        return { out: out, warn: aPull <= 0 ? "The rod is as large as the bore." : undefined };
      },
    },

    "tipping": {
      inputs: [
        { k: "m1", label: "Platform mass", unit: "kg", value: 60 },
        { k: "h1", label: "Platform centre of gravity height", unit: "mm", value: 700 },
        { k: "b1", label: "Platform CoG distance to tipping edge", unit: "mm", value: 350 },
        { k: "m2", label: "Payload mass (person, tools)", unit: "kg", value: 100 },
        { k: "h2", label: "Payload CoG height", unit: "mm", value: 2000 },
        { k: "b2", label: "Payload CoG distance to tipping edge", unit: "mm", value: 300 },
        { k: "hp", label: "Height of a sideways push", unit: "mm", value: 2200 },
      ],
      calc: function (v) {
        var m = v.m1 + v.m2;
        if (m <= 0) return { warn: "Total mass must be above zero." };
        var h = (v.m1 * v.h1 + v.m2 * v.h2) / m;
        var b = (v.m1 * v.b1 + v.m2 * v.b2) / m;
        if (b <= 0) return { warn: "The combined centre of gravity is outside the base. It tips without any push." };
        return {
          out: [
            [fmt(h, 0) + " mm", "combined CoG height"],
            [fmt(b, 0) + " mm", "combined CoG distance to tipping edge"],
            [fmt((Math.atan(b / h) * 180) / Math.PI, 1) + "°", "floor slope at which it tips"],
            [fmt((m * G * b) / v.hp, 0) + " N", "sideways push at that height that tips it"],
          ],
        };
      },
    },

    "beam-deflection": {
      inputs: [
        { k: "cas", label: "Support and load", value: "ss-p", options: [["ss-p", "Simply supported, point load at midspan"], ["ss-w", "Simply supported, uniform load"], ["cant-p", "Cantilever, point load at free end"], ["cant-w", "Cantilever, uniform load"]] },
        { k: "l", label: "Span length", unit: "mm", value: 1000 },
        { k: "load", label: "Load (N for a point load, N/mm for a uniform load)", unit: "N or N/mm", value: 1000 },
        { k: "e", label: "Elastic modulus", unit: "GPa", value: 210 },
        { k: "sec", label: "Cross-section", value: "rect", options: [["rect", "Solid rectangle b × h"], ["round", "Solid round, diameter b"], ["tube", "Round tube, outer b, wall h"]] },
        { k: "b", label: "Dimension b", unit: "mm", value: 40 },
        { k: "h", label: "Dimension h", unit: "mm", value: 60 },
      ],
      calc: function (v) {
        var I, c;
        if (v.sec === "rect") { I = (v.b * Math.pow(v.h, 3)) / 12; c = v.h / 2; }
        else if (v.sec === "round") { I = (Math.PI * Math.pow(v.b, 4)) / 64; c = v.b / 2; }
        else {
          var di = v.b - 2 * v.h;
          if (di < 0) return { warn: "Wall is thicker than the radius." };
          I = (Math.PI * (Math.pow(v.b, 4) - Math.pow(di, 4))) / 64; c = v.b / 2;
        }
        var E = v.e * 1000, L = v.l, P = v.load, d, M;
        if (v.cas === "ss-p") { d = (P * Math.pow(L, 3)) / (48 * E * I); M = (P * L) / 4; }
        else if (v.cas === "ss-w") { d = (5 * P * Math.pow(L, 4)) / (384 * E * I); M = (P * L * L) / 8; }
        else if (v.cas === "cant-p") { d = (P * Math.pow(L, 3)) / (3 * E * I); M = P * L; }
        else { d = (P * Math.pow(L, 4)) / (8 * E * I); M = (P * L * L) / 2; }
        return {
          out: [
            [fmt(d, 3) + " mm", "maximum deflection"],
            [fmt(M / 1000, 1) + " N·m", "maximum bending moment"],
            [fmt((M * c) / I, 1) + " MPa", "maximum bending stress"],
            [fmt(I / 1e4, 2) + " cm⁴", "second moment of area"],
          ],
        };
      },
    },

    "bolt-torque": {
      inputs: [
        { k: "size", label: "Thread size (metric coarse)", value: "M12", options: Object.keys(STRESS_AREA).map(function (s) { return [s, s]; }) },
        { k: "cls", label: "Property class", value: "8.8", options: [["8.8", "8.8"], ["10.9", "10.9"], ["12.9", "12.9"]] },
        { k: "frac", label: "Preload as a share of proof load", unit: "%", value: 75 },
        { k: "kf", label: "Nut factor K", unit: "0.20 dry steel, 0.15 lubricated", value: 0.2 },
      ],
      calc: function (v) {
        var d = Number(v.size.slice(1));
        var proof = (proofStress(v.cls, d) * STRESS_AREA[v.size]) / 1000; // kN
        var F = (proof * v.frac) / 100;
        return {
          out: [
            [fmt(proof, 1) + " kN", "proof load"],
            [fmt(F, 1) + " kN", "target preload"],
            [fmt(v.kf * F * d, 0) + " N·m", "tightening torque"],
          ],
          warn: v.frac > 90 ? "Preload above 90% of proof load leaves little margin for scatter in the nut factor." : undefined,
        };
      },
    },

    "wall-heat": {
      inputs: [
        { k: "ti", label: "Inside temperature", unit: "°C", value: 45 },
        { k: "to", label: "Outside temperature", unit: "°C", value: 25 },
        { k: "hi", label: "Inside heat transfer coefficient", unit: "W/(m²·K)", value: 10 },
        { k: "ho", label: "Outside heat transfer coefficient", unit: "W/(m²·K)", value: 15 },
        { k: "l1", label: "Layer 1 thickness", unit: "mm", value: 2 },
        { k: "k1", label: "Layer 1 conductivity", unit: "W/(m·K)", value: 50 },
        { k: "l2", label: "Layer 2 thickness (0 if none)", unit: "mm", value: 0 },
        { k: "k2", label: "Layer 2 conductivity", unit: "W/(m·K)", value: 0.04 },
        { k: "a", label: "Wall area", unit: "m²", value: 1 },
      ],
      calc: function (v) {
        if (v.hi <= 0 || v.ho <= 0 || v.k1 <= 0 || (v.l2 > 0 && v.k2 <= 0)) return { warn: "Coefficients and conductivities must be above zero." };
        var rTot = 1 / v.hi + v.l1 / 1000 / v.k1 + (v.l2 > 0 ? v.l2 / 1000 / v.k2 : 0) + 1 / v.ho;
        var q = (v.ti - v.to) / rTot; // W/m2
        return {
          out: [
            [fmt(1 / rTot, 2) + " W/(m²·K)", "overall U-value"],
            [fmt(q * v.a, 1) + " W", "heat flow through the wall"],
            [fmt(v.ti - q / v.hi, 1) + " °C", "inner surface temperature"],
            [fmt(v.to + q / v.ho, 1) + " °C", "outer surface temperature"],
          ],
        };
      },
    },
  };

  function fmt(x, dp) {
    if (!isFinite(x)) return "–";
    return Number(x).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  function mount(el) {
    var spec = CALCS[el.dataset.calc];
    if (!spec) return;
    var id = "c-" + el.dataset.calc;
    el.innerHTML =
      '<form class="calc-grid" novalidate>' +
      spec.inputs.map(function (i) {
        var field = i.options
          ? '<select name="' + i.k + '">' + i.options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === i.value ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"
          : '<input type="number" inputmode="decimal" step="any" name="' + i.k + '" value="' + i.value + '">';
        return '<label for="' + id + i.k + '">' + esc(i.label) + (i.unit ? ' <span class="text-muted">(' + esc(i.unit) + ")</span>" : "") + field.replace("name=", 'id="' + id + i.k + '" name=') + "</label>";
      }).join("") +
      '</form><div class="calc-out" aria-live="polite"></div><p class="calc-warn" hidden></p>';
    var form = el.querySelector("form"), out = el.querySelector(".calc-out"), warn = el.querySelector(".calc-warn");
    function run() {
      var v = {};
      spec.inputs.forEach(function (i) {
        var raw = form.elements[i.k].value;
        v[i.k] = i.options ? raw : parseFloat(raw);
      });
      var bad = spec.inputs.filter(function (i) { return !i.options && !isFinite(v[i.k]); });
      var r = bad.length ? { warn: "Fill in " + bad.map(function (i) { return i.label.toLowerCase(); }).join(", ") + "." } : spec.calc(v);
      out.innerHTML = (r.out || []).map(function (o) { return "<div><b>" + esc(o[0]) + "</b><span>" + esc(o[1]) + "</span></div>"; }).join("");
      warn.hidden = !r.warn;
      warn.textContent = r.warn || "";
    }
    form.addEventListener("input", run);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    run();
  }

  if (typeof module !== "undefined") module.exports = { CALCS: CALCS, ppmToMg: ppmToMg, mgToPpm: mgToPpm };
  if (typeof document !== "undefined") {
    var start = function () { document.querySelectorAll("[data-calc]").forEach(mount); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  }
})(this);
