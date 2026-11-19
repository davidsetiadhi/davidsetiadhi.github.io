---
layout: page
title: Beam deflection and bending stress
permalink: /tools/beam-deflection/
description: Four classic support cases with rectangle, round, and tube sections.
og_image: /assets/img/og/scissor-lift.png
---

Maximum deflection, bending moment, and bending stress for the four load cases that cover most quick checks of frames, fixtures, and brackets.

<div class="calc" data-calc="beam-deflection"><noscript>This calculator needs JavaScript.</noscript></div>

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
