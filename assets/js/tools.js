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
        var sec = section(v);
        if (sec.warn) return sec;
        var I = sec.I, c = sec.c;
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

  // Second moment of area I (mm4) and extreme-fibre distance c (mm) of the beam section.
  function section(v) {
    if (v.sec === "rect") return { I: (v.b * Math.pow(v.h, 3)) / 12, c: v.h / 2 };
    if (v.sec === "round") return { I: (Math.PI * Math.pow(v.b, 4)) / 64, c: v.b / 2 };
    var di = v.b - 2 * v.h;
    if (di < 0) return { warn: "Wall is thicker than the radius." };
    return { I: (Math.PI * (Math.pow(v.b, 4) - Math.pow(di, 4))) / 64, c: v.b / 2 };
  }

  // Deflection (mm, positive downward) at x for the four beam cases.
  function beamY(cas, P, L, EI, x) {
    if (cas === "ss-p") { var u = Math.min(x, L - x); return (P * u * (3 * L * L - 4 * u * u)) / (48 * EI); }
    if (cas === "ss-w") return (P * x * (Math.pow(L, 3) - 2 * L * x * x + Math.pow(x, 3))) / (24 * EI);
    if (cas === "cant-p") return (P * x * x * (3 * L - x)) / (6 * EI);
    return (P * x * x * (6 * L * L - 4 * L * x + x * x)) / (24 * EI);
  }

  function sample(f, x0, x1, n) {
    var pts = [];
    for (var i = 0; i <= n; i++) { var x = x0 + ((x1 - x0) * i) / n; pts.push([x, f(x)]); }
    return pts;
  }

  // Optional charts: plot(v) -> { x: {label}, y: {label, log}, series: [{pts, label}], refs: [{y, label}] }.
  CALCS["ozone-ct"].plot = function (v) {
    if (v.c <= 0 || v.ct <= 0) return null;
    var tEnd = (1.25 * v.ct) / v.c;
    return {
      x: { label: "Time, t (min)" }, y: { label: "Accumulated dose, C·t (ppm·min)" },
      series: [{ pts: sample(function (t) { return v.c * t; }, 0, tEnd, 2) }],
      refs: [{ y: v.ct, label: "target CT" }],
      marks: [{ x: v.ct / v.c, y: v.ct }],
    };
  };
  CALCS["ozone-decay"].plot = function (v) {
    if (v.half <= 0 || v.c0 <= 0) return null;
    var k = Math.LN2 / v.half + v.ach / 60;
    var tSafe = v.cs > 0 && v.cs < v.c0 ? Math.log(v.c0 / v.cs) / k : 5 / k;
    return {
      x: { label: "Time after the exposure phase, t (min)" }, y: { label: "Ozone concentration, C (ppm)", log: true },
      series: [{ pts: sample(function (t) { return v.c0 * Math.exp(-k * t); }, 0, 1.2 * tSafe, 120) }],
      refs: v.cs > 0 && v.cs < v.c0 ? [{ y: v.cs, label: "Cₛ door-opening level" }] : [],
      marks: v.cs > 0 && v.cs < v.c0 ? [{ x: tSafe, y: v.cs }] : [],
    };
  };
  CALCS["ozone-buildup"].plot = function (v) {
    var r = CALCS["ozone-buildup"].calc(v);
    if (!r.out) return null;
    var k = Math.LN2 / v.half;
    var css = mgToPpm(((v.g * 1000) / 60 / (v.vol / 1000)) / k, v.t, v.p);
    var tT = v.target > 0 && v.target < css ? -Math.log(1 - v.target / css) / k : 0;
    var refs = [{ y: css, label: "Cₛₛ steady state" }];
    if (v.target > 0) refs.push({ y: v.target, label: "target" });
    return {
      x: { label: "Time after the generator starts, t (min)" }, y: { label: "Ozone concentration, C (ppm)" },
      series: [{ pts: sample(function (t) { return css * (1 - Math.exp(-k * t)); }, 0, Math.max(5 / k, 1.2 * tT), 120) }],
      refs: refs,
      marks: tT ? [{ x: tT, y: v.target }] : [],
    };
  };
  CALCS["beam-deflection"].plot = function (v) {
    var sec = section(v);
    if (sec.warn || v.l <= 0 || v.e <= 0) return null;
    var EI = v.e * 1000 * sec.I;
    var pts = sample(function (x) { return -beamY(v.cas, v.load, v.l, EI, x); }, 0, v.l, 120);
    var tip = v.cas.indexOf("ss") === 0 ? v.l / 2 : v.l;
    return {
      x: { label: "Position along the span, x (mm)" }, y: { label: "Deflection, y (mm)" },
      series: [{ pts: pts }],
      refs: [{ y: 0, label: "undeformed axis" }],
      marks: [{ x: tip, y: -beamY(v.cas, v.load, v.l, EI, tip) }],
    };
  };
  CALCS["wall-heat"].plot = function (v) {
    var r = CALCS["wall-heat"].calc(v);
    if (!r.out) return null;
    var rTot = 1 / v.hi + v.l1 / 1000 / v.k1 + (v.l2 > 0 ? v.l2 / 1000 / v.k2 : 0) + 1 / v.ho;
    var q = (v.ti - v.to) / rTot;
    var tsi = v.ti - q / v.hi, t12 = tsi - (q * v.l1) / 1000 / v.k1;
    var pts = [[0, tsi], [v.l1, t12]];
    if (v.l2 > 0) pts.push([v.l1 + v.l2, t12 - (q * v.l2) / 1000 / v.k2]);
    return {
      x: { label: "Position through the wall from the inner surface (mm)" }, y: { label: "Temperature, T (°C)" },
      series: [{ pts: pts }],
      refs: [{ y: v.ti, label: "Tᵢ inside fluid" }, { y: v.to, label: "Tₒ outside fluid" }],
      marks: pts.map(function (p) { return { x: p[0], y: p[1] }; }),
    };
  };


  // Live schematics: scene.params(v, r) -> numbers (tweened between inputs), scene.draw(p, phase) -> SVG markup.
  // `loop` (ms) adds a repeating time sweep for processes that unfold over time (ozone in a chamber).
  var C_NAVY = "var(--ink)", C_TEAL = "var(--cobalt)", C_O3 = "var(--cobalt)", C_AMB = "var(--cobalt)", C_WARN = "var(--warn)", C_GRID = "var(--rule)";
  function t(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '"' + (o.a ? ' text-anchor="' + o.a + '"' : "") + ' font-size="' + (o.s || 13) + '" font-weight="' + (o.w || 500) + '" fill="' + (o.c || "var(--ink)") + '">' + esc(s) + "</text>";
  }
  function arrow(x1, y1, x2, y2, c, w) {
    var a = Math.atan2(y2 - y1, x2 - x1), h = 7 + (w || 2) * 1.5;
    return '<path d="M' + x1 + " " + y1 + "L" + x2 + " " + y2 + '" stroke="' + c + '" stroke-width="' + (w || 2) + '" stroke-linecap="round"/>' +
      '<path d="M' + (x2 - h * Math.cos(a - 0.45)) + " " + (y2 - h * Math.sin(a - 0.45)) + "L" + x2 + " " + y2 + "L" + (x2 - h * Math.cos(a + 0.45)) + " " + (y2 - h * Math.sin(a + 0.45)) + '" fill="none" stroke="' + c + '" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function logMap(x, hi) { return Math.log10(1 + Math.max(0, x)) / Math.log10(1 + hi); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function mix(c1, c2, f) {
    var a = [1, 3, 5].map(function (i) { return parseInt(c1.substr(i, 2), 16); }), b = [1, 3, 5].map(function (i) { return parseInt(c2.substr(i, 2), 16); });
    return "rgb(" + a.map(function (v, i) { return Math.round(v + (b[i] - v) * f); }).join(",") + ")";
  }
  // Fixed pseudo-random molecule positions inside a chamber (unit square).
  var DOTS = (function () { var s = 7, out = []; for (var i = 0; i < 70; i++) { s = (s * 9301 + 49297) % 233280; var a = s / 233280; s = (s * 9301 + 49297) % 233280; out.push([0.06 + 0.88 * a, 0.08 + 0.84 * (s / 233280)]); } return out; })();
  function chamber(x, y, w, h, level, label) {
    var n = Math.round(clamp(level, 0, 1) * DOTS.length), g = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="14" fill="' + C_O3 + '" fill-opacity="' + (0.04 + 0.22 * clamp(level, 0, 1)).toFixed(3) + '" stroke="' + C_NAVY + '" stroke-width="2.5"/>';
    for (var i = 0; i < n; i++) g += '<circle cx="' + (x + DOTS[i][0] * w).toFixed(1) + '" cy="' + (y + DOTS[i][1] * h).toFixed(1) + '" r="3.2" fill="' + C_O3 + '"/>';
    return g + (label ? t(x + w / 2, y + h + 22, label, { a: "middle", s: 12.5, c: "var(--secondary)" }) : "");
  }

  CALCS["beam-deflection"].scene = {
    params: function (v, r) {
      var sec = section(v);
      if (sec.warn || !r.out || v.l <= 0) return null;
      var d = parseFloat(r.out[0][0].replace(/,/g, "")) || 0;
      return { amp: 70 * Math.tanh((d / v.l) * 150), d: d, cas: v.cas, load: v.load };
    },
    draw: function (p) {
      var x0 = 90, x1 = 550, y = 105, L = x1 - x0, cant = p.cas.indexOf("cant") === 0, g = "";
      var shape = function (u) { return beamY(p.cas, 1, 1, 1, u); }, mx = shape(cant ? 1 : 0.5) || 1;
      var pts = []; for (var i = 0; i <= 60; i++) { var u = i / 60; pts.push([x0 + u * L, y + (p.amp * shape(u)) / mx]); }
      if (cant) g += '<rect x="' + (x0 - 26) + '" y="' + (y - 60) + '" width="26" height="120" fill="var(--raised)" stroke="' + C_NAVY + '" stroke-width="2"/>';
      else g += '<path d="M' + x0 + " " + (y + 9) + "l-14 26h28z M" + x1 + " " + (y + 9) + 'l-14 26h28z" fill="var(--raised)" stroke="' + C_NAVY + '" stroke-width="2" stroke-linejoin="round"/>';
      g += '<path d="M' + x0 + " " + y + "H" + x1 + '" stroke="var(--rule)" stroke-width="12" stroke-dasharray="3 6"/>';
      g += '<path d="' + pts.map(function (q, i) { return (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("") + '" fill="none" stroke="' + C_NAVY + '" stroke-width="12" stroke-linecap="round"/>';
      if (p.cas.slice(-1) === "p") { var xp = cant ? x1 : (x0 + x1) / 2, yp = y + p.amp; g += arrow(xp, yp - 70, xp, yp - 12, C_AMB, 3); g += t(xp + 10, yp - 56, "Load", { c: C_NAVY, w: 600 }); }
      else { for (var j = 0; j <= 8; j++) { var u2 = j / 8, xa = x0 + u2 * L, ya = y + (p.amp * shape(u2)) / mx; g += arrow(xa, ya - 46, xa, ya - 12, C_AMB, 2); } g += t((x0 + x1) / 2, y - 60, "Uniform load", { a: "middle", c: C_NAVY, w: 600 }); }
      var xt = cant ? x1 : (x0 + x1) / 2;
      g += t(xt, y + p.amp + 34, fmt(p.d, 2) + " mm", { a: "middle", s: 15, w: 700, c: C_TEAL });
      g += t(320, 228, "Deflection drawn larger than real, to show the shape", { a: "middle", s: 12, c: "var(--secondary)" });
      return g;
    },
  };

  CALCS["hydraulic-cylinder"].scene = {
    loop: 1600,
    params: function (v, r) {
      if (!r.out) return null;
      var bore = parseFloat(r.out[1][0]);
      return { bore: bore, rod: clamp(v.rod, 0, bore * 0.9), f: v.f, p: v.p, speed: v.speed };
    },
    draw: function (p, ph) {
      var cy = 110, hb = 34 + 96 * clamp((p.bore - 25) / 295, 0, 1), hr = Math.max(6, hb * (p.rod / p.bore)), xb = 110, xe = 400, xp = 300, g = "";
      g += '<rect x="' + xb + '" y="' + (cy - hb / 2) + '" width="' + (xp - xb) + '" height="' + hb + '" fill="' + C_AMB + '" fill-opacity="' + (0.15 + 0.6 * clamp(p.p / 350, 0, 1)).toFixed(2) + '"/>';
      g += '<rect x="' + xb + '" y="' + (cy - hb / 2) + '" width="' + (xe - xb) + '" height="' + hb + '" rx="6" fill="none" stroke="' + C_NAVY + '" stroke-width="3"/>';
      g += '<rect x="' + (xp - 8) + '" y="' + (cy - hb / 2 + 3) + '" width="16" height="' + (hb - 6) + '" fill="' + C_NAVY + '"/>';
      g += '<rect x="' + xp + '" y="' + (cy - hr / 2) + '" width="' + (548 - xp) + '" height="' + hr + '" fill="var(--muted)" stroke="' + C_NAVY + '" stroke-width="2"/>';
      g += '<circle cx="556" cy="' + cy + '" r="' + (hr / 2 + 6) + '" fill="var(--panel)" stroke="' + C_NAVY + '" stroke-width="3"/>';
      var len = 24 + 24 * clamp(logMap(p.f, 1000), 0, 1);
      g += arrow(578, cy, 578 + len, cy, C_TEAL, 4) + t(626, cy - 18, fmt(p.f, 0) + " kN", { a: "end", s: 14, w: 700, c: C_TEAL });
      var off = (-ph * 40).toFixed(1);
      g += '<path d="M60 ' + (cy + hb / 2 + 34) + "H" + (xb + 30) + "V" + (cy + hb / 2) + '" fill="none" stroke="' + C_AMB + '" stroke-width="5" stroke-dasharray="10 10" stroke-dashoffset="' + off + '"/>';
      g += t(60, cy + hb / 2 + 56, "Oil at " + fmt(p.p, 0) + " bar", { s: 12.5, c: "var(--secondary)" });
      g += t((xb + xe) / 2, cy - hb / 2 - 12, "Bore " + p.bore + " mm", { a: "middle", w: 600, c: C_NAVY });
      g += t(470, cy + hr / 2 + 20, "Rod " + fmt(p.rod, 0) + " mm", { a: "middle", s: 12.5, c: "var(--secondary)" });
      return g;
    },
  };

  CALCS["bolt-torque"].scene = {
    params: function (v, r) {
      if (!r.out) return null;
      var d = Number(v.size.slice(1));
      return { d: d, frac: v.frac, torque: parseFloat(r.out[2][0].replace(/,/g, "")) || 0, pre: parseFloat(r.out[1][0].replace(/,/g, "")) || 0 };
    },
    draw: function (p) {
      var cx = 200, cy = 118, sw = 10 + 36 * clamp((p.d - 6) / 24, 0, 1), hw = sw * 1.7, g = "";
      g += '<rect x="' + (cx - 8) + '" y="' + (cy - sw / 2) + '" width="230" height="' + sw + '" fill="var(--rule)" stroke="' + C_NAVY + '" stroke-width="2"/>';
      for (var i = 0; i < 12; i++) g += '<path d="M' + (cx + 110 + i * 10) + " " + (cy - sw / 2) + "l6 " + sw + '" stroke="' + C_NAVY + '" stroke-width="1.3"/>';
      g += '<rect x="' + (cx - 34) + '" y="' + (cy - hw / 2) + '" width="30" height="' + hw + '" rx="3" fill="' + C_NAVY + '"/>';
      var arc = (40 + 260 * logMap(p.torque, 3000)) * Math.PI / 180, R = hw / 2 + 22, a0 = -Math.PI / 2;
      var ax = cx - 19 + R * Math.cos(a0 + arc), ay = cy + R * Math.sin(a0 + arc);
      g += '<path d="M' + (cx - 19) + " " + (cy - R) + "A" + R + " " + R + " 0 " + (arc > Math.PI ? 1 : 0) + " 1 " + ax.toFixed(1) + " " + ay.toFixed(1) + '" fill="none" stroke="' + C_AMB + '" stroke-width="5" stroke-linecap="round"/>';
      g += arrow(ax - 6 * Math.cos(a0 + arc + Math.PI / 2), ay - 6 * Math.sin(a0 + arc + Math.PI / 2), ax, ay, C_AMB, 5);
      g += t(cx - 19, cy - R - 14, fmt(p.torque, 0) + " N·m", { a: "middle", s: 15, w: 700, c: "var(--warn)" });
      var gx = 470, gy = 50, gh = 130, f = clamp(p.frac / 100, 0, 1);
      g += '<rect x="' + gx + '" y="' + gy + '" width="26" height="' + gh + '" rx="13" fill="var(--raised)" stroke="' + C_GRID + '"/>';
      g += '<rect x="' + gx + '" y="' + (gy + gh * (1 - f)) + '" width="26" height="' + gh * f + '" rx="13" fill="' + (p.frac > 90 ? C_WARN : C_TEAL) + '"/>';
      g += '<path d="M' + (gx - 6) + " " + (gy + gh * 0.1) + "h38" + '" stroke="' + C_WARN + '" stroke-dasharray="4 3"/>';
      g += t(gx + 40, gy + gh * 0.1 + 4, "90%", { s: 12, c: C_WARN }) + t(gx + 13, gy + gh + 22, fmt(p.pre, 1) + " kN preload", { a: "middle", s: 12.5, c: "var(--ink)", w: 600 });
      g += t(cx + 100, cy + sw / 2 + 28, "M" + fmt(p.d, 0) + " bolt", { a: "middle", s: 12.5, c: "var(--secondary)" });
      return g;
    },
  };

  CALCS["tipping"].scene = {
    params: function (v, r) {
      if (!r.out) return null;
      var m = v.m1 + v.m2, h = (v.m1 * v.h1 + v.m2 * v.h2) / m, b = (v.m1 * v.b1 + v.m2 * v.b2) / m;
      return { th: Math.atan(b / h), b1: v.b1, h1: v.h1, b2: v.b2, h2: v.h2, b: b, h: h, s: 150 / Math.max(v.h2 + 250, v.h1 * 2, 600) };
    },
    draw: function (p) {
      var Ex = 420, Ey = 205, deg = (p.th * 180) / Math.PI, s = p.s, g = "";
      g += '<path d="M60 ' + Ey + 'H600" stroke="' + C_GRID + '" stroke-width="2" stroke-dasharray="4 5"/>';
      g += '<g transform="rotate(' + deg.toFixed(2) + " " + Ex + " " + Ey + ')">';
      g += '<path d="M120 ' + Ey + 'H560" stroke="var(--muted)" stroke-width="4"/>';
      var w = 2 * p.b1 * s, hgt = 2 * p.h1 * s;
      g += '<rect x="' + (Ex - w) + '" y="' + (Ey - hgt) + '" width="' + w + '" height="' + hgt + '" fill="var(--raised)" stroke="' + C_NAVY + '" stroke-width="2.5"/>';
      for (var k = 1; k < 5; k++) g += '<path d="M' + (Ex - w) + " " + (Ey - (hgt * k) / 5) + "h" + w * (k / 5) + '" stroke="' + C_NAVY + '" stroke-width="1.5"/>';
      var px = Ex - p.b2 * s, py = Ey - p.h2 * s;
      g += '<circle cx="' + px + '" cy="' + (py - 34) + '" r="9" fill="' + C_NAVY + '"/><path d="M' + px + " " + (py - 24) + "v38M" + (px - 12) + " " + (py - 12) + "h24M" + px + " " + (py + 14) + "l-9 " + 20 + "M" + px + " " + (py + 14) + 'l9 20" stroke="' + C_NAVY + '" stroke-width="3.5" stroke-linecap="round" fill="none"/>';
      var gx = Ex - p.b * s, gy = Ey - p.h * s;
      g += "</g>";
      var c = Math.cos(p.th), sn = Math.sin(p.th), rx = Ex + (gx - Ex) * c - (gy - Ey) * sn, ry = Ey + (gx - Ex) * sn + (gy - Ey) * c;
      g += '<path d="M' + rx.toFixed(1) + " " + ry.toFixed(1) + "V" + Ey + '" stroke="' + C_WARN + '" stroke-width="2" stroke-dasharray="5 4"/>';
      g += '<circle cx="' + rx.toFixed(1) + '" cy="' + ry.toFixed(1) + '" r="8" fill="var(--panel)" stroke="' + C_WARN + '" stroke-width="3"/><circle cx="' + Ex + '" cy="' + Ey + '" r="5" fill="' + C_WARN + '"/>';
      g += t(rx + 14, ry - 6, "Centre of gravity", { s: 12.5, c: C_WARN, w: 600 });
      g += t(70, 40, "Tips over at a floor slope of " + fmt(deg, 1) + "°", { s: 15, w: 700, c: deg < 10 ? C_WARN : C_TEAL });
      g += t(70, 60, "At this slope the centre of gravity sits", { s: 12, c: "var(--secondary)" });
      g += t(70, 77, "right above the tipping edge", { s: 12, c: "var(--secondary)" });
      return g;
    },
  };

  CALCS["ozone-ct"].scene = {
    loop: 4500,
    params: function (v) { return v.c > 0 && v.ct > 0 ? { c: v.c, ct: v.ct } : null; },
    draw: function (p, ph) {
      var tEnd = (1.25 * p.ct) / p.c, tt = ph * tEnd, dose = clamp((p.c * tt) / p.ct, 0, 1), g = "";
      g += chamber(70, 40, 220, 150, p.c / 1000, fmt(p.c, 0) + " ppm in the chamber");
      var bx = 350, by = 90, bw = 230;
      g += t(bx, by - 18, "Dose so far: " + fmt(p.c * tt, 0) + " ppm·min", { s: 14, w: 700, c: C_NAVY });
      g += '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="18" rx="9" fill="var(--raised)"/><rect x="' + bx + '" y="' + by + '" width="' + (bw * dose).toFixed(1) + '" height="18" rx="9" fill="' + (dose >= 1 ? C_TEAL : C_O3) + '"/>';
      g += t(bx, by + 44, fmt(tt, 1) + " min", { s: 13, c: "var(--ink)", w: 600 }) + t(bx + bw, by + 44, dose >= 1 ? "Target reached" : "Target " + fmt(p.ct, 0), { a: "end", s: 13, c: dose >= 1 ? C_TEAL : "var(--secondary)", w: 600 });
      return g;
    },
  };

  CALCS["ozone-decay"].scene = {
    loop: 5000,
    params: function (v) {
      if (v.half <= 0 || v.c0 <= 0) return null;
      var k = Math.LN2 / v.half + v.ach / 60;
      return { c0: v.c0, k: k, cs: v.cs, tEnd: 1.2 * (v.cs > 0 && v.cs < v.c0 ? Math.log(v.c0 / v.cs) / k : 5 / k) };
    },
    draw: function (p, ph) {
      var tt = ph * p.tEnd, c = p.c0 * Math.exp(-p.k * tt), open = p.cs > 0 && c <= p.cs, g = "";
      g += chamber(70, 40, 220, 150, Math.pow(c / p.c0, 0.5), fmt(c, c < 10 ? 2 : 0) + " ppm after " + fmt(tt, 0) + " min");
      var dx = 400, dy = 50;
      g += '<rect x="' + dx + '" y="' + dy + '" width="90" height="130" rx="6" fill="var(--panel)" stroke="' + C_NAVY + '" stroke-width="2.5"/>';
      g += '<g transform="translate(' + dx + " " + dy + ") skewY(" + (open ? -12 : 0) + ") scale(" + (open ? 0.72 : 1) + ' 1)"><rect width="90" height="130" rx="6" fill="' + (open ? "#ccfbf1" : "#fee2e2") + '" stroke="' + C_NAVY + '" stroke-width="2.5"/><circle cx="74" cy="68" r="5" fill="' + C_NAVY + '"/></g>';
      g += t(dx + 45, dy + 156, open ? "Door may open" : "Keep the door closed", { a: "middle", s: 13.5, w: 700, c: open ? C_TEAL : C_WARN });
      return g;
    },
  };

  CALCS["ozone-buildup"].scene = {
    loop: 5000,
    params: function (v) {
      if (v.half <= 0 || v.vol <= 0) return null;
      var k = Math.LN2 / v.half, css = mgToPpm(((v.g * 1000) / 60 / (v.vol / 1000)) / k, v.t, v.p);
      var tT = v.target > 0 && v.target < css ? -Math.log(1 - v.target / css) / k : 0;
      return { k: k, css: css, target: v.target, tEnd: Math.max(5 / k, 1.2 * tT), g: v.g };
    },
    draw: function (p, ph) {
      var tt = ph * p.tEnd, c = p.css * (1 - Math.exp(-p.k * tt)), top = Math.max(p.css, p.target, 1e-9) * 1.1, g = "";
      g += '<rect x="40" y="95" width="44" height="40" rx="6" fill="var(--primary)"/>' + t(62, 120, "O₃", { a: "middle", s: 13, w: 700, c: "#fff" });
      g += '<path d="M84 115H120" stroke="' + C_O3 + '" stroke-width="4" stroke-dasharray="6 6" stroke-dashoffset="' + (-ph * 120).toFixed(1) + '"/>';
      g += chamber(120, 40, 220, 150, c / top, fmt(c, 0) + " ppm after " + fmt(tt, 0) + " min");
      var gx = 420, gy = 40, gh = 150, Y = function (x) { return gy + gh * (1 - clamp(x / top, 0, 1)); };
      g += '<rect x="' + gx + '" y="' + gy + '" width="24" height="' + gh + '" rx="12" fill="var(--raised)"/><rect x="' + gx + '" y="' + Y(c) + '" width="24" height="' + (gy + gh - Y(c)) + '" rx="12" fill="' + C_O3 + '"/>';
      g += '<path d="M' + (gx - 6) + " " + Y(p.css) + "h36" + '" stroke="' + C_NAVY + '" stroke-width="2"/>' + t(gx + 40, Y(p.css) + 4, "steady state " + fmt(p.css, 0), { s: 12.5, c: C_NAVY });
      if (p.target > 0) g += '<path d="M' + (gx - 6) + " " + Y(p.target) + "h36" + '" stroke="' + C_WARN + '" stroke-width="2" stroke-dasharray="4 3"/>' + t(gx + 40, Y(p.target) + 4, "target " + fmt(p.target, 0), { s: 12.5, c: C_WARN });
      return g;
    },
  };

  CALCS["wall-heat"].scene = {
    loop: 2000,
    params: function (v, r) {
      if (!r.out) return null;
      var n = function (i) { return parseFloat(r.out[i][0].replace(/,/g, "")); };
      return { ti: v.ti, to: v.to, tsi: n(2), tso: n(3), l1: v.l1, l2: v.l2, q: n(1) / Math.max(v.a, 1e-9) };
    },
    draw: function (p, ph) {
      var lo = Math.min(p.ti, p.to), hi = Math.max(p.ti, p.to), col = function (T) { return mix("#0066cc", "#e4572e", hi > lo ? clamp((T - lo) / (hi - lo), 0, 1) : 0.5); };
      var w1 = 20 + 70 * logMap(p.l1, 200), w2 = p.l2 > 0 ? 20 + 70 * logMap(p.l2, 200) : 0, x1 = 300 - (w1 + w2) / 2, g = "";
      g += '<defs><linearGradient id="wh-g" x1="0" x2="1"><stop offset="0" stop-color="' + col(p.tsi) + '"/><stop offset="1" stop-color="' + col(p.tso) + '"/></linearGradient></defs>';
      g += '<rect x="40" y="40" width="' + (x1 - 40) + '" height="150" fill="' + col(p.ti) + '" fill-opacity="0.18"/><rect x="' + (x1 + w1 + w2) + '" y="40" width="' + (600 - x1 - w1 - w2) + '" height="150" fill="' + col(p.to) + '" fill-opacity="0.18"/>';
      g += '<rect x="' + x1 + '" y="40" width="' + (w1 + w2) + '" height="150" fill="url(#wh-g)" stroke="' + C_NAVY + '" stroke-width="2"/>';
      if (w2) g += '<path d="M' + (x1 + w1) + " 40V190" + '" stroke="' + C_NAVY + '" stroke-width="2" stroke-dasharray="5 4"/>';
      var dir = p.q >= 0 ? 1 : -1, sw = 2 + 6 * logMap(Math.abs(p.q), 2000), off = (dir * -ph * 36).toFixed(1);
      [80, 115, 150].forEach(function (y) { g += '<path d="M70 ' + y + 'H570" stroke="var(--warn)" stroke-opacity="0.55" stroke-width="' + sw.toFixed(1) + '" stroke-dasharray="14 22" stroke-dashoffset="' + off + '" stroke-linecap="round"/>'; });
      g += t(90, 32, "Inside " + fmt(p.ti, 0) + " °C", { s: 13.5, w: 700, c: C_NAVY }) + t(590, 32, "Outside " + fmt(p.to, 0) + " °C", { a: "end", s: 13.5, w: 700, c: C_NAVY });
      g += t(x1 - 6, 210, fmt(p.tsi, 1) + " °C", { a: "end", s: 12.5, c: "var(--ink)" }) + t(x1 + w1 + w2 + 6, 210, fmt(p.tso, 1) + " °C", { s: 12.5, c: "var(--ink)" });
      g += t(300, 230, "Heat flow " + fmt(Math.abs(p.q), 1) + " W/m² " + (dir > 0 ? "outwards" : "inwards"), { a: "middle", s: 12.5, c: "var(--warn)", w: 600 });
      return g;
    },
  };

  // Tick values: "nice" linear steps, or one per decade on a log axis.
  function ticks(lo, hi, log) {
    var out = [], i;
    if (log) {
      for (i = Math.floor(Math.log10(lo)); i <= Math.ceil(Math.log10(hi)); i++) out.push(Math.pow(10, i));
      return out;
    }
    var span = hi - lo || Math.abs(hi) || 1, raw = span / 5, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var step = [1, 2, 2.5, 5, 10].map(function (m) { return m * mag; }).filter(function (st) { return st >= raw; })[0];
    for (i = Math.ceil(lo / step) * step; i <= hi + step * 1e-9; i += step) out.push(Math.abs(i) < step * 1e-9 ? 0 : i);
    return out;
  }

  function tickLabel(x) {
    var a = Math.abs(x);
    if (a !== 0 && (a >= 1e5 || a < 1e-3)) return x.toExponential(0).replace("e+", "e");
    return Number(x.toPrecision(6)).toLocaleString("en-US", { maximumFractionDigits: 4 });
  }

  // Render a plot spec as an inline SVG line chart.
  function chart(p) {
    var W = 640, H = 340, L = 78, R = 150, T = 16, B = 52;
    var xs = [], ys = [];
    p.series.forEach(function (sr) { sr.pts.forEach(function (q) { xs.push(q[0]); ys.push(q[1]); }); });
    (p.refs || []).forEach(function (rf) { ys.push(rf.y); });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var log = p.y.log;
    if (log) { y0 = Math.pow(10, Math.floor(Math.log10(Math.max(y0, 1e-6)))); y1 = Math.pow(10, Math.ceil(Math.log10(y1))); }
    else { var pad = (y1 - y0 || Math.abs(y1) || 1) * 0.08; y0 = y0 >= 0 ? 0 : y0 - pad; y1 = y1 + pad; }
    var xt = ticks(x0, x1, false);
    x1 = Math.max(x1, xt[xt.length - 1]);
    var yt = ticks(y0, y1, log).filter(function (t) { return t >= y0 - 1e-12 && t <= y1 * (1 + 1e-9) + 1e-12; });
    var X = function (x) { return L + ((x - x0) / (x1 - x0 || 1)) * (W - L - R); };
    var Y = function (y) {
      var f = log ? (Math.log10(Math.max(y, y0)) - Math.log10(y0)) / (Math.log10(y1) - Math.log10(y0)) : (y - y0) / (y1 - y0 || 1);
      return H - B - f * (H - T - B);
    };
    var g = "";
    yt.forEach(function (t) {
      g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="var(--rule)"/>' +
        '<text x="' + (L - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + tickLabel(t) + "</text>";
    });
    xt.forEach(function (t) {
      g += '<line x1="' + X(t) + '" x2="' + X(t) + '" y1="' + (H - B) + '" y2="' + (H - B + 5) + '" stroke="var(--ink)"/>' +
        '<text x="' + X(t) + '" y="' + (H - B + 19) + '" text-anchor="middle">' + tickLabel(t) + "</text>";
    });
    (p.refs || []).forEach(function (rf) {
      g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(rf.y) + '" y2="' + Y(rf.y) + '" stroke="var(--warn)" stroke-width="1.5" stroke-dasharray="6 4"/>' +
        '<text x="' + (W - R + 6) + '" y="' + (Y(rf.y) + 4) + '" fill="var(--warn)">' + esc(rf.label) + "</text>";
    });
    p.series.forEach(function (sr) {
      g += '<path fill="none" stroke="var(--cobalt)" stroke-width="2.5" stroke-linejoin="round" d="' +
        sr.pts.map(function (q, i) { return (i ? "L" : "M") + X(q[0]).toFixed(1) + " " + Y(q[1]).toFixed(1); }).join("") + '"/>';
    });
    (p.marks || []).forEach(function (m) {
      g += '<circle cx="' + X(m.x).toFixed(1) + '" cy="' + Y(m.y).toFixed(1) + '" r="4.5" fill="var(--panel)" stroke="var(--cobalt)" stroke-width="2"/>';
    });
    g += '<path d="M' + L + " " + T + "V" + (H - B) + "H" + (W - R) + '" fill="none" stroke="var(--ink)" stroke-width="1.5"/>';
    g += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="13">' + esc(p.x.label) + "</text>";
    g += '<text transform="translate(18 ' + ((T + H - B) / 2) + ') rotate(-90)" text-anchor="middle" font-size="13">' + esc(p.y.label) + "</text>";
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(p.y.label + " against " + p.x.label) + '" font-family="var(--display)" font-size="12" fill="var(--ink)">' + g + "</svg>";
  }

  function fmt(x, dp) {
    if (!isFinite(x)) return "–";
    return Number(x).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  // Tweens scene parameters between inputs (420 ms ease-out) and runs the optional time loop.
  // Reduced motion: no tween, and looped scenes show their end state.
  function sceneDriver(sc, box) {
    var svg = box.querySelector("svg"), cur = null, from = null, to = null, t0 = 0, raf = 0, visible = true;
    var still = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function lerp(a, b, f) { var o = {}; for (var k in b) o[k] = typeof b[k] === "number" && typeof a[k] === "number" ? a[k] + (b[k] - a[k]) * f : b[k]; return o; }
    function frame(now) {
      raf = 0;
      if (!to) return;
      var f = still ? 1 : Math.min(1, (now - t0) / 420), e = 1 - Math.pow(1 - f, 3);
      cur = from ? lerp(from, to, e) : to;
      var ph = sc.loop ? (still ? 1 : (now % sc.loop) / sc.loop) : 0;
      svg.innerHTML = sc.draw(cur, ph);
      if ((f < 1 || (sc.loop && !still)) && visible) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    if (typeof IntersectionObserver !== "undefined") new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }).observe(box);
    return {
      set: function (p) {
        box.hidden = !p;
        if (!p) { to = null; return; }
        from = cur && cur.cas === p.cas ? cur : null; to = p; t0 = performance.now(); kick();
      },
    };
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
        return '<label for="' + id + i.k + '"><span>' + esc(i.label) + (i.unit ? ' <span class="unit">(' + esc(i.unit) + ")</span>" : "") + "</span>" + field.replace("name=", 'id="' + id + i.k + '" name=') + "</label>";
      }).join("") +
      "</form>" + (spec.scene ? '<div class="calc-scene"><svg viewBox="0 0 640 240" role="img" aria-label="Schematic that follows the inputs"></svg></div>' : "") +
      '<div class="calc-out" aria-live="polite"></div><p class="calc-warn" hidden></p>' +
      (spec.plot ? '<div class="calc-plot"></div>' : "");
    var form = el.querySelector("form"), out = el.querySelector(".calc-out"), warn = el.querySelector(".calc-warn"), plot = el.querySelector(".calc-plot");
    var scene = spec.scene && sceneDriver(spec.scene, el.querySelector(".calc-scene"));
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
      if (scene) scene.set(!bad.length && r.out ? spec.scene.params(v, r) : null);
      if (plot) {
        var pl = !bad.length && r.out ? spec.plot(v) : null;
        plot.hidden = !pl;
        plot.innerHTML = pl ? chart(pl) : "";
      }
    }
    form.addEventListener("input", run);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    run();
  }

  if (typeof module !== "undefined") module.exports = { CALCS: CALCS, ppmToMg: ppmToMg, mgToPpm: mgToPpm, chart: chart };
  if (typeof document !== "undefined") {
    var start = function () { document.querySelectorAll("[data-calc]").forEach(mount); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  }
})(this);
