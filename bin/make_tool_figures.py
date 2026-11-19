"""Generate the schematic figures for the engineering tool pages.

Writes one SVG per calculator to assets/img/tools/<slug>.svg. Symbols match the
formulas on each page (_pages/tools/<slug>.md). Run from the repo root:

    python bin/make_tool_figures.py
"""
import math
import os

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "tools")
INK, TEAL, ORANGE, GREY, LIGHT, PALE, FILL = "#1f2937", "#0f766e", "#c2410c", "#6b7280", "#e6f2f0", "#f3f4f6", "#d1d5db"
SANS = "Arial, Helvetica, sans-serif"
SERIF = "Georgia, 'Times New Roman', serif"

DEFS = f"""<defs>
<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="{INK}"/></marker>
<marker id="ahT" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="{TEAL}"/></marker>
<marker id="ahO" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="{ORANGE}"/></marker>
<marker id="dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 1L10 5L0 9" fill="none" stroke="{INK}" stroke-width="1.6"/></marker>
<pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="{GREY}" stroke-width="1.4"/></pattern>
</defs>"""


def svg(name, w, h, body, title):
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">'
         f"<title>{title}</title>{DEFS}"
         f'<rect width="{w}" height="{h}" fill="#ffffff"/>'
         f'<g fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{body}</g></svg>')
    with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8") as f:
        f.write(s)


def sym(main, sub=None, size=22, x=0, y=0, anchor="middle", color=INK):
    """Italic serif symbol with an optional upright subscript."""
    s = f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{SERIF}" font-size="{size}" fill="{color}" stroke="none"><tspan font-style="italic">{main}</tspan>'
    if sub:
        s += f'<tspan font-size="{size * 0.68:.0f}" dy="{size * 0.25:.0f}">{sub}</tspan>'
    return s + "</text>"


def rich(x, y, parts, size=20, anchor="middle", color=INK):
    """Mixed text: parts are (text, style) with style i (italic serif), s (subscript), n (plain serif)."""
    out, shift = "", 0
    for t, st in parts:
        dy = 0
        if st == "s" and shift == 0:
            dy, shift = round(size * 0.25), round(size * 0.25)
        elif st != "s" and shift:
            dy, shift = -shift, 0
        attr = ' font-style="italic"' if st == "i" else f' font-size="{size * 0.68:.0f}"' if st == "s" else ""
        out += f'<tspan{attr}' + (f' dy="{dy}"' if dy else "") + f">{t}</tspan>"
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{SERIF}" font-size="{size}" fill="{color}" stroke="none">{out}</text>'


def lab(x, y, s, size=15, anchor="middle", color=GREY, weight="normal"):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{SANS}" font-size="{size}" font-weight="{weight}" fill="{color}" stroke="none">{s}</text>'


