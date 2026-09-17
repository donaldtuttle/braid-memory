# Grok simulation port

## Source boundary

- Reference app: <https://hme-operator-braid-memory.grok.me/>
- Existing repository snapshot: `5460a4224605beb263259baa0ed6be9e5796cf72`.
- Inspected on 2026-09-17 (UTC).

That snapshot already contains the simulation engine and React interface.
This integration completes the standalone build and GitHub Pages delivery setup;
it does not reconstruct an engine from the visual output or embed the Grok site.
The Grok deployment's original source commit is unavailable, so this is a
behavioral comparison, not a claim of byte-identical source provenance.

Preserved: the engine, RNG, glyph vocabulary, formulas, default parameters,
presets, recall ranking, ablation calculation, and 16-seed sweep. The existing
proprietary license remains in effect.

Added: a dependency lockfile, a Node runtime declaration, relative production
asset paths, and a workflow that tests, builds, and deploys when Pages is enabled.
Grok hosting scripts and telemetry are not required by the standalone app.

## Default-run comparison

With seed 7, 16 steps, divergence 6, re-entangle 12, Δt 3, γ 0.15,
hysteresis 0.10, and the HME operator source, the live Grok display and this
repository's engine agree at the displayed precision:

| Readout | Value |
| --- | --- |
| Match rate | 23% |
| Hysteresis | 23% |
| Identity / braid share | −8% |
| Mean ΔΨ during divergence | 0.233 |
| Mean ΔΨ after re-entangle | 0.180 |
| Braid word | 13 crossings, 9 unique |
| 16-seed sweep | 2 braid/mixed, 7 hysteresis, mean share −0.024 |
| Final Ψintent A / B | 10.200 / 9.480 |

These are compatibility observations for this toy realization. They do not
validate its scientific interpretation, establish QOFT canon, or demonstrate
HME retrieval. The random-source control and γ = 0 ablation remain available.
The D-Π-01 baseline corpus was not used; no complete canon audit is claimed.

## Verification

```bash
npm ci
npm test
npm run build
npm run preview
```

The seven existing engine tests pass. The production build includes TypeScript
checking. Browser checks of the live Grok reference cover both braid views,
playback/stepping, the γ = 0 preset, random control, and glyph-address recall.
The local engine's default results were compared with that live display.

The local build's HTML and relative assets were checked under `/braid-memory/`
with a temporary HTTP server. The managed browser could not open localhost
(`ERR_BLOCKED_BY_CLIENT`), so the new production bundle has not been interactively
tested in that browser. The original interface source remains unchanged.

This record covers the port, not an exhaustive audit of all possible simulation
parameters. GitHub Pages activation and its hosted URL are separate from the
local production-build check.
