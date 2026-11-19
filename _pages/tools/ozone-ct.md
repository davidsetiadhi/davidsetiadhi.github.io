---
layout: page
title: Ozone CT dose and exposure time
permalink: /tools/ozone-ct/
description: Exposure time for a target concentration × time dose, with ppm to mg/m³ conversion.
og_image: /assets/img/og/ozone-chamber.png
---

Ozone disinfection and sterilization are usually specified as a CT dose: concentration multiplied by contact time. This calculator turns a target dose into an exposure time and converts between volume (ppm) and mass (mg/m³) units at your gas temperature and pressure.

<div class="calc" data-calc="ozone-ct"><noscript>This calculator needs JavaScript.</noscript></div>

#### Formulas

$$t = \frac{CT}{C}, \qquad C_{\text{mg/m}^3} = \frac{C_{\text{ppm}}\, M_{\text{O}_3}\, p}{R\,T}$$

with $$M_{\text{O}_3} = 48.00$$ g/mol and the ideal-gas molar volume $$RT/p$$ (24.47 L/mol at 25 °C and 1 atm, so 1 ppm ≈ 1.96 mg/m³).

#### Limits

The CT a process needs depends on the organism, the relative humidity, the load, and the standard you validate against. This tool does the arithmetic only. It does not tell you which CT to use.

#### References

- Ideal gas law; any physical chemistry text.
- Setiadhi et al. (2026), [Engineering optimization of ozone generation technologies for medical device sterilization: a review](https://doi.org/10.1088/1361-6463/ae38f1), _Journal of Physics D: Applied Physics_.

#### Related work

- [Ozone sterilization chamber](/projects/1_ozone_chamber/) (my PhD project)

[All engineering tools](/tools/)

<script src="{{ '/assets/js/tools.js' | relative_url }}" defer></script>
