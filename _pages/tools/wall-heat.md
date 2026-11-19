---
layout: page
title: Heat flow through a layered wall
permalink: /tools/wall-heat/
description: U-value, heat flow, and surface temperatures for one or two layers with convection.
og_image: /assets/img/og/battery-case.png
---

Steady one-dimensional heat flow through a wall of up to two layers with convection on both sides, such as an enclosure panel with insulation or a battery case wall.

<figure class="tool-figure">
{% include figure.liquid path="assets/img/tools/wall-heat.svg" class="img-fluid rounded" alt="Two-layer wall with convection on both sides, its temperature profile and resistance network" %}
<figcaption class="fig-caption"><strong>Figure 1.</strong> Two-layer wall between an inside and an outside fluid. Heat flows at <em>q</em> (W/m²) from the inside fluid at <em>T</em><sub>i</sub> (°C) through the convection film <em>h</em><sub>i</sub> (W/(m²·K)), layer 1 of thickness <em>L</em><sub>1</sub> (mm) and conductivity <em>k</em><sub>1</sub> (W/(m·K)), layer 2 (<em>L</em><sub>2</sub>, <em>k</em><sub>2</sub>), and the outside film <em>h</em><sub>o</sub> to the outside fluid at <em>T</em><sub>o</sub>. <em>T</em><sub>s,i</sub> and <em>T</em><sub>s,o</sub> are the surface temperatures. The four resistances add in series, as the network below the wall shows, and the largest temperature drop sits across the largest resistance.</figcaption>
</figure>

<div class="calc" data-calc="wall-heat"><noscript>This calculator needs JavaScript.</noscript></div>
<p class="fig-caption"><strong>Figure 2.</strong> Temperature <em>T</em> (°C) through the solid layers against position from the inner surface (mm), for the values above. The dashed lines are the inside and outside fluid temperatures, and the gaps between them and the wall ends are the drops across the two convection films.</p>


#### Formulas

$$R_{\text{tot}} = \frac{1}{h_i} + \frac{L_1}{k_1} + \frac{L_2}{k_2} + \frac{1}{h_o}, \qquad q = \frac{T_i - T_o}{R_{\text{tot}}}, \qquad U = \frac{1}{R_{\text{tot}}}$$

#### Limits

Steady state, flat wall, no radiation term, no contact resistance between layers. Transient cases such as a thermal-shock test need a time-dependent model.

#### References

- Bergman, Lavine, Incropera, DeWitt, _Fundamentals of Heat and Mass Transfer_, Wiley.

#### Related work

- [EV battery pack case thermal study](/projects/3_battery_case/)
- Setiadhi et al. (2024), Comparative FEM Study of Thermal Behavior in Sheet Metal and SMC Battery Pack Cases for EVs, _Journal of the Chinese Society of Mechanical Engineers_.

[All engineering tools](/tools/)

<script src="{{ '/assets/js/tools.js' | relative_url }}" defer></script>
