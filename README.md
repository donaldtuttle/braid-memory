# Braid Memory

Side quest of [HME](https://github.com/donaldtuttle/HME). ReflectiveStack × GeminiPath as a **lab instrument**, not a store.

The field remembers the shape. The ledger remembers the name. This repo remembers neither. It pairs two glyph traces with a time offset (`Γ_Gemini`) and asks whether that braid extra-damps divergence, or whether emotion hysteresis does all the work.

It does **not** write the HME field or the ledger. Glyphs here are the QOFT operator tags HME records on encode/retrieve; the payloads and hashes stay in HME.

## What this is / is not

| This | Not this |
| --- | --- |
| Seeded simulation of two agent traces | A quantum computer |
| Ablation of hysteresis vs identity recovery | Calibrated HME `confidence` |
| Ranked glyph-addressed crossings | `retrieve_memory` |
| Hypothesis about operator mix under affect | A measurement from the engine |

If dampening tracks hysteresis, the braid is not doing the work. If identity density recovers after re-entangle, GeminiPath extra-damps. Random traces are the control.

## Glyphs (QOFT / HME ledger tags)

| Glyph | HME role |
| --- | --- |
| `Σ◯` | Durable write (`encode_memory` default) |
| `Θλ` | Retrieve / ReplayPlan / RecallPacket |
| `Λψ` | Collapse / projection |
| `Ψmeta` | Pre-collapse telemetry |
| `Π↺` | QMesh lineage (`memory_precedes_collapse`) |
| ApplyReplay | Mutation after retrieve — **not a stored glyph** |

The 2025 notebook used a decorative alphabet (`Ξμ`, `Σ⊖`, `Ωµ`). This instrument uses the set HME actually writes.

## Formulas

```
Ψintent(t)      = 0.5·t + emotion_weight(t) + 2·coherence(t)
braid_word(t)   = (Ξ_A[t], Ξ_B[t + Δt])          ← Γ_Gemini
braid_coherence = 1 if glyphs match else 0.5
ΔΨ_braid        = |Ψ_A − Ψ_B| − γ · braid_coherence
```

Ablation (the part that makes it an instrument):

- **Hysteresis** = drop in raw `|Ψ_A − Ψ_B|` after re-entangle (emotion weight walking home).
- **Identity share** = `γ · (coherence_post − coherence_div) / mean_raw_div`. Extra dampening from match-rate recovery, *not* from subtracting γ (that always inflates the ratio).
- **16-seed sweep** from the current seed.

Operator mix under fear (Ξ_B during divergence) is a **hypothesis**: shift toward `Θλ` + `Λψ`, off `Σ◯`. Recovery writes and locks lineage. Falsify it with the Random control.

## Run

This is the standalone React/Vite version of the
[Grok simulation](https://hme-operator-braid-memory.grok.me/).
It runs entirely in the browser; no Grok account, API key, or backend is required.
Use Node.js 24 (see `.nvmrc`).

```bash
npm ci            # install the versions recorded in package-lock.json
npm test          # engine tests (node:test, no bundler)
npm run dev       # lab instrument
```

Open the local URL printed by Vite. For the production build:

```bash
npm run build     # typecheck and generate dist/
npm run preview   # serve the production build locally
```

Seed is deterministic. Space plays, arrows step.

## Publish the simulation on GitHub Pages

The **Simulation** workflow tests and builds every push to `main` and every
pull request. Once Pages is configured, successful `main` builds also deploy.
Before that, deployment is skipped and the build remains available as an artifact.

One-time setup in this repository:

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open **Actions → Simulation → Run workflow**, choose `main`, and run it.
4. Open the site link in the successful **deploy** job or in **Settings → Pages**.

Relative asset paths allow the same `dist/` output to run at a repository subpath
such as `/braid-memory/` or at a domain root. Serve `dist/` over HTTP; opening
`index.html` directly with `file://` is not supported.

See [the port verification record](docs/GROK_PORT.md) for the source boundary and
the checks used to compare this build with the Grok app.

## Claims not to make

- Identity share is not a probability.
- Glyph-address ranking is not holographic retrieval.
- A high match rate on random traces is sampling noise, not topology.
- This is not a drop-in index for QMesh. The useful seam, if any, is GeminiPath as a *lineage probe* that then hands hits to `retrieve_memory`.

## License

Proprietary source-available, same family as HME. See [LICENSE](LICENSE). Copyright (c) 2026 Donald Tuttle.
