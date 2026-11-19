---
layout: page
title: Ozone sterilization chamber
description: PhD research. Mathematical model, CFD, and experiments on ozone transport in a closed recirculating chamber
importance: 1
category: research
img: assets/img/illustrations/ozone-chamber.svg
og_image: /assets/img/og/ozone-chamber.png
---

{% include figure.liquid path="assets/img/illustrations/ozone-chamber.svg" class="img-fluid rounded" alt="Ozone chamber with a recirculation loop, an ozone generator, and a concentration sensor" %}

Reusable medical devices that cannot tolerate heat need a low-temperature sterilant. Ozone works well and leaves no residue, but whether every surface in a chamber receives enough of it depends on how the gas is generated, carried, and decays.

My dissertation, _Mathematical Modeling, CFD Simulation, and Experimental Validation of Gas-Phase Ozone Transport in a Closed Recirculating Sterilization Chamber_ (supervisor: Prof. Dr. Kadir Çavdar), asks one practical question: does every surface of a loaded chamber get the dose it needs, and how can you tell without measuring everywhere?

#### The problem

A sterilization cycle is specified as a dose, concentration multiplied by time. A sensor in a chamber reads that dose at one point. Ozone, though, is generated at one outlet, carried by a recirculating flow, and decays on the way and on every surface it touches. A corner behind a packed instrument tray can sit well below the sensor reading. Running the cycle longer covers that gap, but it also costs time and exposes materials to more ozone than they need.

#### The approach

1. **Model.** A mass balance for ozone generation, transport, and decomposition that predicts the concentration history from generator output, chamber volume, flow rate, and decay rate. Its simplest well-mixed form is in the [chamber build-up calculator](/tools/ozone-buildup/).
2. **CFD.** ANSYS Fluent simulation of the recirculating flow and the ozone concentration field, to see where the dose is lowest and how the layout and flow rate change that.
3. **Experiment.** A prototype chamber I designed, built, and instrumented myself, with ozone concentration and flow measurement, to validate both the model and the CFD.

#### What it is for

The aim is a cycle you can set from a model and trust everywhere in the load, with the slowest spot known in advance. The same method carries over to other closed-loop gas treatments, such as fumigation or decontamination of enclosed equipment.

#### Status

Defense in mid-December 2026. Two journal papers from the dissertation are in preparation, so the CFD and validation results will appear here once they are published.

#### Try the numbers

- [Ozone CT dose and exposure time](/tools/ozone-ct/)
- [Chamber ozone build-up from a generator](/tools/ozone-buildup/)
- [Ozone decay and door-opening time](/tools/ozone-decay/)

#### Related work

- Setiadhi, Çavdar, Özakın, Ayas (2026). Engineering optimization of ozone generation technologies for medical device sterilization: a review. _Journal of Physics D: Applied Physics_ 59(9), 093002. [doi:10.1088/1361-6463/ae38f1](https://doi.org/10.1088/1361-6463/ae38f1)
- Setiadhi, Akbari, Çavdar (2024). Ozone sterilization prototype for dental instruments. _UBAK International Congress II_.