def arrow(x1, y1, x2, y2, color=INK, w=2.2, dash=None):
    m = {INK: "ah", TEAL: "ahT", ORANGE: "ahO"}[color]
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{color}" stroke-width="{w}" marker-end="url(#{m})"{d}/>'


def dim(x1, y1, x2, y2, ext=None):
    """Dimension line with open arrowheads at both ends, plus optional extension lines."""
    s = f'<path d="M{x1} {y1}L{x2} {y2}" stroke-width="1.3" marker-start="url(#dim)" marker-end="url(#dim)"/>'
    for e in ext or []:
        s += f'<path d="M{e[0]} {e[1]}L{e[2]} {e[3]}" stroke="{GREY}" stroke-width="1" stroke-dasharray="3 3"/>'
    return s


def o3(x, y, r=5):
    pts = [(x, y), (x - 9, y + 6), (x + 9, y + 6)]
    s = f'<path d="M{x - 9} {y + 6}L{x} {y}L{x + 9} {y + 6}" stroke="{ORANGE}" stroke-width="1.5"/>'
    return s + "".join(f'<circle cx="{a}" cy="{b}" r="{r}" fill="{ORANGE}" stroke="none"/>' for a, b in pts)


def o2(x, y, r=5):
    return (f'<path d="M{x - 5} {y}L{x + 5} {y}" stroke="{GREY}" stroke-width="1.5"/>'
            f'<circle cx="{x - 5}" cy="{y}" r="{r}" fill="{FILL}" stroke="{GREY}" stroke-width="1.2"/><circle cx="{x + 5}" cy="{y}" r="{r}" fill="{FILL}" stroke="{GREY}" stroke-width="1.2"/>')


def chamber(x, y, w, h):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{LIGHT}" stroke-width="2.5"/>'


def zigzag(x1, x2, y, n=6, amp=8):
    seg = (x2 - x1) / (n * 2 + 2)
    d = f"M{x1} {y}L{x1 + seg} {y}"
    for i in range(n * 2):
        d += f"L{x1 + seg * (i + 1.5):.1f} {y + (amp if i % 2 == 0 else -amp)}"
    d += f"L{x2 - seg} {y}L{x2} {y}"
    return f'<path d="{d}" stroke-width="1.8"/>'


def ozone_ct():
    b = [chamber(120, 60, 340, 280)]
    for i in range(6):
        for j in range(4):
            b.append(o3(165 + i * 52, 105 + j * 58))
    b.append(lab(290, 325, "well-mixed chamber, uniform concentration", 14))
    b.append(f'<path d="M460 170H540" stroke-width="2.5"/><rect x="540" y="125" width="130" height="90" rx="6" fill="#ffffff" stroke-width="2.2"/>')
    b.append(sym("C", x=605, y=172, size=30))
    b.append(lab(605, 200, "sensor (ppm)", 13))
    cx, cy = 605, 285
    b.append(f'<circle cx="{cx}" cy="{cy}" r="34" fill="#ffffff" stroke-width="2.2"/><path d="M{cx} {cy}V{cy - 22}M{cx} {cy}L{cx + 16} {cy + 9}" stroke-width="2.2"/><path d="M{cx - 8} {cy - 40}H{cx + 8}M{cx} {cy - 40}V{cy - 34}" stroke-width="2.2"/>')
    b.append(sym("t", x=cx + 54, y=cy + 8, size=28, anchor="start"))
    b.append(lab(cx, cy + 56, "exposure time (min)", 13))
    svg("ozone-ct", 760, 370, "".join(b), "Well-mixed ozone chamber with a concentration sensor and a timer")


def ozone_decay():
    b = [chamber(110, 70, 360, 270)]
    b.append(f'<rect x="96" y="140" width="14" height="130" rx="2" fill="{INK}" stroke="none"/>')
    b.append(lab(90, 130, "door", 13, "end"))
    for (x, y) in [(170, 130), (250, 170), (190, 230), (300, 260)]:
        b.append(o3(x, y))
    for (x, y) in [(360, 140), (400, 210), (340, 300), (420, 280)]:
        b.append(o2(x, y))
    b.append(arrow(225, 300, 300, 300, ORANGE))
    b.append(lab(262, 322, "O₃ → O₂ decay", 13, color=ORANGE))
    b.append(sym("t", "1/2", x=262, y=292, size=20, color=ORANGE))
    b.append(rich(290, 112, [("C", "i"), ("(", "n"), ("t", "i"), (")", "n")], 26))
    # destructor loop
    b.append(f'<path d="M430 70V36H640V130M640 230V380H430V340" stroke="{TEAL}" stroke-width="6"/>')
    b.append(f'<rect x="595" y="130" width="90" height="100" rx="6" fill="#ffffff" stroke="{TEAL}" stroke-width="2.2"/>')
    b.append(lab(640, 175, "destructor", 13, color=TEAL))
    b.append(lab(640, 193, "or vent", 13, color=TEAL))
    b.append(arrow(520, 36, 560, 36, TEAL, 2.5))
    b.append(arrow(640, 300, 640, 330, TEAL, 2.5))
    b.append(sym("ACH", x=700, y=300, size=20, anchor="start", color=TEAL))
    b.append(lab(700, 320, "air changes", 12, "start", TEAL))
    b.append(lab(700, 335, "per hour", 12, "start", TEAL))
    b.append(lab(290, 420, "door may open when", 14, "end"))
    b.append(sym("C", x=300, y=421, size=20, anchor="start"))
    b.append(lab(318, 420, "≤", 15, "start", INK))
    b.append(sym("C", "s", x=334, y=421, size=20, anchor="start"))
    svg("ozone-decay", 800, 440, "".join(b), "Sealed ozone chamber with natural decay and a destructor loop")


def ozone_buildup():
    b = [f'<rect x="40" y="165" width="160" height="96" rx="8" fill="{TEAL}" stroke="none"/>']
    b.append(lab(120, 200, "ozone generator", 13, color="#ffffff"))
    b.append(sym("Ġ", x=104, y=238, size=26, color="#ffffff"))
    b.append(lab(136, 236, "(g/h)", 13, color="#ffffff"))
    b.append(arrow(200, 213, 286, 213, INK, 2.5))
    b.append(chamber(290, 70, 340, 290))
    b.append(sym("V", x=312, y=104, size=24, anchor="start"))
    b.append(lab(334, 103, "(L)", 14, "start"))
    for i in range(5):
        for j in range(4):
            if (i, j) not in [(2, 1), (2, 2), (1, 2), (3, 1)]:
                b.append(o3(330 + i * 62, 140 + j * 58))
    b.append(rich(460, 228, [("C", "i"), ("(", "n"), ("t", "i"), (")", "n")], 34))
    b.append(lab(460, 346, "well mixed", 14))
    b.append(arrow(630, 213, 726, 213, ORANGE, 2.5, "7 6"))
    b.append(sym("kVC", x=678, y=196, size=22, color=ORANGE))
    b.append(lab(678, 240, "decay", 13, color=ORANGE))
    svg("ozone-buildup", 760, 390, "".join(b), "Ozone generator feeding a well-mixed chamber with first-order decay")


def hydraulic():
    b = []
    # barrel: outer shell with caps
    b.append(f'<rect x="120" y="140" width="380" height="140" fill="{FILL}" stroke-width="2.2"/>')
    b.append(f'<rect x="140" y="156" width="340" height="108" fill="#ffffff" stroke="none"/>')
    b.append(f'<rect x="140" y="156" width="160" height="108" fill="{LIGHT}" stroke="none"/>')
    b.append(f'<path d="M140 156H480M140 264H480" stroke-width="1.6"/>')
    b.append(f'<rect x="300" y="156" width="30" height="108" fill="{INK}" stroke="none"/>')
    b.append(f'<rect x="330" y="193" width="340" height="34" fill="{FILL}" stroke-width="2"/>')
    b.append(f'<rect x="480" y="156" width="20" height="37" fill="{FILL}" stroke="none"/><rect x="480" y="227" width="20" height="37" fill="{FILL}" stroke="none"/>')
    b.append(f'<circle cx="690" cy="210" r="20" fill="#ffffff" stroke-width="2.2"/><circle cx="690" cy="210" r="7" stroke-width="1.6"/>')
    b.append(sym("p", x=220, y=218, size=30))
    b.append(lab(220, 250, "cap side", 12))
    b.append(lab(405, 182, "annulus", 12))
    b.append(lab(315, 300, "piston", 12))
    b.append(f'<path d="M200 80V140" stroke="{TEAL}" stroke-width="6"/>')
    b.append(arrow(200, 70, 200, 132, TEAL, 2.5))
    b.append(sym("Q", x=220, y=96, size=24, anchor="start", color=TEAL))
    b.append(arrow(712, 210, 780, 210, INK, 2.8))
    b.append(sym("F", x=760, y=196, size=24))
    b.append(arrow(590, 172, 660, 172, ORANGE, 2.5))
    b.append(sym("v", x=625, y=162, size=22, color=ORANGE))
    b.append(dim(86, 156, 86, 264, [(86, 156, 140, 156), (86, 264, 140, 264)]))
    b.append(sym("D", x=72, y=217, size=24, anchor="end"))
    b.append(f'<path d="M540 160V193" stroke-width="1.3" marker-end="url(#dim)"/><path d="M540 260V227" stroke-width="1.3" marker-end="url(#dim)"/>')
    b.append(sym("d", x=552, y=262, size=22, anchor="start"))
    svg("hydraulic-cylinder", 800, 340, "".join(b), "Section of a hydraulic cylinder with bore, rod, pressure, flow, force and speed")


def cog(x, y, r=10):
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="#ffffff" stroke-width="1.8"/>'
            f'<path d="M{x} {y - r}A{r} {r} 0 0 1 {x + r} {y}H{x}zM{x} {y + r}A{r} {r} 0 0 1 {x - r} {y}H{x}z" fill="{INK}" stroke="none"/>')


