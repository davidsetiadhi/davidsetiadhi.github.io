---
layout: page
title: Tipping threshold of a platform
permalink: /tools/tipping/
description: Static tipping slope and sideways push for a platform with a payload.
og_image: /assets/img/og/stair-platform.png
---

A mobile platform or stair tips when the line of action of its weight passes the edge of its base. This calculator combines the platform and its payload into one centre of gravity and gives the static tipping slope and the sideways push that tips it.

<div class="calc" data-calc="tipping"><noscript>This calculator needs JavaScript.</noscript></div>

#### Formulas

$$h = \frac{\sum m_i h_i}{\sum m_i}, \quad b = \frac{\sum m_i b_i}{\sum m_i}, \qquad \theta_{\text{tip}} = \arctan\frac{b}{h}, \qquad F_{\text{tip}} = \frac{m g\, b}{h_p}$$

#### Limits

This is the static limit. A person climbing, a sudden push, or a wheel hitting a step adds dynamic loads that tip a platform earlier. That dynamic case is what our rigid-body study covers.

#### References

- Moment equilibrium about the tipping edge; any statics text.

#### Related work

- [Maintenance stair platform stability](/projects/4_stair_platform/)
- Setiadhi, Akbari, Ozturk, Çavdar (2025), Tipping Threshold of Undocked Maintenance Stair Platforms: A Rigid-Dynamics Study, _ASES International Selcuk Congress_.

[All engineering tools](/tools/)

<script src="{{ '/assets/js/tools.js' | relative_url }}" defer></script>
