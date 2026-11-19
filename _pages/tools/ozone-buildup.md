---
layout: page
title: Chamber ozone build-up from a generator
permalink: /tools/ozone-buildup/
description: Steady-state concentration and time to target for a generator in a closed chamber.
og_image: /assets/img/og/ozone-chamber.png
---

How high can a given ozone generator push the concentration in a closed chamber, and how long does it take? Treating the chamber as one well-mixed volume with first-order decay gives a quick first answer.

<div class="calc" data-calc="ozone-buildup"><noscript>This calculator needs JavaScript.</noscript></div>

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