def tipping():
    g = 404
    b = [f'<rect x="60" y="{g}" width="640" height="12" fill="url(#hatch)" stroke="none"/><path d="M60 {g}H700" stroke-width="2"/>']
    b.append(f'<path d="M200 382H520V370H200z" fill="{FILL}" stroke-width="2"/>')
    b.append(f'<path d="M205 370L335 150H520V370" fill="{PALE}" stroke-width="2"/>')
    for i in range(1, 6):
        y = 370 - i * 36
        x = 205 + (370 - y) * 130 / 220
        b.append(f'<path d="M{x:.0f} {y}H{x + 40:.0f}" stroke-width="2"/>')
    b.append(f'<path d="M335 150H520" stroke="{TEAL}" stroke-width="5"/>')
    b.append(f'<circle cx="222" cy="393" r="11" fill="#ffffff" stroke-width="2"/><circle cx="498" cy="393" r="11" fill="#ffffff" stroke-width="2"/>')
    # payload: person
    b.append(f'<circle cx="445" cy="70" r="13" fill="{FILL}" stroke-width="1.8"/><path d="M445 83V122M425 100H465M445 122L432 150M445 122L458 150" stroke-width="2"/>')
    b.append(cog(400, 300, 9))
    b.append(sym("m", "1", x=380, y=305, size=19, anchor="end"))
    b.append(cog(445, 110, 9))
    b.append(sym("m", "2", x=470, y=100, size=19, anchor="start"))
    gx, gy = 415, 252
    b.append(cog(gx, gy, 13))
    b.append(sym("G", x=gx - 22, y=gy - 14, size=22, anchor="end", color=TEAL))
    ex, ey = 498, g
    b.append(f'<path d="M{ex} {ey}L{gx} {gy}" stroke="{TEAL}" stroke-width="1.8" stroke-dasharray="6 5"/>')
    b.append(f'<path d="M{ex} {ey}V{gy - 30}" stroke="{GREY}" stroke-width="1.4" stroke-dasharray="4 4"/>')
    ang = math.atan2(ex - gx, ey - gy)
    r = 70
    ax, ay = ex - r * math.sin(ang), ey - r * math.cos(ang)
    b.append(f'<path d="M{ex} {ey - r}A{r} {r} 0 0 0 {ax:.1f} {ay:.1f}" stroke="{ORANGE}" stroke-width="2"/>')
    b.append(sym("θ", "tip", x=ex + 8, y=ey - r - 4, size=20, anchor="start", color=ORANGE))
    b.append(f'<path d="M{ex - 9} {ey + 1}L{ex} {ey - 12}L{ex + 9} {ey + 1}z" fill="{ORANGE}" stroke="none"/>')
    b.append(lab(ex + 14, ey + 34, "tipping edge", 13, "start", ORANGE))
    b.append(f'<path d="M{ex + 10} {ey + 24}L{ex + 2} {ey + 8}" stroke="{ORANGE}" stroke-width="1.2"/>')
    b.append(dim(gx, 440, ex, 440, [(gx, gy + 14, gx, 448), (ex, 418, ex, 448)]))
    b.append(sym("b", x=(gx + ex) / 2, y=432, size=22))
    b.append(dim(600, g, 600, gy, [(gx + 14, gy, 608, gy)]))
    b.append(sym("h", x=614, y=(g + gy) / 2 + 8, size=22, anchor="start"))
    hp = 190
    xs = 205 + (370 - hp) * 130 / 220
    b.append(arrow(xs - 110, hp, xs - 6, hp, INK, 2.8))
    b.append(sym("F", x=xs - 58, y=hp - 12, size=22))
    b.append(dim(110, g, 110, hp, [(118, hp, xs - 112, hp)]))
    b.append(sym("h", "p", x=96, y=(g + hp) / 2 + 8, size=22, anchor="end"))
    svg("tipping", 760, 470, "".join(b), "Mobile platform with payload, combined centre of gravity and tipping edge")


