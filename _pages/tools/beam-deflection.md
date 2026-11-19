---
layout: page
title: Beam deflection and bending stress
permalink: /tools/beam-deflection/
description: Four classic support cases with rectangle, round, and tube sections.
og_image: /assets/img/og/scissor-lift.png
---

Maximum deflection, bending moment, and bending stress for the four load cases that cover most quick checks of frames, fixtures, and brackets.

<figure class="tool-figure">
{% include figure.liquid path="assets/img/tools/beam-deflection.svg" class="img-fluid rounded" alt="Four beam load cases and three cross-sections" %}
<figcaption class="fig-caption"><strong>Figure 1.</strong> The four load cases (a–d), each with span <em>L</em> (mm), point load <em>P</em> (N) or uniform load <em>w</em> (N/mm), and maximum deflection <em>δ</em> (mm; dashed shapes exaggerated), and the three cross-sections (e) with dimensions <em>b</em> and <em>h</em> (mm). The simply supported beams deflect most at midspan, and the cantilevers at the free end.</figcaption>
</figure>

<div class="calc" data-calc="beam-deflection"><noscript>This calculator needs JavaScript.</noscript></div>
<p class="fig-caption"><strong>Figure 2.</strong> Deflected shape <em>y</em>(<em>x</em>) (mm) along the span <em>x</em> (mm) for the selected case and section. The deflection axis is stretched relative to the span axis so the shape is visible. The marked point is the maximum deflection <em>δ</em> given above.</p>


#### Formulas

$$\delta_{\text{SS},P} = \frac{PL^3}{48EI}, \quad \delta_{\text{SS},w} = \frac{5wL^4}{384EI}, \quad \delta_{\text{C},P} = \frac{PL^3}{3EI}, \quad \delta_{\text{C},w} = \frac{wL^4}{8EI}, \qquad \sigma = \frac{Mc}{I}$$

#### Limits

Linear elastic, small deflection, and slender beams only. Shear deflection, local buckling of thin walls, and stress concentrations at holes are not included.

#### References

- Young, Budynas, Sadegh, _Roark's Formulas for Stress and Strain_, McGraw-Hill.
- Budynas, Nisbett, _Shigley's Mechanical Engineering Design_, McGraw-Hill.

#### Related work

- [Double scissor-lift for Bosch TS5 lines](/projects/2_scissor_lift/)

[All engineering tools](/tools/)

<script src="{{ '/assets/js/tools.js' | relative_url }}" defer></script>
