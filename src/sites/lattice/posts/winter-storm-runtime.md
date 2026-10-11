---
title: What a winter storm taught us about runtime forecasts
description: Operators don't want state of charge. They want to know when the lights go out. How we rebuilt the forecast around that.
date: 2026-09-18
author: Ayesha Brooks
image: posts/winter-storm.jpg
imageAlt: An LC-80 under fresh snow outside a rural clinic at night
---

When the ice came through in February, three of our resilience sites islanded within an hour of each other. All three held. What surprised us was the phone calls.

## Nobody asked about state of charge

Every operator asked the same question in different words: **how long have we got?** State of charge is an engineering number. Runtime is a planning number, and planning is what people do in an emergency.

So we rebuilt the console around a single forecast:

- Hours of runtime at the current load
- Hours at critical load only, if you shed the rest
- The time the generator will need to start, if one is connected

## What changed in LatticeOS

The forecast now updates every minute and uses the last six hours of load, not a nameplate average. It's shown first, in the largest type on the screen, and pushed by SMS when it drops below a threshold you choose.

It's a small change. It's also the one we hear about most.
