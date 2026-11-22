# davestia.com: design system

## Direction
The design is calm, light and content first. David's photo and the research map carry the home page. There is no big logo and no decorative motion in the hero: the small logo stays at top left. The potential-flow animation (`FlowHero.astro`) is off the home page. It is kept for a page where it explains something, such as the ozone project.

## Colour (tokens in `src/styles/global.css`)
| Token | Value | Use |
|---|---|---|
| `--navy` | #061F3E | Headings, map lines, primary text accents |
| `--ink` | #292D35 | Body text |
| `--paper` | #FBFCFD | Page background (light by default) |
| `--ice` | #EEF3F8 | Bands, page heads, map ground |
| `--cobalt` | #1749BC | Links, focus on map |
| `--teal` | #096E77 | Dates, small labels |
| `--accent` | #F2A900 | Amber fills with navy text only (buttons, selected node). Never text on paper (contrast 1.9:1) |

Each research direction has its own hue, used only for its dots and lines on the map. The hues are muted so that none of them shouts:
- Health: teal
- Engines & energy: amber-brown
- Safety & materials: slate
- Industry: cobalt
- Environment: green

## Type
- One family for everything: **Inter Variable** (self-hosted through Fontsource, with weight and optical-size axes). It is a neutral grotesque in the Helvetica tradition, chosen to match the plain industrial type of kubota.com (Helvetica Neue).
- Headings are weight 700 with tracking from -0.015em to -0.025em. Body text is 17px with line height 1.65, at most 720px wide.

## Components
- **macOS controls:** the header is a translucent toolbar with a segmented control for the menu and icon buttons for theme and menu. On narrow screens the menu opens as a popover (click outside or Escape closes it). Buttons are push buttons (radius 8px, hairline shadow). Lists are grouped panels (radius 12px) as in System Settings. Calculators sit in a window with a title bar; select fields are pop-up buttons; the search field is a rounded search field. Focus uses a soft cobalt ring.
- **Hero:** the photo (4:5, rounded 10px; the 2026 YTB graduation photo) on the right, and on the left the name, a plain lead, the status and the actions.
- **Research map** (`ResearchMap.astro`): an elliptical radial layout, up to 1360px wide (wider than the text column), with David at the centre, five directions, and projects on the outer ring. Hovering or focusing a direction or a project dims the rest; clicking selects it and fills the panel below the map. Person chips under the map highlight that person's projects. Under 900px the map becomes a list of directions with details, built from the same data. It is fully keyboard operable, and motion is reduced when the visitor asks for it.
- **Status chips:** published, ongoing, planned. Outlined rather than filled, with the label always written.
- **Team cards:** a square face (initials until a photo exists), name, school, and what the person works on.

## Rules
- No eyebrow labels above headings, no section numbers, no identical icon-card grids.
- Concept sketches use the existing illustration style: an 800×500 viewBox, a light tint with a dot grid, line art. They carry no data.