def beam_panel(ox, oy, kind, title):
    x0, x1, y = ox + 50, ox + 330, oy + 110
    b = [lab(ox + 20, oy + 28, title, 14, "start", INK, "bold")]
    b.append(f'<rect x="{x0}" y="{y - 6}" width="{x1 - x0}" height="12" fill="{FILL}" stroke-width="1.8"/>')
    ss = kind.startswith("ss")
    if ss:
        b.append(f'<path d="M{x0} {y + 6}L{x0 - 12} {y + 28}H{x0 + 12}z" fill="#ffffff" stroke-width="1.8"/>')
        b.append(f'<path d="M{x0 - 20} {y + 28}H{x0 + 20}" stroke-width="1.8"/>')
        b.append(f'<circle cx="{x1}" cy="{y + 16}" r="9" fill="#ffffff" stroke-width="1.8"/><path d="M{x1 - 20} {y + 26}H{x1 + 20}" stroke-width="1.8"/>')
    else:
        b.append(f'<rect x="{x0 - 22}" y="{y - 40}" width="22" height="80" fill="url(#hatch)" stroke="none"/><path d="M{x0} {y - 40}V{y + 40}" stroke-width="2.2"/>')
    point = kind.endswith("p")
    if point:
        xp = (x0 + x1) / 2 if ss else x1
        b.append(arrow(xp, y - 64, xp, y - 9, INK, 2.5))
        b.append(sym("P", x=xp + 12, y=y - 46, size=20, anchor="start"))
    else:
        b.append(f'<path d="M{x0} {y - 40}H{x1}" stroke-width="1.6"/>')
        for i in range(8):
            xa = x0 + 12 + i * (x1 - x0 - 24) / 7
            b.append(arrow(xa, y - 40, xa, y - 9, INK, 1.5))
        b.append(sym("w", x=(x0 + x1) / 2, y=y - 50, size=20))
    if ss:
        mid = (x0 + x1) / 2
        b.append(f'<path d="M{x0} {y}Q{mid} {y + 70} {x1} {y}" stroke="{TEAL}" stroke-width="2" stroke-dasharray="7 5"/>')
        b.append(dim(mid + 40, y + 6, mid + 40, y + 35, [(mid, y + 35, mid + 48, y + 35)]))
        b.append(sym("δ", x=mid + 50, y=y + 30, size=20, anchor="start", color=TEAL))
    else:
        b.append(f'<path d="M{x0} {y}Q{x0 + 170} {y + 4} {x1} {y + 50}" stroke="{TEAL}" stroke-width="2" stroke-dasharray="7 5"/>')
        b.append(dim(x1 + 24, y + 6, x1 + 24, y + 50, [(x1 + 6, y + 6, x1 + 32, y + 6), (x1, y + 50, x1 + 32, y + 50)]))
        b.append(sym("δ", x=x1 + 32, y=y + 34, size=20, anchor="start", color=TEAL))
    yl = oy + 196
    b.append(dim(x0, yl, x1, yl, [(x0, y + 30, x0, yl + 8), (x1, y + 30, x1, yl + 8)]))
    b.append(sym("L", x=(x0 + x1) / 2, y=yl - 8, size=20))
    return "".join(b)


