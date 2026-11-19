---
layout: page
title: Hydraulic cylinder sizing
permalink: /tools/hydraulic-cylinder/
description: Minimum bore, standard bore, push and pull force, and flow for a speed.
og_image: /assets/img/og/scissor-lift.png
---

A first sizing pass for a hydraulic cylinder: the smallest bore that gives the force at your pressure, the next standard bore, and the pump flow for the extension speed.

<figure class="tool-figure">
{% include figure.liquid path="assets/img/tools/hydraulic-cylinder.svg" class="img-fluid rounded" alt="Section of a hydraulic cylinder with bore, rod, pressure, flow, force and speed" %}
<figcaption class="fig-caption"><strong>Figure 1.</strong> Section of a double-acting hydraulic cylinder. Pressure <em>p</em> (bar) acts on the cap side over the bore diameter <em>D</em> (mm) and pushes the rod out with force <em>F</em> (kN) at speed <em>v</em> (mm/s), fed by the flow <em>Q</em> (L/min). On the return stroke the pressure acts only on the annulus between the bore and the rod diameter <em>d</em> (mm), so the pull force is smaller than the push force.</figcaption>
</figure>

<div class="calc" data-calc="hydraulic-cylinder"><noscript>This calculator needs JavaScript.</noscript></div>

#### Formulas

$$D_{\min} = \sqrt{\frac{4F}{\pi\, p\, \eta}}, \qquad F_{\text{pull}} = \frac{\pi}{4}\left(D^2 - d^2\right) p\, \eta, \qquad Q = \frac{\pi D^2}{4}\, v$$

#### Limits

Check the rod for buckling at full stroke and check the mounting separately. Bore sizes follow the ISO 3320 series.

#### References

- ISO 3320, Fluid power systems and components: cylinder bores and piston rod diameters.

#### Related work

- [Double scissor-lift for Bosch TS5 lines](/projects/2_scissor_lift/)
- Setiadhi et al. (2025), Double Scissor-Lift System Integrated with TS5 Conveyor Lines, _ASES International Selcuk Congress_.

[All engineering tools](/tools/)

<script src="{{ '/assets/js/tools.js' | relative_url }}" defer></script>
