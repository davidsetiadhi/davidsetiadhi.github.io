---
layout: page
title: Ozone decay and door-opening time
permalink: /tools/ozone-decay/
description: First-order decay with optional ventilation or catalytic destructor removal.
og_image: /assets/img/og/ozone-chamber.png
---

After the exposure phase, ozone has to fall to a safe level before a chamber can be opened. Inside a closed chamber ozone decays roughly first order, and a ventilation fan or catalytic destructor adds a second first-order removal term.

<figure class="tool-figure">
{% include figure.liquid path="assets/img/tools/ozone-decay.svg" class="img-fluid rounded" alt="Sealed ozone chamber with natural decay and a destructor loop" %}
<figcaption class="fig-caption"><strong>Figure 1.</strong> Sealed chamber after the exposure phase. Ozone decays to oxygen with half-life <em>t</em><sub>1/2</sub> (min), and a destructor or vent removes it at ACH air changes per hour. The door may open when the concentration <em>C</em> falls to the door-opening level <em>C</em><sub>s</sub> (ppm). Both removal paths act at the same time, so their rate constants add.</figcaption>
</figure>

<div class="calc" data-calc="ozone-decay"><noscript>This calculator needs JavaScript.</noscript></div>
<p class="fig-caption"><strong>Figure 2.</strong> Ozone concentration <em>C</em> (ppm, logarithmic axis) against time <em>t</em> (min) for the values above. First-order decay is a straight line on this axis, and the marked point is where <em>C</em> reaches <em>C</em><sub>s</sub>.</p>


#### Formulas

$$C(t) = C_0\, e^{-kt}, \qquad k = \frac{\ln 2}{t_{1/2}} + \frac{\text{ACH}}{60}, \qquad t_{\text{safe}} = \frac{\ln(C_0/C_s)}{k}$$

#### Limits

The half-life is not a constant of ozone. It depends on temperature, humidity, and the surfaces in the chamber, so measure it in your own chamber by sealing it and logging the concentration. 0.1 ppm is the US OSHA 8-hour exposure limit for ozone (29 CFR 1910.1000, Table Z-1); use the limit that applies where you work.

#### References

- OSHA 29 CFR 1910.1000, Table Z-1 (ozone, 0.1 ppm).
- Setiadhi et al. (2026), [Engineering optimization of ozone generation technologies for medical device sterilization: a review](https://doi.org/10.1088/1361-6463/ae38f1), _Journal of Physics D: Applied Physics_.

#### Related work

- [Ozone sterilization chamber](/projects/1_ozone_chamber/) (my PhD project)

[All engineering tools](/tools/)

<script src="{{ '/assets/js/tools.js' | relative_url }}" defer></script>