def beam():
    b = [beam_panel(0, 0, "ss-p", "(a) Simply supported, point load"),
         beam_panel(400, 0, "ss-w", "(b) Simply supported, uniform load"),
         beam_panel(0, 230, "cant-p", "(c) Cantilever, point load at free end"),
         beam_panel(400, 230, "cant-w", "(d) Cantilever, uniform load")]
    oy = 470
    b.append(f'<path d="M20 {oy}H780" stroke="{FILL}" stroke-width="1.5"/>')
    b.append(lab(20, oy + 28, "(e) Cross-sections", 14, "start", INK, "bold"))
    # rectangle b x h
    rx, ry, rw, rh = 120, oy + 50, 60, 90
    b.append(f'<rect x="{rx}" y="{ry}" width="{rw}" height="{rh}" fill="{FILL}" stroke-width="1.8"/>')
    b.append(dim(rx, ry + rh + 18, rx + rw, ry + rh + 18))
    b.append(sym("b", x=rx + rw / 2, y=ry + rh + 40, size=19))
    b.append(dim(rx + rw + 18, ry, rx + rw + 18, ry + rh))
    b.append(sym("h", x=rx + rw + 28, y=ry + rh / 2 + 6, size=19, anchor="start"))
    b.append(lab(rx + rw / 2 + 10, oy + 215, "solid rectangle", 13))
    # round
    cx, cy, r = 400, oy + 95, 45
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{FILL}" stroke-width="1.8"/>')
    b.append(dim(cx - r, cy + r + 18, cx + r, cy + r + 18))
    b.append(sym("b", x=cx, y=cy + r + 40, size=19))
    b.append(lab(cx, oy + 215, "solid round", 13))
    # tube
    cx = 640
    b.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{FILL}" stroke-width="1.8"/><circle cx="{cx}" cy="{cy}" r="{r - 12}" fill="#ffffff" stroke-width="1.6"/>')
    b.append(dim(cx - r, cy + r + 18, cx + r, cy + r + 18))
    b.append(sym("b", x=cx, y=cy + r + 40, size=19))
    b.append(f'<path d="M{cx + r + 26} {cy}H{cx + r}" stroke-width="1.3" marker-end="url(#dim)"/><path d="M{cx + r - 12 - 22} {cy}H{cx + r - 12}" stroke-width="1.3" marker-end="url(#dim)"/>')
    b.append(sym("h", x=cx + r + 32, y=cy + 6, size=19, anchor="start"))
    b.append(lab(cx, oy + 215, "round tube", 13))
    svg("beam-deflection", 800, 700, "".join(b), "Four beam load cases and three cross-sections")


