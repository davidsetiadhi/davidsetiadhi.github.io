# davestia.com: design system

## Direction

Calm, content-first web styling inspired by apple.com and developer.apple.com: clear typography, generous space, alternating neutral sections, restrained blue actions, and grouped cards. All CSS and new SVG icons are original. No Apple HTML or CSS is copied. No Apple logos, product images, SF Symbols, font files, or Apple Design Resources are downloaded, embedded, or hosted. The existing Davestia logo and David's photo remain.

Content and product rules in PRODUCT.md still apply. Restyling does not change visible wording. English only; the existing `/id/` content stays as it is. No eyebrow labels, section numbers, identical decorative icon-card grids, or decorative hero motion. `FlowHero.astro` stays off the home page.

## Colour

Tokens live in `src/styles/global.css`. System dark mode and explicit `data-theme='dark'` use the same palette. A saved visitor preference overrides the system; without a saved choice, the system preference applies.

| Tokens | Light | Dark | Use |
|---|---|---|---|
| `--paper` | #ffffff | #000000 | Page |
| `--ice`, `--band` | #f5f5f7 | #1c1c1e | Alternate sections |
| `--panel` | #ffffff | #1c1c1e | Cards |
| `--raised`, `--control`, `--fill` | #f5f5f7 | #2c2c2e | Inputs and nested groups |
| `--navy`, `--ink` | #1d1d1f | #f5f5f7 | Headings and body |
| `--muted` | #6e6e73 | #86868b | Secondary text on page or section grounds |
| `--secondary` | #6e6e73 | #a1a1a6 | Secondary text on raised surfaces |
| `--rule`, `--control-edge` | #d2d2d7 | #424245 | Hairlines |
| `--cobalt`, `--teal` | #0066cc | #2997ff | Links and focus accents |
| `--primary` | #0066cc | #0066cc | Filled pills with white labels |
| `--warn` | #9a4b0b | #ffb067 | Calculator warnings |
| `--accent` | #F2A900 | #F2A900 | Small page-head underline and selection only |

Normal text targets WCAG AA, at least 4.5:1. Light secondary text on #f5f5f7 is 4.66:1; dark secondary #86868b on #1c1c1e is 4.70:1. Raised dark groups use #a1a1a6 (5.42:1 on #2c2c2e), because #86868b would fail there. Filled blue pills retain #0066cc and white labels (5.57:1), including dark mode. The requested #0077ed hover would fail for white labels and small links: filled controls instead hover at #0071e3 (4.70:1 with white), and light text links retain #0066cc with underline feedback. Dark link hover is #64b5ff.

Direction hues remain decorative dots, lines, and subtle capsule tints; labels use the text palette and selected capsules use blue. Dark mode brightens only decorative dots and lines. Calculator diagrams and plots inherit theme tokens; the numeric heat gradient remains a genuine cool-to-warm hex interpolation. Calculator equations, input rules, animations, and output logic are unchanged.

## Type

The stack is `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Inter Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif`. These Apple names only resolve to fonts already installed on the visitor's system. The existing self-hosted Fontsource Inter imports in `Base.astro` remain the Windows/Android fallback. No remote font service is used.

Body text is 17px/1.47, tracking -0.01em. Headlines are weight 700, about 48-56px on desktop with tight -0.02em to -0.03em tracking; section headings are 40px, reducing to 32px on phones. Body measure is 720px. Existing sentence case and wording are preserved.

## Components

- **Header:** 52px sticky translucent material, 72% page colour with saturate(180%) blur(20px), and a hairline. Desktop links are 12px without a segmented background; current links have full opacity and weight 600. Theme and menu use original inline SVGs with 1.6px round strokes and 44px targets.
- **Mobile navigation:** full-width dropdown sheet directly below the header, 28px links, opacity and vertical entrance transition, bounded height with vertical scrolling. Existing outside-click and Escape dismissal and focus return remain.
- **Buttons and links:** 980px pill radius, blue primary with white labels, outlined secondary. `.more` adds a visual chevron to existing editorial links without changing their wording.
- **Sections:** white and #f5f5f7 alternate, black and #1c1c1e in dark mode. Desktop vertical spacing is typically 104px, reducing to 64px on smaller screens. Phone gutters are 16px.
- **Cards:** 18px radius, no outer border, no or very soft shadow. Publications, news, tool indexes, metrics, and skills use grouped cards with internal hairlines. Cards on white sections use the alternate surface; cards on gray sections use the panel surface.
- **Calculators:** plain 18px cards without window chrome or traffic lights. Rounded 44px input fields, an original select chevron, and grouped result tiles. Form columns shrink to the available width on phones. Scenes and plots use themed grounds and labels.
- **Research map:** existing elliptical radial layout, keyboard previews, selection, person filters, and sticky side panel remain. Five original inline line icons distinguish the overview and mobile direction rows. Blue indicates selection. Below 900px, the same data renders as expandable grouped lists. Status labels remain written; unpublished work remains limited to its goal, topic, status, and people.
- **Hero and team:** existing graduation portrait and team imagery, plain introduction, availability, and actions remain. Team placeholders use initials until photos exist.
- **Footer:** 12px gray type on the alternate surface, wrapping profile links, and hairline separators.
- **Accessibility:** 4px soft blue focus ring, semantic buttons and links, responsive grids and wrapping, and reduced-motion styles for navigation, map transitions, and panels. Existing calculator reduced-motion behavior remains.

Concept sketches retain their existing 800x500 viewBox, tint, dot grid, and line art. They carry no data. No unpublished research results or prototype device photos are introduced.
