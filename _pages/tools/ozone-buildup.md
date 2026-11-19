---
layout: page
title: Chamber ozone build-up from a generator
permalink: /tools/ozone-buildup/
description: Steady-state concentration and time to target for a generator in a closed chamber.
og_image: /assets/img/og/ozone-chamber.png
---

How high can a given ozone generator push the concentration in a closed chamber, and how long does it take? Treating the chamber as one well-mixed volume with first-order decay gives a quick first answer.

<figure class="tool-figure">
{% include figure.liquid path="assets/img/tools/ozone-buildup.svg" class="img-fluid rounded" alt="Ozone generator feeding a well-mixed chamber with first-order decay" %}
<figcaption class="fig-caption"><strong>Figure 1.</strong> Ozone generator with output <em>Ġ</em> (g/h) feeding a well-mixed chamber of volume <em>V</em> (L). The concentration <em>C</em>(<em>t</em>) rises until generation balances first-order decay, <em>kVC</em>, where <em>k</em> = ln 2 / <em>t</em><sub>1/2</sub>.</figcaption>
</figure>

<div class="calc" data-calc="ozone-buildup"><noscript>This calculator needs JavaScript.</noscript></div>
<p class="fig-caption"><strong>Figure 2.</strong> Ozone concentration <em>C</em> (ppm) against time <em>t</em> (min) after the generator starts, for the values above. The curve approaches the steady state <em>C</em><sub>ss</sub>, and the marked point is where it reaches the target. A target above <em>C</em><sub>ss</sub> is never reached.</p>


#### Formulas

$$V\frac{dC}{dt} = \dot{G} - kVC \;\;\Rightarrow\;\; C(t) = C_{ss}\left(1 - e^{-kt}\right), \qquad C_{ss} = \frac{\dot{G}}{kV}, \qquad k = \frac{\ln 2}{t_{1/2}}$$

#### Limits

Real chambers are not well mixed. Corners, packed instrument trays, and the generator outlet see different concentrations, which is exactly what my CFD work looks at. Use this result to size a generator, then check the distribution.

#### References

- Well-mixed (CSTR) mass balance; see any chemical reaction engineering text.
- Setiadhi et al. (2026), [Engineering optimization of ozone generation technologies for medical device sterilization: a review](https://doi.org/10.1088/1361-6463/ae38f1), _Journal of Physics D: Applied Physics_.

#### Related work

- [Ozone sterilization chamber](/projects/1_ozone_chamber/) (my PhD project)

[All engineering tools](/tools/)

<script src="{{ '/assets/js/tools.js' | relative_url }}" defer></script>