def bolt():
    b = []
    b.append(f'<rect x="150" y="150" width="360" height="60" fill="{FILL}" stroke-width="2"/><rect x="150" y="210" width="360" height="60" fill="{PALE}" stroke-width="2"/>')
    b.append(f'<rect x="150" y="150" width="360" height="120" fill="url(#hatch)" stroke="none" opacity="0.5"/>')
    b.append(f'<rect x="305" y="150" width="50" height="120" fill="#ffffff" stroke="none"/>')
    b.append(f'<path d="M305 150V270M355 150V270" stroke-width="1.4"/>')
    b.append(f'<rect x="315" y="128" width="30" height="232" fill="#cbd5e1" stroke-width="2"/>')
    for yy in range(276, 356, 9):
        b.append(f'<path d="M315 {yy}L345 {yy + 5}" stroke="{GREY}" stroke-width="1.2"/>')
    b.append(f'<rect x="275" y="104" width="110" height="46" rx="3" fill="#94a3b8" stroke-width="2"/>')
    b.append(f'<rect x="275" y="270" width="110" height="44" rx="3" fill="#94a3b8" stroke-width="2"/>')
    b.append(lab(240, 132, "head", 13, "end"))
    b.append(lab(240, 298, "nut", 13, "end"))
    b.append(lab(530, 186, "clamped plates", 13, "start"))
    b.append(arrow(330, 98, 330, 46, TEAL, 2.8))
    b.append(arrow(330, 366, 330, 418, TEAL, 2.8))
    b.append(sym("F", "i", x=346, y=62, size=22, anchor="start", color=TEAL))
    b.append(sym("F", "i", x=346, y=414, size=22, anchor="start", color=TEAL))
    b.append(f'<path d="M290 232H315" stroke-width="1.3" marker-end="url(#dim)"/><path d="M370 232H345" stroke-width="1.3" marker-end="url(#dim)"/>')
    b.append(sym("d", x=378, y=238, size=22, anchor="start"))
    b.append(f'<path d="M405 330A80 26 0 0 1 255 330" stroke="{ORANGE}" stroke-width="2.4" marker-end="url(#ahO)"/>')
    b.append(sym("T", x=420, y=344, size=24, anchor="start", color=ORANGE))
    b.append(f'<path d="M346 296L530 296" stroke="{GREY}" stroke-width="1.2"/>')
    b.append(lab(536, 292, "thread and nut-face", 13, "start"))
    b.append(lab(536, 309, "friction, nut factor", 13, "start"))
    b.append(sym("K", x=661, y=310, size=17, anchor="start"))
    svg("bolt-torque", 760, 440, "".join(b), "Section of a bolted joint with preload, torque and shank diameter")


