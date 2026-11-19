---
layout: page
title: Bolt preload and tightening torque
permalink: /tools/bolt-torque/
description: Metric bolts, ISO 898-1 property classes, and the nut-factor torque relation.
og_image: /assets/img/og/scissor-lift.png
---

The torque that brings a metric bolt to a chosen share of its proof load, using the short-form torque relation.

<figure class="tool-figure">
{% include figure.liquid path="assets/img/tools/bolt-torque.svg" class="img-fluid rounded" alt="Section of a bolted joint with preload, torque and shank diameter" %}
<figcaption class="fig-caption"><strong>Figure 1.</strong> Section of a bolted joint. The tightening torque <em>T</em> (N·m) on the nut stretches the bolt of nominal diameter <em>d</em> (mm) and produces the preload <em>F</em><sub>i</sub> (kN) that clamps the plates. Most of the torque goes into thread and nut-face friction, lumped into the nut factor <em>K</em>, so any scatter in <em>K</em> becomes scatter in <em>F</em><sub>i</sub>.</figcaption>
</figure>

<div class="calc" data-calc="bolt-torque"><noscript>This calculator needs JavaScript.</noscript></div>

#### Formulas

$$F_p = S_p\, A_t, \qquad F_i = f\, F_p, \qquad T = K\, F_i\, d$$

with tensile stress area $$A_t$$ and proof stress $$S_p$$ from ISO 898-1 (class 8.8: 580 MPa up to M16 and 600 MPa above; 10.9: 830 MPa; 12.9: 970 MPa).

#### Limits

The nut factor scatters by ±25% or more with surface finish and lubrication, so the preload from a torque wrench scatters too. For critical joints, use the torque the fastener supplier gives or measure preload directly.

#### References

- ISO 898-1, Mechanical properties of fasteners made of carbon steel and alloy steel.
- Budynas, Nisbett, _Shigley's Mechanical Engineering Design_, McGraw-Hill, chapter on screws and fasteners.

[All engineering tools](/tools/)

<script src="{{ '/assets/js/tools.js' | relative_url }}" defer></script>
