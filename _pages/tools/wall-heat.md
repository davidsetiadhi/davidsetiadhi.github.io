---
layout: page
title: Heat flow through a layered wall
permalink: /tools/wall-heat/
description: U-value, heat flow, and surface temperatures for one or two layers with convection.
og_image: /assets/img/og/battery-case.png
---

Steady one-dimensional heat flow through a wall of up to two layers with convection on both sides, such as an enclosure panel with insulation or a battery case wall.

<div class="calc" data-calc="wall-heat"><noscript>This calculator needs JavaScript.</noscript></div>

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