def wall():
    top, bot = 70, 300
    xi, x1, x2, xo, xe = 60, 230, 330, 470, 640
    b = [f'<rect x="{xi}" y="{top}" width="{x1 - xi}" height="{bot - top}" fill="#fff7ed" stroke="none"/>',
         f'<rect x="{x1}" y="{top}" width="{x2 - x1}" height="{bot - top}" fill="#cbd5e1" stroke-width="2"/>',
         f'<rect x="{x2}" y="{top}" width="{xo - x2}" height="{bot - top}" fill="#fef3c7" stroke-width="2"/>',
         f'<rect x="{xo}" y="{top}" width="{xe - xo}" height="{bot - top}" fill="#ecfeff" stroke="none"/>']
    ti, tsi, t12, tso, to = 100, 130, 148, 245, 270
    b.append(f'<path d="M{xi + 10} {ti}H{x1 - 50}C{x1 - 20} {ti} {x1 - 8} {tsi - 8} {x1} {tsi}L{x2} {t12}L{xo} {tso}C{xo + 8} {tso + 10} {xo + 22} {to} {xo + 50} {to}H{xe - 10}" stroke="{ORANGE}" stroke-width="2.6"/>')
    for x, y in [(x1, tsi), (x2, t12), (xo, tso)]:
        b.append(f'<circle cx="{x}" cy="{y}" r="4" fill="{ORANGE}" stroke="none"/>')
    b.append(sym("T", "i", x=xi + 20, y=ti - 10, size=20, anchor="start", color=ORANGE))
    b.append(sym("T", "s,i", x=x1 - 8, y=tsi + 26, size=18, anchor="end", color=ORANGE))
    b.append(sym("T", "s,o", x=xo + 10, y=tso - 12, size=18, anchor="start", color=ORANGE))
    b.append(sym("T", "o", x=xe - 30, y=to - 10, size=20, anchor="start", color=ORANGE))
    b.append(arrow(260, 44, 440, 44, TEAL, 2.8))
    b.append(sym("q", x=350, y=34, size=22, color=TEAL))
    b.append(lab((xi + x1) / 2, 240, "inside", 13))
    b.append(sym("h", "i", x=(xi + x1) / 2, y=266, size=20))
    b.append(sym("k", "1", x=(x1 + x2) / 2, y=266, size=20))
    b.append(sym("k", "2", x=(x2 + xo) / 2, y=112, size=20))
    b.append(lab((xo + xe) / 2, 200, "outside", 13))
    b.append(sym("h", "o", x=(xo + xe) / 2, y=226, size=20))
    b.append(dim(x1, 322, x2, 322, [(x1, bot, x1, 330), (x2, bot, x2, 330)]))
    b.append(sym("L", "1", x=(x1 + x2) / 2, y=346, size=19))
    b.append(dim(x2, 322, xo, 322, [(xo, bot, xo, 330)]))
    b.append(sym("L", "2", x=(x2 + xo) / 2, y=346, size=19))
    yn = 410
    nodes = [(xi + 40, "T", "i"), (x1, "T", "s,i"), (x2, None, None), (xo, "T", "s,o"), (xe - 40, "T", "o")]
    res = [("1/", "h", "i"), ("", "L", "1"), ("", "L", "2"), ("1/", "h", "o")]
    for i in range(4):
        a, c = nodes[i][0], nodes[i + 1][0]
        b.append(zigzag(a, c, yn))
        mx = (a + c) / 2
        if res[i][0]:
            parts = [("1/", "n"), (res[i][1], "i"), (res[i][2], "s")]
        else:
            parts = [(res[i][1], "i"), (res[i][2], "s"), ("/", "n"), ("k", "i"), (res[i][2], "s")]
        b.append(rich(mx, yn - 18, parts, 17))
    for x, s, sub in nodes:
        b.append(f'<circle cx="{x}" cy="{yn}" r="5" fill="#ffffff" stroke-width="1.8"/>')
        if s:
            b.append(sym(s, sub, x=x, y=yn + 34, size=17))
    b.append(arrow(xe - 30, yn, xe + 30, yn, TEAL, 2.2))
    b.append(sym("q", x=xe + 40, y=yn + 6, size=19, anchor="start", color=TEAL))
    b.append(lab(xi, 470, "thermal resistance network (per unit area)", 13, "start"))
    svg("wall-heat", 720, 490, "".join(b), "Two-layer wall with convection on both sides, its temperature profile and resistance network")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for f in (ozone_ct, ozone_decay, ozone_buildup, hydraulic, tipping, beam, bolt, wall):
        f()
    print("wrote", len(os.listdir(OUT)), "figures to", os.path.normpath(OUT))
